import type { ChangeEntry } from './compare-changes'

export interface Product {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
  [key: string]: unknown
}

/**
 * Applies confirmed changes to the uploaded product list to produce the final
 * snapshot. Excluded codes are reverted to their old values; new products that
 * are excluded are removed entirely.
 */
export function buildFinalProducts(
  allProducts: Product[],
  changes: ChangeEntry[],
  excludedCodes: Set<string>
): Product[] {
  const confirmedChanges = changes.filter((c) => !excludedCodes.has(c.code))

  // Merge all change entries for the same code so that name edits (name_update)
  // and price edits (price_update) are applied independently without either one
  // clobbering the other.
  const applyMap = new Map<string, { name: string; sellingPrice?: number; buyingPrice?: number }>()
  confirmedChanges.forEach((c) => {
    const key = c.code.toLowerCase()
    const existing = applyMap.get(key)
    if (!existing) {
      applyMap.set(key, { name: c.name, sellingPrice: c.sellingPrice, buyingPrice: c.buyingPrice })
    } else if (c.type === 'name_update') {
      applyMap.set(key, { ...existing, name: c.name })
    } else if (c.type === 'price_update') {
      applyMap.set(key, { ...existing, sellingPrice: c.sellingPrice, buyingPrice: c.buyingPrice })
    }
  })

  const existingCodes = new Set(allProducts.map((p) => p.code.trim().toLowerCase()))

  const mapped = allProducts
    .map((product): Product | null => {
      const codeKey = product.code.trim().toLowerCase()

      if (excludedCodes.has(product.code)) {
        const allChangesForCode = changes.filter((c) => c.code === product.code)
        if (allChangesForCode.some((c) => c.type === 'new_product')) return null
        let restored = { ...product }
        for (const ch of allChangesForCode) {
          if (ch.type === 'price_update') {
            restored = { ...restored, sellingPrice: ch.oldSellingPrice, buyingPrice: ch.oldBuyingPrice }
          } else if (ch.type === 'name_update') {
            restored = { ...restored, name: ch.oldName ?? product.name }
          }
        }
        return restored
      }

      const edit = applyMap.get(codeKey)
      if (edit) {
        return { ...product, name: edit.name, sellingPrice: edit.sellingPrice, buyingPrice: edit.buyingPrice }
      }

      return product
    })
    .filter((p): p is Product => p !== null)

  // Append new_product entries (auto-detected or manually added) that aren't
  // already present in allProducts and haven't been excluded by the user.
  const newProductEntries: Product[] = confirmedChanges
    .filter(
      (c) =>
        c.type === 'new_product' &&
        !existingCodes.has(c.code.trim().toLowerCase())
    )
    .map((c) => ({
      code: c.code,
      name: c.name,
      quantity: 0,
      sellingPrice: c.sellingPrice,
      buyingPrice: c.buyingPrice,
    }))

  return [...mapped, ...newProductEntries]
}
