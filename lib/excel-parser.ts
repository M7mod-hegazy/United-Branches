import * as XLSX from 'xlsx'
import { decode } from 'iconv-lite'

// Register cptable for SheetJS to resolve Arabic encoding issues in Next.js.
try {
  // @ts-ignore
  const cptable = require('xlsx/dist/cpexcel.js')
  // @ts-ignore
  if (typeof XLSX.set_cptable === 'function') {
    // @ts-ignore
    XLSX.set_cptable(cptable)
  } else {
    // @ts-ignore
    const xlsxModule = require('xlsx')
    if (xlsxModule && typeof xlsxModule.set_cptable === 'function') {
      xlsxModule.set_cptable(cptable)
    }
  }
} catch (e) {}

// Fixes garbled Arabic text that occurs when xlsx reads Windows-1256 bytes as Latin-1.
// Each garbled char has a code point equal to the original Windows-1256 byte value.
function fixArabicMojibake(text: string): string {
  if (!text) return text
  // If already contains Arabic Unicode, no fix needed
  if (/[؀-ۿ]/.test(text)) return text
  // If it contains extended Latin chars (0x80-0xFF range), it may be mojibake
  if (!/[-ÿ]/.test(text)) return text
  // Reconstruct the original bytes (each char code IS the byte value) and decode as cp1256
  const bytes = Buffer.alloc(text.length)
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xFF
  const decoded = decode(bytes, 'cp1256')
  // Only use the decoded version if it actually contains Arabic
  return /[؀-ۿ]/.test(decoded) ? decoded : text
}

export interface ParsedProduct {
  code: string
  name: string
  quantity: number
  sellingPrice?: number
  buyingPrice?: number
}

export interface ParseResult {
  products: ParsedProduct[]
  detectedColumns: string[]
}

const codeTerms = ['code', 'item code', 'product code', 'codeofmodel', 'sku', 'كود', 'الكود', 'كود الصنف', 'رقم الصنف', 'باركود']
const nameTerms = ['name', 'item name', 'product name', 'description', 'desc', 'الصنف', 'اسم الصنف', 'الاسم', 'بيان']
const quantityTerms = ['qty', 'quantity', 'stock', 'finalstock', 'balance', 'on hand', 'كمية', 'الكميه', 'الكمية', 'الرصيد', 'رصيد']
const sellingPriceTerms = ['price', 'selling price', 'sell price', 'unit price', 'sale price', 'سعر البيع', 'سعر بيع', 'السعر', 'سعر']
const buyingPriceTerms = ['avgpriceofbuying', 'avg price of buying', 'buying price', 'buy price', 'cost price', 'purchase price', 'سعر الشراء', 'سعر شراء', 'تكلفة']

function normalize(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function scoreHeader(value: unknown, terms: string[]): number {
  const text = normalize(value)
  if (!text) return 0
  if (terms.some((term) => text === term)) return 3
  if (terms.some((term) => text.includes(term))) return 2
  return 0
}

function firstNumber(value: unknown): number | null {
  const match = String(value ?? '')
    .replace(/,/g, '')
    .match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

function isSequentialIntegerColumn(values: string[]): boolean {
  if (values.length < 4) return false
  const numbers = values.map((value) => Number(value))
  if (numbers.some((value) => !Number.isInteger(value))) return false
  return numbers.every((value, index) => index === 0 || value === numbers[index - 1] + 1)
}

function scoreDataColumn(rows: unknown[][], index: number, kind: 'code' | 'name' | 'quantity'): number {
  const values = rows
    .slice(0, 80)
    .map((row) => String(row[index] ?? '').trim())
    .filter(Boolean)
  if (!values.length) return 0

  const filledRatio = values.length / Math.max(1, Math.min(rows.length, 80))
  const uniqueRatio = new Set(values.map((value) => value.toLowerCase())).size / values.length
  const averageLength = values.reduce((sum, value) => sum + value.length, 0) / values.length
  const letterRatio =
    values.filter((value) => /[a-z؀-ۿ]/i.test(value)).length / values.length
  const numericRatio = values.filter((value) => firstNumber(value) !== null).length / values.length
  const decimalRatio = values.filter((value) => /\d+\.\d+/.test(value)).length / values.length

  if (kind === 'quantity') {
    return numericRatio * 8 + filledRatio * 3
  }

  if (kind === 'name') {
    return letterRatio * 8 + Math.min(averageLength / 8, 4) + filledRatio * 2 - numericRatio * 2
  }

  const sequentialPenalty = isSequentialIntegerColumn(values) ? 8 : 0
  const longTextPenalty = letterRatio > 0.6 && averageLength > 12 ? 6 : 0
  return (
    filledRatio * 4 +
    uniqueRatio * 4 +
    decimalRatio * 5 +
    numericRatio * 2 -
    sequentialPenalty -
    longTextPenalty
  )
}

function hasData(rows: unknown[][], index: number): boolean {
  return rows
    .slice(0, 80)
    .some((row) => String(row[index] ?? '').trim().length > 0)
}

function repairEmptyColumns(
  rows: unknown[][],
  header: { rowIndex: number; codeIndex: number; nameIndex: number; quantityIndex: number }
) {
  const dataRows = rows.slice(header.rowIndex + 1)
  const maxColumns = Math.max(...rows.map((row) => row.length), 0)
  const repaired = { ...header }

  if (!hasData(dataRows, repaired.nameIndex)) {
    let bestName = { index: repaired.nameIndex, score: 0 }
    for (let index = 0; index < maxColumns; index += 1) {
      if (index === repaired.codeIndex || index === repaired.quantityIndex) continue
      const score = scoreDataColumn(dataRows, index, 'name')
      if (score > bestName.score) bestName = { index, score }
    }
    repaired.nameIndex = bestName.index
  }

  if (!hasData(dataRows, repaired.codeIndex)) {
    let bestCode = { index: repaired.codeIndex, score: 0 }
    for (let index = 0; index < maxColumns; index += 1) {
      if (index === repaired.nameIndex || index === repaired.quantityIndex) continue
      const score = scoreDataColumn(dataRows, index, 'code')
      if (score > bestCode.score) bestCode = { index, score }
    }
    repaired.codeIndex = bestCode.index
  }

  if (!hasData(dataRows, repaired.quantityIndex)) {
    let bestQuantity = { index: repaired.quantityIndex, score: 0 }
    for (let index = 0; index < maxColumns; index += 1) {
      if (index === repaired.codeIndex || index === repaired.nameIndex) continue
      const score = scoreDataColumn(dataRows, index, 'quantity')
      if (score > bestQuantity.score) bestQuantity = { index, score }
    }
    repaired.quantityIndex = bestQuantity.index
  }

  return repaired
}

function findHeader(rows: unknown[][]) {
  let best = { rowIndex: -1, codeIndex: -1, nameIndex: -1, quantityIndex: -1, score: 0 }

  rows.slice(0, 30).forEach((row, rowIndex) => {
    const dataRows = rows.slice(rowIndex + 1)
    const scores = row.map((cell, index) => ({
      code: scoreHeader(cell, codeTerms) * 2 + scoreDataColumn(dataRows, index, 'code'),
      name: scoreHeader(cell, nameTerms) * 2 + scoreDataColumn(dataRows, index, 'name'),
      quantity:
        scoreHeader(cell, quantityTerms) * 4 + scoreDataColumn(dataRows, index, 'quantity'),
    }))

    for (let codeIndex = 0; codeIndex < scores.length; codeIndex += 1) {
      for (let nameIndex = 0; nameIndex < scores.length; nameIndex += 1) {
        for (let quantityIndex = 0; quantityIndex < scores.length; quantityIndex += 1) {
          if (
            codeIndex === nameIndex ||
            codeIndex === quantityIndex ||
            nameIndex === quantityIndex
          ) {
            continue
          }

          const score =
            scores[codeIndex].code + scores[nameIndex].name + scores[quantityIndex].quantity
          if (score > best.score) {
            best = { rowIndex, codeIndex, nameIndex, quantityIndex, score }
          }
        }
      }
    }
  })

  if (best.rowIndex === -1) {
    throw new Error('Could not detect code, name, and quantity columns in the Excel file')
  }

  return repairEmptyColumns(rows, best)
}

function findOptionalPriceColumns(
  rows: unknown[][],
  header: { rowIndex: number; codeIndex: number; nameIndex: number; quantityIndex: number }
): { sellingPriceIndex: number | null; buyingPriceIndex: number | null } {
  const headerRow = rows[header.rowIndex] ?? []
  const dataRows = rows.slice(header.rowIndex + 1)
  const reserved = new Set([header.codeIndex, header.nameIndex, header.quantityIndex])

  let bestSelling = { index: -1, score: 0 }
  let bestBuying = { index: -1, score: 0 }

  headerRow.forEach((cell, index) => {
    if (reserved.has(index)) return
    const headerScore = scoreHeader(cell, sellingPriceTerms)
    if (headerScore > 0) {
      const dataScore = scoreDataColumn(dataRows, index, 'quantity')
      const total = headerScore * 3 + dataScore
      if (total > bestSelling.score) bestSelling = { index, score: total }
    }
  })

  headerRow.forEach((cell, index) => {
    if (reserved.has(index) || index === bestSelling.index) return
    const headerScore = scoreHeader(cell, buyingPriceTerms)
    if (headerScore > 0) {
      const dataScore = scoreDataColumn(dataRows, index, 'quantity')
      const total = headerScore * 3 + dataScore
      if (total > bestBuying.score) bestBuying = { index, score: total }
    }
  })

  return {
    sellingPriceIndex: bestSelling.index >= 0 ? bestSelling.index : null,
    buyingPriceIndex: bestBuying.index >= 0 ? bestBuying.index : null,
  }
}

function toQuantity(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return firstNumber(value) ?? 0
}

export function parseExcelBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 1256 })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) return { products: [], detectedColumns: [] }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: '',
    raw: false,
  })
  const header = findHeader(rows)
  const priceColumns = findOptionalPriceColumns(rows, header)
  const byCode = new Map<string, ParsedProduct>()

  rows.slice(header.rowIndex + 1).forEach((row) => {
    const code = normalize(row[header.codeIndex])
    const name = String(row[header.nameIndex] ?? '').trim()
    if (!code || !name) return

    const quantity = toQuantity(row[header.quantityIndex])
    const fixedName = fixArabicMojibake(name)

    const sellingPrice =
      priceColumns.sellingPriceIndex !== null
        ? (firstNumber(row[priceColumns.sellingPriceIndex]) ?? undefined)
        : undefined
    const buyingPrice =
      priceColumns.buyingPriceIndex !== null
        ? (firstNumber(row[priceColumns.buyingPriceIndex]) ?? undefined)
        : undefined

    const existing = byCode.get(code)
    if (existing) {
      existing.quantity += quantity
      if (!existing.name && fixedName) existing.name = fixedName
      if (existing.sellingPrice === undefined && sellingPrice !== undefined) existing.sellingPrice = sellingPrice
      if (existing.buyingPrice === undefined && buyingPrice !== undefined) existing.buyingPrice = buyingPrice
    } else {
      byCode.set(code, { code, name: fixedName, quantity, sellingPrice, buyingPrice })
    }
  })

  const detectedColumns = ['code', 'name', 'quantity']
  if (priceColumns.sellingPriceIndex !== null) detectedColumns.push('sellingPrice')
  if (priceColumns.buyingPriceIndex !== null) detectedColumns.push('buyingPrice')

  return { products: Array.from(byCode.values()), detectedColumns }
}
