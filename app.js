const SOURCES = [
  {
    key: "copyright",
    file: "Copyright.json",
    label: "Copyright",
    className: "copyright",
  },
  {
    key: "protect",
    file: "Protect.json",
    label: "Protection",
    className: "protect",
  },
  {
    key: "trademark",
    file: "Trademark.json",
    label: "Trademark",
    className: "trademark",
  },
  {
    key: "copyrightcase",
    file: "CopyrightCase.json",
    label: "Copyright Case",
    className: "copyrightcase",
  },
];

let allRecords = [];
let filteredRecords = [];
let currentSource = "all";
let currentPage = 1;
let pageSize = 10;

const $ = (id) => document.getElementById(id);

async function loadData() {
  try {
    const loaded = await Promise.all(
      SOURCES.map(async (source) => {
        const response = await fetch(source.file);
        if (!response.ok) throw new Error(`โหลด ${source.file} ไม่สำเร็จ`);
        const data = await response.json();
        return data.map((item, index) => ({
          ...item,
          _source: source.key,
          _sourceLabel: source.label,
          _sourceClass: source.className,
          _localId: index + 1,
        }));
      }),
    );

    allRecords = loaded.flat();
    updateStats();
    applyFilters();
  } catch (error) {
    $("tableWrap").innerHTML = `
      <div class="empty">
        <strong>ไม่สามารถโหลด Dataset ได้</strong><br>
        <span>${escapeHtml(error.message)}</span><br><br>
        <small>หากเปิด index.html ด้วยการดับเบิลคลิก ให้เปิดผ่าน GitHub Pages หรือ local server แทน เพราะ browser อาจบล็อกการโหลด JSON</small>
      </div>`;
  }
}

function updateStats() {
  $("heroTotal").textContent = allRecords.length.toLocaleString("th-TH");
  $("count-all").textContent = allRecords.length;
  for (const source of SOURCES) {
    const count = allRecords.filter((x) => x._source === source.key).length;
    $(`count-${source.key}`).textContent = count;
  }

  $("stats").innerHTML = `
    <div class="stat"><div class="label">Dataset ทั้งหมด</div><div class="value accent">${allRecords.length.toLocaleString("th-TH")}</div></div>
    <div class="stat"><div class="label">Copyright</div><div class="value">${$("count-copyright").textContent}</div></div>
    <div class="stat"><div class="label">Protection</div><div class="value">${$("count-protect").textContent}</div></div>
    <div class="stat"><div class="label">Trademark</div><div class="value">${$("count-trademark").textContent}</div></div>
    <div class="stat"><div class="label">Copyright Case</div><div class="value">${$("count-copyrightcase").textContent}</div></div>
  `;
}

function applyFilters() {
  const query = $("search").value.trim().toLowerCase();

  filteredRecords = allRecords.filter((item) => {
    if (currentSource !== "all" && item._source !== currentSource) return false;
    if (!query) return true;

    const searchable = [
      item.question,
      item.issues,
      item.answer,
      ...(item.key_facts || []),
      ...(item.legal_basis || []),
      ...(item.reasoning || []),
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  currentPage = 1;
  render();
}

function render() {
  const total = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const pageRecords = filteredRecords.slice(start, start + pageSize);

  $("resultCount").textContent = `พบ ${total.toLocaleString("th-TH")} รายการ`;
  $("clearSearch").classList.toggle("hidden", !$("search").value.trim());

  if (!pageRecords.length) {
    $("tableWrap").innerHTML =
      `<div class="empty">ไม่พบข้อมูลที่ตรงกับการค้นหา</div>`;
  } else {
    $("tableWrap").innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>คำถาม / ประเด็น</th>
            <th>Dataset</th>
            <th>คำตอบ</th>
          </tr>
        </thead>
        <tbody>
          ${pageRecords
            .map(
              (item, i) => `
            <tr data-index="${start + i}">
              <td class="id">${start + i + 1}</td>
              <td>
                <div class="question">${escapeHtml(item.question)}</div>
                <div class="issue">${escapeHtml(item.issues || "")}</div>
              </td>
              <td><span class="source-pill ${item._sourceClass}">${escapeHtml(item._sourceLabel)}</span></td>
              <td><div class="answer-preview">${escapeHtml(item.answer || "")}</div></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
    $("tableWrap")
      .querySelectorAll("tbody tr")
      .forEach((row) => {
        row.addEventListener("click", () => {
          const index = Number(row.dataset.index);
          openDetail(filteredRecords[index], index);
        });
      });
  }

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const p = $("pagination");
  if (totalPages <= 1) {
    p.innerHTML = "";
    return;
  }

  const buttons = [];
  buttons.push(
    `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">‹</button>`,
  );

  const range = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2)
      range.push(i);
    else if (range[range.length - 1] !== "…") range.push("…");
  }

  range.forEach((item) => {
    if (item === "…") buttons.push(`<span>…</span>`);
    else
      buttons.push(
        `<button class="page-btn ${item === currentPage ? "active" : ""}" data-page="${item}">${item}</button>`,
      );
  });

  buttons.push(
    `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">›</button>`,
  );
  p.innerHTML = buttons.join("");
  p.querySelectorAll("[data-page]").forEach((btn) =>
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      render();
      window.scrollTo({
        top: $("tableWrap").getBoundingClientRect().top + window.scrollY - 100,
        behavior: "smooth",
      });
    }),
  );
}

function openDetail(item, index = filteredRecords.indexOf(item)) {
  const list = (arr) =>
    (arr || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
  const facts = (item.key_facts || [])
    .map((x) => `<span class="fact">${escapeHtml(x)}</span>`)
    .join("");

  $("modalContent").innerHTML = `
    <div class="detail-header">
      <div class="detail-source">
        <span class="source-pill ${item._sourceClass}">${escapeHtml(item._sourceLabel)}</span>
        <span class="detail-position">รายการที่ ${index + 1} / ${filteredRecords.length}</span>
      </div>
      <div class="detail-nav">
        <button class="detail-nav-btn" id="prevDetail" ${index <= 0 ? "disabled" : ""}>← ก่อนหน้า</button>
        <button class="detail-nav-btn primary" id="nextDetail" ${index >= filteredRecords.length - 1 ? "disabled" : ""}>ถัดไป →</button>
      </div>
    </div>

    <h2 class="detail-title">${escapeHtml(item.question)}</h2>

    <section class="detail-section">
      <h3>Issues / ประเด็น</h3>
      <p>${escapeHtml(item.issues || "—")}</p>
    </section>

    <section class="detail-section">
      <h3>Key Facts / ข้อเท็จจริงสำคัญ</h3>
      <div class="fact-list">${facts || "<span>—</span>"}</div>
    </section>

    <section class="detail-section">
      <h3>Legal Basis / ฐานกฎหมาย</h3>
      <ul>${list(item.legal_basis)}</ul>
    </section>

    <section class="detail-section">
      <h3>Reasoning / เหตุผล</h3>
      <ul>${list(item.reasoning)}</ul>
    </section>

    <section class="detail-section">
      <h3>Answer / คำตอบ</h3>
      <div class="answer-box"><p>${escapeHtml(item.answer || "—")}</p></div>
    </section>
  `;

  $("modal").classList.remove("hidden");
  $("modal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  $("prevDetail").addEventListener("click", () => {
    if (index > 0) {
      openDetail(filteredRecords[index - 1], index - 1);
    }
  });

  $("nextDetail").addEventListener("click", () => {
    if (index < filteredRecords.length - 1) {
      openDetail(filteredRecords[index + 1], index + 1);
    }
  });
}

function closeModal() {
  $("modal").classList.add("hidden");
  $("modal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll(".dataset-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".dataset-tab")
      .forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");
    currentSource = btn.dataset.source;
    applyFilters();
  });
});

$("search").addEventListener("input", applyFilters);
$("clearSearch").addEventListener("click", () => {
  $("search").value = "";
  applyFilters();
  $("search").focus();
});
$("pageSize").addEventListener("change", (e) => {
  pageSize = Number(e.target.value);
  currentPage = 1;
  render();
});
$("modalClose").addEventListener("click", closeModal);
$("modalBackdrop").addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if ($("modal").classList.contains("hidden")) return;

  if (e.key === "Escape") {
    closeModal();
  } else if (e.key === "ArrowRight") {
    const currentTitle =
      $("modalContent").querySelector(".detail-title")?.textContent;
    const index = filteredRecords.findIndex((x) => x.question === currentTitle);
    if (index >= 0 && index < filteredRecords.length - 1) {
      openDetail(filteredRecords[index + 1], index + 1);
    }
  } else if (e.key === "ArrowLeft") {
    const currentTitle =
      $("modalContent").querySelector(".detail-title")?.textContent;
    const index = filteredRecords.findIndex((x) => x.question === currentTitle);
    if (index > 0) {
      openDetail(filteredRecords[index - 1], index - 1);
    }
  }
});

loadData();
