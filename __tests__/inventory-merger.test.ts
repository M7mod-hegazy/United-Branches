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
      { code: 'p1', name: 'منتج 1', total: 10, branches: { 'branch-a': 4, 'branch-b': 6 } },
      { code: 'p2', name: 'منتج 2', total: 1, branches: { 'branch-a': 1 } },
      { code: 'p3', name: 'منتج 3', total: 2, branches: { 'branch-b': 2 } },
    ])
  })
})
