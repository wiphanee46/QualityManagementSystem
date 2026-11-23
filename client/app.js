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
          <button class="delete-btn" data-action="detail" data-id="${c.id}">รายละเอียด</button>
          <button class="delete-btn" data-action="delete" data-id="${c.id}"=>ลบ</button>
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
  const { action, id } = e.target.dataset;

  if (action === "detail") {
    openDetail(id);
    return;
  }

  if (action !== "delete") return;
  if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return;

  await fetch(`/api/complaints/${id}`, { method: "DELETE" });
  loadComplaints();
});

// ---------- หน้าต่างรายละเอียด + ประวัติ ----------
let currentId = null;

function openDetail(id) {
  const c = complaints.find(item => String(item.id) === String(id));
  if (!c) return;

  currentId = c.id;

  $("detailTitle").textContent = `${c.customer} • ${c.po || "ไม่มี PO"}`;
  $("detailInfo").innerHTML = `
    <p><strong>วันที่แจ้ง:</strong> ${escapeHtml(c.date)}</p>
    <p><strong>ประเภทปัญหา:</strong> ${escapeHtml(c.type)}</p>
    <p><strong>รายละเอียด:</strong> ${escapeHtml(c.description)}</p>
  `;
  $("detailStatus").innerHTML = STATUSES
    .map(s => `<option value="${s}" ${s === c.status ? "selected" : ""}>${s}</option>`)
    .join("");
  $("detailAssignee").value = c.assignee;
  $("detailResolution").value = c.resolution;

  $("detailDialog").showModal();
  loadHistory(c.id);
}

async function loadHistory(id) {
  const res = await fetch(`/api/complaints/${id}/history`);
  const rows = await res.json();

  $("historyList").innerHTML = rows
    .map(h => {
      const time = new Date(h.changedAt).toLocaleString("th-TH", {
        dateStyle: "medium",
        timeStyle: "short"
      });
      const change = h.oldValue
        ? `${escapeHtml(h.oldValue)} → ${escapeHtml(h.newValue)}`
        : escapeHtml(h.newValue);

      return `
        <li>
          <strong>${escapeHtml(h.field)}</strong>: ${change}
          <div class="desc">${time}</div>
        </li>`;
    })
    .join("");
}

$("detailForm").addEventListener("submit", async e => {
  e.preventDefault();

  await fetch(`/api/complaints/${currentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: $("detailStatus").value,
      assignee: $("detailAssignee").value.trim(),
      resolution: $("detailResolution").value.trim()
    })
  });

  await loadComplaints();
  loadHistory(currentId);
});

$("closeDialog").addEventListener("click", () => $("detailDialog").close());

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