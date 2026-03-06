# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 application for browsing and comparing public rental housing (公租房) listings. Data is served from a static JSON file.

## Commands

```bash
pnpm dev        # Start dev server (port 3000, auto-opens browser)
pnpm build      # Type-check with vue-tsc and build for production
pnpm preview    # Preview production build
```

## Architecture

### Tech Stack
- **Vue 3** with Composition API (`<script setup>`)
- **TypeScript** for type safety
- **Vite 7** as build tool
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Element Plus** for UI components (configured with Chinese locale)
- **Pinia** for state management
- **Vue Router** with lazy-loaded routes

### Directory Structure
```
src/
├── types/        # TypeScript interfaces (Property, FilterState, etc.)
├── stores/       # Pinia stores using setup store syntax
├── composables/  # Vue composables (useProperty, useStorage, usePagination)
├── components/   # Reusable Vue components
│   └── Layout/   # Layout components (AppHeader, AppFooter)
├── views/        # Page-level components (routed views)
├── utils/        # Utility functions (format, storage)
└── router/       # Vue Router configuration
```

### Key Patterns

**Pinia Stores**: All stores use setup store syntax:
```typescript
export const useXxxStore = defineStore('xxx', () => {
  const state = ref(...)
  return { state, actions }
})
```

**Data Source**: Property data is fetched from `/data/bsgz.json` (static file in `public/`). No backend API.

**State Persistence**: Favorites use localStorage directly via helper functions in stores.

**Infinite Scroll**: HomeView uses IntersectionObserver for lazy loading more results.

### Styling Conventions
- Tailwind CSS for utility classes
- Custom container class `.container-app` (max-width: 1500px)
- Element Plus theme customized via CSS variables in `style.css`
- Chinese is the primary UI language