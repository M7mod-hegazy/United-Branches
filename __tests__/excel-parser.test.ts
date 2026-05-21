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

    const { products } = parseExcelBuffer(buffer)
    expect(products).toEqual([
      { code: 'a-1', name: 'صنف أول', quantity: 5 },
      { code: 'b-2', name: 'صنف ثاني', quantity: 5 },
    ])
  })

  it('detects English columns', () => {
    const buffer = workbookBuffer([
      ['Product Code', 'Product Name', 'Quantity'],
      ['C-3', 'Cable', '7'],
    ])

    const { products } = parseExcelBuffer(buffer)
    expect(products).toEqual([{ code: 'c-3', name: 'Cable', quantity: 7 }])
  })

  it('handles exported branch reports with spacer columns and unit-suffixed quantities', () => {
    const buffer = workbookBuffer([
      ['Text55', 'Text69', 'NameOfStore', 'FinalStock', 'Text64', 'CodeOfModel', 'Text63', 'Text62'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '28 قطعة', 'كابولي  لماسورة مربعه سناره', '', '1.23', '1'],
      ['', '', '', '33 قطعة', 'كابولي 10 بليه على ماسورة مربعه عدل نيكل', '', '1.2', '2'],
    ])

    const { products } = parseExcelBuffer(buffer)
    expect(products).toEqual([
      { code: '1.23', name: 'كابولي  لماسورة مربعه سناره', quantity: 28 },
      { code: '1.2', name: 'كابولي 10 بليه على ماسورة مربعه عدل نيكل', quantity: 33 },
    ])
  })

  it('detects selling and buying price columns from new format', () => {
    const buffer = workbookBuffer([
      ['Text55', 'Text69', 'NameOfStore', 'TotalSelling', 'TotalBuying', 'FinalStock', 'Price', 'AVGPriceOfBuying', 'Text64', 'CodeNumberOfMode', 'Text62'],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '1680', '1400', '28 قطعة', 60, 50, 'كابولي لماسورة', '1.23', 1],
      ['', '', '', '1485', '1320', '33 قطعة', 45, 40, 'كابولي 10 بليه', '1.2', 2],
    ])

    const { products, detectedColumns } = parseExcelBuffer(buffer)
    expect(detectedColumns).toContain('sellingPrice')
    expect(detectedColumns).toContain('buyingPrice')
    expect(products[0]).toMatchObject({ sellingPrice: 60, buyingPrice: 50 })
    expect(products[1]).toMatchObject({ sellingPrice: 45, buyingPrice: 40 })
  })

  it('returns detectedColumns without prices for old format', () => {
    const buffer = workbookBuffer([
      ['كود الصنف', 'اسم الصنف', 'الرصيد'],
      ['A-1', 'صنف أول', 2],
    ])

    const { detectedColumns, products } = parseExcelBuffer(buffer)
    expect(detectedColumns).toEqual(['code', 'name', 'quantity'])
    expect(products[0].sellingPrice).toBeUndefined()
    expect(products[0].buyingPrice).toBeUndefined()
  })
})
