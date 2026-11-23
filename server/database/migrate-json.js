const fs = require("fs");
const path = require("path");
const db = require("./db");

const jsonFile = path.join(__dirname, "..", "data", "complaints.json");

if (!fs.existsSync(jsonFile)) {
  console.log("ไม่พบไฟล์ complaints.json ไม่มีข้อมูลให้ย้าย");
  process.exit(0);
}

const old = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
const existing = db.prepare("SELECT COUNT(*) AS n FROM complaints").get().n;

if (existing > 0) {
  console.log("ฐานข้อมูลมีข้อมูลอยู่แล้ว ยกเลิกการย้ายเพื่อกันข้อมูลซ้ำ");
  process.exit(0);
}

const addCustomer = db.prepare("INSERT OR IGNORE INTO customers (name) VALUES (?)");
const findCustomer = db.prepare("SELECT id FROM customers WHERE name = ?");
const addComplaint = db.prepare(`
  INSERT INTO complaints
    (date, customer_id, po, type, description, assignee, status, resolution, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const addHistory = db.prepare(`
  INSERT INTO complaint_history (complaint_id, field, old_value, new_value, changed_at)
  VALUES (?, 'ย้ายข้อมูลจากไฟล์เดิม', '', ?, ?)
`);

const migrate = db.transaction(() => {
  for (const c of old) {
    addCustomer.run(c.customer);
    const customer = findCustomer.get(c.customer);
    const created = c.createdAt || new Date().toISOString();

    const result = addComplaint.run(
      c.date, customer.id, c.po || "", c.type, c.description,
      c.assignee || "", c.status || "รอดำเนินการ", c.resolution || "",
      created, c.updatedAt || created
    );
    addHistory.run(result.lastInsertRowid, c.status || "รอดำเนินการ", created);
  }
});

migrate();
console.log(`ย้ายข้อมูลสำเร็จ ${old.length} รายการ`);