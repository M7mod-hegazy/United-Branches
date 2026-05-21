# Design Spec: Blue Theme Redesign + Name Conflict Button

**Date:** 2026-05-21  
**Status:** Approved

---

## 1. Color System Redesign

Replace the warm beige/gold palette with a clean corporate blue for better visibility on older screens.

### Token Map

| Role | Old Value | New Value |
|---|---|---|
| Page background | `#FCFAF7` | `#F5F8FC` |
| Surface / cards / table rows | `#FAF8F5` | `#FFFFFF` |
| Table header background | `#FAF8F5` | `#EEF4FB` |
| Primary accent | `#A88554` | `#1E6FBF` |
| Accent hover | `#96764A` | `#1557A0` |
| Borders | `#EAE8E4`, `#E2E0D9` | `#C8D9EC`, `#D0E3F5` |
| Muted text | `#78726A`, `#A19D95` | `#5A7A9A`, `#8AAAC8` |
| Body text | `#1E2229` | `#1A202C` |
| Row stripe | `#FCFAF7/30` | `#F0F6FF/40` |
| Row hover | `#FDFBF9` | `#EBF3FC` |
| Total cell bg | `#FAF8F5/30` | `#EEF4FB/50` |

### Affected Files
- `app/globals.css` — base body background
- `app/layout.tsx` — header, nav links, login button, brand dot
- `app/page.tsx` — page title accent, count dot, skeleton, pagination buttons
- `components/preview/InventoryTable.tsx` — table header, rows, sticky cells, total column
- `components/preview/SearchFilters.tsx` — inputs, selects, checkbox, focus rings
- `components/preview/BranchColumnHeader.tsx` — any accent colors used there

---

## 2. Name Conflict Button + Modal

### Problem
`inventory-merger.ts` currently picks the first name it encounters for a product code. Different branches may upload the same code with different names (typos, alternate spellings). These conflicts are currently invisible.

### Data Layer

Extend `MergedProduct` in `lib/inventory-merger.ts`:

```ts
export interface NameVariant {
  branchId: string
  branchName: string
  name: string
}

export interface MergedProduct {
  code: string
  name: string
  total: number
  branches: Record<string, number>
  nameVariants: NameVariant[]   // all distinct names seen across branches
}
```

During merge, collect every `{ branchId, branchName, name }` per product code. A product has a conflict when `nameVariants` contains 2+ distinct `name` values (case-insensitive trim comparison).

### UI — Conflict Button

Placed between the page title block and the `<SearchFilters>` section in `app/page.tsx`. Only rendered when `conflictCount > 0`.

```
[ ⚠ ٥ أصناف بأسماء متعارضة ]
```

- Outlined blue button (`border-[#1E6FBF] text-[#1E6FBF]`)
- On click: opens `<NameConflictsModal>`

### UI — Modal

New component: `components/preview/NameConflictsModal.tsx`

- Dark overlay backdrop (`bg-black/50`)
- White card, max-width `640px`, scrollable body
- Title: **"أصناف بأسماء متعارضة"**
- Each conflicted product shown as a card:
  ```
  كود: 1234.5
    • فرع الرياض   → قلم أحمر
    • فرع جدة      → قلم رصاص
  ```
- Sorted by product code ascending
- Close button (X) top-right + clicking backdrop closes modal

### Conflict Detection in page.tsx

```ts
const conflicts = useMemo(() =>
  data.products.filter(p => {
    const uniqueNames = new Set(p.nameVariants.map(v => v.name.trim().toLowerCase()))
    return uniqueNames.size > 1
  }),
  [data.products]
)
```

---

## 3. Out of Scope
- No changes to upload flow, admin pages, or API auth
- No per-row conflict indicators — one global button only
- No conflict resolution / editing capability
