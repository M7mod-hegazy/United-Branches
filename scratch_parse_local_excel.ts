import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

// Register cp1256 encoding support for xlsx
try {
  const cptable = require('xlsx/dist/cpexcel.js');
  if (typeof XLSX.set_cptable === 'function') {
    (XLSX as any).set_cptable(cptable);
  }
} catch (e) {}

import { parseExcelBuffer } from './lib/excel-parser';

const MONGODB_URI = "mongodb+srv://m7mod:275757@united-branches.duzabq5.mongodb.net/?appName=united-branches";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const filePath = path.join(__dirname, 'أرصدة كميات وأسعار.xls');
  const buffer = fs.readFileSync(filePath);
  const { products: excelProducts, detectedColumns } = parseExcelBuffer(buffer);

  console.log(`Excel parsed successfully:`);
  console.log(`- Detected columns:`, detectedColumns);
  console.log(`- Products count:`, excelProducts.length);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("DB connection not established");
  }
  const snapshot = await db.collection('snapshots').findOne({ _id: new mongoose.Types.ObjectId('6a0f4a79f377b0296bc4fc62') });
  
  if (!snapshot) {
    console.log("Snapshot 6a0f4a79f377b0296bc4fc62 not found");
    await mongoose.disconnect();
    return;
  }

  console.log("Database snapshot products count:", snapshot.products.length);

  // Compare parsed Excel products with snapshot products
  const dbMap = new Map<string, any>();
  snapshot.products.forEach((p: any) => dbMap.set(p.code.trim().toLowerCase(), p));

  let matched = 0;
  let unmatched = 0;
  let priceDiffs = 0;
  let nameDiffs = 0;

  excelProducts.forEach(ep => {
    const code = ep.code.trim().toLowerCase();
    const dp = dbMap.get(code);
    if (!dp) {
      unmatched++;
      if (unmatched <= 5) console.log(`Unmatched in DB (New product from excel): ${ep.code} - ${ep.name} (Selling: ${ep.sellingPrice}, Buying: ${ep.buyingPrice})`);
    } else {
      matched++;
      if (ep.name.trim() !== dp.name.trim()) {
        nameDiffs++;
        if (nameDiffs <= 5) console.log(`Name diff for ${ep.code}: Excel "${ep.name}" vs DB "${dp.name}"`);
      }
      if (ep.sellingPrice !== dp.sellingPrice || ep.buyingPrice !== dp.buyingPrice) {
        priceDiffs++;
        if (priceDiffs <= 5) console.log(`Price diff for ${ep.code} (${ep.name}): Excel S:${ep.sellingPrice} B:${ep.buyingPrice} vs DB S:${dp.sellingPrice} B:${dp.buyingPrice}`);
      }
    }
  });

  console.log(`\nComparison stats:`);
  console.log(`- Matched in DB: ${matched}`);
  console.log(`- Unmatched (New in Excel): ${unmatched}`);
  console.log(`- Name diffs: ${nameDiffs}`);
  console.log(`- Price diffs: ${priceDiffs}`);

  await mongoose.disconnect();
}

main().catch(console.error);
