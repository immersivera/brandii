// Add this function to handle image deletion
export async function deleteGeneratedAsset(assetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('generated_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }

  return true;
}