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

  it('handles exported branch reports with spacer columns and unit-suffixed quantities', () => {
    const buffer = workbookBuffer([
      ['Text55', 'Text69', 'NameOfStore', 'FinalStock', 'Text64', 'CodeOfModel', 'Text63', 'Text62'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '28 قطعة', 'كابولي  لماسورة مربعه سناره', '', '1.23', '1'],
      ['', '', '', '33 قطعة', 'كابولي 10 بليه على ماسورة مربعه عدل نيكل', '', '1.2', '2'],
    ])

    expect(parseExcelBuffer(buffer)).toEqual([
      { code: '1.23', name: 'كابولي  لماسورة مربعه سناره', quantity: 28 },
      { code: '1.2', name: 'كابولي 10 بليه على ماسورة مربعه عدل نيكل', quantity: 33 },
    ])
  })
})
