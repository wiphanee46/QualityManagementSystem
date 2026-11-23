const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

const dataFile = path.join(__dirname, "data", "complaints.json");

function readComplaints() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]");
  }
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function saveComplaints(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/api/complaints", (req, res) => {
  res.json(readComplaints());
});

app.post("/api/complaints", (req, res) => {
  const { date, customer, po, type, description, assignee } = req.body;

  if (!date || !customer || !type || !description) {
    return res.status(400).json({
      message: "กรุณากรอกวันที่ ลูกค้า ประเภทปัญหา และรายละเอียด"
    });
  }

  const complaints = readComplaints();

  const newComplaint = {
    id: Date.now().toString(),
    date,
    customer,
    po: po || "",
    type,
    description,
    assignee: assignee || "",
    status: "รอดำเนินการ",
    resolution: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  complaints.push(newComplaint);
  saveComplaints(complaints);

  res.status(201).json(newComplaint);
});

app.patch("/api/complaints/:id", (req, res) => {
  const complaints = readComplaints();
  const complaint = complaints.find(item => item.id === req.params.id);

  if (!complaint) {
    return res.status(404).json({ message: "ไม่พบรายการปัญหา" });
  }

  const allowedStatuses = [
    "รอดำเนินการ",
    "กำลังดำเนินการ",
    "รอตรวจสอบ",
    "แก้ไขเรียบร้อย",
    "ปิดงาน"
  ];

  const { status, resolution, assignee } = req.body;

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
  }

  if (status !== undefined) complaint.status = status;
  if (resolution !== undefined) complaint.resolution = resolution;
  if (assignee !== undefined) complaint.assignee = assignee;

  complaint.updatedAt = new Date().toISOString();

  saveComplaints(complaints);
  res.json(complaint);
});

app.delete("/api/complaints/:id", (req, res) => {
  const complaints = readComplaints();
  const filtered = complaints.filter(item => item.id !== req.params.id);

  if (filtered.length === complaints.length) {
    return res.status(404).json({ message: "ไม่พบรายการปัญหา" });
  }

  saveComplaints(filtered);
  res.json({ message: "ลบรายการสำเร็จ" });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});