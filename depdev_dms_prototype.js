var currentUser = { role: "admin", name: "Sir Harry", division: null };
var currentPage = "dashboard";
var REF_COUNTER_BY_MONTH = {};
var currentEditingRef = null;
var currentLogbookEditRef = null;
var pendingUploadFileName = "";
var pendingImportType = "upload"; // "upload" | "ocr"
var currentQuickSendRef = null;
var userMgmtModal = { type: null, userId: null, resetMode: "manual" };
var userMgmtNotice = "";
var ACCOUNT_SECURITY_META = {};
var PROFILE_PICS = {};
var pendingProfilePicDataUrl = null;
var CHAT_THREADS = {}; // { [contactId]: [{ me, text, time }] }
var currentChatContactId = null;

// Archive folders structure
var ARCHIVE_FOLDERS = [
  { id: "default", name: "General Archive", created: "2026-01-01", createdBy: "System" },
  { id: "memorandum", name: "Memorandums", created: "2026-01-15", createdBy: "Admin" },
  { id: "reports", name: "Reports", created: "2026-02-01", createdBy: "Admin" },
  { id: "letters", name: "Letters", created: "2026-02-15", createdBy: "Admin" }
];

/* ========= LOADING STATE ========= */

function showLoading(show) {
  const loader = document.getElementById('loader');
  if (loader) {
    if (show) {
      loader.classList.add('show');
    } else {
      loader.classList.remove('show');
    }
  }
}

/* ========= TOAST NOTIFICATIONS ========= */

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  
  const icons = {
    success: '✓',
    error: '!',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '•'}</span>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300)">✕</button>
  `;
  
  container.appendChild(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

function showSuccess(message, duration = 3000) {
  showToast(message, 'success', duration);
}

function showError(message, duration = 3000) {
  showToast(message, 'error', duration);
}

function showWarning(message, duration = 3000) {
  showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
  showToast(message, 'info', duration);
}

/**
 * Styled confirmation dialog (replaces window.confirm for destructive flows).
 * @returns {Promise<boolean>}
 */
function showConfirmDialog(opts) {
  opts = opts || {};
  var title = opts.title || "Confirm";
  var message = opts.message || "";
  var detail = opts.detail || "";
  var confirmLabel = opts.confirmLabel || "Confirm";
  var cancelLabel = opts.cancelLabel || "Cancel";
  var variant = opts.variant || "neutral";
  var safeVariant =
    variant === "danger" || variant === "warning" || variant === "neutral"
      ? variant
      : "neutral";

  var glyphs = { danger: "⚠", warning: "📦", neutral: "↩" };
  var glyph = glyphs[safeVariant] || glyphs.neutral;

  return new Promise(function (resolve) {
    var overlay = document.createElement("div");
    overlay.className = "confirm-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "confirm-modal-title");

    var detailHtml = detail
      ? '<p class="confirm-modal__detail">' + escapeHtml(detail) + "</p>"
      : "";

    var confirmBtnClass =
      "btn-confirm-action btn-confirm-action--" +
      (safeVariant === "danger"
        ? "danger"
        : safeVariant === "warning"
          ? "warning"
          : "primary");

    overlay.innerHTML =
      '<div class="confirm-modal confirm-modal--' +
      safeVariant +
      '" onclick="event.stopPropagation()">' +
      '<div class="confirm-modal__main">' +
      '<div class="confirm-modal__icon" aria-hidden="true">' +
      glyph +
      "</div>" +
      '<div class="confirm-modal__content">' +
      '<h3 id="confirm-modal-title" class="confirm-modal__title">' +
      escapeHtml(title) +
      "</h3>" +
      (message
        ? '<p class="confirm-modal__message">' + escapeHtml(message) + "</p>"
        : "") +
      detailHtml +
      "</div></div>" +
      '<div class="confirm-modal__footer">' +
      '<button type="button" class="btn-sec confirm-modal__cancel">' +
      escapeHtml(cancelLabel) +
      "</button>" +
      '<button type="button" class="' +
      confirmBtnClass +
      ' confirm-modal__ok">' +
      escapeHtml(confirmLabel) +
      "</button>" +
      "</div></div>";

    function onKey(e) {
      if (e.key === "Escape") {
        finish(false);
      }
    }

    function finish(result) {
      document.removeEventListener("keydown", onKey);
      overlay.classList.remove("is-open");
      setTimeout(function () {
        overlay.remove();
        resolve(result);
      }, 220);
    }

    overlay.addEventListener("click", function () {
      finish(false);
    });

    var btnCancel = overlay.querySelector(".confirm-modal__cancel");
    var btnOk = overlay.querySelector(".confirm-modal__ok");
    btnCancel.addEventListener("click", function () {
      finish(false);
    });
    btnOk.addEventListener("click", function () {
      finish(true);
    });

    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    setTimeout(function () {
      btnCancel.focus();
    }, 50);
  });
}

/* ========= FORM VALIDATION ========= */

function setFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const container = field.closest('.field') || field.parentElement;
  if (!container) return;
  
  container.classList.add('error');
  container.classList.remove('success');
  
  let errorEl = container.querySelector('.field-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    container.appendChild(errorEl);
  }
  errorEl.textContent = errorMessage;
}

function setFieldSuccess(fieldId, successMessage = '') {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const container = field.closest('.field') || field.parentElement;
  if (!container) return;
  
  container.classList.remove('error');
  container.classList.add('success');
  
  const errorEl = container.querySelector('.field-error');
  if (errorEl) errorEl.remove();
  
  if (successMessage) {
    const successEl = document.createElement('div');
    successEl.className = 'field-success';
    successEl.textContent = successMessage;
    container.appendChild(successEl);
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const container = field.closest('.field') || field.parentElement;
  if (!container) return;
  
  container.classList.remove('error', 'success');
  
  const errorEl = container.querySelector('.field-error');
  if (errorEl) errorEl.remove();
  
  const successEl = container.querySelector('.field-success');
  if (successEl) successEl.remove();
}

function validateRequired(fieldId, fieldName = '') {
  const field = document.getElementById(fieldId);
  if (!field) return false;
  
  const value = (field.value || '').trim();
  if (!value) {
    const name = fieldName || field.getAttribute('placeholder') || 'This field';
    setFieldError(fieldId, `${name} is required`);
    return false;
  }
  
  clearFieldError(fieldId);
  return true;
}

function validateEmail(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return false;
  
  const value = (field.value || '').trim();
  if (!value) return true; // Allow empty, use validateRequired separately
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    setFieldError(fieldId, 'Please enter a valid email address');
    return false;
  }
  
  clearFieldError(fieldId);
  return true;
}

function validateMinLength(fieldId, minLength) {
  const field = document.getElementById(fieldId);
  if (!field) return false;
  
  const value = (field.value || '').trim();
  if (value.length < minLength) {
    setFieldError(fieldId, `Minimum ${minLength} characters required`);
    return false;
  }
  
  clearFieldError(fieldId);
  return true;
}

function validateMatch(fieldId1, fieldId2, fieldName = 'Fields') {
  const field1 = document.getElementById(fieldId1);
  const field2 = document.getElementById(fieldId2);
  if (!field1 || !field2) return false;
  
  const value1 = field1.value || '';
  const value2 = field2.value || '';
  
  if (value1 !== value2) {
    setFieldError(fieldId2, `${fieldName} do not match`);
    return false;
  }
  
  clearFieldError(fieldId1);
  clearFieldError(fieldId2);
  return true;
}

/* ========= MOBILE SIDEBAR TOGGLE ========= */

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
  if (hamburger) {
    hamburger.classList.toggle('active');
  }
  if (overlay) {
    overlay.classList.toggle('open');
  }
}

function closeSidebarOnMobile() {
  const sidebar = document.querySelector('.sidebar');
  const hamburger = document.getElementById('hamburger-btn');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (window.innerWidth <= 768) {
    if (sidebar) sidebar.classList.remove('open');
    if (hamburger) hamburger.classList.remove('active');
    if (overlay) overlay.classList.remove('open');
  }
}

function getAccountKey() {
  // Stable enough for this prototype: prefer Gmail/email when present.
  return currentUser.email
    ? currentUser.email
    : [currentUser.role, currentUser.division || "", "local-user"].join("|");
}

var USERS = {
  admin: {
    role: "admin",
    name: "Sir. Harry",
    initial: "H",
    roleLabel: "Administrator",
    email: "harry@depdev7.gov.ph",
  },
  rd: {
    role: "rd",
    name: "Dir. RDJEN",
    initial: "R",
    roleLabel: "Regional Director",
    email: "rdjen@depdev7.gov.ph",
  },
  ard: {
    role: "ard",
    name: "ARD Mark",
    initial: "M",
    roleLabel: "Asst. Regional Director",
    email: "mark@depdev7.gov.ph",
  },
  oic: {
    role: "oic",
    name: "OIC Santos",
    initial: "O",
    roleLabel: "OIC",
    email: "oic@depdev7.gov.ph",
  },
  dc: {
    role: "dc",
    name: "Chief Reyes",
    initial: "C",
    roleLabel: "Division Chief",
    division: "Monitoring and Evaluation Division",
    email: "reyes@depdev7.gov.ph",
  },
  supervisor: {
    role: "supervisor",
    name: "Supervisor Jose",
    initial: "J",
    roleLabel: "Supervisor",
    division: "Monitoring and Evaluation Division",
    email: "jose@depdev7.gov.ph",
  },
  staff: {
    role: "staff",
    name: "Staff Ana",
    initial: "A",
    roleLabel: "Staff",
    division: "Monitoring and Evaluation Division",
    email: "ana@depdev7.gov.ph",
  },
};

var DOCS = [
  {
    ref: "2026-04-180",
    type: "Memorandum",
    from: "Finance Division",
    to: "RD",
    subject: "Budget Utilization Report Q1 2026",
    status: "For RD Approval",
    date: "2026-04-28",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
  },
  {
    ref: "2026-04-163",
    type: "Letter",
    from: "External Agency",
    to: "ARD",
    subject: "Request for Coordination Meeting",
    status: "For ARD Clearance",
    date: "2026-04-27",
    conf: false,
    kind: "incoming",
    division: "Monitoring and Evaluation Division",
  },
  {
    ref: "2026-04-155",
    type: "Endorsement",
    from: "HR Division",
    to: "RD",
    subject: "Personnel Action Form — Promotion",
    status: "Approved",
    date: "2026-04-26",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
  },
  {
    ref: "2026-04-148",
    type: "Report",
    from: "MED",
    to: "RD",
    subject: "Monthly Monitoring Report March 2026",
    status: "Released",
    date: "2026-04-25",
    conf: false,
    kind: "outgoing",
    division: "Monitoring and Evaluation Division",
  },
  {
    ref: "2026-04-140",
    type: "Letter",
    from: "ORD",
    to: "External",
    subject: "Reply to NEDA Memorandum No. 2026-021",
    status: "Released",
    date: "2026-04-24",
    conf: false,
    kind: "outgoing",
    division: "ORD",
  },
  {
    ref: "2026-04-118",
    type: "Confidential",
    from: "RD Office",
    to: "ARD",
    subject: "[Confidential — Reference Only]",
    status: "For ARD Clearance",
    date: "2026-04-20",
    conf: true,
    kind: "incoming",
    division: "ORD",
  },
  {
    ref: "2026-03-200",
    type: "Memorandum",
    from: "Budget Division",
    to: "RD",
    subject: "Supplemental Budget Proposal 2026",
    status: "Approved",
    date: "2026-03-30",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
  },
  {
    ref: "2026-03-185",
    type: "Bill",
    from: "Supplier XYZ",
    to: "FAD",
    subject: "Invoice for Office Supplies",
    status: "Released",
    date: "2026-03-28",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
  },
];

var NAV_ADMIN = [
  {
    label: "Main",
    items: [
      { icon: "📊", text: "Dashboard", page: "dashboard" },
      { icon: "📥", text: "Incoming Documents", page: "incoming", badge: 3 },
      { icon: "📤", text: "Outgoing Documents", page: "outgoing" },
      { icon: "📋", text: "Document Logbook", page: "logbook" },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: "🔍", text: "Search Documents", page: "search" },
      { icon: "📁", text: "Archive", page: "archive" },
      { icon: "👥", text: "User Management", page: "users" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: "💬", text: "Messages", page: "messages" },
      { icon: "🔔", text: "Notifications", page: "notifications", badge: 5 },
    ],
  },
  {
    label: "Reports",
    items: [{ icon: "📑", text: "Reports", page: "reports" }],
  },
];
var NAV_RD = [
  {
    label: "Main",
    items: [
      { icon: "📊", text: "Dashboard", page: "dashboard" },
      { icon: "📥", text: "For My Approval", page: "incoming", badge: 4 },
      { icon: "✅", text: "Approved Documents", page: "approved" },
      { icon: "📋", text: "Document Logbook", page: "logbook" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: "💬", text: "Messages", page: "messages" },
      { icon: "🔔", text: "Notifications", page: "notifications", badge: 4 },
    ],
  },
];
var NAV_ARD = [
  {
    label: "Main",
    items: [
      { icon: "📊", text: "Dashboard", page: "dashboard" },
      { icon: "📥", text: "For My Clearance", page: "incoming", badge: 2 },
      { icon: "📤", text: "For RD Routing", page: "outgoing" },
      { icon: "📋", text: "Document Logbook", page: "logbook" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: "💬", text: "Messages", page: "messages" },
      { icon: "🔔", text: "Notifications", page: "notifications", badge: 2 },
    ],
  },
];
var NAV_DC = [
  {
    label: "Main",
    items: [
      { icon: "📊", text: "Division Dashboard", page: "dashboard" },
      { icon: "📥", text: "Division Incoming", page: "incoming", badge: 1 },
      { icon: "📤", text: "Division Outgoing", page: "outgoing" },
      { icon: "📋", text: "Division Logbook", page: "logbook" },
      { icon: "📁", text: "Division Archive", page: "archive" },
    ],
  },
  {
    label: "Management",
    items: [{ icon: "👥", text: "Division User Management", page: "users" }],
  },
  {
    label: "Communication",
    items: [
      { icon: "💬", text: "Messages", page: "messages" },
      { icon: "🔔", text: "Notifications", page: "notifications", badge: 1 },
    ],
  },
];
var NAV_STAFF = [
  {
    label: "Main",
    items: [
      { icon: "📊", text: "My Dashboard", page: "dashboard" },
      { icon: "📥", text: "Assigned to Me", page: "incoming", badge: 2 },
      { icon: "📤", text: "My Submissions", page: "outgoing" },
      { icon: "📋", text: "Document Logbook", page: "logbook" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: "💬", text: "Messages", page: "messages" },
      { icon: "🔔", text: "Notifications", page: "notifications", badge: 2 },
    ],
  },
];

function getNav() {
  var r = currentUser.role;
  if (r === "admin") return NAV_ADMIN;
  if (r === "rd") return NAV_RD;
  if (r === "ard" || r === "oic") return NAV_ARD;
  if (r === "dc") return NAV_DC;
  return NAV_STAFF;
}

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function loginAs(role) {
  showLoading(true);
  currentUser = Object.assign({}, USERS[role]);
  showApp();

  showLoading(false);

}

function selectedDivisionName() {
  var picked = document.querySelector('input[name="div"]:checked');
  if (!picked) return null;
  var map = {
    med: "Monitoring and Evaluation Division",
    pfp: "Policy Formulation and Planning Division",
    pdip: "Project Development, Investment Programming and Budget Division",
    drd: "Development and Research Division",
    fad: "Finance and Administrative Division",
  };
  return map[picked.value] || null;
}

function togglePasswordVisibility(inputId, toggleId) {
  var passwordInput = document.getElementById(inputId);
  var toggleIcon = document.getElementById(toggleId);

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.textContent = "🙈";
    toggleIcon.title = "Hide password";
  } else {
    passwordInput.type = "password";
    toggleIcon.textContent = "👁️";
    toggleIcon.title = "Show password";
  }
}

function doSignup() {
  var firstName = (
    document.getElementById("signup-first-name").value || ""
  ).trim();
  var lastName = (
    document.getElementById("signup-last-name").value || ""
  ).trim();
  var role = document.getElementById("role-select").value;

  if (!firstName || !lastName) {
    showError("Please enter your first name and last name.");
    return;
  }
  if (!role || !USERS[role]) {
    showError("Please select a valid role.");
    return;
  }

  var base = Object.assign({}, USERS[role]);
  var fullName = firstName + " " + lastName;
  base.name = fullName;
  base.initial = (firstName[0] || "") + (lastName[0] || "");
  base.initial = base.initial.toUpperCase() || "U";

  var needsDivision = ["dc", "supervisor", "staff"].includes(role);
  var division = selectedDivisionName();
  if (needsDivision && !division) {
    showError("Please select your division.");
    return;
  }
  if (division) base.division = division;

  currentUser = base;
  USERS[currentUser.role] = Object.assign({}, USERS[currentUser.role], base);
  showLoading(true);
  setTimeout(() => {
    showApp();
    showLoading(false);
    showSuccess("Signed in as " + fullName + ".");
  }, 500);
}
function doLogin() {
  showLoading(true);
  setTimeout(() => {
    showApp();
    showLoading(false);
    showSuccess(
      "Welcome back" +
        (currentUser && currentUser.name ? ", " + currentUser.name : "") +
        ".",
    );
  }, 500);
}
function showApp() {
  var u = currentUser;
  var avatarEl = document.getElementById("sb-avatar");
  var pic = PROFILE_PICS[getAccountKey()] || "";
  if (avatarEl) {
    if (pic) {
      avatarEl.innerHTML =
        '<img src="' +
        pic +
        '" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />';
    } else {
      avatarEl.textContent = u.initial || (u.name && u.name[0]) || "U";
    }
  }
  document.getElementById("sb-name").textContent = u.name;
  document.getElementById("sb-role").textContent =
    u.roleLabel + (u.division ? " — " + u.division.split(" ")[0] : "");
  renderNav();
  renderRecipientDirectory();
  showScreen("screen-app");
  showPage("dashboard");
}

function renderRecipientDirectory() {
  var dl = document.getElementById("compose-recipient-list");
  if (!dl) return;
  var seen = {};
  var options = [];

  Object.keys(USERS).forEach(function (k) {
    var u = USERS[k];
    if (!u || !u.name) return;
    var label = u.name + " — " + (u.roleLabel || u.role || "User");
    if (u.division) label += " (" + u.division + ")";
    if (u.email) label += " <" + u.email + ">";
    if (!seen[label]) {
      seen[label] = true;
      options.push(label);
    }
  });

  dl.innerHTML = options
    .map(function (txt) {
      return '<option value="' + txt.replace(/"/g, "&quot;") + '"></option>';
    })
    .join("");
}
function doLogout() {
  showLoading(true);
  setTimeout(() => {
    showScreen("screen-signin");
    showLoading(false);
  }, 500);
}

function renderNav() {
  var nav = getNav();
  var el = document.getElementById("sb-nav");
  var html = "";
  nav.forEach(function (sec) {
    html += '<div class="sb-section">' + sec.label + "</div>";
    sec.items.forEach(function (item) {
      html +=
        '<div class="sb-item" onclick="showPage(\'' +
        item.page +
        '\')" id="nav-' +
        item.page +
        '"><span class="sb-icon">' +
        item.icon +
        "</span>" +
        item.text +
        (item.badge ? '<span class="sb-badge">' + item.badge + "</span>" : "") +
        "</div>";
    });
  });
  html +=
    '<div class="sb-item" onclick="doLogout()" id="nav-signout"><span class="sb-icon">⬅</span>Sign out</div>';
  el.innerHTML = html;
}

function showPage(page) {
  closeSidebarOnMobile();
  showLoading(true);
  currentPage = page;
  document
    .querySelectorAll(".sb-item")
    .forEach((i) => i.classList.remove("active"));
  var el = document.getElementById("nav-" + page);
  if (el) el.classList.add("active");
  var titles = {
    dashboard: "Dashboard",
    incoming: "Incoming Documents",
    outgoing: "Outgoing Documents",
    logbook: "Document Logbook",
    search: "Search Documents",
    archive: "Archive",
    users: "User Management",
    messages: "Messages & Chat",
    notifications: "Notifications",
    reports: "Reports",
    approved: "Approved Documents",
    
  };
  var c = document.getElementById("main-content");
  var titleHeader = renderPageHeader(titles[page] || page);
  if (page === "dashboard") c.innerHTML = titleHeader + renderDashboard();
  else if (page === "incoming") c.innerHTML = titleHeader + renderIncoming();
  else if (page === "outgoing") c.innerHTML = titleHeader + renderOutgoing();
  else if (page === "logbook") c.innerHTML = titleHeader + renderLogbook();
  else if (page === "messages") c.innerHTML = titleHeader + renderMessages();
  else if (page === "notifications")
    c.innerHTML = titleHeader + renderNotifications();
  else if (page === "users") c.innerHTML = titleHeader + renderUsers();
  else if (page === "search") c.innerHTML = titleHeader + renderSearch();
  else if (page === "reports") c.innerHTML = titleHeader + renderReports();
  else if (page === "archive") c.innerHTML = titleHeader + renderArchive();
  else
    c.innerHTML =
      titleHeader +
      '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:1rem">🚧</div><div style="font-size:16px;font-weight:600">' +
      titles[page] +
      '</div><div style="font-size:13px;margin-top:.5rem">This section is under development.</div></div>';
      showLoading(false);
}

function renderPageHeader(title) {
  return (
    '<div class="page-header"><div class="page-header-title">' +
    title +
    "</div></div>"
  );
}

function statusPill(s) {
  if (s === "Archived") return '<span class="pill pill-gray">Archived</span>';
  if (s === "Approved" || s === "Released")
    return '<span class="pill pill-green">' + s + "</span>";
  if (s === "For RD Approval" || s === "For ARD Clearance")
    return '<span class="pill pill-amber">' + s + "</span>";
  if (s === "Rejected") return '<span class="pill pill-red">' + s + "</span>";
  return '<span class="pill pill-blue">' + s + "</span>";
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function formatDateISO(d) {
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function registerExistingReferences() {
  REF_COUNTER_BY_MONTH = {};
  DOCS.forEach(function (d) {
    var m = /^(\d{4})-(\d{2})-(\d{3})$/.exec(d.ref || "");
    if (!m) return;
    var key = m[1] + "-" + m[2];
    var seq = parseInt(m[3], 10);
    REF_COUNTER_BY_MONTH[key] = Math.max(REF_COUNTER_BY_MONTH[key] || 0, seq);
  });
}

function nextSystemReference(isoDate) {
  var key = (isoDate || formatDateISO(new Date())).slice(0, 7);
  var next = (REF_COUNTER_BY_MONTH[key] || 0) + 1;
  REF_COUNTER_BY_MONTH[key] = next;
  return key + "-" + pad3(next);
}

function flowPill(kind) {
  return kind === "incoming"
    ? '<span class="pill pill-blue">Incoming</span>'
    : '<span class="pill pill-green">Outgoing</span>';
}

function getDocByRef(ref) {
  return DOCS.find(function (d) {
    return d.ref === ref;
  });
}

function isGlobalLogbookRole(role) {
  return role === "admin" || role === "rd" || role === "ard" || role === "oic";
}

function getVisibleLogbookDocs() {
  if (isGlobalLogbookRole(currentUser.role)) return DOCS;
  return DOCS.filter(function (d) {
    return (d.division || "ORD") === currentUser.division;
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderActionsMenu(ref, editFn) {
  var ef = editFn || "openEditor";
  return (
    '<select class="btn-sm primary" onchange="handleActionMenu(this,\'' +
    ref +
    "','" +
    ef +
    "')\">" +
    '<option value="">Options</option>' +
    '<option value="view">View</option>' +
    '<option value="edit">Edit</option>' +
    '<option value="send">Send</option>' +
    '<option value="print">Print</option>' +
    '<option value="delete">Delete</option>' +
    "</select>"
  );
}

function handleActionMenu(el, ref, editFn) {
  var action = el.value;
  el.value = "";
  if (!action) return;
  if (action === "view") {
    viewDoc(ref);
    return;
  }
  if (action === "edit") {
    var fn = window[editFn];
    if (typeof fn === "function") fn(ref);
    else openEditor(ref);
    return;
  }
  if (action === "send") {
    openQuickSend(ref);
    return;
  }
  if (action === "print") {
    printDocument(ref);
    return;
  }
  if (action === "delete") {
    deleteLogbookEntry(ref);
  }
}

function renderDashboard() {
  var r = currentUser.role;
  var h = "";
  // Role-aware welcome
  h +=
    '<div style="background:linear-gradient(110deg,var(--navy) 0%,var(--navy3) 100%);border-radius:14px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">';
  h +=
    '<div><div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:.25rem">Good day,</div><div style="font-size:22px;font-weight:700">' +
    currentUser.name +
    '</div><div style="font-size:13px;color:rgba(255,255,255,.65);margin-top:.3rem">' +
    currentUser.roleLabel +
    (currentUser.division ? " · " + currentUser.division : "") +
    "</div></div>";
  h +=
    '<div style="text-align:right"><div style="font-size:13px;color:rgba(255,255,255,.5)">Today</div><div style="font-size:18px;font-weight:600">April 28, 2026</div><div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:.25rem">Reference: 2026-04-</div></div>';
  h += "</div>";

  h += '<div class="stats-row">';
  if (r === "admin") {
    h += statCard("📥", "Total Received", "142", "This month", "var(--info)");
    h += statCard(
      "⏳",
      "Pending Action",
      "18",
      "Across all divisions",
      "var(--warn)",
    );
    h += statCard(
      "✅",
      "Released Today",
      "7",
      "Documents processed",
      "var(--success)",
    );
    h += statCard(
      "⚠️",
      "Deadline Alerts",
      "3",
      "Within 3 days",
      "var(--danger)",
    );
  } else if (r === "rd") {
    h += statCard(
      "📋",
      "For My Approval",
      "4",
      "Awaiting your signature",
      "var(--warn)",
    );
    h += statCard(
      "✅",
      "Approved This Week",
      "11",
      "Documents signed",
      "var(--success)",
    );
    h += statCard("📤", "Released", "8", "Outgoing documents", "var(--info)");
    h += statCard("⚠️", "Overdue", "1", "Action required", "var(--danger)");
  } else if (r === "ard" || r === "oic") {
    h += statCard(
      "🔍",
      "For My Clearance",
      "2",
      "Pending endorsement",
      "var(--warn)",
    );
    h += statCard("➡️", "Forwarded to RD", "9", "This week", "var(--info)");
    h += statCard("✅", "Cleared", "5", "Documents endorsed", "var(--success)");
    h += statCard("🔔", "Alerts", "2", "Deadline reminders", "var(--danger)");
  } else if (r === "dc") {
    h += statCard(
      "📥",
      "Division Incoming",
      "6",
      "Unread/pending",
      "var(--info)",
    );
    h += statCard("📤", "For Submission", "1", "Ready for ARD", "var(--warn)");
    h += statCard("✅", "Completed", "14", "This month", "var(--success)");
    h += statCard("👤", "Staff Assigned", "3", "Active tasks", "var(--navy)");
  } else {
    h += statCard(
      "📌",
      "Assigned to Me",
      "2",
      "Requires action",
      "var(--warn)",
    );
    h += statCard("📝", "In Progress", "1", "Being prepared", "var(--info)");
    h += statCard("✅", "Submitted", "5", "This month", "var(--success)");
    h += statCard("🔔", "Notifications", "2", "Unread", "var(--danger)");
  }
  h += "</div>";

  h += '<div class="grid2">';
  // Recent docs
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Recent Documents</div><div class="card-action" onclick="showPage(\'incoming\')">View all →</div></div>';
  h +=
    '<table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Status</th></tr></thead><tbody>';
  DOCS.slice(0, 5).forEach(function (d) {
    if (d.conf && r === "staff") return;
    h +=
      "<tr onclick=\"viewDoc('" +
      d.ref +
      '\')" style="cursor:pointer"><td style="font-family:monospace;font-size:12px">' +
      d.ref +
      "</td><td>" +
      d.subject +
      "</td><td>" +
      statusPill(d.status) +
      "</td></tr>";
  });
  h += "</tbody></table></div>";

  // Workflow tracker
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Workflow Pipeline</div></div>';
  h += '<div style="display:flex;flex-direction:column;gap:.6rem">';
  var stages = [
    { label: "Received by ORD", count: 12, color: "var(--info)" },
    { label: "For ARD Clearance", count: 4, color: "var(--warn)" },
    { label: "For RD Approval", count: 3, color: "var(--gold)" },
    { label: "Approved — For Release", count: 5, color: "var(--success)" },
    { label: "Released / Archived", count: 118, color: "var(--muted)" },
  ];
  stages.forEach(function (s) {
    var pct = Math.min(100, Math.round((s.count / 118) * 100)) + 2;
    h +=
      '<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>' +
      s.label +
      '</span><span style="font-weight:700;color:var(--text)">' +
      s.count +
      "</span></div>";
    h +=
      '<div style="height:8px;border-radius:4px;background:var(--border)"><div style="height:8px;border-radius:4px;background:' +
      s.color +
      ";width:" +
      pct +
      '%"></div></div></div>';
  });
  h += "</div></div>";
  h += "</div>";

  // Deadline alerts
  h +=
    '<div class="card mb15 mt1" style="margin-top:1.25rem"><div class="card-head"><div class="card-title">⚠️ Deadline Alerts</div></div>';
  h +=
    '<table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  h +=
    '<tr><td style="font-family:monospace;font-size:12px">2026-04-118</td><td>Personnel Action — Deadline Reminder</td><td><span style="color:var(--danger);font-weight:600">Apr 30, 2026</span></td><td><span class="pill pill-red">2 days left</span></td><td><div style="display:flex;gap:.35rem"><button class="btn-sm" onclick="viewDoc(\'2026-04-118\')">View</button><button class="btn-sm primary" onclick="openEditor(\'2026-04-118\')">Edit</button><button class="btn-sm primary" onclick="openQuickSend(\'2026-04-118\')">Send</button></div></td></tr>';
  h +=
    '<tr><td style="font-family:monospace;font-size:12px">2026-04-163</td><td>Request for Coordination Meeting</td><td><span style="color:var(--warn);font-weight:600">May 2, 2026</span></td><td><span class="pill pill-amber">4 days left</span></td><td><div style="display:flex;gap:.35rem"><button class="btn-sm" onclick="viewDoc(\'2026-04-163\')">View</button><button class="btn-sm primary" onclick="openEditor(\'2026-04-163\')">Edit</button><button class="btn-sm primary" onclick="openQuickSend(\'2026-04-163\')">Send</button></div></td></tr>';
  h +=
    '<tr><td style="font-family:monospace;font-size:12px">2026-04-180</td><td>Budget Utilization Report Q1</td><td><span style="color:var(--muted)">May 5, 2026</span></td><td><span class="pill pill-gray">7 days left</span></td><td><div style="display:flex;gap:.35rem"><button class="btn-sm" onclick="viewDoc(\'2026-04-180\')">View</button><button class="btn-sm primary" onclick="openEditor(\'2026-04-180\')">Edit</button><button class="btn-sm primary" onclick="openQuickSend(\'2026-04-180\')">Send</button></div></td></tr>';
  h += "</tbody></table></div>";
  return h;
}

function statCard(icon, label, val, sub, color) {
  return (
    '<div class="stat-card"><div class="stat-icon">' +
    icon +
    '</div><div class="stat-label">' +
    label +
    '</div><div class="stat-val" style="color:' +
    color +
    '">' +
    val +
    '</div><div class="stat-sub">' +
    sub +
    "</div></div>"
  );
}

function renderIncoming() {
  var h = "";
  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h +=
    '<div class="tab-bar" id="in-tabs"><div class="tab active" onclick="setTab(this,\'all\')">All</div><div class="tab" onclick="setTab(this,\'pending\')">Pending</div><div class="tab" onclick="setTab(this,\'approved\')">Approved</div><div class="tab" onclick="setTab(this,\'released\')">Released</div></div>';
  h +=
    '<button class="btn-sm primary" onclick="openCompose()">+ Send Document</button>';
  h += "</div>";
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Incoming Documents</div><div style="font-size:12px;color:var(--muted)">' +
    DOCS.filter((d) => d.kind === "incoming").length +
    " records</div></div>";
  h +=
    '<table class="doc-table"><thead><tr><th>Reference No.</th><th>Direction</th><th>Type</th><th>From</th><th>Subject</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>';
  DOCS.filter((d) => d.kind === "incoming").forEach(function (d) {
    var conf = d.conf
      ? '<span class="pill pill-red" style="margin-left:4px">Conf.</span>'
      : "";
    h +=
      '<tr><td style="font-family:monospace;font-size:12px">' +
      d.ref +
      "</td><td>" +
      flowPill(d.kind) +
      "</td><td>" +
      d.type +
      conf +
      "</td><td>" +
      d.from +
      "</td><td>" +
      d.subject +
      "</td><td>" +
      d.date +
      "</td><td>" +
      statusPill(d.status) +
      "</td><td>" +
      renderActionsMenu(d.ref) +
      "</td></tr>";
  });
  h += "</tbody></table></div>";
  return h;
}

function renderOutgoing() {
  var h = "";
  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h +=
    '<div class="tab-bar"><div class="tab active">All</div><div class="tab">Draft</div><div class="tab">For Approval</div><div class="tab">Released</div></div>';
  h +=
    '<button class="btn-sm primary" onclick="openCompose()">+ New Document</button>';
  h += "</div>";
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Outgoing Documents</div></div>';
  h +=
    '<table class="doc-table"><thead><tr><th>Reference No.</th><th>Direction</th><th>Type</th><th>To</th><th>Subject</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>';
  DOCS.filter((d) => d.kind === "outgoing").forEach(function (d) {
    h +=
      '<tr><td style="font-family:monospace;font-size:12px">' +
      d.ref +
      "</td><td>" +
      flowPill(d.kind) +
      "</td><td>" +
      d.type +
      "</td><td>" +
      d.to +
      "</td><td>" +
      d.subject +
      "</td><td>" +
      d.date +
      "</td><td>" +
      statusPill(d.status) +
      "</td><td>" +
      renderActionsMenu(d.ref) +
      "</td></tr>";
  });
  h += "</tbody></table></div>";
  return h;
}

function renderLogbook() {
  var h = "";
  var visibleDocs = getVisibleLogbookDocs();
  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h += "<div></div>";
  h +=
    '<div style="display:flex;gap:.5rem"><button class="btn-sm" onclick="openManualLogbook()">✍️ Manual Logbook</button><button class="btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn-sm">⬇️ Export CSV</button></div>';
  h += "</div>";
  if (isGlobalLogbookRole(currentUser.role)) {
    h +=
      '<div style="font-size:12px;color:var(--muted);margin:-.5rem 0 1rem 0">Global logbook view for Admin, RD, and ARD/OIC. This includes all divisions.</div>';
  } else {
    h +=
      '<div style="font-size:12px;color:var(--muted);margin:-.5rem 0 1rem 0">Division logbook only: ' +
      currentUser.division +
      ". You cannot access other division logbooks.</div>";
  }
  h +=
    '<div class="card"><table class="doc-table"><thead><tr><th>#</th><th>Reference No.</th><th>Direction</th><th>Date Received</th><th>Type</th><th>From / Sender</th><th>Subject</th><th>Routed To</th><th>Status</th><th>Physical Copy</th><th>Actions</th></tr></thead><tbody>';
  visibleDocs.forEach(function (d, i) {
    h +=
      '<tr><td style="color:var(--muted)">' +
      (i + 1) +
      '</td><td style="font-family:monospace;font-size:12px">' +
      d.ref +
      "</td><td>" +
      flowPill(d.kind) +
      "</td><td>" +
      d.date +
      "</td><td>" +
      d.type +
      "</td><td>" +
      d.from +
      "</td><td>" +
      d.subject +
      "</td><td>" +
      d.to +
      "</td><td>" +
      statusPill(d.status) +
      '</td><td style="text-align:center">' +
      (d.physicalCopy ? "✔️" : "—") +
      "</td><td>" +
      renderActionsMenu(d.ref, "openLogbookEdit") +
      "</td></tr>";
  });
  h += "</tbody></table></div>";
  return h;
}

function renderMessages() {
  var h = '<div class="grid2" style="align-items:start">';

  var visibleUsersForChat = USER_ACCOUNTS.filter(function (u) {
    if (!u || u.status !== "Active") return false;
    if (currentUser.role === "dc") return u.division === currentUser.division;
    return true;
  }).filter(function (u) {
    // Exclude self
    return u.email !== currentUser.email;
  });

  h +=
    '<div class="card" style="min-width:320px">' +
    '<div class="card-head"><div class="card-title">Messages</div></div>' +
    '<div style="padding:0 1rem 1rem"><div style="margin-bottom:.6rem">' +
    '<input id="chat-user-search" oninput="filterChatContacts(this.value)" placeholder="Search people..." style="width:100%;padding:.55rem .85rem;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none" />' +
    "</div>" +
    '<div id="chat-contacts-list" style="display:flex;flex-direction:column;gap:2px"></div>' +
    "</div>" +
    "</div>";

  h +=
    '<div class="card" style="flex:1;min-width:420px">' +
    '<div class="card-head"><div class="card-title" id="chat-thread-title">Select a person to chat</div></div>' +
    '<div class="chat-wrap" id="chat-messages"></div>' +
    '<div class="chat-input-row"><input placeholder="Type a message..." id="chat-in"><button class="chat-send" onclick="sendChat()">Send</button></div>' +
    "</div>";

  h += "</div>";

  // Fill contacts list after HTML is injected (so we can attach DOM updates).
  // We store this on window for the helper.
  window.__chat_contacts = visibleUsersForChat.map(function (u) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      division: u.division,
      role: u.role,
    };
  });

  // Render contacts list immediately if the container exists.
  // Note: showPage() injects innerHTML before this function returns.
  setTimeout(function () {
    renderChatContacts();
    // Auto-select first contact if available.
    if (window.__chat_contacts && window.__chat_contacts.length) {
      selectChat(window.__chat_contacts[0].id);
    }
  }, 0);

  return h;
}

function renderNotifications() {
  var h =
    '<div class="card"><div class="card-head"><div class="card-title">All Notifications</div><button class="btn-sm" onclick="">Mark all as read</button></div>';
  var notifs = [
    {
      icon: "📥",
      text: "Document 2026-04-180 received and logged.",
      time: "Just now",
      read: false,
    },
    {
      icon: "⏳",
      text: "Document 2026-04-163 is awaiting ARD clearance.",
      time: "2 hours ago",
      read: false,
    },
    {
      icon: "⚠️",
      text: "DEADLINE ALERT: Document 2026-04-118 is due in 2 days.",
      time: "3 hours ago",
      read: false,
    },
    {
      icon: "✅",
      text: "Document 2026-04-155 approved by RD.",
      time: "Yesterday",
      read: true,
    },
    {
      icon: "📤",
      text: "Document 2026-04-140 has been released.",
      time: "Yesterday",
      read: true,
    },
    {
      icon: "👤",
      text: "New user account (Staff Ana) registered — pending activation.",
      time: "2 days ago",
      read: true,
    },
    {
      icon: "📋",
      text: "Monthly logbook report for March 2026 generated.",
      time: "3 days ago",
      read: true,
    },
  ];
  notifs.forEach(function (n) {
    h +=
      '<div style="display:flex;align-items:flex-start;gap:.85rem;padding:.85rem 0;border-bottom:1px solid var(--border);' +
      (n.read ? "opacity:.65" : "") +
      '">';
    h +=
      '<div style="width:36px;height:36px;border-radius:50%;background:var(--pill);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' +
      n.icon +
      "</div>";
    h +=
      '<div style="flex:1"><div style="font-size:13px;line-height:1.5">' +
      n.text +
      '</div><div style="font-size:11px;color:var(--muted);margin-top:3px">' +
      n.time +
      "</div></div>";
    if (!n.read)
      h +=
        '<div style="width:8px;height:8px;border-radius:50%;background:var(--navy3);margin-top:6px;flex-shrink:0"></div>';
    h += "</div>";
  });
  h += "</div>";
  return h;
}

function renderUsers() {
  if (currentUser.role !== "admin" && currentUser.role !== "dc") {
    return '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">User management is available for Admin and Division Chief only.</div>';
  }
  var h =
    '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:1.25rem"><button class="btn-sm primary" onclick="openAddUserModal()">+ Add User</button></div>';
  h +=
    '<div class="card" style="margin-bottom:.75rem;font-size:12px;color:var(--muted)">' +
    (currentUser.role === "admin"
      ? "Admin authority: full access over all users and system functions. Can add users with any role."
      : "Division Chief authority: manage users in your division only (access, password reset, activate/deactivate). Can add Staff and Supervisor roles for your division. New users remain Pending until Admin approval.") +
    "</div>";
  if (userMgmtNotice) {
    h +=
      '<div class="card" style="margin-bottom:.75rem;font-size:12px;color:var(--success)">' +
      userMgmtNotice +
      "</div>";
  }
  h += '<div class="card">';
  h +=
    '<table class="doc-table"><thead><tr><th>Name</th><th>Role</th><th>Division</th><th>Email</th><th>Document Access</th><th>Function Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  var visibleUsers = USER_ACCOUNTS.filter(function (u) {
    if (currentUser.role === "admin") return true;
    return u.division === currentUser.division;
  });

  visibleUsers.forEach(function (u) {
    var statusPillHtml =
      u.status === "Active"
        ? '<span class="pill pill-green">Active</span>'
        : u.status === "Pending"
          ? '<span class="pill pill-amber">Pending</span>'
          : '<span class="pill pill-red">Deactivated</span>';
    var canManage = canManageUserAccount(u);
    var statusActionLabel =
      u.status === "Pending"
        ? "Approve"
        : u.status === "Deactivated"
          ? "Activate"
          : "Deactivate";
    var statusActionClass =
      u.status === "Pending" || u.status === "Deactivated"
        ? "btn-sm success"
        : "btn-sm danger";
    var actions = canManage
      ? '<div style="display:flex;gap:.3rem;flex-wrap:wrap"><button class="btn-sm" onclick="openAccessModal(\'' +
        u.id +
        '\')">Edit Access</button><button class="btn-sm" onclick="openResetPasswordModal(\'' +
        u.id +
        '\')">Reset Password</button><button class="' +
        statusActionClass +
        '" onclick="openStatusModal(\'' +
        u.id +
        "')\">" +
        statusActionLabel +
        "</button></div>"
      : '<span style="font-size:12px;color:var(--muted)">No authority</span>';

    h +=
      '<tr><td style="font-weight:600">' +
      u.name +
      "</td><td>" +
      u.role +
      "</td><td>" +
      divisionShortName(u.division) +
      '</td><td style="font-size:12px;color:var(--muted)">' +
      u.email +
      "</td><td>" +
      u.docAccess +
      "</td><td>" +
      u.funcAccess +
      "</td><td>" +
      statusPillHtml +
      "</td><td>" +
      actions +
      "</td></tr>";
  });
  h += "</tbody></table></div>";
  h += renderUserManagementModals();
  return h;
}

var USER_ACCOUNTS = [
  {
    id: "u-admin",
    name: "Sir Harry",
    role: "Admin",
    division: "ORD",
    email: "harry@depdev7.gov.ph",
    status: "Active",
    docAccess: "Full",
    funcAccess: "Full",
  },
  {
    id: "u-rd",
    name: "Dir. RDJEN",
    role: "RD",
    division: "ORD",
    email: "rdjen@depdev7.gov.ph",
    status: "Active",
    docAccess: "Full",
    funcAccess: "Approval",
  },
  {
    id: "u-ard",
    name: "ARD Mark",
    role: "ARD",
    division: "ORD",
    email: "mark@depdev7.gov.ph",
    status: "Active",
    docAccess: "Full",
    funcAccess: "Clearance",
  },
  {
    id: "u-dc",
    name: "Chief Reyes",
    role: "Division Chief",
    division: "Finance and Administrative Division",
    email: "reyes@depdev7.gov.ph",
    status: "Active",
    docAccess: "Division",
    funcAccess: "Division Manager",
  },
  {
    id: "u-staff-ana",
    name: "Staff Ana",
    role: "Staff",
    division: "Finance and Administrative Division",
    email: "ana@depdev7.gov.ph",
    status: "Pending",
    docAccess: "Division",
    funcAccess: "Basic",
  },
  {
    id: "u-sup-jose",
    name: "Supervisor Jose",
    role: "Supervisor",
    division: "Monitoring and Evaluation Division",
    email: "jose@depdev7.gov.ph",
    status: "Active",
    docAccess: "Division",
    funcAccess: "Supervisor",
  },
];

function divisionShortName(name) {
  if (name === "Finance and Administrative Division") return "FAD";
  if (name === "Monitoring and Evaluation Division") return "MED";
  if (name === "Policy Formulation and Planning Division") return "PFPD";
  if (
    name === "Project Development, Investment Programming and Budget Division"
  )
    return "PDIPBD";
  if (name === "Development and Research Division") return "DRD";
  return name || "ORD";
}

function getUserAccountById(userId) {
  return USER_ACCOUNTS.find(function (u) {
    return u.id === userId;
  });
}

function canManageUserAccount(userAccount) {
  if (!userAccount) return false;
  if (currentUser.role === "admin") return true;
  if (currentUser.role !== "dc") return false;
  if (userAccount.division !== currentUser.division) return false;
  return (
    userAccount.role === "Division Chief" ||
    userAccount.role === "Supervisor" ||
    userAccount.role === "Staff"
  );
}

function setUserMgmtNotice(msg) {
  userMgmtNotice = msg || "";
}

function openAccessModal(userId) {
  var user = getUserAccountById(userId);
  if (!user) return;
  if (!canManageUserAccount(user)) {
    setUserMgmtNotice("Access denied. You cannot modify this account.");
    showError("Access denied. You cannot modify this account.");
    showPage("users");
    return;
  }
  userMgmtModal = { type: "access", userId: user.id, resetMode: "manual" };
  showPage("users");
  
}

function saveAccessChanges() {
  if (userMgmtModal.type !== "access" || !userMgmtModal.userId) return;
  var user = getUserAccountById(userMgmtModal.userId);
  if (!user || !canManageUserAccount(user)) return closeUserMgmtModal();
  var docEl = document.getElementById("um-doc-access");
  var fnEl = document.getElementById("um-func-access");
  if (!docEl || !fnEl) return;
  user.docAccess = docEl.value;
  user.funcAccess = fnEl.value;
  setUserMgmtNotice("Access updated for " + user.name + ".");
  showSuccess("Access updated for " + user.name + ".");
  closeUserMgmtModal();
  showPage("users");
}

function openResetPasswordModal(userId) {
  var user = getUserAccountById(userId);
  if (!user) return;
  if (!canManageUserAccount(user)) {
    setUserMgmtNotice("Access denied. You cannot reset this user's password.");
    showError("Access denied. You cannot reset this user's password.");
    showPage("users");
    return;
  }
  userMgmtModal = { type: "reset", userId: user.id, resetMode: "manual" };
  showPage("users");
}

function setResetMode(mode) {
  if (userMgmtModal.type !== "reset") return;
  userMgmtModal.resetMode = mode === "passwordless" ? "passwordless" : "manual";
  showPage("users");
}

function confirmResetPassword() {
  if (userMgmtModal.type !== "reset" || !userMgmtModal.userId) return;
  var user = getUserAccountById(userMgmtModal.userId);
  if (!user || !canManageUserAccount(user)) return closeUserMgmtModal();
  if (userMgmtModal.resetMode === "manual") {
    var newPassEl = document.getElementById("um-new-password");
    var newPass = (newPassEl && newPassEl.value ? newPassEl.value : "").trim();
    if (!newPass) {
      setUserMgmtNotice("Please provide a new password.");
      showError("Please provide a new password.");
      showPage("users");
      return;
    }
    user.passwordMode = "required";
    user.tempPassword = newPass;
    setUserMgmtNotice("Password updated for " + user.name + ".");
    showSuccess("Password updated for " + user.name + ".");
  } else {
    user.passwordMode = "passwordless";
    user.tempPassword = "";
    setUserMgmtNotice(
      "Password reset to passwordless login for " +
        user.name +
        ". User can log in without entering a password.",
    );
    showSuccess(
      "Password reset to passwordless login for " +
        user.name +
        ". User can log in without entering a password.",
    );
  }
  closeUserMgmtModal();
  showPage("users");
}

function openStatusModal(userId) {
  var user = getUserAccountById(userId);
  if (!user) return;
  if (!canManageUserAccount(user)) {
    setUserMgmtNotice("Access denied. You cannot change this user's status.");
    showError("Access denied. You cannot change this user's status.");
    showPage("users");
    return;
  }
  if (user.status === "Pending" && currentUser.role !== "admin") {
    setUserMgmtNotice("Access denied. Only Admin can approve pending accounts.");
    showError("Access denied. Only Admin can approve pending accounts.");
    showPage("users");
    return;
  }
  if (user.status === "Pending") {
    showConfirmDialog({
      variant: "warning",
      title: "Approve this account?",
      message:
        "Approve " +
        user.name +
        " for sign-in access. Approved users become Active immediately.",
      confirmLabel: "Approve account",
      cancelLabel: "Keep pending",
    }).then(function (ok) {
      if (!ok) return;
      user.status = "Active";
      setUserMgmtNotice(
        "Account approved: " + user.name + " is now Active.",
      );
      showSuccess("Account approved: " + user.name + " is now Active.");
      closeUserMgmtModal();
      showPage("users");
    });
    return;
  }
  var nextStatus = user.status === "Deactivated" ? "Active" : "Deactivated";
  if (nextStatus === "Deactivated") {
    showConfirmDialog({
      variant: "danger",
      title: "Deactivate this account?",
      message:
        "Account holder: " +
        user.name +
        ". They will not be able to sign in until an administrator reactivates the account.",
      confirmLabel: "Deactivate account",
      cancelLabel: "Keep active",
    }).then(function (ok) {
      if (!ok) return;
      user.status = "Deactivated";
      setUserMgmtNotice(
        "Account status updated: " + user.name + " is now Deactivated.",
      );
      showSuccess("Account status updated: " + user.name + " is now Deactivated.");
      closeUserMgmtModal();
      showPage("users");
    });
    return;
  }
  userMgmtModal = { type: "status", userId: user.id, resetMode: "manual" };
  showPage("users");
}

function confirmToggleStatus() {
  if (userMgmtModal.type !== "status" || !userMgmtModal.userId) return;
  var user = getUserAccountById(userMgmtModal.userId);
  if (!user || !canManageUserAccount(user)) return closeUserMgmtModal();
  var nextStatus =
    user.status === "Pending"
      ? "Active"
      : user.status === "Deactivated"
        ? "Active"
        : "Deactivated";
  if (user.status === "Pending" && currentUser.role !== "admin") {
    setUserMgmtNotice("Access denied. Only Admin can approve pending accounts.");
    showError("Access denied. Only Admin can approve pending accounts.");
    closeUserMgmtModal();
    showPage("users");
    return;
  }
  user.status = nextStatus;
  setUserMgmtNotice(
    "Account status updated: " + user.name + " is now " + nextStatus + ".",
  );
  showSuccess("Account status updated: " + user.name + " is now " + nextStatus + ".");
  closeUserMgmtModal();
  showPage("users");
}

function openMySecuritySettings() {
  // Backward-compatible alias (used by older UI)
  openAccountSettings();
}

function saveMySecuritySettings() {
  if (userMgmtModal.type !== "security") return;
  var nameEl = document.getElementById("um-profile-name");
  var newName = (nameEl && nameEl.value ? nameEl.value : "").trim();
  if (!newName) {
    setUserMgmtNotice("Please enter a valid profile name.");
    showError("Please enter a valid profile name.");
    showPage("users");
    return;
  }
  currentUser.name = newName;
  currentUser.initial = (newName[0] || "U").toUpperCase();
  Object.keys(USERS).forEach(function (k) {
    if (USERS[k].role === currentUser.role) {
      USERS[k].name = newName;
      USERS[k].initial = currentUser.initial;
    }
  });
  var account = USER_ACCOUNTS.find(function (u) {
    return u.email === currentUser.email;
  });
  if (account) account.name = newName;
  setUserMgmtNotice("Security settings updated for your account.");
  showSuccess("Security settings updated for your account.");
  closeUserMgmtModal();
  showApp();
  showPage("users");
}

function closeUserMgmtModal() {
  userMgmtModal = { type: null, userId: null, resetMode: "manual" };
}

function openAddUserModal() {
  userMgmtModal.type = "add";
  showPage("users"); // Re-render to show the modal
}

function saveNewUser() {
  var firstName = (
    document.getElementById("add-user-first-name").value || ""
  ).trim();
  var lastName = (
    document.getElementById("add-user-last-name").value || ""
  ).trim();
  var email = (document.getElementById("add-user-email").value || "").trim();
  var role = document.getElementById("add-user-role").value;
  var division = document.getElementById("add-user-division").value;
  var status = document.getElementById("add-user-status").value;
  var isAdmin = currentUser.role === "admin";

  // Validation
  if (!firstName || !lastName) {
    userMgmtNotice = "Error: Please enter first name and last name.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }

  if (!email) {
    userMgmtNotice = "Error: Please enter email address.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }

  if (!role) {
    userMgmtNotice = "Error: Please select a role.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }

  if (!division) {
    userMgmtNotice = "Error: Please select a division.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }

  // Role-based validation
  if (
    !isAdmin &&
    (role === "admin" ||
      role === "rd" ||
      role === "ard" ||
      role === "oic" ||
      role === "dc")
  ) {
    userMgmtNotice =
      "Error: Division Chiefs can only add Staff and Supervisor roles.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }

  // Division validation for non-admin
  if (!isAdmin && division !== currentUser.division) {
    userMgmtNotice =
      "Error: Division Chiefs can only add users to their own division.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }
  if (!isAdmin) {
    status = "Pending";
  }

  // Generate user ID
  var userId = "u-" + role.toLowerCase() + "-" + Date.now();
  var fullName = firstName + " " + lastName;
  var initial = (firstName[0] || "") + (lastName[0] || "");

  // Create new user account
  var newUser = {
    id: userId,
    name: fullName,
    role: role,
    division: division,
    email: email,
    status: status,
    docAccess: getDocAccessForRole(role),
    funcAccess: getFuncAccessForRole(role),
  };

  // Add to USER_ACCOUNTS
  USER_ACCOUNTS.push(newUser);

  // Success message
  userMgmtNotice =
    "Success: " +
    fullName +
    " has been added as " +
    role +
    " in " +
    division +
    ".";
  showSuccess(userMgmtNotice.replace(/^Success:\s*/, ""));
  closeUserMgmtModal();
  showPage("users");

  // Clear notice after 3 seconds
  setTimeout(function () {
    userMgmtNotice = "";
  }, 3000);
}

function getDocAccessForRole(role) {
  var accessMap = {
    admin: "Full",
    rd: "Full",
    ard: "Full",
    oic: "Full",
    dc: "Division",
    supervisor: "Division",
    staff: "Division",
  };
  return accessMap[role] || "Division";
}

function getFuncAccessForRole(role) {
  var accessMap = {
    admin: "Full",
    rd: "Approval",
    ard: "Division Manager",
    oic: "Division Manager",
    dc: "Division Manager",
    supervisor: "Supervisor",
    staff: "Basic",
  };
  return accessMap[role] || "Basic";
}

function renderUserManagementModals() {
  var user = getUserAccountById(userMgmtModal.userId);
  var h = "";

  // Add User Modal
  if (userMgmtModal.type === "add") {
    var isAdmin = currentUser.role === "admin";
    var availableRoles = isAdmin
      ? '<option value="">- Select role -</option><option value="admin">Admin</option><option value="rd">RD</option><option value="ard">ARD</option><option value="oic">OIC</option><option value="dc">Division Chief</option><option value="supervisor">Supervisor</option><option value="staff">Staff</option>'
      : '<option value="">- Select role -</option><option value="supervisor">Supervisor</option><option value="staff">Staff</option>';

    var divisionOptions = isAdmin
      ? '<option value="">- Select division -</option><option value="Monitoring and Evaluation Division">Monitoring and Evaluation Division</option><option value="Policy Formulation and Planning Division">Policy Formulation and Planning Division</option><option value="Project Development, Investment Programming and Budget Division">Project Development, Investment Programming and Budget Division</option><option value="Development and Research Division">Development and Research Division</option><option value="Finance and Administrative Division">Finance and Administrative Division</option><option value="ORD">Office of the Regional Director</option>'
      : '<option value="' +
        currentUser.division +
        '" selected>' +
        currentUser.division +
        "</option>";
    var statusOptions = isAdmin
      ? '<option value="Active">Active</option><option value="Pending" selected>Pending</option>'
      : '<option value="Pending" selected>Pending (Admin approval required)</option>';

    h +=
      '<div class="modal-overlay open"><div class="modal" style="max-width:580px"><div class="modal-head"><h3>' +
      (isAdmin ? "Add New User" : "Add Division User") +
      '</h3><span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')">✕</span></div><div class="modal-body"><div class="form-row"><div class="field"><label>First Name</label><input id="add-user-first-name" type="text" placeholder="First name" /></div><div class="field"><label>Last Name</label><input id="add-user-last-name" type="text" placeholder="Last name" /></div></div><div class="field"><label>Email Address</label><input id="add-user-email" type="email" placeholder="user@deped.gov.ph" /></div><div class="field"><label>Role</label><select id="add-user-role">' +
      availableRoles +
      '</select></div><div class="field"><label>Division</label><select id="add-user-division">' +
      divisionOptions +
      '</select></div><div class="field"><label>Initial Status</label><select id="add-user-status">' +
      statusOptions +
      '</select></div><div style="font-size:12px;color:var(--muted);margin-top:1rem;">' +
      (isAdmin
        ? "Admin can add users with any role and division."
        : "Division Chief can only add Staff and Supervisor roles within their division.") +
      '</div></div><div class="modal-footer"><button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')">Cancel</button><button class="btn-send" onclick="saveNewUser()">Add User</button></div></div></div>';
  }

  if (userMgmtModal.type === "access" && user) {
    h +=
      '<div class="modal-overlay open"><div class="modal" style="max-width:520px"><div class="modal-head"><h3>Edit Access - ' +
      user.name +
      '</h3><span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')">✕</span></div><div class="modal-body"><div class="field"><label>Document Access</label><select id="um-doc-access"><option' +
      (user.docAccess === "Full" ? " selected" : "") +
      ">Full</option><option" +
      (user.docAccess === "Division" ? " selected" : "") +
      ">Division</option><option" +
      (user.docAccess === "None" ? " selected" : "") +
      '>None</option></select></div><div class="field"><label>Function Access</label><select id="um-func-access"><option' +
      (user.funcAccess === "Full" ? " selected" : "") +
      ">Full</option><option" +
      (user.funcAccess === "Division Manager" ? " selected" : "") +
      ">Division Manager</option><option" +
      (user.funcAccess === "Supervisor" ? " selected" : "") +
      ">Supervisor</option><option" +
      (user.funcAccess === "Basic" ? " selected" : "") +
      ">Basic</option><option" +
      (user.funcAccess === "None" ? " selected" : "") +
      '>None</option></select></div></div><div class="modal-footer"><button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')">Cancel</button><button class="btn-send" onclick="saveAccessChanges()">Save Access</button></div></div></div>';
  }
  if (userMgmtModal.type === "reset" && user) {
    h +=
      '<div class="modal-overlay open"><div class="modal" style="max-width:560px"><div class="modal-head"><h3>Reset Password - ' +
      user.name +
      '</h3><span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')">✕</span></div><div class="modal-body"><div class="field"><label style="text-transform:none;letter-spacing:0"><input type="radio" name="um-reset-mode" value="manual" ' +
      (userMgmtModal.resetMode === "manual" ? "checked" : "") +
      ' onchange="setResetMode(\'manual\')" style="width:auto;margin-right:.45rem">Set new password manually</label></div><div class="field"><label style="text-transform:none;letter-spacing:0"><input type="radio" name="um-reset-mode" value="passwordless" ' +
      (userMgmtModal.resetMode === "passwordless" ? "checked" : "") +
      ' onchange="setResetMode(\'passwordless\')" style="width:auto;margin-right:.45rem">Reset to passwordless login (no password required)</label></div>' +
      (userMgmtModal.resetMode === "manual"
        ? '<div class="field"><label>New Password</label><input id="um-new-password" type="password" placeholder="Enter new password"></div>'
        : '<div style="font-size:12px;color:var(--muted)">User can log in directly without entering a password until policy is changed.</div>') +
      '</div><div class="modal-footer"><button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')">Cancel</button><button class="btn-send" onclick="confirmResetPassword()">Apply Reset</button></div></div></div>';
  }
  if (userMgmtModal.type === "status" && user) {
    var nextStatus =
      user.status === "Pending"
        ? "Active"
        : user.status === "Deactivated"
          ? "Active"
          : "Deactivated";
    h +=
      '<div class="modal-overlay open"><div class="modal" style="max-width:480px"><div class="modal-head"><h3>Confirm Account Status</h3><span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')">✕</span></div><div class="modal-body"><div style="font-size:13px;color:var(--text)">Are you sure you want to set <strong>' +
      user.name +
      "</strong> to <strong>" +
      nextStatus +
      '?</strong></div></div><div class="modal-footer"><button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')">Cancel</button><button class="btn-send" onclick="confirmToggleStatus()">Confirm</button></div></div></div>';
  }
  if (userMgmtModal.type === "security") {
    h +=
      '<div class="modal-overlay open"><div class="modal" style="max-width:520px"><div class="modal-head"><h3>My Security Settings</h3><span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')">✕</span></div><div class="modal-body"><div class="field"><label>Profile Name</label><input id="um-profile-name" value="' +
      (currentUser.name || "").replace(/"/g, "&quot;") +
      '" placeholder="Enter your profile name"></div><div style="font-size:12px;color:var(--muted)">This setting updates only your current account profile.</div></div><div class="modal-footer"><button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')">Cancel</button><button class="btn-send" onclick="saveMySecuritySettings()">Save Settings</button></div></div></div>';
  }
  return h;
}

function openAccountSettings() {
  var key = getAccountKey();
  pendingProfilePicDataUrl = null;
  var existingPic = PROFILE_PICS[key] || "";

  var email = currentUser.email || "(not set)";
  var username = currentUser.name || "(not set)";

  var html =
    '<div class="modal-overlay open" id="acct-settings-modal">' +
    '<div class="modal" style="max-width:600px">' +
    '<div class="modal-head">' +
    "<h3>Account Settings</h3>" +
    '<span class="modal-close" onclick="closeAccountSettings()">✕</span>' +
    "</div>" +
    '<div class="modal-body">' +
    '<div style="display:flex;gap:1rem;align-items:flex-start;margin-bottom:1rem">' +
    '<div style="width:72px;height:72px;border-radius:50%;border:1px solid var(--border);overflow:hidden;flex-shrink:0;background:#fff;display:flex;align-items:center;justify-content:center">' +
    (existingPic
      ? '<img id="um-acct-pic-preview" src="' +
        existingPic +
        '" alt="Profile" style="width:100%;height:100%;object-fit:cover" />'
      : '<div id="um-acct-pic-preview-fallback" style="font-weight:700;color:var(--navy)">' +
        (currentUser.initial || "U") +
        "</div>") +
    "</div>" +
    '<div style="flex:1">' +
    '<div class="field" style="margin-top:0"><label>Profile Picture</label></div>' +
    '<input type="file" accept="image/*" onchange="handleAccountProfilePic(this)" />' +
    '<div id="um-acct-pic-hint" style="font-size:12px;color:var(--muted);margin-top:.35rem">Upload a JPG/PNG image (saved for this session).</div>' +
    "</div>" +
    "</div>" +
    '<div class="field"><label>Profile Name</label><input id="um-acct-profile-name" value="' +
    username.replace(/"/g, "&quot;") +
    '" /></div>' +
    '<div class="field"><label>Gmail / Username (read-only)</label><input id="um-acct-email" value="' +
    email.replace(/"/g, "&quot;") +
    '" disabled /></div>' +
    '<div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">' +
    '<div class="field"><label style="display:block;font-weight:700;margin-bottom:.35rem">Password</label></div>' +
    '<div class="field" style="margin-top:0">' +
    '<label style="display:flex;align-items:center;gap:.5rem"><input type="radio" name="um-pass-mode" value="manual" checked onchange="setAccountPassMode(\'manual\')" style="width:auto" /> Set new password</label>' +
    "</div>" +
    '<div class="field">' +
    '<label style="display:flex;align-items:center;gap:.5rem"><input type="radio" name="um-pass-mode" value="passwordless" onchange="setAccountPassMode(\'passwordless\')" style="width:auto" /> Reset to passwordless login (no password required)</label>' +
    "</div>" +
    '<div class="field" id="um-pass-manual-wrap">' +
    '<label>New Password</label><input type="password" id="um-acct-new-password" placeholder="Enter new password" />' +
    "</div>" +
    '<div style="font-size:12px;color:var(--muted);margin-top:.4rem">Username/email cannot be changed in this prototype. Password reset choice is UI-only.</div>' +
    "</div>" +
    "</div>" +
    '<div id="um-acct-notice" style="font-size:12px;color:var(--muted);margin-top:.5rem"></div>' +
    '<div class="modal-footer">' +
    '<button class="btn-sec" onclick="closeAccountSettings()">Cancel</button>' +
    '<button class="btn-send" onclick="saveAccountSettings()">Save Changes</button>' +
    "</div>" +
    "</div></div>";

  var container = document.getElementById("global-modal-container");
  if (!container) return;
  container.innerHTML = html;
  document.body.classList.add('modal-open');
  // Set initial manual/passwordless state
  setAccountPassMode("manual");
}

function closeAccountSettings() {
  var container = document.getElementById("global-modal-container");
  if (container) container.innerHTML = "";
  document.body.classList.remove('modal-open');
  pendingProfilePicDataUrl = null;
}

function handleAccountProfilePic(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    pendingProfilePicDataUrl = reader.result;
    var img = document.getElementById("um-acct-pic-preview");
    var fb = document.getElementById("um-acct-pic-preview-fallback");
    if (img) {
      img.src = pendingProfilePicDataUrl;
    } else {
      if (fb) fb.remove();
      var wrap = document.querySelector(
        "#acct-settings-modal .modal-body > div:first-child",
      );
      // Fallback: just refresh the preview block by inserting img.
      // If the above selector fails, the UI still works when saved.
      if (wrap) {
        wrap.innerHTML =
          '<img id="um-acct-pic-preview" src="' +
          pendingProfilePicDataUrl +
          '" alt="Profile" style="width:100%;height:100%;object-fit:cover" />';
      }
    }
  };
  reader.readAsDataURL(file);
}

function setAccountPassMode(mode) {
  var wrap = document.getElementById("um-pass-manual-wrap");
  if (!wrap) return;
  if (mode === "passwordless") {
    wrap.style.display = "none";
  } else {
    wrap.style.display = "block";
  }
}

function saveAccountSettings() {
  var container = document.getElementById("global-modal-container");
  if (!container) return;

  var key = getAccountKey();
  var nameEl = document.getElementById("um-acct-profile-name");
  var newName = (nameEl && nameEl.value ? nameEl.value : "").trim();
  if (!newName) {
    return;
  }

  var modeEl = document.querySelector('input[name="um-pass-mode"]:checked');
  var passMode = modeEl ? modeEl.value : "manual";

  var noticeEl = document.getElementById("um-acct-notice");
  if (noticeEl) noticeEl.textContent = "";

  if (passMode === "manual") {
    var newPassEl = document.getElementById("um-acct-new-password");
    var newPass = (newPassEl && newPassEl.value ? newPassEl.value : "").trim();
    if (!newPass) {
      if (noticeEl)
        noticeEl.textContent =
          "Please enter a new password (or choose passwordless login).";
      return;
    }
    ACCOUNT_SECURITY_META[key] = {
      passwordMode: "required",
      tempPassword: newPass,
    };
  } else {
    // Passwordless login: no password required for this prototype.
    ACCOUNT_SECURITY_META[key] = {
      passwordMode: "passwordless",
      tempPassword: "",
    };
  }

  currentUser.name = newName;
  currentUser.initial = (newName[0] || "U").toUpperCase();

  PROFILE_PICS[key] = pendingProfilePicDataUrl || PROFILE_PICS[key] || "";

  // Update USERS entry so recipient dropdown shows the latest name.
  Object.keys(USERS).forEach(function (k) {
    if (USERS[k].role === currentUser.role) {
      USERS[k].name = newName;
      USERS[k].initial = currentUser.initial;
    }
  });

  // Update display immediately
  showApp();
  closeAccountSettings();
}

function renderSearch() {
  var h =
    '<div class="card mb15"><div class="card-title" style="margin-bottom:1rem">Search Documents</div>';
  h +=
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;margin-bottom:.75rem">';
  h +=
    '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Keyword / Reference</label><input style="width:100%;padding:.5rem .85rem;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none" placeholder="e.g. 2026-04 or memorandum..."></div>';
  h +=
    '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Document Type</label><select style="width:100%;padding:.5rem .85rem;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none"><option>All types</option><option>Memorandum</option><option>Letter</option><option>Endorsement</option><option>Report</option><option>Bill</option></select></div>';
  h +=
    '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Status</label><select style="width:100%;padding:.5rem .85rem;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none"><option>All statuses</option><option>For ARD Clearance</option><option>For RD Approval</option><option>Approved</option><option>Released</option></select></div>';
  h += "</div>";
  h +=
    '<button class="btn-sm primary" style="padding:.5rem 1.5rem">🔍 Search</button></div>';
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Results — all documents</div></div>';
  h +=
    '<table class="doc-table"><thead><tr><th>Reference No.</th><th>Type</th><th>Subject</th><th>From/To</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>';
  DOCS.forEach(function (d) {
    h +=
      '<tr><td style="font-family:monospace;font-size:12px">' +
      d.ref +
      "</td><td>" +
      d.type +
      "</td><td>" +
      d.subject +
      "</td><td>" +
      d.from +
      "</td><td>" +
      d.date +
      "</td><td>" +
      statusPill(d.status) +
      '</td><td><button class="btn-sm" onclick="viewDoc(\'' +
      d.ref +
      "')\">View</button></td></tr>";
  });
  h += "</tbody></table></div>";
  return h;
}

function renderReports() {
  var h = '<div class="section-title">Reports & Analytics</div>';
  h += '<div class="stats-row mb15">';
  h += statCard("📥", "Total Incoming", "142", "This year", "var(--info)");
  h += statCard("📤", "Total Outgoing", "89", "This year", "var(--success)");
  h += statCard(
    "⏳",
    "Avg. Processing",
    "2.4 days",
    "Per document",
    "var(--warn)",
  );
  h += statCard("🗃️", "Archived", "401", "All time", "var(--muted)");
  h += "</div>";
  h +=
    '<div class="grid2"><div class="card"><div class="card-head"><div class="card-title">Documents by Type</div></div>';
  var types = [
    ["Memorandum", 38],
    ["Letter", 29],
    ["Endorsement", 22],
    ["Report", 18],
    ["Bill", 14],
    ["Other", 9],
  ];
  types.forEach(function (t) {
    var w = Math.round((t[1] / 38) * 100);
    h +=
      '<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>' +
      t[0] +
      '</span><span style="font-weight:600">' +
      t[1] +
      '</span></div><div style="height:8px;border-radius:4px;background:var(--border)"><div style="height:8px;border-radius:4px;background:var(--navy3);width:' +
      w +
      '%"></div></div></div>';
  });
  h += "</div>";
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Documents by Division</div></div>';
  var divs = [
    ["Finance and Administrative", 52],
    ["Policy and Planning", 28],
    ["MED", 24],
    ["Development and Research", 20],
    ["Project Dev & Budget", 18],
  ];
  divs.forEach(function (d) {
    var w = Math.round((d[1] / 52) * 100);
    h +=
      '<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>' +
      d[0] +
      '</span><span style="font-weight:600">' +
      d[1] +
      '</span></div><div style="height:8px;border-radius:4px;background:var(--border)"><div style="height:8px;border-radius:4px;background:var(--gold);width:' +
      w +
      '%"></div></div></div>';
  });
  h += "</div></div>";
  h +=
    '<div style="margin-top:1.25rem;display:flex;gap:.5rem"><button class="btn-sm">🖨️ Print Report</button><button class="btn-sm">⬇️ Export PDF</button><button class="btn-sm">⬇️ Export Excel</button></div>';
  return h;
}


function renderArchiveActionsMenu(ref, mode) {
  // mode: "archived" | "released"
  var allowArchive = mode === "released";
  var options = '<option value="">Options</option>';
  options += '<option value="view">View</option>';
  options += '<option value="print">Print</option>';
  if (allowArchive) options += '<option value="archive">Archive</option>';
  else options += '<option value="unarchive">Unarchive</option>';
  options += '<option value="move">Move to Folder</option>';
  var allowStr = allowArchive ? "true" : "false";
  return (
    '<select class="btn-sm primary" onchange="handleArchiveMenu(this,\'' +
    ref +
    "','" +
    allowStr +
    '\')">' +
    options +
    "</select>"
  );
}

function handleArchiveMenu(el, ref, allowArchive) {
  var action = el.value;
  el.value = "";
  if (!action) return;
  if (action === "view") return viewDoc(ref);
  if (action === "print") return printDocument(ref);
  if (action === "archive") return archiveDocument(ref);
  if (action === "unarchive") return unarchiveDocument(ref);
  if (action === "move") return showMoveToFolderDialog(ref);
}

function showMoveToFolderDialog(ref) {
  var doc = getDocByRef(ref);
  if (!doc) return;
  
  var folderOptions = ARCHIVE_FOLDERS.map(f => 
    '<option value="' + f.id + '">' + f.name + '</option>'
  ).join('');
  
  var currentFolder = doc.archiveFolder || "default";
  
  var dialog = document.createElement('div');
  dialog.className = 'modal-overlay open';
  dialog.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-head">
        <h3>Move Document to Folder</h3>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</span>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Document: <strong>${doc.ref}</strong></label>
        </div>
        <div class="field">
          <label>Current Folder:</label>
          <div style="padding: 0.5rem; background: var(--pill); border-radius: 6px; margin-top: 0.25rem;">
            ${ARCHIVE_FOLDERS.find(f => f.id === currentFolder)?.name || 'General Archive'}
          </div>
        </div>
        <div class="field">
          <label>Move to Folder:</label>
          <select id="move-folder-select" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px;">
            ${folderOptions}
          </select>
        </div>
      </div>
      <div class="modal-footer" style="justify-content: flex-end;">
        <button class="btn-sec" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-send" onclick="confirmMoveToFolder('${ref}', this)">Move Document</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  // Set current folder as selected
  dialog.querySelector('#move-folder-select').value = currentFolder;
}

function confirmMoveToFolder(ref, button) {
  var select = document.querySelector('#move-folder-select');
  var folderId = select.value;
  
  if (folderId) {
    moveDocumentToFolder(ref, folderId);
    button.closest('.modal-overlay').remove();
  }
}

function showCreateFolderDialog() {
  var dialog = document.createElement('div');
  dialog.className = 'modal-overlay open';
  dialog.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-head">
        <h3>Create New Archive Folder</h3>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</span>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Folder Name:</label>
          <input type="text" id="new-folder-name" placeholder="Enter folder name" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px;" onkeypress="if(event.key==='Enter') confirmCreateFolder(this)">
        </div>
      </div>
      <div class="modal-footer" style="justify-content: flex-end;">
        <button class="btn-sec" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-send" onclick="confirmCreateFolder(this)">Create Folder</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  // Focus on input
  setTimeout(() => dialog.querySelector('#new-folder-name').focus(), 100);
}

function confirmCreateFolder(button) {
  var input = document.querySelector('#new-folder-name');
  var folderName = input.value.trim();
  
  if (folderName) {
    createArchiveFolder(folderName);
    button.closest('.modal-overlay').remove();
  }
}

function showRenameFolderDialog(folderId, currentName) {
  var dialog = document.createElement('div');
  dialog.className = 'modal-overlay open';
  dialog.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-head">
        <h3>Rename Archive Folder</h3>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</span>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Current Name:</label>
          <div style="padding: 0.5rem; background: var(--pill); border-radius: 6px; margin-bottom: 1rem;">${currentName}</div>
        </div>
        <div class="field">
          <label>New Name:</label>
          <input type="text" id="rename-folder-name" value="${currentName}" placeholder="Enter new folder name" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px;" onkeypress="if(event.key==='Enter') confirmRenameFolder('${folderId}', this)">
        </div>
      </div>
      <div class="modal-footer" style="justify-content: flex-end;">
        <button class="btn-sec" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-send" onclick="confirmRenameFolder('${folderId}', this)">Rename Folder</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  // Focus on input and select text
  setTimeout(() => {
    var input = dialog.querySelector('#rename-folder-name');
    input.focus();
    input.select();
  }, 100);
}

function confirmRenameFolder(folderId, button) {
  var input = document.querySelector('#rename-folder-name');
  var newName = input.value.trim();
  
  if (newName) {
    renameArchiveFolder(folderId, newName);
    button.closest('.modal-overlay').remove();
  }
}

function archiveDocument(ref) {
  var d = getDocByRef(ref);
  if (!d) return;
  if (!isArchiveAllowedForCurrentUser(d)) {
    showError("Access denied. You can only archive documents in your division.");
    return;
  }
  showConfirmDialog({
    variant: "warning",
    title: "Archive this document?",
    message:
      "Reference " +
      ref +
      " will leave the released list and move into Archive. You can restore it later if needed.",
    confirmLabel: "Archive document",
    cancelLabel: "Cancel",
  }).then(function (ok) {
    if (!ok) return;
    d.status = "Archived";
    d.archivedBy = currentUser.name;
    d.archivedDate = formatDateISO(new Date());
    d.archiveFolder = d.archiveFolder || "default";
    showSuccess("Document " + ref + " archived.");
    showPage("archive");
  });
}

function unarchiveDocument(ref) {
  var d = getDocByRef(ref);
  if (!d) return;
  if (!isArchiveAllowedForCurrentUser(d)) {
    showError("Access denied. You can only unarchive documents in your division.");
    return;
  }
  showConfirmDialog({
    variant: "neutral",
    title: "Restore to released?",
    message:
      "Reference " +
      ref +
      " will return to the active released list and leave the archive.",
    confirmLabel: "Restore document",
    cancelLabel: "Cancel",
  }).then(function (ok) {
    if (!ok) return;
    d.status = "Released";
    delete d.archivedBy;
    delete d.archivedDate;
    showSuccess("Document " + ref + " restored to Released.");
    showPage("archive");
  });
}

function isArchiveAllowedForCurrentUser(doc) {
  if (currentUser.role === "admin") return true;
  if (currentUser.role !== "dc") return false;
  return (doc.division || "ORD") === currentUser.division;
}

function createArchiveFolder(folderName) {
  var id = "fld-" + Date.now();
  ARCHIVE_FOLDERS.push({
    id: id,
    name: folderName,
    created: formatDateISO(new Date()),
    createdBy: currentUser.name || "User",
  });
  showSuccess('Folder "' + folderName + '" created.');
  showPage("archive");
}

function renameArchiveFolder(folderId, newName) {
  var folder = ARCHIVE_FOLDERS.find(function (f) {
    return f.id === folderId;
  });
  if (!folder) return;
  folder.name = newName;
  showSuccess('Folder renamed to "' + newName + '".');
  showPage("archive");
}

function moveDocumentToFolder(ref, folderId) {
  var d = getDocByRef(ref);
  if (!d) return;
  d.archiveFolder = folderId;
  showSuccess("Document " + ref + " moved to folder.");
  showPage("archive");
}

function deleteArchiveFolder(folderId) {
  if (folderId === "default") return;
  var folder = ARCHIVE_FOLDERS.find(function (f) {
    return f.id === folderId;
  });
  if (!folder) return;
  var docCount = DOCS.filter(function (d) {
    return (
      d.status === "Archived" && (d.archiveFolder || "default") === folderId
    );
  }).length;
  var folderMsg =
    docCount > 0
      ? docCount +
        " archived document(s) in this folder will be moved to General Archive. The folder itself will be removed."
      : "This folder is empty and will be removed from your archive list.";
  showConfirmDialog({
    variant: "danger",
    title: 'Delete folder "' + folder.name + '"?',
    message: folderMsg,
    detail: "This cannot be undone.",
    confirmLabel: "Delete folder",
    cancelLabel: "Cancel",
  }).then(function (ok) {
    if (!ok) return;
    DOCS.forEach(function (d) {
      if (
        d.status === "Archived" &&
        (d.archiveFolder || "default") === folderId
      ) {
        d.archiveFolder = "default";
      }
    });
    ARCHIVE_FOLDERS = ARCHIVE_FOLDERS.filter(function (f) {
      return f.id !== folderId;
    });
    showSuccess('Folder "' + folder.name + '" deleted.');
    showPage("archive");
  });
}

function renderArchive() {
  if (currentUser.role !== "admin" && currentUser.role !== "dc") {
    return (
      '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">' +
      "Archive management is available for Admin and Division Chief." +
      "</div>"
    );
  }

  var h = "";
  
  // Archive Folders Section
  h += '<div class="card mb15"><div class="card-head"><div class="card-title">Archive Folders</div>';
  h += '<div class="card-action"><button class="btn-sm" onclick="showCreateFolderDialog()">+ New Folder</button></div></div>';
  h += '<div class="folder-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: 1rem;">';
  
  ARCHIVE_FOLDERS.forEach(function(folder) {
    var docCount = DOCS.filter(d => d.status === "Archived" && d.archiveFolder === folder.id).length;
    var isDefault = folder.id === "default";
    
    h += '<div class="folder-card" style="border: 1px solid var(--border); border-radius: 8px; padding: 1rem; cursor: pointer; background: var(--pill);">';
    h += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">';
    h += '<div style="display: flex; align-items: center; gap: 0.5rem;">';
    h += '<span style="font-size: 24px;">📁</span>';
    h += '<div>';
    h += '<div style="font-weight: 600; color: var(--navy);">' + folder.name + '</div>';
    h += '<div style="font-size: 12px; color: var(--muted);">' + docCount + ' documents</div>';
    h += '</div></div>';
    
    if (!isDefault) {
      h += '<div style="display: flex; gap: 0.25rem;">';
      h += '<button class="btn-sm" onclick="event.stopPropagation(); showRenameFolderDialog(\'' + folder.id + '\', \'' + folder.name + '\')" style="padding: 0.25rem 0.5rem;">✏️</button>';
      h += '<button class="btn-sm danger" onclick="event.stopPropagation(); deleteArchiveFolder(\'' + folder.id + '\')" style="padding: 0.25rem 0.5rem;">🗑️</button>';
      h += '</div>';
    }
    
    h += '</div>';
    h += '<div style="font-size: 11px; color: var(--muted); margin-top: 0.5rem;">';
    h += 'Created: ' + folder.created + ' by ' + folder.createdBy;
    h += '</div>';
    h += '</div>';
  });
  
  h += '</div></div>';

  // Filter documents by current user's access
  var archived = DOCS.filter(function (d) {
    if (d.status !== "Archived") return false;
    if (currentUser.role === "admin") return true;
    return (d.division || "ORD") === currentUser.division;
  });

  var released = DOCS.filter(function (d) {
    if (d.status !== "Released") return false;
    if (currentUser.role === "admin") return true;
    return (d.division || "ORD") === currentUser.division;
  });

  // Group archived documents by folder
  var archivedByFolder = {};
  ARCHIVE_FOLDERS.forEach(function(folder) {
    archivedByFolder[folder.id] = archived.filter(d => (d.archiveFolder || "default") === folder.id);
  });

  // Display archived documents by folder
  ARCHIVE_FOLDERS.forEach(function(folder) {
    var docsInFolder = archivedByFolder[folder.id];
    if (docsInFolder.length === 0) return;
    
    h += '<div class="card mb15"><div class="card-head"><div class="card-title">' + folder.name + '</div>';
    h += '<div style="font-size:12px;color:var(--muted)">' + docsInFolder.length + ' records</div></div>';
    h += '<table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Archived Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    
    docsInFolder.forEach(function (d) {
      h +=
        '<tr><td style="font-family:monospace;font-size:12px">' +
        d.ref +
        "</td><td>" +
        d.subject +
        '</td><td style="font-size:12px;color:var(--muted)">' +
        (d.archivedDate || "-") +
        "</td><td>" +
        statusPill(d.status) +
        "</td><td>" +
        renderArchiveActionsMenu(d.ref, "archived") +
        "</td></tr>";
    });
    h += "</tbody></table></div>";
  });

  // Ready to Archive section
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Ready to Archive</div><div style="font-size:12px;color:var(--muted)">' +
    released.length +
    " records</div></div>";
  h +=
    '<table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  released.forEach(function (d) {
    h +=
      '<tr><td style="font-family:monospace;font-size:12px">' +
      d.ref +
      "</td><td>" +
      d.subject +
      '</td><td style="font-size:12px;color:var(--muted)">' +
      d.date +
      "</td><td>" +
      statusPill(d.status) +
      "</td><td>" +
      renderArchiveActionsMenu(d.ref, "released") +
      "</td></tr>";
  });
  h += "</tbody></table></div>";

  return h;
}

function viewDoc(ref) {
  var d = DOCS.find(function (x) {
    return x.ref === ref;
  });
  if (!d) return;
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }
  var c = document.getElementById("main-content");
  c.innerHTML =
    '<button class="btn-sm" onclick="showPage(currentPage)" style="margin-bottom:1rem">← Back</button>' +
    '<div class="section-title">Document Detail</div>' +
    '<div class="doc-view-card">' +
    '<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-family:monospace;font-size:18px;font-weight:700;color:var(--navy)">' +
    d.ref +
    '</div><div style="font-size:13px;color:var(--muted);margin-top:2px">' +
    d.type +
    (d.conf ? ' · <span class="pill pill-red">CONFIDENTIAL</span>' : "") +
    "</div></div>" +
    statusPill(d.status) +
    "</div>" +
    '<div style="border-top:1px solid var(--border);padding-top:1rem"><div class="doc-meta-grid">' +
    '<div class="meta-item"><label>Subject</label><span>' +
    d.subject +
    "</span></div>" +
    '<div class="meta-item"><label>From</label><span>' +
    d.from +
    "</span></div>" +
    '<div class="meta-item"><label>To / Routed To</label><span>' +
    d.to +
    "</span></div>" +
    '<div class="meta-item"><label>Date Received</label><span>' +
    d.date +
    "</span></div>" +
    '<div class="meta-item"><label>Document Kind</label><span style="text-transform:capitalize">' +
    d.kind +
    "</span></div>" +
    '<div class="meta-item"><label>Physical Copy</label><span>' +
    (d.ref.endsWith("0") ? "Yes" : "No") +
    "</span></div>" +
    "</div></div>" +
    '<div style="border-top:1px solid var(--border);padding-top:1rem"><div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:.75rem">Routing History</div>' +
    '<div class="timeline">' +
    tlItem(true, "Received by ORD (Sir Harry)", "Apr 28, 2026 - 8:30 AM") +
    tlItem(true, "Forwarded to ARD for clearance", "Apr 28, 2026 - 9:00 AM") +
    (d.status === "For ARD Clearance"
      ? tlItem(false, "ARD endorsement pending", "-")
      : tlItem(
          true,
          "ARD cleared — forwarded to RD",
          "Apr 28, 2026 - 10:00 AM",
        )) +
    (d.status.includes("RD") || d.status === "For ARD Clearance"
      ? tlItem(false, "RD approval pending", "-")
      : tlItem(true, "RD approved", "Apr 28, 2026 - 11:00 AM")) +
    (d.status === "Released"
      ? tlItem(true, "Released by ORD", "Apr 28, 2026 - 2:00 PM")
      : tlItem(false, "Pending release", "-")) +
    "</div></div>" +
    '<div style="display:flex;gap:.5rem;border-top:1px solid var(--border);padding-top:1rem">' +
    (currentUser.role !== "staff"
      ? '<button class="btn-sm primary" onclick="showSuccess(\'Action recorded\')">Approve</button><button class="btn-sm" onclick="showInfo(\'Returned for revision\')">Return</button>'
      : "") +
    '<button class="btn-sm" onclick="openCompose()">Forward</button>' +
    '<button class="btn-sm" onclick="showInfo(\'File preview would open here\')">View File</button>' +
    '<button class="btn-sm" onclick="showSuccess(\'Printed\')">Print</button>' +
    "</div>" +
    "</div>";
}

function printDocument(ref) {
  var d = getDocByRef(ref);
  if (!d) {
    showError("Document not found.");
    return;
  }
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }
  var printWin = window.open("", "_blank", "width=900,height=700");
  if (!printWin) {
    showWarning("Please allow pop-ups to print this document.");
    return;
  }
  var html = [
    "<!doctype html>",
    '<html><head><meta charset="utf-8">',
    "<title>Print " + escapeHtml(d.ref) + "</title>",
    "<style>",
    "body{font-family:Arial,sans-serif;padding:24px;color:#1f2937}",
    "h1{font-size:20px;margin:0 0 12px}",
    "table{width:100%;border-collapse:collapse}",
    "td{padding:8px;border:1px solid #d1d5db;vertical-align:top}",
    "td:first-child{width:180px;font-weight:700;background:#f8fafc}",
    "</style></head><body>",
    "<h1>Document " + escapeHtml(d.ref) + "</h1>",
    "<table>",
    "<tr><td>Subject</td><td>" + escapeHtml(d.subject) + "</td></tr>",
    "<tr><td>Type</td><td>" + escapeHtml(d.type) + "</td></tr>",
    "<tr><td>Direction</td><td>" + escapeHtml(d.kind) + "</td></tr>",
    "<tr><td>From</td><td>" + escapeHtml(d.from) + "</td></tr>",
    "<tr><td>To / Routed To</td><td>" + escapeHtml(d.to) + "</td></tr>",
    "<tr><td>Date</td><td>" + escapeHtml(d.date) + "</td></tr>",
    "<tr><td>Status</td><td>" + escapeHtml(d.status) + "</td></tr>",
    "</table></body></html>",
  ].join("");
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  printWin.print();
}

function tlItem(done, label, time) {
  var weight = done ? "600" : "400";
  var dotClass = done ? "done" : "";
  return (
    '<div class="tl-item"><div class="tl-dot ' +
    dotClass +
    '"></div><div><div style="font-size:13px;font-weight:' +
    weight +
    '">' +
    label +
    '</div><div style="font-size:11px;color:var(--muted)">' +
    time +
    "</div></div></div>"
  );
}

function openCompose() {
  const modal = document.getElementById('compose-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.classList.add('modal-open');  /* ← NEW */
  }
}
function closeCompose() {
  const modal = document.getElementById('compose-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');  /* ← NEW */
  }
}
function sendDoc() {
  var to = (document.getElementById("compose-to").value || "").trim();
  var subject = (document.getElementById("compose-subject").value || "").trim();
  showSuccess(
    "Document sent to users successfully." +
      (to ? " Recipient: " + to + "." : "") +
      (subject ? " Subject: " + subject + "." : ""),
  );
  closeCompose();
}

function openManualLogbook(defaultSubject) {
  currentLogbookEditRef = null;
  var today = formatDateISO(new Date());
  var ref = nextSystemReference(today);
  document.getElementById("manual-logbook-modal").classList.add("open");
  document.querySelector("#manual-logbook-modal h3").textContent =
    "Manual Logbook Entry";
  document.querySelector("#manual-logbook-modal .btn-send").textContent =
    "Save Logbook Entry";
  document.getElementById("manual-ref").value = ref;
  document.getElementById("manual-date").value = today;
  document.getElementById("manual-kind").value = "incoming";
  document.getElementById("manual-type").value = "";
  document.getElementById("manual-from").value =
    currentUser.division || currentUser.name;
  document.getElementById("manual-subject").value = defaultSubject || "";
  document.getElementById("manual-to").value = "ORD";
  document.getElementById("manual-status").value = "For ARD Clearance";
  document.getElementById("manual-physical").value = "no";
  document.body.classList.add('modal-open');  /* ← NEW */
}

function closeManualLogbook() {
   const modal = document.getElementById('manual-logbook-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');  /* ← NEW */
  }
}

function openQuickSend(ref) {
  var d = getDocByRef(ref);
  if (!d) {
    showError("Document not found.");
    return;
  }
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }
  currentQuickSendRef = ref;
  document.getElementById("quick-send-title").textContent =
    "Send Document " + ref;
  document.getElementById("quick-send-to").value = d.to || "";
  document.getElementById("quick-send-remarks").value = d.sendRemarks || "";
  document.getElementById("quick-send-modal").classList.add("open");
  document.body.classList.add("modal-open");  /* ← NEW */
}

function closeQuickSend() {
  document.getElementById("quick-send-modal").classList.remove("open");
  document.body.classList.remove("modal-open");  /* ← NEW */
}

function submitQuickSend() {
  if (!currentQuickSendRef) return;
  var d = getDocByRef(currentQuickSendRef);
  if (!d) return;
  var to = (document.getElementById("quick-send-to").value || "").trim();
  var remarks = (
    document.getElementById("quick-send-remarks").value || ""
  ).trim();
  if (!to) {
    showError("Please fill in where to send the document.");
    return;
  }

  d.to = to;
  d.sendRemarks = remarks;
  d.status = "Sent to " + to;
  d.lastSentBy = currentUser.name;
  d.lastSentDate = formatDateISO(new Date());

  closeQuickSend();
  showSuccess(
    "Document " + currentQuickSendRef + " sent successfully to " + to + ".",
  );
  showPage(currentPage);
}

function openLogbookEdit(ref) {
  var d = getDocByRef(ref);
  if (!d) return;
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }
  currentLogbookEditRef = ref;
  document.getElementById("manual-logbook-modal").classList.add("open");
  document.querySelector("#manual-logbook-modal h3").textContent =
    "Edit Logbook Entry " + ref;
  document.querySelector("#manual-logbook-modal .btn-send").textContent =
    "Update Logbook Entry";
  document.getElementById("manual-ref").value = d.ref;
  document.getElementById("manual-date").value = d.date;
  document.getElementById("manual-kind").value = d.kind || "incoming";
  document.getElementById("manual-type").value = d.type || "";
  document.getElementById("manual-from").value = d.from || "";
  document.getElementById("manual-subject").value = d.subject || "";
  document.getElementById("manual-to").value = d.to || "";
  document.getElementById("manual-status").value =
    d.status || "For ARD Clearance";
  document.getElementById("manual-physical").value = d.physicalCopy
    ? "yes"
    : "no";
  document.body.classList.add('modal-open');
}

function openUploadDialog() {
  document.getElementById("local-upload-input").click();
  
}

function openOCRDialog() {
  // Open the advanced OCR scanner modal instead of simple file input
  document.getElementById("ocr-scanner-modal").classList.add("open");
  detectScanners(); // Auto-detect scanners on open
  document.body.classList.add("modal-open");  /* ← NEW */
  
}

function handleLocalUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  pendingImportType = "upload";
  pendingUploadFileName = file.name;
  document.getElementById("upload-file-name").textContent = file.name;
  var h3 = document.querySelector("#upload-encode-modal h3");
  if (h3) h3.textContent = "Upload Complete";
  document.getElementById("upload-encode-modal").classList.add("open");
  document.body.classList.add('modal-open');
  input.value = "";
}

function handleOCRUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  pendingImportType = "ocr";
  pendingUploadFileName = file.name;
  var h3 = document.querySelector("#upload-encode-modal h3");
  if (h3) h3.textContent = "OCR Scan Complete";
  var msg = document.querySelector("#upload-encode-modal .upload-alert-msg");
  if (msg) {
    msg.innerHTML =
      'Do you want to automatically encode this OCR scanned document in the Document Logbook? <span class="upload-alert-file" id="upload-file-name"></span>';
    var span = document.getElementById("upload-file-name");
    if (span) span.textContent = file.name;
  }
  document.getElementById("upload-encode-modal").classList.add("open");
  document.body.classList.add('modal-open');
  input.value = "";
}

function closeUploadEncodeModal() {
  document.getElementById("upload-encode-modal").classList.remove("open");
  document.body.classList.remove('modal-open');
}

function submitUploadEncodeChoice(autoEncode) {
  if (!pendingUploadFileName) {
    closeUploadEncodeModal();
    return;
  }
  var fileName = pendingUploadFileName;
  var importType = pendingImportType;
  var displayTitle =
    importType === "ocr" ? "OCR Scanned: " + fileName : "Uploaded: " + fileName;
  closeUploadEncodeModal();
  if (autoEncode) {
    var today = formatDateISO(new Date());
    var ref = nextSystemReference(today);
    DOCS.unshift({
      ref: ref,
      type: importType === "ocr" ? "OCR Scanned Document" : "Uploaded File",
      from: currentUser.name,
      to: currentUser.division || "ORD",
      subject: displayTitle,
      status: "For ARD Clearance",
      date: today,
      conf: false,
      kind: "incoming",
      physicalCopy: false,
      division: currentUser.division || "ORD",
      content:
        importType === "ocr"
          ? "OCR extracted content placeholder for: " + fileName
          : "Local upload file: " + fileName,
    });
    showSuccess(
      (importType === "ocr"
        ? "OCR scanned document encoded to logbook. Ref: "
        : "Document uploaded and automatically encoded to logbook. Ref: ") +
        ref,
    );
    showPage("logbook");
  } else {
    openManualLogbook(displayTitle);
  }
  pendingUploadFileName = "";
  pendingImportType = "upload";
}

function deleteLogbookEntry(ref) {
  var d = getDocByRef(ref);
  if (!d) {
    showError("Document not found.");
    return;
  }
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }
  showConfirmDialog({
    variant: "danger",
    title: "Delete logbook entry?",
    message:
      "Permanently remove reference " +
      ref +
      " from the logbook. Routing history and metadata for this row will be gone from this DMS.",
    detail: "This action cannot be undone.",
    confirmLabel: "Delete entry",
    cancelLabel: "Keep entry",
  }).then(function (ok) {
    if (!ok) return;
    DOCS = DOCS.filter(function (x) {
      return x.ref !== ref;
    });
    registerExistingReferences();
    showSuccess("Document entry deleted: " + ref);
    showPage("logbook");
  });
}

function openEditor(ref) {
  var d = getDocByRef(ref);
  if (!d) {
    showError("Document not found.");
    return;
  }
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }
  currentEditingRef = ref;
  document.getElementById("editor-title").textContent = "Edit Document " + ref;
  document.getElementById("editor-meta").textContent =
    "Type: " +
    d.type +
    " | Subject: " +
    d.subject +
    " | Accessible editing tools: Word, Excel, PowerPoint, General";
  document.getElementById("editor-content").value =
    d.content ||
    "Document content for " +
      ref +
      "\n\nSubject: " +
      d.subject +
      "\n\n(You can edit this content and save it in-system.)";
  document.getElementById("editor-modal").classList.add("open");
  document.body.classList.add('modal-open');
}

function closeEditor() {
  document.getElementById("editor-modal").classList.remove("open");
  document.body.classList.remove('modal-open');
  
  
}

function saveEditor() {
  if (!currentEditingRef) return;
  var d = getDocByRef(currentEditingRef);
  if (!d) return;
  d.content = document.getElementById("editor-content").value;
  d.lastEditedBy = currentUser.name;
  d.editTool = document.getElementById("editor-tool").value;
  showSuccess(
    "Document " +
      currentEditingRef +
      " updated inside the system using " +
      d.editTool +
      ".",
  );
  closeEditor();
}

function saveManualLogbook() {
  var ref = document.getElementById("manual-ref").value.trim();
  var kind = document.getElementById("manual-kind").value;
  var date = document.getElementById("manual-date").value;
  var type = document.getElementById("manual-type").value.trim();
  var from = document.getElementById("manual-from").value.trim();
  var subject = document.getElementById("manual-subject").value.trim();
  var to = document.getElementById("manual-to").value.trim();
  var status = document.getElementById("manual-status").value;
  var physicalCopy = document.getElementById("manual-physical").value === "yes";

  if (!date || !type || !from || !subject || !to) {
    showError("Please fill out all required manual logbook fields.");
    return;
  }

  if (currentLogbookEditRef) {
    var d = getDocByRef(currentLogbookEditRef);
    if (!d) return;
    d.type = type;
    d.from = from;
    d.to = to;
    d.subject = subject;
    d.status = status;
    d.date = date;
    d.kind = kind;
    d.physicalCopy = physicalCopy;
    d.lastEditedBy = currentUser.name;
    closeManualLogbook();
    showSuccess("Logbook entry updated: " + currentLogbookEditRef);
  } else {
    DOCS.unshift({
      ref: ref,
      type: type,
      from: from,
      to: to,
      subject: subject,
      status: status,
      date: date,
      conf: false,
      kind: kind,
      physicalCopy: physicalCopy,
      division: currentUser.division || "ORD",
    });
    closeManualLogbook();
    showSuccess("Manual logbook entry added with reference: " + ref);
  }
  showPage("logbook");
}
function toggleNotif() {
  document.getElementById("notif-panel").classList.toggle("open");
}
function closeNotif() {
  document.getElementById("notif-panel").classList.remove("open");
  
  
}
function setTab(el, t) {
  el.parentNode.querySelectorAll(".tab").forEach(function (x) {
    x.classList.remove("active");
  });
  el.classList.add("active");
}
function renderChatContacts() {
  var listEl = document.getElementById("chat-contacts-list");
  if (!listEl) return;
  var contacts = window.__chat_contacts || [];
  var q = (window.__chat_contact_query || "").toLowerCase().trim();

  // Clear first
  listEl.innerHTML = "";

  contacts.forEach(function (c) {
    var nameMatch = c.name && c.name.toLowerCase().includes(q);
    var emailMatch = c.email && c.email.toLowerCase().includes(q);
    var pass = !q || nameMatch || emailMatch;
    if (!pass) return;

    var thread = CHAT_THREADS[c.id] || [];
    var last = thread.length ? thread[thread.length - 1] : null;
    var lastText = last ? escapeHtml(last.text) : "Start the conversation...";
    var lastTime = last ? last.time : "";

    var active = c.id === currentChatContactId ? "background:var(--pill)" : "";
    var el = document.createElement("div");
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.gap = ".75rem";
    el.style.padding = ".75rem";
    el.style.borderRadius = "10px";
    el.style.cursor = "pointer";
    el.style.marginBottom = "2px";
    el.setAttribute("data-chat-id", c.id);
    el.onclick = function () {
      selectChat(c.id);
    };
    if (active) el.style.background = "var(--pill)";

    el.innerHTML =
      '<div style="width:40px;height:40px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">' +
      (c.name[0] || "U") +
      "</div>" +
      '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between">' +
      '<span style="font-size:13px;font-weight:600">' +
      (c.name || "") +
      '</span><span style="font-size:11px;color:var(--muted)">' +
      (lastTime || "") +
      "</span></div>" +
      '<div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
      lastText +
      "</div></div>";

    // Unread badge mock: show badge if there are messages and last message is not "me"
    if (thread.length && thread[thread.length - 1].me === false && !active) {
      el.innerHTML =
        el.innerHTML +
        '<div style="background:var(--navy3);color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-left:auto">1</div>';
    }

    listEl.appendChild(el);
  });

  if (!listEl.children.length) {
    listEl.innerHTML =
      '<div style="font-size:12px;color:var(--muted);padding:.75rem">No matching users.</div>';
  }
}

function filterChatContacts(q) {
  window.__chat_contact_query = q || "";
  renderChatContacts();
}

function renderChatThread(contactId) {
  var chatEl = document.getElementById("chat-messages");
  if (!chatEl) return;
  var thread = CHAT_THREADS[contactId] || [];
  chatEl.innerHTML = "";

  if (!thread.length) {
    var contacts = window.__chat_contacts || [];
    var c = contacts.find(function (x) {
      return x.id === contactId;
    });
    var name = c ? c.name : "person";
    chatEl.innerHTML =
      '<div style="font-size:12px;color:var(--muted);padding:1rem">No messages yet. Say hi to ' +
      escapeHtml(name) +
      ".</div>";
    return;
  }

  thread.forEach(function (m) {
    chatEl.innerHTML =
      chatEl.innerHTML +
      '<div class="chat-bubble ' +
      (m.me ? "me" : "them") +
      '"><div class="bubble-text">' +
      escapeHtml(m.text) +
      '</div><div class="bubble-meta">' +
      (m.time || "") +
      "</div></div>";
  });
}

function selectChat(contactId) {
  currentChatContactId = contactId;
  var title = document.getElementById("chat-thread-title");
  var contacts = window.__chat_contacts || [];
  var c = contacts.find(function (x) {
    return x.id === contactId;
  });
  if (title) title.textContent = c ? c.name : "Chat";
  var searchEl = document.getElementById("chat-user-search");
  if (searchEl && c) searchEl.value = c.name;
  renderChatContacts();
  renderChatThread(contactId);
}

function sendChat() {
  var el = document.getElementById("chat-in");
  if (!el) return;
  var text = (el.value || "").trim();
  if (!text) return;
  if (!currentChatContactId) {
    showWarning("Please select a person to chat with.");
    return;
  }

  var now = new Date();
  var time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  var msg = { me: true, text: text, time: time };
  if (!CHAT_THREADS[currentChatContactId])
    CHAT_THREADS[currentChatContactId] = [];
  CHAT_THREADS[currentChatContactId].push(msg);

  el.value = "";
  renderChatThread(currentChatContactId);
  // Refresh contact list to update preview/time
  renderChatContacts();
}
function doSearch(v) {
  if (v.length > 1) {
    showPage("search");
  }
}
function onRoleChange(v) {
  var box = document.getElementById("div-select-box");
  if (["dc", "supervisor", "staff"].includes(v)) {
    box.classList.add("show");
  } else {
    box.classList.remove("show");
  }
}
document.addEventListener("click", function (e) {
  var p = document.getElementById("notif-panel");
  if (
    p &&
    p.classList.contains("open") &&
    !p.contains(e.target) &&
    !e.target.closest(".icon-btn")
  ) {
    p.classList.remove("open");
  }
});

registerExistingReferences();

// ===== OCR SCANNER FUNCTIONS =====

var detectedScanners = [];
var currentScanData = null;
var isScanning = false;

function closeOCRScanner() {
  document.getElementById("ocr-scanner-modal").classList.remove("open");
  resetScannerState();
  document.body.classList.remove('modal-open');
  
}

function resetScannerState() {
  isScanning = false;
  currentScanData = null;
  document.getElementById("scan-preview").innerHTML = `
      <div style="font-size: 48px; margin-bottom: 1rem; opacity: 0.3;">📷</div>
      <div style="color: var(--muted); font-size: 14px;">No document scanned yet</div>
      <div style="color: var(--muted); font-size: 12px; margin-top: 0.5rem;">Click "Start Scanning" to begin</div>
    `;
  document.getElementById("ocr-results-section").style.display = "none";
  document.getElementById("ocr-extracted-text").value = "";
  document.getElementById("start-scan-btn").textContent = "📷 Start Scanning";
  document.getElementById("start-scan-btn").disabled = false;
}

function detectScanners() {
  var statusDiv = document.getElementById("scanner-status");
  statusDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--muted);">
        <span>🔍</span>
        <span>Searching for connected scanners...</span>
      </div>
    `;

  // Simulate scanner detection (in real implementation, this would use TWAIN/WIA/Scanner APIs)
  setTimeout(function () {
    detectedScanners = [
      {
        name: "Canon PIXMA MG3620",
        type: "flatbed",
        status: "ready",
        connection: "USB",
      },
      {
        name: "HP OfficeJet Pro 9015",
        type: "adf",
        status: "ready",
        connection: "Network",
      },
      {
        name: "Epson WorkForce ES-500W",
        type: "adf",
        status: "ready",
        connection: "WiFi",
      },
    ];

    var scannerList = detectedScanners
      .map(function (scanner) {
        var statusIcon = scanner.status === "ready" ? "✅" : "⚠️";
        var typeIcon = scanner.type === "flatbed" ? "📄" : "📋";
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 0.5rem; background: #fff;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${typeIcon}</span>
              <div>
                <div style="font-weight: 600; font-size: 13px;">${scanner.name}</div>
                <div style="font-size: 11px; color: var(--muted);">${scanner.connection} • ${scanner.type}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${statusIcon}
              <button class="btn-sm" onclick="selectScanner('${scanner.name}')">Select</button>
            </div>
          </div>
        `;
      })
      .join("");

    statusDiv.innerHTML = `
        <div style="margin-bottom: 0.5rem; font-weight: 600; color: var(--navy);">Found ${detectedScanners.length} scanner(s):</div>
        ${scannerList}
        <div style="margin-top: 1rem; font-size: 12px; color: var(--muted);">
          💡 Tip: Make sure your scanner is powered on and connected to use OCR scanning.
        </div>
      `;
  }, 1500);
}

function selectScanner(scannerName) {
  var statusDiv = document.getElementById("scanner-status");
  var selectedScanner = detectedScanners.find((s) => s.name === scannerName);

  if (selectedScanner) {
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #e6f9f1; border: 1px solid var(--success); border-radius: 6px;">
          <span style="color: var(--success);">✅</span>
          <div>
            <div style="font-weight: 600; color: var(--success);">Selected: ${selectedScanner.name}</div>
            <div style="font-size: 12px; color: var(--muted);">Ready to scan • ${selectedScanner.connection}</div>
          </div>
        </div>
      `;

    // Update scan source based on scanner type
    var scanSource = document.getElementById("scan-source");
    for (var i = 0; i < scanSource.options.length; i++) {
      if (scanSource.options[i].value === selectedScanner.type) {
        scanSource.selectedIndex = i;
        break;
      }
    }
  }
}

function updateScanSettings() {
  var source = document.getElementById("scan-source").value;
  var resolution = document.getElementById("scan-resolution").value;
  var color = document.getElementById("scan-color").value;

  // In a real implementation, these would configure the scanner driver
  console.log("Scan settings updated:", { source, resolution, color });
}

function startScanning() {
  if (isScanning) return;

  isScanning = true;
  var scanBtn = document.getElementById("start-scan-btn");
  var previewDiv = document.getElementById("scan-preview");

  scanBtn.textContent = "⏳ Scanning...";
  scanBtn.disabled = true;

  // Show scanning animation
  previewDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 48px; margin-bottom: 1rem; animation: pulse 1.5s infinite;">📷</div>
        <div style="color: var(--navy); font-weight: 600; margin-bottom: 0.5rem;">Scanning document...</div>
        <div style="color: var(--muted); font-size: 12px;">Please wait, this may take a few seconds</div>
        <div style="width: 200px; height: 4px; background: var(--border); border-radius: 2px; margin-top: 1rem; overflow: hidden;">
          <div style="width: 0%; height: 100%; background: var(--navy3); animation: scanProgress 3s ease-out forwards;"></div>
        </div>
      </div>
    `;

  // Simulate scanning process
  setTimeout(function () {
    // Generate a sample scanned image (in real implementation, this would come from the scanner)
    var canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    var ctx = canvas.getContext("2d");

    // Create a simple document preview
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;

    // Draw document lines
    for (var i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(50, 100 + i * 30);
      ctx.lineTo(550, 100 + i * 30);
      ctx.stroke();
    }

    // Add some sample text
    ctx.fillStyle = "#333333";
    ctx.font = "14px Arial";
    ctx.fillText("DEPARTMENT OF EDUCATION", 50, 80);
    ctx.font = "12px Arial";
    ctx.fillText("Central Visayas Region", 50, 100);
    ctx.fillText("Document Management System", 50, 120);

    // Convert to image
    var scannedImage = canvas.toDataURL("image/png");
    currentScanData = scannedImage;

    // Show preview
    previewDiv.innerHTML = `
        <div style="position: relative;">
          <img src="${scannedImage}" style="max-width: 100%; max-height: 300px; border: 1px solid var(--border); border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="position: absolute; top: 10px; right: 10px; background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
            ✅ Scan Complete
          </div>
        </div>
      `;

    // Start OCR processing
    setTimeout(function () {
      processOCR(scannedImage);
    }, 500);
  }, 3000);
}

function processOCR(imageData) {
  var ocrSection = document.getElementById("ocr-results-section");
  var ocrText = document.getElementById("ocr-extracted-text");

  ocrSection.style.display = "block";
  ocrText.value = "🔍 Performing OCR analysis...";

  // Simulate OCR processing
  setTimeout(function () {
    var language = document.getElementById("ocr-language").value;
    var autoEnhance = document.getElementById("ocr-auto-enhance").checked;

    // Sample OCR result (in real implementation, this would use Tesseract.js or server-side OCR)
    var sampleText = `DEPARTMENT OF EDUCATION
Central Visayas Region
Office of the Regional Director

DATE: April 28, 2026
REFERENCE: 2026-04-181

SUBJECT: Implementation of Enhanced Document Management System

This memorandum serves to inform all division chiefs and supervisors regarding full implementation of Enhanced Document Management System (DMS) effective May 1, 2026.

KEY FEATURES:
- Automated document tracking and routing
- OCR scanning capabilities for physical documents
- Role-based access control
- Digital signature integration
- Real-time notification system

All personnel are required to undergo training on the new system by April 30, 2026. Please coordinate with the ICT Division for schedule arrangements.

For inquiries and technical support, please contact:
- ICT Helpdesk: ext. 1234
- Email: dms-support@deped.gov.ph

Approved by:
[SIGNATURE]
HARRY J. VILLANUEVA
Regional Director
`;

    if (autoEnhance) {
      sampleText = sampleText.replace(/\s+/g, " ").trim();
    }

    ocrText.value = sampleText;

    // Show encoding options
    document.getElementById("encoding-options").style.display = "block";

    // Update preview with actual data
    updateAutoEncodePreview();

    // Update modal footer buttons
    updateModalFooter();

    isScanning = false;

    // Show success notification
    showNotification("OCR processing completed successfully!", "success");
  }, 2000);
}

function toggleEncodingOption() {
  var autoOption = document.getElementById("auto-encode").checked;
  var autoPreview = document.getElementById("auto-encode-preview");
  var manualForm = document.getElementById("manual-encode-form");

  if (autoOption) {
    autoPreview.style.display = "block";
    manualForm.style.display = "none";
  } else {
    autoPreview.style.display = "none";
    manualForm.style.display = "block";
  }
}

function updateAutoEncodePreview() {
  var today = formatDateISO(new Date());
  var nextRef = nextSystemReference(today);

  document.getElementById("preview-ref").textContent = nextRef;
  document.getElementById("preview-type").textContent = "OCR Scanned Document";
  document.getElementById("preview-from").textContent = currentUser.name;
  document.getElementById("preview-subject").textContent =
    "Document scanned on " + today;
}

function updateModalFooter() {
  var footer = document.getElementById("ocr-modal-footer");
  footer.innerHTML = `
      <button class="btn-sec" onclick="closeOCRScanner()">Cancel</button>
      <button class="btn-sec" onclick="retryOCR()">🔄 Retry OCR</button>
      <button class="btn-send" onclick="confirmEncoding()">✅ Confirm & Encode to Logbook</button>
    `;
}

function confirmEncoding() {
  var autoEncode = document.getElementById("auto-encode").checked;

  if (autoEncode) {
    // Auto-encode the document
    autoEncodeDocument();
  } else {
    // Validate manual form first
    if (validateManualForm()) {
      manualEncodeDocument();
    }
  }
}

function autoEncodeDocument() {
  var today = formatDateISO(new Date());
  var ref = nextSystemReference(today);
  var ocrText = document.getElementById("ocr-extracted-text").value;

  // Create the document entry
  var newDoc = {
    ref: ref,
    type: "OCR Scanned Document",
    from: currentUser.name,
    to: currentUser.division || "ORD",
    subject: "Document scanned on " + today,
    status: "For Processing",
    date: today,
    conf: false,
    kind: "incoming",
    division: currentUser.division || "ORD",
    physicalCopy: false,
    content: "OCR extracted content: " + ocrText.substring(0, 200) + "...",
  };

  DOCS.unshift(newDoc);

  showNotification(
    "Document automatically encoded to logbook! Reference: " + ref,
    "success",
  );
  closeOCRScanner();
  showPage("logbook");
}

function validateManualForm() {
  var docType = document.getElementById("manual-doc-type").value;
  var direction = document.getElementById("manual-direction").value;
  var from = document.getElementById("manual-from").value.trim();
  var to = document.getElementById("manual-to").value.trim();
  var subject = document.getElementById("manual-subject").value.trim();

  if (!from) {
    showNotification("Please enter the sender/origin", "error");
    return false;
  }

  if (!to) {
    showNotification("Please enter the recipient", "error");
    return false;
  }

  if (!subject) {
    showNotification("Please enter the document subject", "error");
    return false;
  }

  return true;
}

function manualEncodeDocument() {
  var today = formatDateISO(new Date());
  var ref = nextSystemReference(today);
  var ocrText = document.getElementById("ocr-extracted-text").value;

  // Create the document entry with manual details
  var newDoc = {
    ref: ref,
    type: document.getElementById("manual-doc-type").value,
    from: document.getElementById("manual-from").value.trim(),
    to: document.getElementById("manual-to").value.trim(),
    subject: document.getElementById("manual-subject").value.trim(),
    status: "For Processing",
    date: today,
    conf: false,
    kind: document.getElementById("manual-direction").value,
    division: currentUser.division || "ORD",
    physicalCopy: true,
    content:
      "Manual encoding with OCR content: " + ocrText.substring(0, 200) + "...",
    remarks: document.getElementById("manual-remarks").value.trim(),
  };

  DOCS.unshift(newDoc);

  showNotification(
    "Document manually encoded to logbook! Reference: " + ref,
    "success",
  );
  closeOCRScanner();
  showPage("logbook");
}

function copyOCRText() {
  var ocrText = document.getElementById("ocr-extracted-text");
  ocrText.select();
  document.execCommand("copy");
  showNotification("OCR text copied to clipboard!", "success");
}

function editOCRText() {
  var ocrText = document.getElementById("ocr-extracted-text");
  ocrText.focus();
  ocrText.select();
}

function retryOCR() {
  if (currentScanData) {
    processOCR(currentScanData);
  } else {
    showNotification(
      "No scanned image available. Please scan a document first.",
      "error",
    );
  }
}

function showNotification(message, type) {
  type = type || "info";
  if (type === "success") showSuccess(message);
  else if (type === "error") showError(message);
  else if (type === "warning") showWarning(message);
  else showInfo(message);
}

// Add CSS animation for scanning
var style = document.createElement("style");
style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes scanProgress {
      0% { width: 0%; }
      100% { width: 100%; }
    }
  `;
document.head.appendChild(style);

// ========================================
// RESPONSIVE DESIGN CONSISTENCY FUNCTION
// ========================================

function ensureResponsiveConsistency() {
  // Function to maintain consistent layout across all desktop sizes
  function adjustLayoutForScreenSize() {
    const screenWidth = window.innerWidth;
    const authContent = document.querySelector('.auth-content');
    const authFormWrap = document.querySelector('.auth-form-wrap');
    const authBranding = document.querySelector('.auth-branding');
    
    if (authContent && authFormWrap) {
      // Ensure consistent max-width based on screen size
      if (screenWidth >= 1920) {
        authContent.style.maxWidth = '1600px';
        if (authBranding) authBranding.style.flex = '0 0 600px';
      } else if (screenWidth >= 1400) {
        authContent.style.maxWidth = '1400px';
        if (authBranding) authBranding.style.flex = '0 0 500px';
      } else if (screenWidth >= 1025) {
        authContent.style.maxWidth = '1200px';
        authFormWrap.style.flex = '0 0 480px';
      } else if (screenWidth <= 1024) {
        // Mobile/tablet layout handled by CSS
        authContent.style.maxWidth = '';
        authFormWrap.style.flex = '';
      }
    }
    
    // Ensure app shell consistency
    const app = document.querySelector('.app');
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    
    if (app && sidebar && main) {
      if (screenWidth <= 1024) {
        app.style.flexDirection = 'column';
        sidebar.style.width = '100%';
        sidebar.style.height = 'auto';
        main.style.width = '100%';
      } else {
        app.style.flexDirection = '';
        sidebar.style.width = '';
        sidebar.style.height = '';
        main.style.width = '';
      }
    }
  }
  
  // Initial adjustment
  adjustLayoutForScreenSize();
  
  // Listen for window resize
  window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(adjustLayoutForScreenSize, 100);
  });
  
  // Listen for orientation change
  window.addEventListener('orientationchange', function() {
    setTimeout(adjustLayoutForScreenSize, 200);
  });
}

// Initialize responsive consistency when DOM is ready
document.addEventListener('DOMContentLoaded', ensureResponsiveConsistency);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureResponsiveConsistency);
} else {
  ensureResponsiveConsistency();
}

