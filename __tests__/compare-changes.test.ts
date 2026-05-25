import { computeChanges } from '@/lib/compare-changes'
import type { OldProduct, NewProduct } from '@/lib/compare-changes'

function old(code: string, name: string, sellingPrice?: number, buyingPrice?: number): OldProduct {
  return { code, name, quantity: 10, sellingPrice, buyingPrice }
}

function neu(code: string, name: string, sellingPrice?: number, buyingPrice?: number): NewProduct {
  return { code, name, quantity: 10, sellingPrice, buyingPrice }
}

describe('computeChanges', () => {
  describe('new products', () => {
    it('flags every product as new_product when old snapshot is empty', () => {
      const changes = computeChanges([], [neu('A1', 'Widget'), neu('A2', 'Gadget')])
      expect(changes).toHaveLength(2)
      expect(changes.every((c) => c.type === 'new_product')).toBe(true)
    })

    it('flags a product that exists in the new upload but not in the old snapshot', () => {
      const changes = computeChanges([old('A1', 'Widget')], [neu('A1', 'Widget'), neu('A2', 'Gadget')])
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({ code: 'A2', type: 'new_product', name: 'Gadget' })
    })

    it('includes prices in new_product entry when present', () => {
      const changes = computeChanges([], [neu('X1', 'Item', 50, 30)])
      expect(changes[0]).toMatchObject({ type: 'new_product', sellingPrice: 50, buyingPrice: 30 })
    })
  })

  describe('no changes', () => {
    it('returns empty array when products are identical', () => {
      const old1 = [old('A1', 'Widget', 100, 80), old('A2', 'Gadget', 200, 150)]
      const new1 = [neu('A1', 'Widget', 100, 80), neu('A2', 'Gadget', 200, 150)]
      expect(computeChanges(old1, new1)).toHaveLength(0)
    })

    it('returns empty array when only quantity changed (quantity is not part of the changelog)', () => {
      const changes = computeChanges(
        [{ code: 'A1', name: 'Widget', quantity: 5, sellingPrice: 100 }],
        [{ code: 'A1', name: 'Widget', quantity: 99, sellingPrice: 100 }]
      )
      expect(changes).toHaveLength(0)
    })

    it('does not flag a product that was removed from the new upload', () => {
      const changes = computeChanges([old('A1', 'Widget'), old('GONE', 'Old Item')], [neu('A1', 'Widget')])
      expect(changes).toHaveLength(0)
    })
  })

  describe('name changes', () => {
    it('detects a name change as name_update', () => {
      const changes = computeChanges([old('A1', 'Old Name')], [neu('A1', 'New Name')])
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        code: 'A1',
        type: 'name_update',
        name: 'New Name',
        oldName: 'Old Name',
      })
    })

    it('does not set oldSellingPrice / oldBuyingPrice for a pure name change', () => {
      const changes = computeChanges([old('A1', 'Old Name', 100)], [neu('A1', 'New Name', 100)])
      expect(changes[0].oldSellingPrice).toBeUndefined()
      expect(changes[0].oldBuyingPrice).toBeUndefined()
    })
  })

  describe('price changes', () => {
    it('detects a selling price change as price_update', () => {
      const changes = computeChanges([old('A1', 'Widget', 100)], [neu('A1', 'Widget', 120)])
      expect(changes).toHaveLength(1)
      expect(changes[0]).toMatchObject({
        type: 'price_update',
        sellingPrice: 120,
        oldSellingPrice: 100,
      })
    })

    it('detects a buying price change as price_update', () => {
      const changes = computeChanges([old('A1', 'Widget', 100, 80)], [neu('A1', 'Widget', 100, 90)])
      expect(changes[0]).toMatchObject({
        type: 'price_update',
        buyingPrice: 90,
        oldBuyingPrice: 80,
      })
    })

    it('detects when a price is added (old: undefined, new: defined)', () => {
      const changes = computeChanges([old('A1', 'Widget')], [neu('A1', 'Widget', 50)])
      expect(changes[0]).toMatchObject({ type: 'price_update', sellingPrice: 50, oldSellingPrice: undefined })
    })

    it('detects when a price is removed (old: defined, new: undefined)', () => {
      const changes = computeChanges([old('A1', 'Widget', 50)], [neu('A1', 'Widget', undefined)])
      expect(changes[0]).toMatchObject({ type: 'price_update', sellingPrice: undefined, oldSellingPrice: 50 })
    })
  })

  describe('combined name + price change (key bug fix)', () => {
    it('produces exactly ONE entry when both name and price change', () => {
      const changes = computeChanges(
        [old('A1', 'Old Name', 100, 80)],
        [neu('A1', 'New Name', 120, 90)]
      )
      expect(changes).toHaveLength(1)
    })

    it('uses type price_update when both name and price change', () => {
      const changes = computeChanges(
        [old('A1', 'Old Name', 100)],
        [neu('A1', 'New Name', 120)]
      )
      expect(changes[0].type).toBe('price_update')
    })

    it('carries oldName in the single price_update entry when name also changed', () => {
      const changes = computeChanges(
        [old('A1', 'Old Name', 100)],
        [neu('A1', 'New Name', 120)]
      )
      expect(changes[0]).toMatchObject({
        type: 'price_update',
        name: 'New Name',
        oldName: 'Old Name',
        sellingPrice: 120,
        oldSellingPrice: 100,
      })
    })

    it('does NOT set oldName when only price changed (no name change)', () => {
      const changes = computeChanges([old('A1', 'Widget', 100)], [neu('A1', 'Widget', 120)])
      expect(changes[0].oldName).toBeUndefined()
    })
  })

  describe('code matching', () => {
    it('matches codes case-insensitively', () => {
      const changes = computeChanges([old('abc', 'Widget', 100)], [neu('ABC', 'Widget', 100)])
      expect(changes).toHaveLength(0)
    })

    it('trims whitespace from codes when matching', () => {
      const changes = computeChanges([old('  A1  ', 'Widget', 100)], [neu('A1', 'Widget', 100)])
      expect(changes).toHaveLength(0)
    })
  })

  describe('multiple products', () => {
    it('handles a mix of new, changed, and unchanged products', () => {
      const oldProducts = [
        old('P1', 'Product 1', 100, 80),
        old('P2', 'Product 2', 200, 150),
        old('P3', 'Product 3', 50, 30),
      ]
      const newProducts = [
        neu('P1', 'Product 1', 100, 80),   // unchanged
        neu('P2', 'Product 2 Updated', 220, 150), // name + selling price changed
        neu('P3', 'Product 3', 50, 35),    // buying price changed
        neu('P4', 'Product 4', 75, 60),    // new product
      ]

      const changes = computeChanges(oldProducts, newProducts)
      expect(changes).toHaveLength(3)

      const p2 = changes.find((c) => c.code === 'P2')!
      expect(p2.type).toBe('price_update')
      expect(p2.oldName).toBe('Product 2')
      expect(p2.name).toBe('Product 2 Updated')
      expect(p2.oldSellingPrice).toBe(200)
      expect(p2.sellingPrice).toBe(220)

      const p3 = changes.find((c) => c.code === 'P3')!
      expect(p3.type).toBe('price_update')
      expect(p3.oldName).toBeUndefined()

      const p4 = changes.find((c) => c.code === 'P4')!
      expect(p4.type).toBe('new_product')
    })
  })
})
