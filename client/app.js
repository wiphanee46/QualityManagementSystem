const STATUSES = [
  "รอดำเนินการ",
  "กำลังดำเนินการ",
  "รอตรวจสอบ",
  "แก้ไขเรียบร้อย",
  "ปิดงาน"
];

let complaints = [];
const $ = id => document.getElementById(id);

// กันข้อความที่ผู้ใช้พิมพ์ไปแทรกเป็นโค้ด HTML
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- โหลดข้อมูล ----------
async function loadComplaints() {
  const res = await fetch("/api/complaints");
  complaints = await res.json();
  renderTable();
  renderDashboard();
}

// ---------- ตารางรายการ ----------
function renderTable() {
  const keyword = $("searchInput").value.trim().toLowerCase();

  const rows = complaints
    .filter(c =>
      [c.customer, c.po, c.type].some(v =>
        (v || "").toLowerCase().includes(keyword)
      )
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  if (rows.length === 0) {
    $("complaintTable").innerHTML =
      `<tr><td colspan="7" class="empty">ไม่พบรายการ</td></tr>`;
    return;
  }

  $("complaintTable").innerHTML = rows
    .map(c => `
      <tr>
        <td>${escapeHtml(c.date)}</td>
        <td>${escapeHtml(c.customer)}</td>
        <td>${escapeHtml(c.po)}</td>
        <td>
          ${escapeHtml(c.type)}
          <div class="desc">${escapeHtml(c.description)}</div>
        </td>
        <td>${escapeHtml(c.assignee)}</td>
        <td>
          <select data-action="status" data-id="${c.id}">
            ${STATUSES.map(s =>
              `<option value="${s}" ${s === c.status ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        </td>
        <td>
          <button class="delete-btn" data-action="delete" data-id="${c.id}">ลบ</button>
        </td>
      </tr>
    `)
    .join("");
}

// ---------- Dashboard ----------
function countBy(list, keyFn) {
  const result = {};
  list.forEach(item => {
    const key = keyFn(item);
    if (key) result[key] = (result[key] || 0) + 1;
  });
  return Object.entries(result);
}

function renderBars(containerId, entries) {
  const container = $(containerId);

  if (entries.length === 0) {
    container.innerHTML = `<p class="empty">ยังไม่มีข้อมูล</p>`;
    return;
  }

  const max = Math.max(...entries.map(e => e[1]));

  container.innerHTML = entries
    .map(([label, count]) => `
      <div class="bar-row">
        <div class="bar-label">
          <span>${escapeHtml(label)}</span>
          <strong>${count}</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(count / max) * 100}%"></div>
        </div>
      </div>
    `)
    .join("");
}

function renderDashboard() {
  $("totalCount").textContent = complaints.length;
  $("pendingCount").textContent =
    complaints.filter(c => c.status === "รอดำเนินการ").length;
  $("workingCount").textContent =
    complaints.filter(c => c.status === "กำลังดำเนินการ").length;
  // นับ "ปิดงาน" รวมเป็นแก้ไขเรียบร้อยด้วย
  $("completedCount").textContent =
    complaints.filter(c => ["แก้ไขเรียบร้อย", "ปิดงาน"].includes(c.status)).length;

  const byType = countBy(complaints, c => c.type)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const byMonth = countBy(complaints, c => c.date.slice(0, 7))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const byCustomer = countBy(complaints, c => c.customer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  renderBars("topProblems", byType);
  renderBars("monthlyProblems", byMonth);
  renderBars("customerProblems", byCustomer);
}

// ---------- ฟอร์มเพิ่มปัญหา ----------
$("complaintForm").addEventListener("submit", async e => {
  e.preventDefault();

  const body = {
    date: $("date").value,
    customer: $("customer").value.trim(),
    po: $("po").value.trim(),
    type: $("type").value,
    description: $("description").value.trim(),
    assignee: $("assignee").value.trim()
  };

  const res = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.message);
    return;
  }

  $("complaintForm").reset();
  setToday();
  loadComplaints();
});

// ---------- เปลี่ยนสถานะ / ลบ ----------
$("complaintTable").addEventListener("change", async e => {
  if (e.target.dataset.action !== "status") return;

  await fetch(`/api/complaints/${e.target.dataset.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: e.target.value })
  });
  loadComplaints();
});

$("complaintTable").addEventListener("click", async e => {
  if (e.target.dataset.action !== "delete") return;
  if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;

  await fetch(`/api/complaints/${e.target.dataset.id}`, { method: "DELETE" });
  loadComplaints();
});

$("searchInput").addEventListener("input", renderTable);

// ---------- สลับหน้า ----------
function showPage(page) {
  const isComplaint = page === "complaint";
  $("complaintPage").hidden = !isComplaint;
  $("dashboardPage").hidden = isComplaint;
  $("complaintTab").classList.toggle("active", isComplaint);
  $("dashboardTab").classList.toggle("active", !isComplaint);
  if (!isComplaint) renderDashboard();
}

$("complaintTab").addEventListener("click", () => showPage("complaint"));
$("dashboardTab").addEventListener("click", () => showPage("dashboard"));

// ตั้งวันที่เริ่มต้นเป็นวันนี้
function setToday() {
  $("date").value = new Date().toISOString().slice(0, 10);
}

setToday();
loadComplaints();