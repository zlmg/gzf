# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A pnpm monorepo for browsing and comparing public rental housing (公租房) listings in Shanghai Baoshan. Features include property search/filtering, favorites, comparison, nearby amenities via AMap API, user authentication, and browse history.

## Commands

```bash
# Development (runs both frontend and backend)
pnpm dev              # Start all apps
pnpm dev:frontend     # Start frontend only (port 3000)
pnpm dev:server       # Start backend only (port 3001)

# Build
pnpm build            # Build all apps
pnpm build:frontend   # Build frontend only
pnpm build:server     # Build backend only

# Other
pnpm lint             # Lint all apps
pnpm clean            # Clean all node_modules
```

## Architecture

### Monorepo Structure
```
gzf/
├── apps/
│   ├── frontend/         # Vue 3 frontend application
│   └── server/           # Fastify backend service
├── docs/                 # Documentation
├── script/               # data scripts
├── pnpm-workspace.yaml   # pnpm workspace config
└── package.json          # Root package.json with workspace scripts
```

### Frontend (apps/frontend/)

**Tech Stack:**
- **Vue 3.5** with Composition API (`<script setup lang="ts">`)
- **TypeScript 5.9** for type safety
- **Vite 7** as build tool
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Element Plus** for UI components (Chinese locale)
- **Pinia 3** for state management (setup store syntax)
- **Vue Router 5** with lazy-loaded routes
- **VueUse Core** for utility composables
- **AMap JS API** for maps and POI search

**Directory Structure:**
```
apps/frontend/src/
├── api/             # API request modules
│   └── index.ts     # Auth and user data API (authApi, userApi)
├── components/      # Reusable Vue components
│   ├── Layout/      # AppHeader, AppFooter
│   ├── PropertyCard.vue
│   ├── PropertyFilter.vue
│   ├── FavoriteButton.vue
│   ├── ImageGallery.vue
│   ├── ImageViewer.vue
│   ├── CompareBar.vue
│   ├── AmapNearby.vue
│   └── FavoriteNotification.vue
├── composables/     # Vue composables
│   ├── useProperty.ts
│   ├── useStorage.ts
│   ├── usePoiCache.ts
│   ├── usePagination.ts
│   └── useSync.ts
├── config/          # App configuration
├── router/          # Vue Router config
├── stores/          # Pinia stores (setup store syntax)
│   ├── property.ts  # Property data and computed values
│   ├── filter.ts    # Filter state, sorting, and filter logic
│   ├── favorite.ts  # Favorites with localStorage persistence
│   ├── compare.ts   # Compare list (max 4 items)
│   ├── history.ts   # Browse history (max 100 items)
│   └── auth.ts      # Authentication and cloud data sync
├── types/           # TypeScript interfaces
│   ├── property.ts  # Property, HouseType, FilterState
│   └── user.ts      # User, FavoriteItem, HistoryItem, Preferences
├── utils/           # Utility functions
└── views/           # Page-level routed components
    ├── HomeView.vue
    ├── PropertyDetail.vue
    ├── FavoritesView.vue
    ├── CompareView.vue
    ├── HistoryView.vue
    ├── LoginView.vue
    └── RegisterView.vue
```

### Backend (apps/server/)

**Tech Stack:**
- **Node.js** with TypeScript
- **Fastify** - high-performance web framework
- **Prisma** - ORM for database access
- **SQLite** - lightweight database
- **JWT** - authentication
- **Zod** - request validation

**Directory Structure:**
```
apps/server/
├── src/
│   ├── routes/      # API route handlers
│   ├── middleware/  # Auth and other middleware
│   ├── prisma/      # Prisma client instance
│   ├── types/       # TypeScript types
│   ├── app.ts       # Fastify app configuration
│   └── index.ts     # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

**Database Commands:**
```bash
pnpm --filter server db:generate   # Generate Prisma client
pnpm --filter server db:migrate    # Run database migrations
pnpm --filter server db:studio     # Open Prisma Studio
```

### Key Patterns

**Pinia Stores (Setup Store Syntax):**
```typescript
export const useXxxStore = defineStore('xxx', () => {
  const state = ref<Type>(initialValue)
  const computedValue = computed(() => ...)
  const action = () => { ... }
  return { state, computedValue, action }
})
```

**Vue Components (Script Setup):**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Property } from '@/types/property'

const props = defineProps<{ property: Property }>()
const loading = ref(true)
const computed = computed(() => ...)
</script>
```

**Data Sources:**
- Frontend static data: `/data/bsgz.json` (in `apps/frontend/public/`)
- Backend API: REST endpoints at `http://localhost:3001/api/*`
- AMap POI: `https://restapi.amap.com/v3/place/around` API

**State Persistence:**
- All stores persist to localStorage via `storage` utility
- Storage key prefix: `gzf-`
- POI cache: 90-day TTL with coordinate-based keys

**Infinite Scroll:**
- HomeView uses IntersectionObserver for lazy loading
- Page size: 12 items

**Filtering & Sorting:**
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

**User**: Basic user info with `id`, `username`

**FavoriteItem/HistoryItem**: Property snapshot with timestamp (`addedAt`/`viewedAt`)

**Preferences**: User's filter and sort preferences for cloud sync

### Authentication & Data Sync

- JWT-based authentication via `/api/auth/login` and `/api/auth/register`
- Authenticated users can sync favorites, history, and preferences to cloud
- `useSync` composable provides debounced auto-sync (2s delay) when data changes
- On login, cloud data is pulled and merged with local data (local takes priority on conflict)

### Environment Variables

**Frontend (`apps/frontend/.env`):**
- `VITE_AMAP_KEY` - AMap API Key
- `VITE_API_BASE_URL` - Backend API URL (optional, defaults to localhost:3001)

**Backend (`apps/server/.env`):**
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - SQLite database path

### External Services
- **AMap API Key**: Required in frontend `.env` as `VITE_AMAP_KEY`
- **Image Base URL**: `https://www.bsgzf.com.cn` (prepended to relative paths)

### Component Communication
- Stores for global state (favorites, compare, filters)
- Props for parent-child communication
- No event bus or provide/inject patterns used

### Deployment

**Vercel** (via `vercel.json`):
- Build command: `pnpm build:frontend`
- Output directory: `apps/frontend/dist`
- SPA rewrites configured

**Railway** (monorepo root):
- Backend: Nixpacks builder, runs Prisma migrations on start
- Frontend: Railpack static SPA (`apps/frontend/railway.toml`)
- Health check on `/health` with 300s timeout