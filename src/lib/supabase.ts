```typescript
// Add deleteGeneratedAsset function
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
```