import * as XLSX from 'xlsx'
import { parseExcelBuffer } from '@/lib/excel-parser'

function workbookBuffer(rows: unknown[][]) {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

describe('parseExcelBuffer', () => {
  it('detects Arabic columns and sums duplicate product codes', () => {
    const buffer = workbookBuffer([
      ['تقرير أرصدة'],
      ['كود الصنف', 'اسم الصنف', 'الرصيد'],
      ['A-1', 'صنف أول', 2],
      ['A-1', 'صنف أول', 3],
      ['B-2', 'صنف ثاني', '5'],
    ])

    expect(parseExcelBuffer(buffer)).toEqual([
      { code: 'a-1', name: 'صنف أول', quantity: 5 },
      { code: 'b-2', name: 'صنف ثاني', quantity: 5 },
    ])
  })

  it('detects English columns', () => {
    const buffer = workbookBuffer([
      ['Product Code', 'Product Name', 'Quantity'],
      ['C-3', 'Cable', '7'],
    ])

    expect(parseExcelBuffer(buffer)).toEqual([{ code: 'c-3', name: 'Cable', quantity: 7 }])
  })
})
