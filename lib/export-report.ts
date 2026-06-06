import * as XLSX from 'xlsx'
import type { BranchMeta, MergedProduct } from '@/components/preview/InventoryTable'

interface ExportOptions {
  branches: BranchMeta[]
  products: MergedProduct[]
  showSellingPrice: boolean
  showBuyingPrice: boolean
}

const ARABIC_FONT = { name: 'Cairo', sz: 11 }

const BASE_COLORS = {
  primary: '1E6FBF',
  accent: '1E40AF',
  headerBg: '1E6FBF',
  headerFg: 'FFFFFF',
  subHeaderBg: 'EFF6FF',
  stripeBg: 'F8FAFC',
  border: 'CBD5E1',
  codeBg: 'EFF6FF',
}

interface CellStyle {
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean }
  font?: { name?: string; sz?: number; bold?: boolean; color?: { rgb: string } }
  fill?: { fgColor?: { rgb: string } }
  border?: { top?: any; bottom?: any; left?: any; right?: any }
}

function cellStyle(opts: {
  bold?: boolean
  fontSize?: number
  bg?: string
  color?: string
  border?: boolean
  align?: 'right' | 'center' | 'left'
  wrap?: boolean
  fontName?: string
}): CellStyle {
  const style: CellStyle = {
    alignment: {
      horizontal: opts.align || 'right',
      vertical: 'center',
      wrapText: opts.wrap || false,
    },
    font: {
      name: opts.fontName || ARABIC_FONT.name,
      sz: opts.fontSize || ARABIC_FONT.sz,
      bold: opts.bold || false,
      color: opts.color ? { rgb: opts.color } : undefined,
    },
    fill: opts.bg ? { fgColor: { rgb: opts.bg } } : undefined,
  }
  if (opts.border !== false) {
    style.border = {
      top: { style: 'thin', color: { rgb: BASE_COLORS.border } },
      bottom: { style: 'thin', color: { rgb: BASE_COLORS.border } },
      left: { style: 'thin', color: { rgb: BASE_COLORS.border } },
      right: { style: 'thin', color: { rgb: BASE_COLORS.border } },
    }
  }
  return style
}

export function exportToExcel({ branches, products, showSellingPrice, showBuyingPrice }: ExportOptions) {
  const wb = XLSX.utils.book_new()

  const headerRows = [
    ['كود الصنف', 'اسم الصنف', ...branches.map((b) => b.name), 'إجمالي المخزون'],
  ]

  if (showSellingPrice || showBuyingPrice) {
    const priceHeaders: string[] = []
    for (const branch of branches) {
      if (showSellingPrice && showBuyingPrice) {
        priceHeaders.push(`${branch.name} - سعر البيع`, `${branch.name} - سعر الشراء`)
      } else if (showSellingPrice) {
        priceHeaders.push(`${branch.name} - سعر البيع`)
      } else {
        priceHeaders.push(`${branch.name} - سعر الشراء`)
      }
    }
    headerRows.push([
      '',
      '',
      ...priceHeaders,
      '',
    ])
  }

  const hasPrices = showSellingPrice || showBuyingPrice
  const branchCols = branches.length
  const priceCols = hasPrices
    ? branches.length * (showSellingPrice && showBuyingPrice ? 2 : 1)
    : 0
  const totalCols = 1
  const totalColumns = 2 + branchCols + totalCols + priceCols

  const wsData: (string | number)[][] = [...headerRows]

  const productsToExport = products

  for (const product of productsToExport) {
    const row: (string | number)[] = [
      product.code,
      product.name,
    ]

    for (const branch of branches) {
      row.push(product.branches[branch.id] ?? 0)
    }

    if (hasPrices) {
      for (const branch of branches) {
        const variant = product.priceVariants.find((v) => v.branchId === branch.id)
        if (showSellingPrice && showBuyingPrice) {
          row.push(variant?.sellingPrice ?? '')
          row.push(variant?.buyingPrice ?? '')
        } else if (showSellingPrice) {
          row.push(variant?.sellingPrice ?? '')
        } else {
          row.push(variant?.buyingPrice ?? '')
        }
      }
    }

    row.push(product.total)
    wsData.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const branchStart = 2
  const branchEnd = branchStart + branchCols - 1
  const priceStart = branchEnd + 1
  const priceEnd = priceStart + priceCols - 1
  const totalCol = totalColumns - 1

  if (!ws['!merges']) ws['!merges'] = []

  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } })

  const colWidths: { wch: number }[] = [
    { wch: 14 },
    { wch: 40 },
    ...branches.map(() => ({ wch: 14 })),
  ]
  if (hasPrices) {
    for (const branch of branches) {
      if (showSellingPrice && showBuyingPrice) {
        colWidths.push({ wch: 16 }, { wch: 16 })
      } else {
        colWidths.push({ wch: 16 })
      }
    }
  }
  colWidths.push({ wch: 16 })
  ws['!cols'] = colWidths

  for (let R = 0; R < wsData.length; R++) {
    for (let C = 0; C < wsData[R].length; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) continue
      if (typeof ws[addr] === 'object' && !(ws[addr] as any).t) continue

      const cell = ws[addr] as XLSX.CellObject

      if (R === 0) {
        cell.s = cellStyle({
          bold: true,
          fontSize: 16,
          bg: BASE_COLORS.headerBg,
          color: BASE_COLORS.headerFg,
          align: 'center',
        })
      } else if (R === 1 && hasPrices) {
        cell.s = cellStyle({
          bold: true,
          fontSize: 9,
          bg: BASE_COLORS.subHeaderBg,
          color: BASE_COLORS.accent,
          align: 'center',
        })
      } else {
        const isEven = R % 2 === 0
        const isCode = C === 0
        const isName = C === 1
        const isQuantity = C >= branchStart && C <= branchEnd
        const isPrice = C >= priceStart && C <= priceEnd
        const isTotal = C === totalCol

        let bg: string | undefined
        if (isCode) bg = BASE_COLORS.codeBg
        else if (isEven) bg = BASE_COLORS.stripeBg

        const opts: Parameters<typeof cellStyle>[0] = {
          fontSize: isCode ? 12 : 11,
          bold: isCode || isTotal || isQuantity,
          bg,
          align: isName ? 'right' : 'center',
        }

        if (isCode) opts.color = BASE_COLORS.primary
        if (isTotal) opts.color = BASE_COLORS.primary

        cell.s = cellStyle(opts)
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'تقرير المخزون الموحد')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `تقرير-المخزون-الموحد-${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
