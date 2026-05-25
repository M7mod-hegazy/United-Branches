import { buildFinalProducts } from '@/lib/build-final-products'
import type { Product } from '@/lib/build-final-products'
import type { ChangeEntry } from '@/lib/compare-changes'

function prod(code: string, name: string, sellingPrice?: number, buyingPrice?: number): Product {
  return { code, name, quantity: 10, sellingPrice, buyingPrice }
}

function priceChange(code: string, name: string, newSell: number, oldSell: number, newBuy?: number, oldBuy?: number): ChangeEntry {
  return {
    code,
    type: 'price_update',
    name,
    sellingPrice: newSell,
    oldSellingPrice: oldSell,
    buyingPrice: newBuy,
    oldBuyingPrice: oldBuy,
  }
}

function nameChange(code: string, newName: string, oldName: string): ChangeEntry {
  return { code, type: 'name_update', name: newName, oldName }
}

function newProduct(code: string, name: string, sellingPrice?: number): ChangeEntry {
  return { code, type: 'new_product', name, sellingPrice }
}

describe('buildFinalProducts', () => {
  describe('applying changes', () => {
    it('applies a price_update to the matching product', () => {
      const products = [prod('A1', 'Widget', 100, 80)]
      const changes: ChangeEntry[] = [priceChange('A1', 'Widget', 120, 100, 90, 80)]

      const result = buildFinalProducts(products, changes, new Set())
      expect(result[0]).toMatchObject({ code: 'A1', sellingPrice: 120, buyingPrice: 90 })
    })

    it('applies a name_update to the matching product', () => {
      const products = [prod('A1', 'Old Name', 100)]
      const changes: ChangeEntry[] = [nameChange('A1', 'New Name', 'Old Name')]

      const result = buildFinalProducts(products, changes, new Set())
      expect(result[0].name).toBe('New Name')
    })

    it('passes through unchanged products untouched', () => {
      const products = [prod('A1', 'Widget', 100), prod('A2', 'Gadget', 200)]
      const changes: ChangeEntry[] = [priceChange('A1', 'Widget', 120, 100)]

      const result = buildFinalProducts(products, changes, new Set())
      const a2 = result.find((p) => p.code === 'A2')!
      expect(a2).toMatchObject({ name: 'Gadget', sellingPrice: 200 })
    })

    it('applies price from price_update and name from name_update when both exist for same code', () => {
      // This scenario covers legacy data where two entries might exist for one code.
      // The applyMap must not let one clobber the other.
      const products = [prod('A1', 'Old Name', 100)]
      const changes: ChangeEntry[] = [
        nameChange('A1', 'New Name', 'Old Name'),
        priceChange('A1', 'New Name', 150, 100),
      ]

      const result = buildFinalProducts(products, changes, new Set())
      expect(result[0].name).toBe('New Name')
      expect(result[0].sellingPrice).toBe(150)
    })

    it('name edit from name_update is not clobbered by a subsequent price_update entry', () => {
      const products = [prod('A1', 'Old Name', 100)]
      const changes: ChangeEntry[] = [
        nameChange('A1', 'User Edited Name', 'Old Name'), // processed first
        priceChange('A1', 'User Edited Name', 150, 100),  // processed second — must keep name
      ]

      const result = buildFinalProducts(products, changes, new Set())
      expect(result[0].name).toBe('User Edited Name')
      expect(result[0].sellingPrice).toBe(150)
    })
  })

  describe('excluding changes', () => {
    it('removes a new_product whose code is in excludedCodes', () => {
      const products = [prod('A1', 'Widget'), prod('NEW', 'Brand New')]
      const changes: ChangeEntry[] = [newProduct('NEW', 'Brand New', 50)]

      const result = buildFinalProducts(products, changes, new Set(['NEW']))
      expect(result.find((p) => p.code === 'NEW')).toBeUndefined()
      expect(result).toHaveLength(1)
    })

    it('restores old selling price when a price_update is excluded', () => {
      const products = [prod('A1', 'Widget', 120)]  // new price from upload
      const changes: ChangeEntry[] = [priceChange('A1', 'Widget', 120, 100)]  // old was 100

      const result = buildFinalProducts(products, changes, new Set(['A1']))
      expect(result[0].sellingPrice).toBe(100)
    })

    it('restores old name when a name_update is excluded', () => {
      const products = [prod('A1', 'New Name')]
      const changes: ChangeEntry[] = [nameChange('A1', 'New Name', 'Old Name')]

      const result = buildFinalProducts(products, changes, new Set(['A1']))
      expect(result[0].name).toBe('Old Name')
    })

    it('restores BOTH old name AND old price when both changes are excluded', () => {
      const products = [prod('A1', 'New Name', 150)]
      const changes: ChangeEntry[] = [
        nameChange('A1', 'New Name', 'Old Name'),
        priceChange('A1', 'New Name', 150, 100),
      ]

      const result = buildFinalProducts(products, changes, new Set(['A1']))
      expect(result[0].name).toBe('Old Name')
      expect(result[0].sellingPrice).toBe(100)
    })

    it('does not affect products whose codes are not in excludedCodes', () => {
      const products = [prod('A1', 'Widget', 120), prod('A2', 'Gadget', 200)]
      const changes: ChangeEntry[] = [
        priceChange('A1', 'Widget', 120, 100),
        priceChange('A2', 'Gadget', 200, 180),
      ]

      // Only exclude A1; A2 should have its new price applied
      const result = buildFinalProducts(products, changes, new Set(['A1']))
      const a2 = result.find((p) => p.code === 'A2')!
      expect(a2.sellingPrice).toBe(200)
    })
  })

  describe('edge cases', () => {
    it('returns all products unchanged when there are no changes', () => {
      const products = [prod('A1', 'Widget', 100), prod('A2', 'Gadget', 200)]
      const result = buildFinalProducts(products, [], new Set())
      expect(result).toHaveLength(2)
      expect(result[0].sellingPrice).toBe(100)
    })

    it('handles an empty product list', () => {
      const result = buildFinalProducts([], [priceChange('A1', 'X', 10, 5)], new Set())
      expect(result).toHaveLength(0)
    })

    it('matches codes case-insensitively when applying changes', () => {
      const products = [prod('abc', 'Widget', 100)]
      const changes: ChangeEntry[] = [priceChange('ABC', 'Widget', 120, 100)]

      const result = buildFinalProducts(products, changes, new Set())
      expect(result[0].sellingPrice).toBe(120)
    })
  })
})
