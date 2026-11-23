const express = require("express");
const path = require("path");
const db = require("./database/db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));

const ALLOWED_STATUSES = [
  "รอดำเนินการ",
  "กำลังดำเนินการ",
  "รอตรวจสอบ",
  "แก้ไขเรียบร้อย",
  "ปิดงาน"
];

// ดึงรายการปัญหาพร้อมชื่อลูกค้า (หน้าตาข้อมูลเหมือนเดิมทุกอย่าง)
const SELECT_COMPLAINT = `
  SELECT c.id, c.date, cu.name AS customer, c.po, c.type, c.description,
         c.assignee, c.status, c.resolution,
         c.created_at AS createdAt, c.updated_at AS updatedAt
  FROM complaints c
  JOIN customers cu ON cu.id = c.customer_id
`;

function getComplaint(id) {
  return db.prepare(`${SELECT_COMPLAINT} WHERE c.id = ?`).get(id);
}

function addHistory(complaintId, field, oldValue, newValue, time) {
  db.prepare(`
    INSERT INTO complaint_history (complaint_id, field, old_value, new_value, changed_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(complaintId, field, oldValue, newValue, time);
}

// API: ดึงรายการทั้งหมด
app.get("/api/complaints", (req, res) => {
  const rows = db
    .prepare(`${SELECT_COMPLAINT} ORDER BY c.date DESC, c.id DESC`)
    .all();
  res.json(rows);
});

// API: เพิ่มรายการใหม่
const createComplaint = db.transaction(data => {
  const now = new Date().toISOString();

  db.prepare("INSERT OR IGNORE INTO customers (name) VALUES (?)").run(data.customer);
  const customer = db.prepare("SELECT id FROM customers WHERE name = ?").get(data.customer);

  const result = db.prepare(`
    INSERT INTO complaints
      (date, customer_id, po, type, description, assignee, status, resolution, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'รอดำเนินการ', '', ?, ?)
  `).run(
    data.date, customer.id, data.po || "", data.type,
    data.description, data.assignee || "", now, now
  );

  addHistory(result.lastInsertRowid, "สร้างรายการ", "", "รอดำเนินการ", now);
  return result.lastInsertRowid;
});

app.post("/api/complaints", (req, res) => {
  const { date, customer, type, description } = req.body;

  if (!date || !customer || !type || !description) {
    return res.status(400).json({
      message: "กรุณากรอกวันที่ ลูกค้า ประเภทปัญหา และรายละเอียด"
    });
  }

  const id = createComplaint(req.body);
  res.status(201).json(getComplaint(id));
});

// API: แก้ไขสถานะ / ผลการแก้ไข / ผู้รับผิดชอบ พร้อมบันทึกประวัติ
const FIELD_LABELS = {
  status: "สถานะ",
  resolution: "ผลการแก้ไข",
  assignee: "ผู้รับผิดชอบ"
};

const updateComplaint = db.transaction((id, changes) => {
  const current = db.prepare("SELECT * FROM complaints WHERE id = ?").get(id);
  const now = new Date().toISOString();

  for (const key of Object.keys(FIELD_LABELS)) {
    if (changes[key] !== undefined && changes[key] !== current[key]) {
      db.prepare(`UPDATE complaints SET ${key} = ?, updated_at = ? WHERE id = ?`)
        .run(changes[key], now, id);
      addHistory(id, FIELD_LABELS[key], current[key], changes[key], now);
    }
  }
});

app.patch("/api/complaints/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!getComplaint(id)) {
    return res.status(404).json({ message: "ไม่พบรายการปัญหา" });
  }

  if (req.body.status && !ALLOWED_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
  }

  updateComplaint(id, req.body);
  res.json(getComplaint(id));
});

// API: ดูประวัติการดำเนินงานของรายการหนึ่ง
app.get("/api/complaints/:id/history", (req, res) => {
  const rows = db.prepare(`
    SELECT field, old_value AS oldValue, new_value AS newValue, changed_at AS changedAt
    FROM complaint_history
    WHERE complaint_id = ?
    ORDER BY id DESC
  `).all(Number(req.params.id));
  res.json(rows);
});

// API: ลบรายการ (ประวัติของรายการนั้นถูกลบตามอัตโนมัติ)
app.delete("/api/complaints/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM complaints WHERE id = ?")
    .run(Number(req.params.id));

  if (result.changes === 0) {
    return res.status(404).json({ message: "ไม่พบรายการปัญหา" });
  }

  res.json({ message: "ลบรายการสำเร็จ" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});