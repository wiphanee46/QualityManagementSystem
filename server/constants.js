module.exports = {
  JOB_TYPES: ["งานกล่อง", "งานแผ่น", "ลูกฟูก 2 ชั้น"],

  PROBLEM_TYPES: [
    "คุณภาพสินค้า",
    "การผลิต",
    "ขาดจำนวนจากการผลิต",
    "การจัดส่ง",
    "ขนาด/สเปก",
    "ความแข็งแรง",
    "ขาดจำนวนในมือ"
  ],

  CS_STATUSES: ["เปิดปัญหา", "กำลังดำเนินการ", "รอติดตาม", "ปิดปัญหา", "ยกเลิก"],

  RESOLUTION_STATUSES: [
    "รอดำเนินการ",
    "อยู่ระหว่างดำเนินการ",
    "รอผลการแก้ไข",
    "แก้ไขเสร็จสิ้น",
    "ไม่สามารถแก้ไขได้"
  ],

  // ชื่อฟิลด์ที่ใช้ใน API : ชื่อคอลัมน์ในฐานข้อมูล
  FIELDS: {
    date: "date",
    jobType: "job_type",
    po: "po",
    jobName: "job_name",
    ssSb: "ss_sb",
    grade: "grade",
    flute: "flute",
    size: "size",
    slit: "slit",
    orderQty: "order_qty",
    affectedQty: "affected_qty",
    productionDate: "production_date",
    deliveryDate: "delivery_date",
    problemType: "problem_type",
    problemDetailType: "problem_detail_type",
    description: "description",
    assignee: "assignee",
    action: "action",
    csStatus: "cs_status",
    cause: "cause",
    solution: "solution",
    prevention: "prevention",
    resolvedDate: "resolved_date",
    resolutionStatus: "resolution_status"
  },

  // ชื่อภาษาไทยของแต่ละฟิลด์ (ใช้บันทึกในประวัติ)
  LABELS: {
    date: "วันที่แจ้งปัญหา",
    jobType: "ประเภทงาน",
    po: "เลขที่ PO",
    jobName: "ชื่องาน",
    ssSb: "เลข SS/SB",
    grade: "เกรดแกรม",
    flute: "ลอน",
    size: "ขนาด",
    slit: "ผ่าทับรอย",
    orderQty: "จำนวนสั่ง",
    affectedQty: "จำนวนที่ได้รับผลกระทบ",
    productionDate: "วันที่ผลิต",
    deliveryDate: "วันที่จัดส่ง",
    problemType: "ประเภทปัญหา",
    problemDetailType: "ลักษณะปัญหา",
    description: "รายละเอียดปัญหา",
    assignee: "ผู้รับผิดชอบ",
    action: "การดำเนินการ",
    csStatus: "สถานะ CS",
    cause: "สาเหตุของปัญหา",
    solution: "วิธีแก้ปัญหา",
    prevention: "การป้องกัน",
    resolvedDate: "วันที่แก้ไขเสร็จสิ้น",
    resolutionStatus: "สถานะการแก้ไขปัญหา"
  }
};