import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Function to send upgrade notification via Edge Function
export const sendUpgradeNotification = async (planId: string, planName: string) => {
  // Get current user information
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get user profile information if available
  let userProfile;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    userProfile = profile;
  } catch (e) {
    console.warn('Could not fetch profile, continuing with basic user info');
    userProfile = { full_name: null };
  }
  
  // Send all necessary information to the edge function
  const { data, error } = await supabase.functions.invoke('upgrade-notification', {
    body: { 
      planId, 
      planName,
      userEmail: user.email,
      userId: user.id,
      userName: userProfile?.full_name || 'User'
    }
  });
  
  if (error) {
    console.error('Error sending upgrade notification:', error);
    throw error;
  }
  
  return data;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'brandii_auth_token',
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export type UserProfile = {
  id: string;
  username: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  user_type: 'free' | 'pro' | 'elite' | 'admin' | null;
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null;
  subscription_plan_id: string | null;
  social_links: {
    twitter: string;
    github: string;
    linkedin: string;
  };
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean | null;
  };
  created_at: string;
  updated_at: string;
};

export type GeneratedAsset = {
  id: string;
  brand_kit_id: string;
  image_data: string;
  image_url?: string;
  image_prompt?: string;
  type: 'logo' | 'image';
  created_at: string;
};

export type BrandKit = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  logo: {
    type: string;
    text: string;
    image?: string;
    personality: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  logo_selected_asset_id?: string;
  generated_assets?: GeneratedAsset[];
};

export type PaginatedResponse<T> = {
  data: T[];
  totalCount: number;
};

export type BrandKitForGeneration = Pick<BrandKit, 
  'id' | 
  'name' | 
  'type' | 
  'description' | 
  'colors' | 
  'typography' | 
  'logo'
>;

export type UserCredits = {
  user_id: string;
  purchased_credits: number;
  monthly_credits: number;
  credits_used: number;
  available_credits: number;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  updated_at: string;
};

export async function disableUserAccount(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');
    
    const { error } = await supabase.rpc('disable_user_account', {
      user_id: user.id
    });
    
    if (error) {
      console.error('Error disabling account:', error);
      throw new Error('Failed to disable account. Please try again.');
    }
    
    // Sign out the user after disabling the account
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error('Error in disableUserAccount:', error);
    throw error;
  }
}

export function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime || 'image/png' });
}

export async function uploadBase64Image(
  base64Data: string, 
  brandKitId: string, 
  fileName: string = 'converted-asset.png',
  type: 'logo' | 'image' = 'image'
): Promise<string> {
  try {

    //fetch base64 data from asset id filename
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Authentication required');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    //filter asset id from filename
    const assetId = fileName.split('.')[0];
    
    const { data } = await supabase
      .from('generated_assets')
      .select('image_data')
      .eq('id', assetId);
      
    if (!data || data.length === 0) {
      throw new Error('Generated asset not found');
    }
    
    const image_data = data[0].image_data;
    
    if (!image_data) {
      throw new Error('Generated asset has no image data');
    }
    
    // Convert base64 to File
    const file = dataURLtoFile(image_data, fileName);
    // Determine the bucket based on asset type
    const bucket = type === 'logo' ? 'brand-logos' : 'brand-assets';
    
    // Upload the file
    let filePath = `${brandKitId}/${uuidv4()}-${fileName}`;
    //if bucket is brand-assets
    if (bucket === 'brand-assets') {
      filePath = `generated-images/${brandKitId}/${fileName}`;
    }

    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`Error uploading ${type} to ${bucket}:`, error);
      throw new Error(`Failed to upload ${type}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error(`Error in uploadBase64Image (${type}):`, error);
    throw error;
  }
}

export async function uploadImageToStorage(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('brand-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload logo. Please try again.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
}

//new function to check if the user has anybrandkit
export async function checkUserHasBrandKit(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return false;
  }

  const { data, error } = await supabase
    .from('brand_kits')
    .select('id', { count: 'exact' })
    .eq('user_id', session.user.id)

  if (error) {
    console.error('Error checking user brand kit:', error);
    return false;
  }

  return data.length > 0;
}

export async function fetchBrandKits(
  page: number = 1,
  limit: number = 6,
  searchQuery: string = ''
): Promise<PaginatedResponse<BrandKit>> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const offset = (page - 1) * limit;

  // First get the total count
  const countQuery = supabase
    .from('brand_kits')
    .select('id', { count: 'exact' })
    .eq('user_id', session.user.id);

  // Add search filter if provided
  if (searchQuery) {
    countQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    console.error('Error fetching brand kits count:', countError);
    throw countError;
  }

  // Then fetch the paginated data with generated_assets including image_data
  const dataQuery = supabase
    .from('brand_kits')
    .select(`
      *,
      generated_assets!generated_assets_brand_kit_id_fkey (
        id,
        type,
        image_url,
        created_at
      )
    `)
    .eq('user_id', session.user.id)
    .eq('generated_assets.type', 'logo')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Add search filter if provided
  if (searchQuery) {
    dataQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: brandKits, error: dataError } = await dataQuery;

  if (dataError) {
    console.error('Error fetching brand kits:', dataError);
    throw dataError;
  }

  return {
    data: brandKits || [],
    totalCount: totalCount || 0
  };
}

export async function fetchBrandKitById(id: string): Promise<BrandKit | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { data: brandKit, error: brandKitError } = await supabase
    .from('brand_kits')
    .select(`
      *,
      generated_assets!generated_assets_brand_kit_id_fkey (id, brand_kit_id, image_url, type, image_prompt, created_at)
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (brandKitError) {
    console.error('Error fetching brand kit:', brandKitError);
    throw brandKitError;
  }

  return brandKit;
}

export async function updateBrandKit(id: string, updates: Partial<BrandKit>): Promise<BrandKit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  // Exclude the generated_assets field from updates as it's a relationship, not a column
  const { generated_assets: _, ...updateData } = updates;

  // If logo_selected_asset_id is being updated, fetch the asset to get its URL
  let finalUpdates = { ...updateData };
  if (updateData.logo_selected_asset_id && updateData.logo?.image === undefined) {
    const { data: selectedAsset } = await supabase
      .from('generated_assets')
      .select('image_url')
      .eq('id', updateData.logo_selected_asset_id)
      .single();

    if (selectedAsset?.image_url) {
      finalUpdates = {
        ...finalUpdates,
        logo: {
          ...((updateData.logo || {}) as BrandKit['logo']),
          image: selectedAsset.image_url
        }
      };
    }
  }

  const { data: updatedBrandKit, error } = await supabase
    .from('brand_kits')
    .update({
      ...finalUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select(`
      *,
      generated_assets!generated_assets_brand_kit_id_fkey (*)
    `)
    .single();

  if (error) {
    console.error('Error updating brand kit:', error);
    throw error;
  }

  return updatedBrandKit;
}

export async function uploadGeneratedImage(imageData: string, brandKitId: string, type: 'logo' | 'image' = 'image'): Promise<string> {
  try {
    // Extract the base64 data
    const base64Data = imageData.split(';base64,').pop();
    if (!base64Data) {
      throw new Error('Invalid image data');
    }

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const fileName = `${uuidv4()}.png`;
    const filePath = `${brandKitId}/${fileName}`;

    // Use brand-logos bucket for logos, brand-assets for other images
    const bucket = type === 'logo' ? 'brand-logos' : 'brand-assets';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('Error uploading generated image:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    // Get public URL from the correct bucket
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadGeneratedImage:', error);
    throw error;
  }
}

export async function saveGeneratedAssets(
  brandKitId: string, 
  imageDataArray: string[], 
  type: 'logo' | 'image' = 'logo',
  imagePrompt?: string
): Promise<GeneratedAsset[]> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  // Upload each image to the appropriate bucket and get URLs
  const imageUrls: (string | null)[] = [];
  for (const imageData of imageDataArray) {
    try {
      const url = await uploadGeneratedImage(imageData, brandKitId, type);
      imageUrls.push(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      imageUrls.push(null);
    }
  }

  // Prepare assets with both image_data (base64) and image_url
  const assets = imageDataArray.map((imageData, index) => ({
    brand_kit_id: brandKitId,
    image_data: imageData,
    image_url: imageUrls[index],
    type,
    image_prompt: imagePrompt
  }));

  try {
    
    // First, try the transaction-based approach
    // const { data: savedAssets, error } = await supabase.rpc('with_transaction', {
    //   callback_fn_name: 'save_assets_and_deduct_credits',
    //   payload: JSON.stringify({
    //     user_id: session.user.id,
    //     brand_kit_id: brandKitId,
    //     assets,
    //     credits_to_use: imageDataArray.length, // 1 credit per image
    //     description: `Generated ${imageDataArray.length} ${type} image(s)`,
    //     reference_type: 'image_generation'
    //   })
    // });

    // if (error) {
    //   if ( error.code === 'P0001' || error.code === 'PGRST301' || error.code === 'PGRST302' || error.code === 'PGRST303' || error.code === 'PGRST304' || error.code === 'PGRST305') {
    //     console.warn('Transaction function not available, falling back to direct save:', error.message);
    //     // Fallback to direct save without credit deduction
    //     return await saveAssetsDirectly(assets, session);
    //   } 
    //   throw error;
    // } 
    // return savedAssets;

    // Fallback to direct save without credit deduction
    return await saveAssetsDirectly(assets, session);

  } catch (error) {
    console.error('Error in saveGeneratedAssets:', error);
    
    // If it's a 400 error (bad request), fall back to direct save
    if ((error as any).code === 'P0001' || (error as any).code === 'PGRST301' || (error as any).code === 'PGRST302' || (error as any).code === 'PGRST303' || (error as any).code === 'PGRST304' || (error as any).code === 'PGRST305') {
      console.warn('Transaction function not available, falling back to direct save:', (error as any).message);
      // Fallback to direct save without credit deduction
      return await saveAssetsDirectly(assets, session);
    }
    
    // For other errors, rethrow
    throw error;
  }
}

// Helper function to save assets directly without transaction
async function saveAssetsDirectly(assets: any[], session: any): Promise<GeneratedAsset[]> {
  // First save the assets
  const { data: savedAssets, error: saveError } = await supabase
    .from('generated_assets')
    .insert(assets)
    .select();

  if (saveError) {
    console.error('Error saving assets directly:', saveError);
    throw new Error(`Failed to save assets: ${saveError.message}`);
  }

  try {
    // Then try to log the credit usage
    const { error: creditError } = await supabase
      .from('credit_usage')
      .insert({
        user_id: session.user.id,
        credits_used: assets.length,
        description: `Generated ${assets.length} image(s)`,
        reference_id: savedAssets[0].brand_kit_id,
        reference_type: 'image_generation',
        metadata: {
          is_fallback: true,
          asset_ids: savedAssets.map(asset => asset.id),
          brand_kit_id: assets[0]?.brand_kit_id
        }
      });

    if (creditError) {
      console.error('Error logging credit usage (non-critical):', creditError);
      // Don't fail the operation if credit logging fails
    }
  } catch (logError) {
    console.error('Error in credit logging (non-critical):', logError);
    // Continue even if credit logging fails
  }

  console.warn('Saved assets directly with separate credit logging');
  return savedAssets;
}

export async function updateGeneratedAsset(id: string, updates: Partial<GeneratedAsset>): Promise<GeneratedAsset> {
  try {
    const { data, error } = await supabase
      .from('generated_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating generated asset:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateGeneratedAsset:', error);
    throw error;
  }
}

export async function deleteGeneratedAsset(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('generated_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting generated asset:', error);
    throw error;
  }
}

export async function saveBrandKit(brandKit: Omit<BrandKit, 'id' | 'created_at' | 'updated_at' | 'user_id'>, generatedLogoImages?: string[]): Promise<BrandKit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const newBrandKit = {
    ...brandKit,
    user_id: session.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: savedBrandKit, error: brandKitError } = await supabase
    .from('brand_kits')
    .insert([newBrandKit])
    .select()
    .single();

  if (brandKitError) {
    console.error('Error saving brand kit:', brandKitError);
    throw brandKitError;
  }

  // If there are generated logo images, save them
  if (generatedLogoImages?.length) {
    try {
      const assets = await saveGeneratedAssets(savedBrandKit.id, generatedLogoImages, 'logo');
      
      // Set the first generated asset as the selected logo and update the logo.image
      if (assets.length > 0) {
        const selectedAsset = assets[0];
        await updateBrandKit(savedBrandKit.id, {
          logo_selected_asset_id: selectedAsset.id,
          logo: {
            ...savedBrandKit.logo,
            image: selectedAsset.image_url
          }
        });

        return {
          ...savedBrandKit,
          generated_assets: assets,
          logo_selected_asset_id: selectedAsset.id,
          logo: {
            ...savedBrandKit.logo,
            image: selectedAsset.image_url
          }
        };
      }
      
      return {
        ...savedBrandKit,
        generated_assets: assets
      };
    } catch (error) {
      console.error('Error saving generated assets:', error);
      return savedBrandKit;
    }
  }

  return savedBrandKit;
}

export async function deleteBrandKit(id: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('brand_kits')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting brand kit:', error);
    throw error;
  }

  return true;
}

export async function fetchBrandKitForGeneration(id: string): Promise<BrandKitForGeneration | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { data: brandKit, error: brandKitError } = await supabase
    .from('brand_kits')
    .select(`
      id,
      name,
      type,
      description,
      colors,
      typography,
      logo
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (brandKitError) {
    console.error('Error fetching brand kit:', brandKitError);
    throw brandKitError;
  }

  return brandKit;
}

/**
 * Fetches the current user's credit balance
 * @returns Promise with the user's credit information
 */
export async function fetchUserCredits(): Promise<UserCredits | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('user_available_credits')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }

  return data;
}

/**
 * Checks if the current user has enough credits for an operation
 * @param requiredCredits Number of credits required
 * @returns Promise that resolves to a boolean indicating if the user has enough credits
 */
export async function hasEnoughCredits(requiredCredits: number): Promise<boolean> {
  try {
    const credits = await fetchUserCredits();
    return credits ? credits.available_credits >= requiredCredits : false;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
}

/**
 * Updates a user's purchased credits after a successful payment
 * @param userId The ID of the user to update
 * @param creditsToAdd Number of credits to add to the user's purchased credits
 * @param paymentReference Payment reference ID (e.g., PayPal transaction ID)
 * @returns Promise that resolves to the updated UserCredits object
 */
export async function addPurchasedCredits(userId: string, creditsToAdd: number, paymentReference: string): Promise<UserCredits | null> {
  try {
    // First, get the current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current credits:', fetchError);
      throw fetchError;
    }
    
    //check if the credit_usage refrence_id/paymentreference doesn't already exist
    const { data: existingCreditUsage } = await supabase
      .from('credit_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_id', paymentReference)
      .single();
    
    if (existingCreditUsage) {
      return null;
    }

    //check payments
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('provider_payment_id', paymentReference)
      .single();
    
    if (existingPayment) {
      return null;
    }
    
    // If user doesn't have a credits record yet, create one
    if (!currentCredits) {
      // const { data: newCredits, error: insertError } = await supabase
      //   .from('user_credits')
      //   .insert({
      //     user_id: userId,
      //     purchased_credits: creditsToAdd,
      //     monthly_credits: 0,
      //     credits_used: 0
      //   })
      //   .select()
      //   .single();
      
      // if (insertError) {
      //   console.error('Error creating credits record:', insertError);
      //   throw insertError;
      // }

      // // Log the credit purchase in credit_usage table (as a negative value to indicate addition)
      // await supabase
      //   .from('credit_usage')
      //   .insert({
      //     user_id: userId,
      //     credits_used: -creditsToAdd, // Negative value indicates credits added
      //     description: 'Credits purchased via PayPal',
      //     reference_id: paymentReference,
      //     reference_type: 'paypal_payment',
      //     metadata: { payment_method: 'paypal' }
      //   });
      
      return null;
    } else {

      const newCredits = Number(currentCredits.purchased_credits) + Number(creditsToAdd);
      // Update existing credits record
      const { data: updatedCredits, error: updateError } = await supabase
        .from('user_credits')
        .update({
          purchased_credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating credits:', updateError);
        throw updateError;
      }
      
      // Log the credit purchase in credit_usage table (as a negative value to indicate addition)
      // await supabase
      //   .from('credit_usage')
      //   .insert({
      //     user_id: userId,
      //     credits_used: -creditsToAdd, // Negative value indicates credits added
      //     description: 'Credits purchased via PayPal',
      //     reference_id: paymentReference,
      //     reference_type: 'paypal_payment',
      //     metadata: { payment_method: 'paypal' }
      //   });
      
      return updatedCredits;
    }
  } catch (error) {
    console.error('Error adding purchased credits:', error);
    throw error;
  }
}

/**
 * Inserts a payment record into the payments table
 * @param paymentData Object containing payment details
 * @returns The created payment record
 */
export async function createPaymentRecord(paymentData: {
  user_id: string;
  provider: 'stripe' | 'paypal' | 'manual';
  provider_payment_id: string;
  amount: number;
  currency?: string;
  status: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Check if payment with this provider_payment_id already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider', paymentData.provider)
      .eq('provider_payment_id', paymentData.provider_payment_id)
      .single();
    
    if (existingPayment) {
      throw new Error('Payment record already exists');
    }

    const { data: currentCredits, error: fetchError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', paymentData.user_id)
    .single();

    if (fetchError) {
      console.error('Error fetching current credits:', fetchError);
      throw fetchError;
    }
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: paymentData.user_id,
        provider: paymentData.provider,
        provider_payment_id: paymentData.provider_payment_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        status: paymentData.status,
        metadata: paymentData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }

    //update purchasedcredits
    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .update({
        purchased_credits: Number(currentCredits.purchased_credits) + Number(paymentData.metadata?.credits_added),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', paymentData.user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating purchased credits:', updateError);
      throw updateError;
    }

    return data;
  } catch (error) {
    console.error('Error in createPaymentRecord:', error);
    throw error;
  }
}