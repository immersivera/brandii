-- Create a generic transaction function that can execute other functions in a transaction
CREATE OR REPLACE FUNCTION public.with_transaction(
  callback_fn_name TEXT,
  payload JSONB
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  function_schema TEXT;
  function_name TEXT;
  param_names TEXT[];
  param_types TEXT[];
  param_values JSONB;
  query TEXT;
  param_list TEXT;
  i INTEGER;
BEGIN
  -- Parse the function name (can be schema-qualified)
  IF strpos(callback_fn_name, '.') > 0 THEN
    function_schema := split_part(callback_fn_name, '.', 1);
    function_name := split_part(callback_fn_name, '.', 2);
  ELSE
    function_schema := 'public';
    function_name := callback_fn_name;
  END IF;
  
  -- Get the function's parameter names and types
  SELECT 
    array_agg(p.parameter_name ORDER BY p.ordinal_position),
    array_agg(p.data_type ORDER BY p.ordinal_position)
  INTO param_names, param_types
  FROM information_schema.parameters p
  WHERE p.specific_schema = function_schema
    AND p.specific_name = function_name
  GROUP BY p.specific_schema, p.specific_name;
  
  -- Check if function exists
  IF param_names IS NULL THEN
    RAISE EXCEPTION 'Function % not found', callback_fn_name;
  END IF;
  
  -- Extract parameter values from the payload
  param_values := payload;
  
  -- Build the parameter list for the dynamic query
  param_list := '';
  FOR i IN 1..array_length(param_names, 1) LOOP
    IF i > 1 THEN
      param_list := param_list || ', ';
    END IF;
    
    -- Handle different parameter types
    IF param_types[i] IN ('json', 'jsonb') THEN
      param_list := param_list || format('(%L)::%s', (param_values->>param_names[i])::text, param_types[i]);
    ELSE
      param_list := param_list || format('%L::%s', param_values->>param_names[i], param_types[i]);
    END IF;
  END LOOP;
  
  -- Build and execute the dynamic query
  query := format('SELECT %I.%I(%s)', function_schema, function_name, param_list);
  
  -- Execute within a transaction
  BEGIN
    -- Start transaction
    EXECUTE 'BEGIN';
    
    -- Execute the function
    EXECUTE query INTO result;
    
    -- Commit the transaction
    EXECUTE 'COMMIT';
    
    RETURN jsonb_build_object('success', true, 'data', result);
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    EXECUTE 'ROLLBACK';
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error in with_transaction: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.with_transaction(TEXT, JSONB) TO authenticated;

-- Add a comment to document the function
COMMENT ON FUNCTION public.with_transaction IS 'Executes a function within a transaction. Takes a function name and a JSONB payload with parameters.';
