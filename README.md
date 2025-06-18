# API Context Hub

AI-Ready API Documentation for Modern Developers

## Overview

API Context Hub solves a fundamental problem: development AI tools like ChatGPT and GitHub Copilot don't know the latest API specifications. We provide up-to-date API documentation optimized for AI prompts, allowing developers to get accurate code generation with just one click.

## Features

- **AI-Optimized Copy**: Click "⚡ Copy for AI" to get structured prompts with the latest API information
- **Always Up-to-Date**: Documentation is automatically synchronized with official API sources
- **Developer Focused**: Only the essential information needed for integration
- **Dark Mode**: Built-in dark mode support for comfortable reading

## Supported APIs

Currently supporting:
- **Stripe** - Payment processing
- **SendGrid** - Email delivery
- **Twilio** - SMS & Voice communication
- **Supabase** - Backend as a Service

## Tech Stack

- **Frontend**: Next.js 14 (App Router, SSG)
- **Styling**: Tailwind CSS + shadcn/ui
- **Documentation**: Markdown with syntax highlighting
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/api-context-hub.git
cd api-context-hub

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Collect/update API documentation
npm run collect-docs
```

### Project Structure

```
api-context-hub/
├── app/                    # Next.js app directory
│   ├── api/[apiId]/       # Dynamic API documentation pages
│   ├── roadmap/           # Roadmap page
│   └── page.tsx           # Home page
├── components/            # React components
├── contents/              # API documentation (Markdown)
│   ├── stripe/
│   ├── sendgrid/
│   ├── twilio/
│   └── supabase/
├── scripts/               # Documentation collection scripts
│   └── collectors/        # API-specific collectors
└── lib/                   # Utility functions
```

## Deployment

The project is configured for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Deploy with default settings

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details