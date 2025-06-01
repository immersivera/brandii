// Update the BrandKitPage to add a link to the gallery
// Add after the "Create" button in the header buttons section:

<Button
  variant="outline"
  size="sm"
  onClick={() => navigate(`/kit/${id}/gallery`)}
  leftIcon={<Image className="h-4 w-4" />}
>
  View Gallery
</Button>