export interface OldProduct {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
}

export interface NewProduct {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
}

export interface ChangeEntry {
  code: string
  type: 'price_update' | 'name_update' | 'new_product'
  name: string
  oldName?: string
  sellingPrice?: number
  oldSellingPrice?: number
  buyingPrice?: number
  oldBuyingPrice?: number
}

/**
 * Compares two product lists and returns one change entry per affected product.
 * Products with both name and price changes produce a single `price_update` entry
 * that also carries `oldName`, avoiding duplicate entries for the same code.
 */
export function computeChanges(oldProducts: OldProduct[], newProducts: NewProduct[]): ChangeEntry[] {
  const oldMap = new Map<string, OldProduct>()
  oldProducts.forEach((p) => oldMap.set(p.code.trim().toLowerCase(), p))

  const changes: ChangeEntry[] = []

  newProducts.forEach((newProd) => {
    const codeKey = newProd.code.trim().toLowerCase()
    const oldProd = oldMap.get(codeKey)

    if (!oldProd) {
      changes.push({
        code: newProd.code,
        type: 'new_product',
        name: newProd.name,
        sellingPrice: newProd.sellingPrice,
        buyingPrice: newProd.buyingPrice,
      })
      return
    }

    const nameChanged = newProd.name.trim() !== oldProd.name.trim()
    const sellingChanged = newProd.sellingPrice !== oldProd.sellingPrice
    const buyingChanged = newProd.buyingPrice !== oldProd.buyingPrice
    const hasPriceChange = sellingChanged || buyingChanged

    if (nameChanged || hasPriceChange) {
      changes.push({
        code: newProd.code,
        type: hasPriceChange ? 'price_update' : 'name_update',
        name: newProd.name,
        oldName: nameChanged ? oldProd.name : undefined,
        sellingPrice: newProd.sellingPrice,
        oldSellingPrice: hasPriceChange ? oldProd.sellingPrice : undefined,
        buyingPrice: newProd.buyingPrice,
        oldBuyingPrice: hasPriceChange ? oldProd.buyingPrice : undefined,
      })
    }
  })

  return changes
}
