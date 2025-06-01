# Changelog

## Version 0.3.0 (Latest)

### Added
- Media asset generation for existing brand kits
- Improved brand kit management interface
- Real-time preview and customization options
- Export to multiple formats
- Toast notifications for better user feedback
- Validation checks for media asset creation

### Changed
- Updated create page UI with clearer options
- Improved error handling and user feedback
- Enhanced brand kit library performance
- Optimized database queries for better performance

### Fixed
- Statement timeout issues in brand kit queries
- Missing useDebounce export
- Navigation issues in create flow
- Brand kit loading states

## Version 0.2.0

### Added
- Pagination in brand kit library (6 items per page)
- "Start Over" button in preview and results screens
- Enhanced logo generation with more brand context
- Improved industry and personality display in results

### Changed
- Updated logo generation to include more brand details:
  - Primary, secondary, and accent colors
  - Brand description
  - Industry type
  - Brand personality
- Improved brand kit display in library
- Enhanced user experience with pagination controls

### Fixed
- Industry and personality text display in results page
- Search functionality in paginated library view

## Version 0.1.0 (Initial Release)

### Added
- Initial project setup with React, TypeScript, and Vite
- Tailwind CSS configuration with custom theme
- Dark mode support with system preference detection
- Basic application structure and routing
- Core pages:
  - Homepage with animated hero section
  - Brand creation wizard with multi-step form
  - Brand kit results page
  - Brand library page
  - Brand kit detail view page
- Components:
  - UI component library (Button, Card, Input, etc.)
  - Color picker component
  - Layout components (Header, Footer)
- Context providers:
  - Theme context for dark/light mode
  - Brand context for wizard state management
- Utilities:
  - Color manipulation functions
  - Helper functions for CSS class management
- Mock Supabase integration for brand kit storage
- Responsive design for all viewports
- Brand kit features:
  - View detailed brand information
  - Download brand assets
  - Share brand kits
  - Delete brand kits