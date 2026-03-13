# Element-Plus to Nuxt-UI Migration Design

**Date:** 2026-03-13
**Status:** Approved

## Overview

Migrate the frontend UI component library from Element-Plus to Nuxt-UI in a Vue 3 + Vite SPA project. Nuxt-UI supports standalone Vue/Vite mode through its dedicated Vite plugin.

## Goals

- Replace all Element-Plus components with Nuxt-UI equivalents
- Configure Nuxt-UI for auto-import (tree-shaking)
- Maintain visual consistency with current design
- Implement carousel using Embla Carousel (Nuxt-UI has no built-in carousel)

## Dependencies

### Remove
- `element-plus`
- `@element-plus/icons-vue`

### Add
- `@nuxt/ui` - Component library
- `zod` - Form validation (Nuxt-UI uses Standard Schema)
- `embla-carousel-vue` - Carousel component
- `@iconify-json/lucide` - Icon collection

## Configuration

### vite.config.ts
```typescript
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      ui: { colors: { primary: 'blue', neutral: 'gray' } }
    }),
    // ... existing plugins
  ],
})
```

### main.ts
```typescript
import ui from '@nuxt/ui/vue-plugin'
import './assets/main.css'

const app = createApp(App)
app.use(router)
app.use(ui)
app.mount('#app')
```

### assets/main.css
```css
@import "tailwindcss";
@import "@nuxt/ui";
```

### App.vue
```vue
<template>
  <UApp>
    <RouterView />
  </UApp>
</template>
```

### index.html
Add `class="isolate"` to the root div.

## Component Mapping

| Element-Plus | Nuxt-UI | Notes |
|--------------|---------|-------|
| `ElMessage` | `useToast()` | Composable for notifications |
| `ElMessageBox` | `UModal` + `useOverlay()` | Programmatic modal |
| `ElButton` | `UButton` | Direct replacement |
| `ElEmpty` | Custom Tailwind | Build with UIcon + Tailwind |
| `ElForm/ElFormItem` | `UForm/UFormField` | Requires Zod schema |
| `ElInput` | `UInput` | Direct replacement |
| `ElDropdown*` | `UDropdownMenu` | Items array pattern |
| `ElDialog` | `UModal` | v-model:open pattern |
| `ElCarousel` | Embla Carousel | External library |
| `@element-plus/icons-vue` | Iconify `i-lucide-*` | Lucide icon set |

## Files to Modify

1. **package.json** - Update dependencies
2. **vite.config.ts** - Add Nuxt-UI Vite plugin
3. **src/main.ts** - Replace ElementPlus with ui plugin
4. **src/style.css** - Remove Element-Plus imports and overrides
5. **src/App.vue** - Wrap with UApp
6. **index.html** - Add isolate class
7. **src/views/LoginView.vue** - Form and toast migration
8. **src/views/RegisterView.vue** - Form and toast migration
9. **src/views/FavoritesView.vue** - Button, empty, message, message-box
10. **src/views/HistoryView.vue** - Button, empty, message
11. **src/components/Layout/AppHeader.vue** - Dropdown, dialog, message, button
12. **src/components/ImageGallery.vue** - Carousel replacement

## Utility Composable

Create `src/composables/useAppToast.ts` for consistent toast usage:

```typescript
export function useAppToast() {
  const toast = useToast()

  return {
    success: (title: string) => toast.add({ title, color: 'success', icon: 'i-lucide-check' }),
    error: (title: string) => toast.add({ title, color: 'error', icon: 'i-lucide-x' }),
    warning: (title: string) => toast.add({ title, color: 'warning', icon: 'i-lucide-alert-triangle' }),
    info: (title: string) => toast.add({ title, color: 'info', icon: 'i-lucide-info' }),
  }
}
```

## Carousel Implementation

Use Embla Carousel for image gallery:

```bash
pnpm add embla-carousel-vue
```

The ImageGallery component will be rewritten to use `emblaCarouselVue` composable with:
- Touch/swipe support
- Dot indicators
- Thumbnail navigation
- Click to open viewer

## Form Validation

Migrate from Element-Plus rule-based validation to Zod schema:

```typescript
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({})
```

## Testing Checklist

- [ ] All pages render correctly
- [ ] Login/Register forms validate and submit
- [ ] Toast notifications display correctly
- [ ] Dropdown menus function properly
- [ ] Modal dialogs open/close correctly
- [ ] Carousel navigates and shows images
- [ ] All buttons have correct styling
- [ ] Mobile responsive layouts work
- [ ] No console errors
- [ ] Bundle size reduced (check build output)