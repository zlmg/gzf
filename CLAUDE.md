# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 application for browsing and comparing public rental housing (公租房) listings in Shanghai Baoshan. Features include property search/filtering, favorites, comparison, and nearby amenities via AMap API.

## Commands

```bash
pnpm dev        # Start dev server (port 3000, auto-opens browser)
pnpm build      # Type-check with vue-tsc and build for production
pnpm preview    # Preview production build
```

## Architecture

### Tech Stack
- **Vue 3.5** with Composition API (`<script setup lang="ts">`)
- **TypeScript 5.9** for type safety
- **Vite 7** as build tool
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Element Plus** for UI components (Chinese locale)
- **Pinia 3** for state management (setup store syntax)
- **Vue Router 5** with lazy-loaded routes
- **VueUse Core** for utility composables
- **AMap JS API** for maps and POI search

### Directory Structure
```
src/
├── types/           # TypeScript interfaces
│   ├── property.ts  # Property, HouseType, FilterState, SortField, etc.
│   └── element-plus.d.ts
├── stores/          # Pinia stores (setup store syntax)
│   ├── index.ts     # Re-exports all stores
│   ├── property.ts  # Property data and computed values
│   ├── filter.ts    # Filter state, sorting, and filter logic
│   ├── favorite.ts  # Favorites with localStorage persistence
│   └── compare.ts   # Compare list (max 4 items)
├── composables/     # Vue composables
│   ├── useProperty.ts    # Property fetching and filtering
│   ├── useStorage.ts     # Reactive localStorage wrapper
│   ├── usePoiCache.ts    # POI data caching (90-day TTL)
│   └── usePagination.ts
├── components/      # Reusable Vue components
│   ├── Layout/      # AppHeader, AppFooter
│   ├── PropertyCard.vue
│   ├── PropertyFilter.vue
│   ├── FavoriteButton.vue
│   ├── ImageGallery.vue
│   ├── CompareBar.vue
│   ├── AmapNearby.vue    # POI search with AMap
│   └── FavoriteNotification.vue
├── views/           # Page-level routed components
│   ├── HomeView.vue      # Infinite scroll property list
│   ├── PropertyDetail.vue
│   ├── FavoritesView.vue
│   └── CompareView.vue
├── utils/
│   ├── format.ts    # Formatting utilities
│   └── storage.ts   # localStorage wrapper with prefix
├── router/          # Vue Router config
└── style.css        # Global styles + Element Plus overrides
```

### Key Patterns

**Pinia Stores (Setup Store Syntax)**:
```typescript
export const useXxxStore = defineStore('xxx', () => {
  const state = ref<Type>(initialValue)
  const computedValue = computed(() => ...)
  const action = () => { ... }
  return { state, computedValue, action }
})
```

**Vue Components (Script Setup)**:
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Property } from '@/types/property'

const props = defineProps<{ property: Property }>()
const loading = ref(true)
const computed = computed(() => ...)
</script>
```

**Data Source**:
- Property data: `/data/bsgz.json` (static file in `public/`)
- AMap POI: `https://restapi.amap.com/v3/place/around` API
- No backend API

**State Persistence**:
- All stores persist to localStorage via `storage` utility
- Storage key prefix: `gzf-`
- POI cache: 90-day TTL with coordinate-based keys

**Infinite Scroll**:
- HomeView uses IntersectionObserver for lazy loading
- Page size: 12 items

**Filtering & Sorting**:
- FilterStore handles all filter logic and sorting
- Sort fields: `price`, `kezuCount`, `openingDate`
- Sort order persisted to localStorage

### Styling Conventions
- Tailwind CSS utility classes (primary styling method)
- Custom container class `.container-app` (max-width: 1500px)
- Scoped CSS only when necessary (e.g., line-clamp, transitions)
- Element Plus theme customized via CSS variables
- Chinese is the primary UI language

### Data Types

**Property**: Main entity with fields like `projectNo`, `projectName`, `location`, `minRent`, `maxRent`, `kezuCount`, `roomTypeDetails[]`

**HouseType**: Individual room type with `area`, `towards`, `roomEquipment`, `vrUrl`

**FilterState**: Filter configuration with `layout[]`, `roomType[]`, `priceRange`, `equipment[]`, `label[]`, `towards[]`, `areaRange`

### External Services
- **AMap API Key**: Required in `.env` as `VITE_AMAP_KEY`
- **Image Base URL**: `https://www.bsgzf.com.cn` (prepended to relative paths)

### Component Communication
- Stores for global state (favorites, compare, filters)
- Props for parent-child communication
- No event bus or provide/inject patterns used