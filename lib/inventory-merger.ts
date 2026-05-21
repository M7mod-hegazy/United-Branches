import type { IProduct } from '@/models/Snapshot'

export interface SnapshotInput {
  branchId: string
  branchName: string
  uploadedAt: Date | string
  products: IProduct[]
}

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
  nameVariants: NameVariant[]
}

export interface BranchMeta {
  id: string
  name: string
  uploadedAt: string
}

export interface MergedInventory {
  branches: BranchMeta[]
  products: MergedProduct[]
}

export function mergeInventory(snapshots: SnapshotInput[]): MergedInventory {
  const branches: BranchMeta[] = snapshots.map((snapshot) => ({
    id: snapshot.branchId,
    name: snapshot.branchName,
    uploadedAt: new Date(snapshot.uploadedAt).toISOString(),
  }))
  const products = new Map<string, MergedProduct>()

  snapshots.forEach((snapshot) => {
    snapshot.products.forEach((product) => {
      const code = product.code.trim().toLowerCase()
      if (!code) return

      const existing =
        products.get(code) ||
        ({
          code,
          name: product.name,
          total: 0,
          branches: {},
          nameVariants: [],
        } satisfies MergedProduct)

      existing.name = existing.name || product.name
      existing.branches[snapshot.branchId] =
        (existing.branches[snapshot.branchId] || 0) + product.quantity
      existing.total += product.quantity
      existing.nameVariants.push({
        branchId: snapshot.branchId,
        branchName: snapshot.branchName,
        name: product.name,
      })
      products.set(code, existing)
    })
  })

  return {
    branches,
    products: Array.from(products.values()).sort((a, b) => a.code.localeCompare(b.code)),
  }
}
