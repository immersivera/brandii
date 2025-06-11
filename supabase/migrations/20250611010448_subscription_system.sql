-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    monthly_credits INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payment providers enum
CREATE TYPE public.payment_provider AS ENUM ('stripe', 'paypal', 'manual');

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    provider payment_provider NOT NULL,
    provider_payment_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'paused',
    'trialing',
    'unpaid',
    'expired'
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    status subscription_status NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    payment_method_id UUID REFERENCES public.payments(id),
    metadata JSONB,
    UNIQUE(user_id, status) WHERE status = 'active' -- Only one active subscription per user
);

-- Create user credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    purchased_credits INTEGER NOT NULL DEFAULT 10, -- One-time purchased credits
    monthly_credits INTEGER NOT NULL DEFAULT 0, -- Monthly credits from subscription
    credits_used INTEGER NOT NULL DEFAULT 0,
    last_monthly_credit_refresh TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create credit usage table
CREATE TABLE IF NOT EXISTS public.credit_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    credits_used INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT, -- Can reference the entity that used the credits (e.g., image_id, generation_id)
    reference_type TEXT, -- Type of reference (e.g., 'image_generation', 'api_call')
    metadata JSONB, -- Additional context about the usage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for credit_usage
CREATE INDEX idx_credit_usage_user_id ON public.credit_usage(user_id);
CREATE INDEX idx_credit_usage_created_at ON public.credit_usage(created_at);
CREATE INDEX idx_credit_usage_reference ON public.credit_usage(reference_id, reference_type);

-- Create user types enum
CREATE TYPE public.user_type AS ENUM ('free', 'pro', 'admin');

-- Add user_type to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('free', 'pro', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'user_profiles' 
                  AND column_name = 'user_type') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN user_type user_type NOT NULL DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'user_profiles' 
                  AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- Insert subscription plans
INSERT INTO public.subscription_plans (id, name, description, monthly_credits, price, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Free', 'Free plan with 10 credits', 0, 0.00, true),
    ('00000000-0000-0000-0000-000000000002', 'Pro', 'Pro plan with 100 monthly credits', 100, 20.00, true)
ON CONFLICT (id) DO NOTHING;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (id, email, user_type)
    VALUES (new.id, new.email, 'free');
    
    -- Initialize user credits
    INSERT INTO public.user_credits (user_id, purchased_credits, monthly_credits)
    VALUES (new.id, 10, 0);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Credit refresh is handled by payment provider webhooks
-- No automatic refresh function needed

-- Create or replace use_credits function
CREATE OR REPLACE FUNCTION public.use_credits(
    p_user_id UUID, 
    p_credits_to_use INTEGER,
    p_description TEXT,
    p_reference_id TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available_credits INTEGER;
    v_used_credits INTEGER := 0;
    v_remaining_credits INTEGER;
BEGIN
    -- Check available credits within a transaction
    SELECT (purchased_credits + monthly_credits - credits_used)
    INTO v_available_credits
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row to prevent race conditions
    
    IF v_available_credits < p_credits_to_use THEN
        RETURN FALSE; -- Not enough credits
    END IF;
    
    -- Calculate how many credits to use from monthly vs purchased
    v_remaining_credits := p_credits_to_use;
    
    -- First, use monthly credits
    IF (SELECT monthly_credits - credits_used FROM user_credits WHERE user_id = p_user_id) > 0 THEN
        v_used_credits := LEAST(
            (SELECT monthly_credits - credits_used FROM user_credits WHERE user_id = p_user_id),
            v_remaining_credits
        );
        
        UPDATE user_credits
        SET credits_used = credits_used + v_used_credits
        WHERE user_id = p_user_id;
        
        v_remaining_credits := v_remaining_credits - v_used_credits;
    END IF;
    
    -- If there are still credits to use, use purchased credits
    IF v_remaining_credits > 0 THEN
        UPDATE user_credits
        SET purchased_credits = purchased_credits - v_remaining_credits
        WHERE user_id = p_user_id;
    END IF;
    
    -- Record the usage
    INSERT INTO credit_usage (
        user_id,
        credits_used,
        description,
        reference_id,
        reference_type,
        metadata
    ) VALUES (
        p_user_id,
        p_credits_to_use,
        p_description,
        p_reference_id,
        p_reference_type,
        p_metadata
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in use_credits: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for available credits
CREATE OR REPLACE VIEW public.user_available_credits AS
SELECT 
    uc.user_id,
    uc.purchased_credits,
    uc.monthly_credits,
    uc.credits_used,
    (uc.purchased_credits + uc.monthly_credits - uc.credits_used) AS available_credits,
    uc.last_monthly_credit_refresh,
    us.status AS subscription_status,
    us.ends_at AS subscription_ends_at
FROM 
    user_credits uc
LEFT JOIN user_subscriptions us ON 
    uc.user_id = us.user_id 
    AND us.status = 'active' 
    AND (us.ends_at IS NULL OR us.ends_at > NOW());

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Subscription plans (read-only for all)
CREATE POLICY "Anyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (true);

-- Payments (user-specific)
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- User subscriptions (user-specific)
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- User credits (user-specific)
CREATE POLICY "Users can view their own credits" 
ON public.user_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
ON public.user_credits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Credit usage (user-specific)
CREATE POLICY "Users can view their own credit usage" 
ON public.credit_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit usage" 
ON public.credit_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Credit refresh triggers are handled by payment provider webhooks

-- Create trigger for new user signup if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE OR REPLACE FUNCTION add_updated_at_trigger(table_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I 
                   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                   table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to all relevant tables
SELECT add_updated_at_trigger('subscription_plans');
SELECT add_updated_at_trigger('payments');
SELECT add_updated_at_trigger('user_subscriptions');
SELECT add_updated_at_trigger('user_credits');
