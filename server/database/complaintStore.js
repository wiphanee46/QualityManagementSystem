const db = require("./db");
const { FIELDS, LABELS } = require("../constants");

const FIELD_KEYS = Object.keys(FIELDS);
const FIELD_COLUMNS = Object.values(FIELDS);

const SELECT_COMPLAINT = `
  SELECT c.id, cu.name AS customer,
         ${FIELD_KEYS.map(key => `c.${FIELDS[key]} AS ${key}`).join(", ")},
         c.created_at AS createdAt, c.updated_at AS updatedAt
  FROM complaints c
  JOIN customers cu ON cu.id = c.customer_id
`;

function listComplaints() {
  return db.prepare(`${SELECT_COMPLAINT} ORDER BY c.date DESC, c.id DESC`).all();
}

function getComplaint(id) {
  return db.prepare(`${SELECT_COMPLAINT} WHERE c.id = ?`).get(id);
}

function getHistory(id) {
  return db.prepare(`
    SELECT field, old_value AS oldValue, new_value AS newValue, changed_at AS changedAt
    FROM complaint_history
    WHERE complaint_id = ?
    ORDER BY id DESC
  `).all(id);
}

function addHistory(complaintId, field, oldValue, newValue, time) {
  db.prepare(`
    INSERT INTO complaint_history (complaint_id, field, old_value, new_value, changed_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(complaintId, field, oldValue, newValue, time);
}

// เพิ่มรายการใหม่ (ลูกค้าที่ยังไม่มีในระบบจะถูกสร้างให้อัตโนมัติ)
const insertComplaint = db.transaction((data, historyText) => {
  const now = new Date().toISOString();

  db.prepare("INSERT OR IGNORE INTO customers (name) VALUES (?)").run(data.customer);
  const customer = db.prepare("SELECT id FROM customers WHERE name = ?").get(data.customer);

  const result = db.prepare(`
    INSERT INTO complaints
      (customer_id, ${FIELD_COLUMNS.join(", ")}, created_at, updated_at)
    VALUES (?, ${FIELD_COLUMNS.map(() => "?").join(", ")}, ?, ?)
  `).run(
    customer.id,
    ...FIELD_KEYS.map(key => data[key] ?? ""),
    now,
    now
  );

  addHistory(result.lastInsertRowid, historyText, "", data.csStatus ?? "", now);
  return result.lastInsertRowid;
});

// แก้ไขเฉพาะฟิลด์ที่ส่งมา และบันทึกประวัติเฉพาะฟิลด์ที่ค่าเปลี่ยนจริง
const updateComplaint = db.transaction((id, changes) => {
  const current = db.prepare("SELECT * FROM complaints WHERE id = ?").get(id);
  const now = new Date().toISOString();

  for (const key of FIELD_KEYS) {
    const column = FIELDS[key];

    if (changes[key] !== undefined && changes[key] !== current[column]) {
      db.prepare(`UPDATE complaints SET ${column} = ?, updated_at = ? WHERE id = ?`)
        .run(changes[key], now, id);
      addHistory(id, LABELS[key], current[column], changes[key], now);
    }
  }
});

function deleteComplaint(id) {
  return db.prepare("DELETE FROM complaints WHERE id = ?").run(id).changes;
}

module.exports = {
  FIELD_KEYS,
  listComplaints,
  getComplaint,
  getHistory,
  insertComplaint,
  updateComplaint,
  deleteComplaint
};