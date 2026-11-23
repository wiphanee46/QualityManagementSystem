const express = require("express");
const path = require("path");
const {
  JOB_TYPES,
  PROBLEM_TYPES,
  CS_STATUSES,
  RESOLUTION_STATUSES
} = require("./constants");
const store = require("./database/complaintStore");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));

const clean = value =>
  value === undefined || value === null ? "" : String(value).trim();

// เก็บเฉพาะฟิลด์ที่รู้จัก และตัดช่องว่างหัวท้าย
function cleanBody(body) {
  const result = {};
  for (const key of [...store.FIELD_KEYS, "customer"]) {
    if (body[key] !== undefined) result[key] = clean(body[key]);
  }
  return result;
}

// ตรวจค่าที่ต้องอยู่ในรายการที่กำหนด คืนข้อความ error หรือ null ถ้าผ่าน
function validate(data, requireAll) {
  const lists = [
    ["jobType", JOB_TYPES, "ประเภทงาน"],
    ["problemType", PROBLEM_TYPES, "ประเภทปัญหา"],
    ["csStatus", CS_STATUSES, "สถานะ CS"],
    ["resolutionStatus", RESOLUTION_STATUSES, "สถานะการแก้ไขปัญหา"]
  ];

  for (const [key, list, label] of lists) {
    if (data[key] && !list.includes(data[key])) return `${label}ไม่ถูกต้อง`;
  }

  if (requireAll) {
    const required = {
      date: "วันที่แจ้งปัญหา",
      customer: "ชื่อลูกค้า",
      jobType: "ประเภทงาน",
      problemType: "ประเภทปัญหา",
      description: "ลักษณะปัญหา"
    };
    const missing = Object.keys(required)
      .filter(key => !data[key])
      .map(key => required[key]);

    if (missing.length > 0) return `กรุณากรอก: ${missing.join(", ")}`;
  }

  return null;
}

// API: รายการตัวเลือกสำหรับ dropdown
app.get("/api/options", (req, res) => {
  res.json({
    jobTypes: JOB_TYPES,
    problemTypes: PROBLEM_TYPES,
    csStatuses: CS_STATUSES,
    resolutionStatuses: RESOLUTION_STATUSES
  });
});

app.get("/api/complaints", (req, res) => {
  res.json(store.listComplaints());
});

app.post("/api/complaints", (req, res) => {
  const data = cleanBody(req.body);
  data.csStatus = data.csStatus || "เปิดปัญหา";
  data.resolutionStatus = data.resolutionStatus || "รอดำเนินการ";

  const error = validate(data, true);
  if (error) return res.status(400).json({ message: error });

  const id = store.insertComplaint(data, "สร้างรายการ");
  res.status(201).json(store.getComplaint(id));
});

app.patch("/api/complaints/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!store.getComplaint(id)) {
    return res.status(404).json({ message: "ไม่พบรายการปัญหา" });
  }

  const changes = cleanBody(req.body);
  delete changes.customer; // ยังไม่รองรับการเปลี่ยนชื่อลูกค้า

  const error = validate(changes, false);
  if (error) return res.status(400).json({ message: error });

  store.updateComplaint(id, changes);
  res.json(store.getComplaint(id));
});

app.get("/api/complaints/:id/history", (req, res) => {
  res.json(store.getHistory(Number(req.params.id)));
});

app.delete("/api/complaints/:id", (req, res) => {
  if (store.deleteComplaint(Number(req.params.id)) === 0) {
    return res.status(404).json({ message: "ไม่พบรายการปัญหา" });
  }
  res.json({ message: "ลบรายการสำเร็จ" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});