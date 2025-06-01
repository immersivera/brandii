# Brandii - Modern Brand Kit Generator

Brandii is a powerful AI-powered brand identity generator that helps businesses create professional brand kits in minutes. Generate color palettes, logo concepts, and brand guidelines with ease.

## Features

- AI-powered brand identity generation
- Professional color palette creation
- Logo concept generation with AI
- Complete brand guidelines export
- Brand kit library with search and pagination
- Dark mode support
- Responsive design
- Media asset generation for existing brand kits
- Comprehensive brand kit management
- Real-time preview and customization
- Export to multiple formats

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Supabase
- OpenAI

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
4. Start development server: `npm run dev`

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── context/       # React context providers
  ├── lib/           # Utility functions and API clients
  ├── pages/         # Application pages/routes
  └── styles/        # Global styles and Tailwind config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT