const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://m7mod:275757@united-branches.duzabq5.mongodb.net/?appName=united-branches";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const db = mongoose.connection.db;

  const lastSnapshot = await db.collection('snapshots').findOne({ _id: new mongoose.Types.ObjectId('6a0f4a79f377b0296bc4fc62') });
  
  // Let's mock a newly uploaded products list
  // 1. New product
  // 2. Changed price
  // 3. Changed name
  const uploadedProducts = JSON.parse(JSON.stringify(lastSnapshot.products));
  
  // 1. New product (creation)
  uploadedProducts.push({
    code: "99.99",
    name: "منتج جديد للتجربة",
    quantity: 10,
    sellingPrice: 100,
    buyingPrice: 80
  });

  // 2. Changed price
  const prodToChangePrice = uploadedProducts.find(p => p.code === "1.23");
  prodToChangePrice.sellingPrice = 70; // was 60
  prodToChangePrice.buyingPrice = 55; // was 50

  // 3. Changed name
  const prodToChangeName = uploadedProducts.find(p => p.code === "1.2");
  prodToChangeName.name = "كابولي 10 بليه معدل"; // was "كابولي 10 بليه على ماسورة مربعه عدل نيكل"

  // Now run the comparison algorithm
  const oldProductsMap = new Map();
  lastSnapshot.products.forEach((p) => {
    const codeKey = p.code.trim().toLowerCase();
    oldProductsMap.set(codeKey, p);
  });

  const changes = [];

  uploadedProducts.forEach((newProd) => {
    const codeKey = newProd.code.trim().toLowerCase();
    const oldProd = oldProductsMap.get(codeKey);

    if (!oldProd) {
      // New product creation
      changes.push({
        code: newProd.code,
        type: 'new_product',
        name: newProd.name,
        sellingPrice: newProd.sellingPrice,
        buyingPrice: newProd.buyingPrice,
      });
    } else {
      const nameChanged = newProd.name.trim() !== oldProd.name.trim();
      const sellingChanged = newProd.sellingPrice !== oldProd.sellingPrice;
      const buyingChanged = newProd.buyingPrice !== oldProd.buyingPrice;

      if (nameChanged) {
        changes.push({
          code: newProd.code,
          type: 'name_update',
          name: newProd.name,
          oldName: oldProd.name,
          sellingPrice: newProd.sellingPrice,
          buyingPrice: newProd.buyingPrice,
        });
      }

      if (sellingChanged || buyingChanged) {
        changes.push({
          code: newProd.code,
          type: 'price_update',
          name: newProd.name,
          sellingPrice: newProd.sellingPrice,
          oldSellingPrice: oldProd.sellingPrice,
          buyingPrice: newProd.buyingPrice,
          oldBuyingPrice: oldProd.buyingPrice,
        });
      }
    }
  });

  console.log("\nDetected changes:");
  console.log(JSON.stringify(changes, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
