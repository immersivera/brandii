// Add handleDeleteLogo function and update the logo concepts section
const handleDeleteLogo = async (assetId: string, e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent logo selection when clicking delete
  
  if (!confirm('Are you sure you want to delete this logo? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteGeneratedAsset(assetId);
    
    // If this was the selected logo, clear the selection
    if (brandKit?.logo_selected_asset_id === assetId) {
      await updateBrandKit(brandKit.id, {
        logo_selected_asset_id: null
      });
    }
    
    // Refresh brand kit data
    const updatedBrandKit = await fetchBrandKitById(brandKit!.id);
    if (updatedBrandKit) {
      setBrandKit(updatedBrandKit);
    }
    
    toast.success('Logo deleted successfully');
  } catch (error) {
    console.error('Error deleting logo:', error);
    toast.error('Failed to delete logo');
  }
};

// Update the logo concepts grid in the JSX
<div className="grid grid-cols-2 gap-4">
  {logoAssets.map((asset) => (
    <div
      key={asset.id}
      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
        brandKit.logo_selected_asset_id === asset.id
          ? 'border-brand-600 shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={() => handleSelectLogo(asset.id)}
    >
      <img
        src={asset.image_data}
        alt="Logo concept"
        className="w-full h-auto"
        style={{ 
          backgroundColor: brandKit.colors.background
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex justify-between items-center">
          {brandKit.logo_selected_asset_id === asset.id && (
            <span className="text-white text-sm bg-brand-600 px-2 py-1 rounded-full">
              Selected
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteLogo(asset.id, e)}
            className="ml-auto text-white hover:text-red-500 hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ))}
</div>