---
name: Custom categories
description: Custom charge categories persisted in localStorage, available in all category selectors
type: feature
---
Custom categories are stored in localStorage under key `custom-categories` as a `Record<string, string>` (key → label).
Hook: `useCustomCategories()` for CRUD, `getCustomCategories()` for read-only access.
All components using CATEGORY_LABELS must also merge custom categories via `getCustomCategories()`.
Colors for custom categories are generated deterministically from the key hash.
