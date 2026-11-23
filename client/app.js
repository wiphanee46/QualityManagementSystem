// ---------- นิยามฟิลด์ (ฟอร์มและหน้าต่างแก้ไขสร้างจากรายการนี้) ----------
const GROUPS = [
  { id: "general", title: "ข้อมูลทั่วไป" },
  { id: "product", title: "ข้อมูลสินค้า" },
  { id: "problem", title: "ปัญหาที่พบ" },
  { id: "resolution", title: "การดำเนินการและแก้ไข" }
];

const FIELD_DEFS = [
  // ข้อมูลทั่วไป
  { key: "date", label: "วันที่แจ้งปัญหา", type: "date", required: true, group: "general" },
  { key: "customer", label: "ชื่อลูกค้า", suggest: true, required: true, createOnly: true, group: "general" },
  { key: "jobType", label: "ประเภทงาน", type: "select", required: true, group: "general" },
  { key: "po", label: "เลขที่ PO", group: "general" },
  { key: "jobName", label: "ชื่องาน", group: "general" },
  { key: "ssSb", label: "เลข SS/SB", group: "general" },

  // ข้อมูลสินค้า
  { key: "grade", label: "เกรดแกรม", group: "product" },
  { key: "flute", label: "ลอน", group: "product" },
  { key: "size", label: "ขนาด", group: "product" },
  { key: "slit", label: "ผ่าทับรอย", group: "product" },
  { key: "orderQty", label: "จำนวนสั่ง (แผ่น/ใบ)", group: "product" },
  { key: "affectedQty", label: "จำนวนที่ได้รับผลกระทบ", group: "product" },
  { key: "productionDate", label: "วันที่ผลิต", type: "date", group: "product" },
  { key: "deliveryDate", label: "วันที่จัดส่ง", type: "date", group: "product" },

  // ปัญหาที่พบ
  { key: "problemType", label: "ประเภทปัญหา", type: "select", required: true, group: "problem" },
  { key: "problemDetailType", label: "ลักษณะปัญหา", suggest: true, required: true, group: "problem" },
  { key: "assignee", label: "ผู้รับผิดชอบ", suggest: true, group: "problem" },
  { key: "description", label: "รายละเอียดปัญหา", type: "textarea", wide: true, group: "problem" },

  // การดำเนินการและแก้ไข
  { key: "action", label: "การดำเนินการ", type: "textarea", wide: true, group: "resolution" },
  { key: "csStatus", label: "สถานะ CS", type: "select", editOnly: true, group: "resolution" },
  { key: "resolutionStatus", label: "สถานะการแก้ไขปัญหา", type: "select", editOnly: true, group: "resolution" },
  { key: "resolvedDate", label: "วันที่แก้ไขเสร็จสิ้น", type: "date", editOnly: true, group: "resolution" },
  { key: "cause", label: "สาเหตุของปัญหา", type: "textarea", wide: true, editOnly: true, group: "resolution" },
  { key: "solution", label: "วิธีแก้ปัญหา", type: "textarea", wide: true, editOnly: true, group: "resolution" },
  { key: "prevention", label: "การป้องกัน", type: "textarea", wide: true, editOnly: true, group: "resolution" }
];

const CREATE_DEFS = FIELD_DEFS.filter(d => !d.editOnly);
const EDIT_DEFS = FIELD_DEFS.filter(d => !d.createOnly);

const CS_BADGE = {
  "เปิดปัญหา": "badge-red",
  "กำลังดำเนินการ": "badge-amber",
  "รอติดตาม": "badge-amber",
  "ปิดปัญหา": "badge-green",
  "ยกเลิก": "badge-gray"
};

let complaints = [];
let OPTIONS = {};
let currentId = null;

const $ = id => document.getElementById(id);

// กันข้อความที่ผู้ใช้พิมพ์ไปแทรกเป็นโค้ด HTML
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- สร้างฟอร์มจากนิยามฟิลด์ ----------
function fieldHtml(def, prefix, value) {
  const id = `${prefix}-${def.key}`;
  const required = def.required ? "required" : "";
  const wide = def.wide ? "full-width" : "";
  let input;

  if (def.type === "select") {
    const options = (OPTIONS[def.key] || [])
      .map(o => `<option value="${escapeHtml(o)}" ${o === value ? "selected" : ""}>${escapeHtml(o)}</option>`)
      .join("");
    input = `<select id="${id}" ${required}><option value="">เลือก</option>${options}</select>`;
  } else if (def.type === "textarea") {
    input = `<textarea id="${id}" ${required}>${escapeHtml(value)}</textarea>`;
  } else if (def.type === "date") {
    input = `<input type="date" id="${id}" value="${escapeHtml(value)}" ${required}>`;
  } else {
    const list = def.suggest ? `list="list-${def.key}"` : "";
    input = `<input type="text" id="${id}" value="${escapeHtml(value)}" ${list} ${required}>`;
  }

  return `
    <div class="${wide}">
      <label>${def.label}${def.required ? " *" : ""}</label>
      ${input}
    </div>`;
}

function renderFields(containerId, prefix, defs, values) {
  $(containerId).innerHTML = GROUPS
    .map(group => {
      const items = defs.filter(d => d.group === group.id);
      if (items.length === 0) return "";

      return `
        <fieldset>
          <legend>${group.title}</legend>
          <div class="form-grid">
            ${items.map(d => fieldHtml(d, prefix, values[d.key] ?? "")).join("")}
          </div>
        </fieldset>`;
    })
    .join("");
}

function readFields(prefix, defs) {
  const data = {};
  defs.forEach(d => {
    data[d.key] = $(`${prefix}-${d.key}`).value.trim();
  });
  return data;
}

function renderCreateForm() {
  renderFields("newFields", "new", CREATE_DEFS, { date: today() });
}

// รายการแนะนำ (ลูกค้า / ลักษณะปัญหา / ผู้รับผิดชอบ) จากข้อมูลเดิม
function renderDatalists() {
  $("datalists").innerHTML = FIELD_DEFS
    .filter(d => d.suggest)
    .map(d => {
      const values = [...new Set(complaints.map(c => c[d.key]).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "th"));

      return `<datalist id="list-${d.key}">
        ${values.map(v => `<option value="${escapeHtml(v)}"></option>`).join("")}
      </datalist>`;
    })
    .join("");
}

// ---------- โหลดข้อมูล ----------
async function loadOptions() {
  const res = await fetch("/api/options");
  const o = await res.json();

  OPTIONS = {
    jobType: o.jobTypes,
    problemType: o.problemTypes,
    csStatus: o.csStatuses,
    resolutionStatus: o.resolutionStatuses
  };
}

async function loadComplaints() {
  const res = await fetch("/api/complaints");
  complaints = await res.json();

  renderDatalists();
  renderTable();
  renderDashboard();
}

// ---------- ตัวกรอง ----------
function fillFilter(id, allLabel, options, extra) {
  $(id).innerHTML =
    `<option value="">${allLabel}</option>` +
    options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("") +
    (extra || "");
}

function fillFilters() {
  fillFilter("filterJobType", "ทุกประเภทงาน", OPTIONS.jobType);
  fillFilter("filterProblemType", "ทุกประเภทปัญหา", OPTIONS.problemType);
  fillFilter("filterCsStatus", "ทุกสถานะ CS", OPTIONS.csStatus);
  fillFilter(
    "filterResolution",
    "ทุกสถานะแก้ไข",
    OPTIONS.resolutionStatus,
    `<option value="__blank__">ยังไม่ระบุ</option>`
  );
}

function filteredComplaints() {
  const keyword = $("searchInput").value.trim().toLowerCase();

  const filters = {
    jobType: $("filterJobType").value,
    problemType: $("filterProblemType").value,
    csStatus: $("filterCsStatus").value,
    resolutionStatus: $("filterResolution").value
  };

  return complaints.filter(c => {
    const matchFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (value === "__blank__") return !c[key];
      return c[key] === value;
    });

    const matchKeyword =
      !keyword ||
      [c.customer, c.po, c.ssSb, c.jobName, c.problemDetailType, c.description].some(v =>
        (v || "").toLowerCase().includes(keyword)
      );

    return matchFilters && matchKeyword;
  });
}

// ---------- ตารางรายการ ----------
function renderTable() {
  const rows = filteredComplaints();
  $("resultCount").textContent = `(${rows.length} จาก ${complaints.length} รายการ)`;

  if (rows.length === 0) {
    $("complaintTable").innerHTML =
      `<tr><td colspan="9" class="empty">ไม่พบรายการ</td></tr>`;
    return;
  }

  $("complaintTable").innerHTML = rows
    .map(c => `
      <tr>
        <td>${escapeHtml(c.date)}</td>
        <td>${escapeHtml(c.customer)}</td>
        <td>${escapeHtml(c.jobType)}</td>
        <td>${escapeHtml(c.po)}</td>
        <td>
          ${escapeHtml(c.problemDetailType)}
          <div class="desc">${escapeHtml(c.problemType)}</div>
        </td>
        <td>${escapeHtml(c.assignee)}</td>
        <td>
          <span class="badge ${CS_BADGE[c.csStatus] || "badge-gray"}">${escapeHtml(c.csStatus)}</span>
        </td>
        <td>${escapeHtml(c.resolutionStatus) || "-"}</td>
        <td class="actions">
          <button class="detail-btn" data-action="detail" data-id="${c.id}">รายละเอียด</button>
          <button class="delete-btn" data-action="delete" data-id="${c.id}">ลบ</button>
        </td>
      </tr>
    `)
    .join("");
}

// ---------- Dashboard ----------
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const PROBLEM_COLORS = ["#2563eb", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#06b6d4", "#6b7280"];

const dashState = { jobType: "", year: "", month: "" };

const countWhere = (list, test) => list.filter(test).length;
const monthOf = c => Number(c.date.slice(5, 7));

function fillDashboardFilters() {
  // แท็บประเภทงาน
  $("dashJobTabs").innerHTML = ["", ...OPTIONS.jobType]
    .map(job => `
      <button type="button" class="job-tab ${job === dashState.jobType ? "active" : ""}"
              data-job="${escapeHtml(job)}">${job || "ทั้งหมด"}</button>
    `)
    .join("");

  // ปี (จากข้อมูลจริง ล่าสุดอยู่บนสุด)
  const years = [...new Set(complaints.map(c => c.date.slice(0, 4)))].sort().reverse();
  if (!years.includes(dashState.year)) dashState.year = years[0] || "";

  $("dashYear").innerHTML = years
    .map(y => `<option value="${y}" ${y === dashState.year ? "selected" : ""}>${y}</option>`)
    .join("");

  // เดือน
  $("dashMonth").innerHTML =
    `<option value="">ทั้งหมด</option>` +
    MONTHS_TH.map((name, i) => {
      const value = String(i + 1).padStart(2, "0");
      return `<option value="${value}" ${value === dashState.month ? "selected" : ""}>${name}</option>`;
    }).join("");
}

// ตารางสรุป: ชื่อ | จำนวน | แท่งสัดส่วน | แถวรวม
function renderSummaryTable(containerId, rows, total) {
  const max = Math.max(1, ...rows.map(r => r[1]));

  $(containerId).innerHTML = `
    <table class="summary-table">
      <tbody>
        ${rows.map(([label, count]) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td class="num">${count}</td>
            <td class="bar-cell">
              <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
            </td>
          </tr>
        `).join("")}
        <tr class="total-row"><td>รวม</td><td class="num">${total}</td><td></td></tr>
      </tbody>
    </table>`;
}

// แนวโน้มรายเดือน แยกสีตามประเภทปัญหา
function renderMonthlyTrend(base) {
  $("legend").innerHTML = OPTIONS.problemType
    .map((type, i) => `<span class="legend-item"><i style="background:${PROBLEM_COLORS[i]}"></i>${escapeHtml(type)}</span>`)
    .join("");

  if (base.length === 0) {
    $("monthlyTrend").innerHTML = `<p class="empty">ยังไม่มีข้อมูล</p>`;
    return;
  }

  const months = base.map(monthOf);
  const first = Math.min(...months);
  const last = Math.max(...months);

  const rows = [];
  for (let m = first; m <= last; m++) {
    rows.push({ label: MONTHS_TH[m - 1], items: base.filter(c => monthOf(c) === m) });
  }

  const max = Math.max(1, ...rows.map(r => r.items.length));

  $("monthlyTrend").innerHTML = rows
    .map(r => {
      const segments = OPTIONS.problemType
        .map((type, i) => {
          const n = countWhere(r.items, c => c.problemType === type);
          if (n === 0) return "";
          return `<div class="seg" style="width:${(n / max) * 100}%;background:${PROBLEM_COLORS[i]}"
                       title="${escapeHtml(type)}: ${n}">${n}</div>`;
        })
        .join("");

      return `
        <div class="stack-row">
          <span class="stack-label">${r.label}</span>
          <div class="stack-bar">${segments}</div>
          <strong class="stack-total">${r.items.length}</strong>
        </div>`;
    })
    .join("");
}

// ตารางลูกค้า x ประเภทปัญหา
function renderCustomerMatrix(list) {
  if (list.length === 0) {
    $("customerMatrix").innerHTML = `<p class="empty">ยังไม่มีข้อมูล</p>`;
    return;
  }

  const rows = [...new Set(list.map(c => c.customer))]
    .map(name => {
      const items = list.filter(c => c.customer === name);
      return {
        name,
        counts: OPTIONS.problemType.map(type => countWhere(items, c => c.problemType === type)),
        total: items.length
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "th"));

  const columnTotals = OPTIONS.problemType.map((type, i) =>
    rows.reduce((sum, r) => sum + r.counts[i], 0)
  );

  $("customerMatrix").innerHTML = `
    <table class="matrix">
      <thead>
        <tr>
          <th>ชื่อลูกค้า</th>
          ${OPTIONS.problemType.map(t => `<th class="num">${escapeHtml(t)}</th>`).join("")}
          <th class="num">รวม</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${escapeHtml(r.name)}</td>
            ${r.counts.map(n => `<td class="num ${n ? "hot" : "zero"}">${n || "-"}</td>`).join("")}
            <td class="num"><strong>${r.total}</strong></td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>รวม</td>
          ${columnTotals.map(n => `<td class="num">${n}</td>`).join("")}
          <td class="num">${list.length}</td>
        </tr>
      </tbody>
    </table>`;
}

// TOP 10 ลักษณะปัญหา พร้อมรายชื่อลูกค้า
function renderTopProblems(list) {
  const groups = new Map();

  list.forEach(c => {
    if (!c.problemDetailType) return;
    if (!groups.has(c.problemDetailType)) groups.set(c.problemDetailType, new Map());

    const customers = groups.get(c.problemDetailType);
    customers.set(c.customer, (customers.get(c.customer) || 0) + 1);
  });

  const top = [...groups.entries()]
    .map(([name, customers]) => ({
      name,
      customers,
      count: [...customers.values()].reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "th"))
    .slice(0, 10);

  const totalCount = top.reduce((sum, t) => sum + t.count, 0);
  const customerSet = new Set(top.flatMap(t => [...t.customers.keys()]));

  $("topKpis").innerHTML = `
    <div><strong>${totalCount}</strong><span>ครั้ง</span></div>
    <div><strong>${top.length}</strong><span>ปัญหาย่อย</span></div>
    <div><strong>${customerSet.size}</strong><span>ลูกค้า</span></div>`;

  if (top.length === 0) {
    $("topTable").innerHTML = `<p class="empty">ยังไม่มีข้อมูล</p>`;
    return;
  }

  $("topTable").innerHTML = `
    <table>
      <thead>
        <tr><th>#</th><th>ปัญหาย่อย</th><th class="num">จำนวนครั้ง</th><th>ชื่อลูกค้า</th></tr>
      </thead>
      <tbody>
        ${top.map((t, i) => {
          const names = [...t.customers.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"))
            .map(([name, n]) => `${escapeHtml(name)} (${n})`)
            .join(", ");

          return `
            <tr>
              <td class="rank">${i + 1}</td>
              <td>${escapeHtml(t.name)}</td>
              <td class="num"><strong>${t.count}</strong></td>
              <td>${names}</td>
            </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

function renderDashboard() {
  fillDashboardFilters();

  // ข้อมูลตามประเภทงาน + ปี (ใช้กับแนวโน้มรายเดือน)
  const base = complaints.filter(
    c =>
      (!dashState.jobType || c.jobType === dashState.jobType) &&
      c.date.startsWith(dashState.year)
  );

  // เพิ่มตัวกรองเดือน (ใช้กับส่วนอื่นทั้งหมด)
  const list = dashState.month
    ? base.filter(c => c.date.slice(5, 7) === dashState.month)
    : base;

  $("kpiTotal").textContent = list.length;
  $("kpiDetail").textContent = new Set(list.map(c => c.problemDetailType).filter(Boolean)).size;
  $("kpiCustomer").textContent = new Set(list.map(c => c.customer)).size;

  // สถานะ CS
  const csRows = OPTIONS.csStatus.map(s => [s, countWhere(list, c => c.csStatus === s)]);
  renderSummaryTable("csTable", csRows, list.length);

  // สถานะการแก้ไขปัญหา (รวมแถว "ไม่ระบุ" เพื่อให้ยอดรวมเท่ากับจำนวนปัญหาทั้งหมด)
  const resolutionRows = [
    ...OPTIONS.resolutionStatus.map(s => [s, countWhere(list, c => c.resolutionStatus === s)]),
    ["ไม่ระบุ", countWhere(list, c => !c.resolutionStatus)]
  ];
  renderSummaryTable("resolutionTable", resolutionRows, list.length);

  // ประเภทปัญหา
  const typeRows = OPTIONS.problemType.map(t => [t, countWhere(list, c => c.problemType === t)]);
  renderSummaryTable("problemTypeTable", typeRows, list.length);

  renderMonthlyTrend(base);
  renderCustomerMatrix(list);
  renderTopProblems(list);
}

$("dashJobTabs").addEventListener("click", e => {
  if (e.target.dataset.job === undefined) return;
  dashState.jobType = e.target.dataset.job;
  renderDashboard();
});

$("dashYear").addEventListener("change", e => {
  dashState.year = e.target.value;
  renderDashboard();
});

$("dashMonth").addEventListener("change", e => {
  dashState.month = e.target.value;
  renderDashboard();
});

// ---------- ฟอร์มเพิ่มปัญหา ----------
$("complaintForm").addEventListener("submit", async e => {
  e.preventDefault();

  const res = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readFields("new", CREATE_DEFS))
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.message);
    return;
  }

  renderCreateForm();
  await loadComplaints();
});

// ---------- ปุ่มในตาราง: รายละเอียด / ลบ ----------
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

["searchInput", "filterJobType", "filterProblemType", "filterCsStatus", "filterResolution"]
  .forEach(id => {
    $(id).addEventListener(id === "searchInput" ? "input" : "change", renderTable);
  });

// ---------- หน้าต่างรายละเอียด + ประวัติ ----------
function openDetail(id) {
  const c = complaints.find(item => String(item.id) === String(id));
  if (!c) return;

  currentId = c.id;
  $("detailTitle").textContent = `${c.customer} • ${c.po || "ไม่มี PO"}`;
  renderFields("editFields", "edit", EDIT_DEFS, c);

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

  const res = await fetch(`/api/complaints/${currentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readFields("edit", EDIT_DEFS))
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.message);
    return;
  }

  await loadComplaints();
  loadHistory(currentId);
});

$("closeDialog").addEventListener("click", () => $("detailDialog").close());

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

// ---------- เริ่มทำงาน ----------
async function init() {
  await loadOptions();
  fillFilters();
  renderCreateForm();
  await loadComplaints();
}

init();