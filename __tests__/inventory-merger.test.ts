import { mergeInventory } from '@/lib/inventory-merger'

describe('mergeInventory', () => {
  it('merges products across branches and calculates totals', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع أ',
        uploadedAt: '2026-05-20T10:00:00.000Z',
        products: [
          { code: 'P1', name: 'منتج 1', quantity: 4 },
          { code: 'P2', name: 'منتج 2', quantity: 1 },
        ],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع ب',
        uploadedAt: '2026-05-20T11:00:00.000Z',
        products: [
          { code: 'p1', name: 'منتج 1', quantity: 6 },
          { code: 'P3', name: 'منتج 3', quantity: 2 },
        ],
      },
    ])

    expect(result.branches).toHaveLength(2)
    expect(result.products).toEqual([
      {
        code: 'p1',
        name: 'منتج 1',
        total: 10,
        branches: { 'branch-a': 4, 'branch-b': 6 },
        nameVariants: [
          { branchId: 'branch-a', branchName: 'فرع أ', name: 'منتج 1' },
          { branchId: 'branch-b', branchName: 'فرع ب', name: 'منتج 1' },
        ],
        priceVariants: [],
      },
      {
        code: 'p2',
        name: 'منتج 2',
        total: 1,
        branches: { 'branch-a': 1 },
        nameVariants: [{ branchId: 'branch-a', branchName: 'فرع أ', name: 'منتج 2' }],
        priceVariants: [],
      },
      {
        code: 'p3',
        name: 'منتج 3',
        total: 2,
        branches: { 'branch-b': 2 },
        nameVariants: [{ branchId: 'branch-b', branchName: 'فرع ب', name: 'منتج 3' }],
        priceVariants: [],
      },
    ])
  })

  it('collects all name variants when branches use different names for the same code', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع الرياض',
        uploadedAt: '2026-05-21T10:00:00.000Z',
        products: [{ code: 'P1', name: 'قلم أحمر', quantity: 3 }],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع جدة',
        uploadedAt: '2026-05-21T11:00:00.000Z',
        products: [{ code: 'p1', name: 'قلم رصاص', quantity: 5 }],
      },
    ])

    const product = result.products[0]
    expect(product.code).toBe('p1')
    expect(product.nameVariants).toEqual([
      { branchId: 'branch-a', branchName: 'فرع الرياض', name: 'قلم أحمر' },
      { branchId: 'branch-b', branchName: 'فرع جدة', name: 'قلم رصاص' },
    ])
  })

  it('populates priceVariants for products with price data', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع أ',
        uploadedAt: '2026-05-21T10:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 4, sellingPrice: 60, buyingPrice: 50 }],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع ب',
        uploadedAt: '2026-05-21T11:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 6, sellingPrice: 55, buyingPrice: 50 }],
      },
    ])

    const p1 = result.products.find((p) => p.code === 'p1')!
    expect(p1.priceVariants).toHaveLength(2)
    expect(p1.priceVariants[0]).toMatchObject({ branchId: 'branch-a', sellingPrice: 60, buyingPrice: 50 })
    expect(p1.priceVariants[1]).toMatchObject({ branchId: 'branch-b', sellingPrice: 55, buyingPrice: 50 })
  })

  it('excludes branches with no price data from priceVariants', () => {
    const result = mergeInventory([
      {
        branchId: 'branch-a',
        branchName: 'فرع أ',
        uploadedAt: '2026-05-21T10:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 4 }],
      },
      {
        branchId: 'branch-b',
        branchName: 'فرع ب',
        uploadedAt: '2026-05-21T11:00:00.000Z',
        products: [{ code: 'P1', name: 'منتج 1', quantity: 6, sellingPrice: 55 }],
      },
    ])

    const p1 = result.products.find((p) => p.code === 'p1')!
    expect(p1.priceVariants).toHaveLength(1)
    expect(p1.priceVariants[0].branchId).toBe('branch-b')
  })
})
