const fs = require("fs");
const path = require("path");
const db = require("./db");
const { insertComplaint } = require("./complaintStore");

const file = path.join(__dirname, "..", "data", "excel-import.json");

if (!fs.existsSync(file)) {
  console.log("ไม่พบไฟล์ server/data/excel-import.json");
  process.exit(1);
}

const existing = db.prepare("SELECT COUNT(*) AS n FROM complaints").get().n;

if (existing > 0) {
  console.log(`ฐานข้อมูลมีข้อมูลอยู่แล้ว ${existing} รายการ ยกเลิกการนำเข้าเพื่อกันข้อมูลซ้ำ`);
  process.exit(0);
}

const records = JSON.parse(fs.readFileSync(file, "utf8"));

const importAll = db.transaction(() => {
  for (const record of records) {
    insertComplaint(record, "นำเข้าจาก Excel");
  }
});

importAll();
console.log(`นำเข้าสำเร็จ ${records.length} รายการ`);