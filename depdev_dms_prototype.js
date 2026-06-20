var currentUser = { role: "admin", name: "Sir Harry", division: null };
var currentPage = "dashboard";

const announcements = [
  {
    id: 1,
    title: "Quarterly Staff Meeting",
    content: "All personnel are required to attend the quarterly staff meeting.",
    postedBy: "System Administrator",
    priority: "Important",
    pinned: true,
    datePosted: "2026-06-15"
  },
  {
    id: 2,
    title: "New Memorandum Released",
    content: "Memorandum No. 2026-015 has been officially released.",
    postedBy: "Regional Director",
    priority: "Normal",
    pinned: false,
    datePosted: "2026-06-12"
  }
];
var REF_COUNTER_BY_MONTH = {};
var currentEditingRef = null;
var currentLogbookEditRef = null;
var pendingUploadFileName = "";
var pendingImportType = "upload"; // "upload" | "ocr"
var currentLogbookView = "global"; // "global" | "division" | "user"
var currentLogbookDivision = null; // Current division being viewed
var currentLogbookUser = null; // Current user being viewed
var currentQuickSendRef = null;
var userMgmtModal = { type: null, userId: null, resetMode: "manual" };
var userMgmtNotice = "";
var ACCOUNT_SECURITY_META = {};
var PROFILE_PICS = {};
var pendingProfilePicDataUrl = null;
var currentArchiveFolderId = null;

// Archive folders structure
var ARCHIVE_FOLDERS = [
  {
    id: "default",
    name: "General Archive",
    created: "2026-01-01",
    createdBy: "System",
  },
  {
    id: "memorandum",
    name: "Memorandums",
    created: "2026-01-15",
    createdBy: "Admin",
  },
  { id: "reports", name: "Reports", created: "2026-02-01", createdBy: "Admin" },
  { id: "letters", name: "Letters", created: "2026-02-15", createdBy: "Admin" },
];

// Division structure for admin logbook view
var DIVISIONS = [
  { id: "med", name: "Monitoring and Evaluation Division", shortName: "MED" },
  {
    id: "pfp",
    name: "Policy Formulation and Planning Division",
    shortName: "PFP",
  },
  {
    id: "pdip",
    name: "Project Development, Investment Programming and Budget Division",
    shortName: "PDIP",
  },
  { id: "drd", name: "Development and Research Division", shortName: "DRD" },
  { id: "fad", name: "Finance and Administrative Division", shortName: "FAD" },
  { id: "ord", name: "Office of the Regional Director", shortName: "ORD" },
];

/* ========= LOADING STATE ========= */

function showLoading(show) {
  const loader = document.getElementById("loader");
  if (loader) {
    if (show) {
      loader.classList.add("show");
    } else {
      loader.classList.remove("show");
    }
  }
}

function showOICDutyFade(show, designation) {
  const oicFade = document.getElementById("oic-duty-fade");
  if (!oicFade) return;

  // Clear previous variant classes
  oicFade.classList.remove("oic-rd", "oic-ard");

  if (show) {
    // Apply variant class and message based on designation
    if (designation === "rd") {
      oicFade.classList.add("oic-rd");
      const p = oicFade.querySelector("p");
      if (p) p.textContent = "Assuming OIC - Regional Director...";
    } else if (designation === "ard") {
      oicFade.classList.add("oic-ard");
      const p = oicFade.querySelector("p");
      if (p) p.textContent = "Assuming OIC - Assistant RD...";
    } else {
      const p = oicFade.querySelector("p");
      if (p) p.textContent = "Assuming OIC Duty...";
    }

    oicFade.classList.add("show");
  } else {
    oicFade.classList.remove("show", "oic-rd", "oic-ard");
  }
}

/* ========= TOAST NOTIFICATIONS ========= */

function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = "info", duration = 3000) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");

  const icons = {
    success: "✓",
    error: "!",
    warning: "⚠",
    info: "ℹ",
  };

  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "•"}</span>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300)">✕</button>
  `;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

function showSuccess(message, duration = 3000) {
  showToast(message, "success", duration);
}

function showError(message, duration = 3000) {
  showToast(message, "error", duration);
}

function showWarning(message, duration = 3000) {
  showToast(message, "warning", duration);
}

function showInfo(message, duration = 3000) {
  showToast(message, "info", duration);
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

  var glyphs = { danger: "⚠", warning: "📦", neutral: "👤" };
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

  const container = field.closest(".field") || field.parentElement;
  if (!container) return;

  container.classList.add("error");
  container.classList.remove("success");

  let errorEl = container.querySelector(".field-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "field-error";
    container.appendChild(errorEl);
  }
  errorEl.textContent = errorMessage;
}

function setFieldSuccess(fieldId, successMessage = "") {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const container = field.closest(".field") || field.parentElement;
  if (!container) return;

  container.classList.remove("error");
  container.classList.add("success");

  const errorEl = container.querySelector(".field-error");
  if (errorEl) errorEl.remove();

  if (successMessage) {
    const successEl = document.createElement("div");
    successEl.className = "field-success";
    successEl.textContent = successMessage;
    container.appendChild(successEl);
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const container = field.closest(".field") || field.parentElement;
  if (!container) return;

  container.classList.remove("error", "success");

  const errorEl = container.querySelector(".field-error");
  if (errorEl) errorEl.remove();

  const successEl = container.querySelector(".field-success");
  if (successEl) successEl.remove();
}

function validateRequired(fieldId, fieldName = "") {
  const field = document.getElementById(fieldId);
  if (!field) return false;

  const value = (field.value || "").trim();
  if (!value) {
    const name = fieldName || field.getAttribute("placeholder") || "This field";
    setFieldError(fieldId, `${name} is required`);
    return false;
  }

  clearFieldError(fieldId);
  return true;
}

function validateEmail(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return false;

  const value = (field.value || "").trim();
  if (!value) return true; // Allow empty, use validateRequired separately

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    setFieldError(fieldId, "Please enter a valid email address");
    return false;
  }

  clearFieldError(fieldId);
  return true;
}

function validateMinLength(fieldId, minLength) {
  const field = document.getElementById(fieldId);
  if (!field) return false;

  const value = (field.value || "").trim();
  if (value.length < minLength) {
    setFieldError(fieldId, `Minimum ${minLength} characters required`);
    return false;
  }

  clearFieldError(fieldId);
  return true;
}

function validateMatch(fieldId1, fieldId2, fieldName = "Fields") {
  const field1 = document.getElementById(fieldId1);
  const field2 = document.getElementById(fieldId2);
  if (!field1 || !field2) return false;

  const value1 = field1.value || "";
  const value2 = field2.value || "";

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
  const sidebar = document.querySelector(".sidebar");
  const hamburger = document.getElementById("hamburger-btn");
  const overlay = document.getElementById("sidebar-overlay");

  if (window.innerWidth <= 768) {
    // Mobile: slide in/out
    if (sidebar) sidebar.classList.toggle("open");
    if (hamburger) hamburger.classList.toggle("active");
    if (overlay) overlay.classList.toggle("open");
  } else {
    // Desktop: collapse/expand
    if (sidebar) sidebar.classList.toggle("collapsed");
  }
}

function closeSidebarOnMobile() {
  const sidebar = document.querySelector(".sidebar");
  const hamburger = document.getElementById("hamburger-btn");
  const overlay = document.getElementById("sidebar-overlay");

  if (window.innerWidth <= 768) {
    if (sidebar) sidebar.classList.remove("open");
    if (hamburger) hamburger.classList.remove("active");
    if (overlay) overlay.classList.remove("open");
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
    id: "u-dc",
    role: "dc",
    name: "Chief Reyes",
    initial: "C",
    roleLabel: "Division Chief",
    division: "Finance and Administrative Division",
    email: "reyes@depdev7.gov.ph",
    oicApproved: null,
    oicRequest: null,
  },
  custodian: {
    id: "u-custodian",
    role: "custodian",
    name: "Clara Custodian",
    initial: "C",
    roleLabel: "Division Custodian",
    division: "Finance and Administrative Division",
    email: "clara@depdev7.gov.ph",
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
    ref: "2026-05-001",
    type: "Memorandum",
    from: "Chief Reyes",
    to: "All Staff",
    subject: "Division Performance Target 2026",
    status: "For ARD Clearance",
    date: "2026-05-14",
    conf: false,
    kind: "outgoing",
    division: "Finance and Administrative Division",
    tracking: { lastActor: "dc", lastUpdated: "2026-05-14T08:00:00Z" },
  },
  {
    ref: "2026-05-002",
    type: "Report",
    from: "Staff Ana",
    to: "Chief Reyes",
    subject: "Weekly Accomplishment Report",
    status: "For ARD Clearance",
    date: "2026-05-14",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    tracking: { lastActor: "staff", lastUpdated: "2026-05-14T09:30:00Z" },
  },
  {
    ref: "2026-05-003",
    type: "Endorsement",
    from: "Supervisor Jose",
    to: "Chief Reyes",
    subject: "Leave Application Endorsement",
    status: "Approved",
    date: "2026-05-14",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    tracking: { lastActor: "supervisor", lastUpdated: "2026-05-14T10:15:00Z" },
  },
  {
    ref: "2026-05-004",
    type: "Memorandum",
    from: "Sir Harry",
    to: "Regional Staff",
    subject: "DMS System Maintenance Advisory",
    status: "Released",
    date: "2026-05-14",
    conf: false,
    kind: "outgoing",
    division: "Office of the Regional Director",
    tracking: { lastActor: "admin", lastUpdated: "2026-05-14T11:00:00Z" },
  },
  {
    ref: "2026-05-005",
    type: "Letter",
    from: "External Partner",
    to: "Regional Director",
    subject: "Invitation: Regional Planning Summit",
    status: "For RD Approval",
    date: "2026-05-14",
    conf: false,
    kind: "incoming",
    division: "Office of the Regional Director",
    tracking: { lastActor: "rd", lastUpdated: "2026-05-14T13:45:00Z" },
  },
  {
    ref: "2026-05-006",
    type: "Endorsement",
    from: "Division Chief",
    to: "ARD",
    subject: "Project Proposal Clearance Request",
    status: "For ARD Clearance",
    date: "2026-05-14",
    conf: false,
    kind: "incoming",
    division: "Office of the Regional Director",
    tracking: { lastActor: "ard", lastUpdated: "2026-05-14T14:20:00Z" },
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
    tracking: {
      createdAt: "2026-04-26T09:00:00",
      createdBy: "HR Division",
      lastUpdated: "2026-04-26T15:30:00",
      updatedBy: "RD",
      trail: [
        {
          user: "HR Division",
          action: "Created",
          timestamp: "2026-04-26T09:00:00",
        },
        { user: "RD", action: "Received", timestamp: "2026-04-26T10:15:00" },
        { user: "RD", action: "Approved", timestamp: "2026-04-26T15:30:00" },
      ],
    },
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
    tracking: {
      createdAt: "2026-04-25T14:00:00",
      createdBy: "MED",
      lastUpdated: "2026-04-25T16:45:00",
      updatedBy: "RD",
      trail: [
        { user: "MED", action: "Created", timestamp: "2026-04-25T14:00:00" },
        { user: "RD", action: "Received", timestamp: "2026-04-25T14:30:00" },
        { user: "RD", action: "Released", timestamp: "2026-04-25T16:45:00" },
      ],
    },
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
    division: "Operations and Training Division",
    tracking: {
      createdAt: "2026-04-24T11:00:00",
      createdBy: "ORD",
      lastUpdated: "2026-04-24T17:30:00",
      updatedBy: "ORD",
      trail: [
        { user: "ORD", action: "Created", timestamp: "2026-04-24T11:00:00" },
        { user: "ORD", action: "Sent", timestamp: "2026-04-24T12:15:00" },
        {
          user: "External",
          action: "Received",
          timestamp: "2026-04-24T14:00:00",
        },
      ],
    },
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
  },
  // Sample documents for testing expired document notifications
  {
    ref: "2021-04-100",
    type: "Memorandum",
    from: "Previous Administration",
    to: "RD",
    subject: "Old Policy Guidelines",
    status: "Approved",
    date: "2021-04-15",
    conf: false,
    kind: "incoming",
    division: "Policy Formulation and Planning Division",
    disposalDate: "2026-04-15",
    retentionYears: 5,
    disposalAction: "Shred",
    daysUntilDisposal: -28,
  },
  {
    ref: "2021-03-085",
    type: "Letter",
    from: "External Agency",
    to: "ARD",
    subject: "Correspondence from 2021",
    status: "Released",
    date: "2021-03-20",
    conf: false,
    kind: "incoming",
    division: "Monitoring and Evaluation Division",
    disposalDate: "2026-03-20",
    retentionYears: 5,
    disposalAction: "Shred",
    daysUntilDisposal: -54,
  },
  {
    ref: "2026-04-050",
    type: "Report",
    from: "DRD",
    to: "RD",
    subject: "Research Report",
    status: "Approved",
    date: "2026-05-13",
    conf: false,
    kind: "outgoing",
    division: "Development and Research Division",
    disposalDate: "2036-05-13",
    retentionYears: 10,
    disposalAction: "Archive",
    daysUntilDisposal: 15,
  },
  {
    ref: "2026-04-025",
    type: "Bill / Financial",
    from: "Finance Division",
    to: "RD",
    subject: "Financial Statement",
    status: "Released",
    date: "2026-05-01",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    disposalDate: "2033-05-01",
    retentionYears: 7,
    disposalAction: "Shred",
    daysUntilDisposal: 7,
  },
  {
    ref: "2026-03-175",
    type: "Memorandum",
    from: "PFP Division",
    to: "RD",
    subject: "Policy Review Guidelines",
    status: "For RD Approval",
    date: "2026-03-25",
    conf: false,
    kind: "outgoing",
    division: "Policy Formulation and Planning Division",
  },
  {
    ref: "2026-03-160",
    type: "Report",
    from: "DRD Division",
    to: "ARD",
    subject: "Research Findings Summary",
    status: "Approved",
    date: "2026-03-20",
    conf: false,
    kind: "incoming",
    division: "Development and Research Division",
  },
  {
    ref: "2026-03-150",
    type: "Letter",
    from: "PDIP Division",
    to: "External Agency",
    subject: "Project Proposal Submission",
    status: "Released",
    date: "2026-03-15",
    conf: false,
    kind: "outgoing",
    division: "Project Development, Investment Programming and Budget Division",
  },
  {
    ref: "2026-03-140",
    type: "Memorandum",
    from: "ARD Office",
    to: "All Divisions",
    subject: "ARD Clearance Guidelines",
    status: "For ARD Clearance",
    date: "2026-03-12",
    conf: false,
    kind: "outgoing",
    division: "Office of the Regional Director",
  },
  {
    ref: "2026-03-130",
    type: "Endorsement",
    from: "External Agency",
    to: "RD",
    subject: "Endorsement for Regional Approval",
    status: "For RD Approval",
    date: "2026-03-10",
    conf: false,
    kind: "incoming",
    division: "Office of the Regional Director",
  },
  {
    ref: "2026-03-120",
    type: "Report",
    from: "Admin Office",
    to: "ARD",
    subject: "Monthly Administrative Report",
    status: "Approved",
    date: "2026-03-08",
    conf: false,
    kind: "outgoing",
    division: "Office of the Regional Director",
  },
  // DEMONSTRATION SAMPLES: Documents with custom expiration dates
  {
    ref: "2023-01-045",
    type: "Memorandum",
    from: "Regional Director",
    to: "All Divisions",
    subject: "Special Project Directive 2023",
    status: "Released",
    date: "2023-01-10",
    conf: false,
    kind: "outgoing",
    division: "Office of the Regional Director",
    disposalDate: "2024-01-10", // Set to 1 year after receipt by user
    retentionYears: 1,
    disposalAction: "Shred",
    daysUntilDisposal: -489,
  },
  {
    ref: "2025-05-150",
    type: "Contract",
    from: "Legal Service",
    to: "RD",
    subject: "Service Agreement",
    status: "Approved",
    date: "2025-05-14",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    disposalDate: "2026-05-16", // Custom short retention
    retentionYears: 1,
    disposalAction: "Permanent Archive",
    daysUntilDisposal: 2,
  },
  {
    ref: "2024-02-088",
    type: "Letter",
    from: "External Partner",
    to: "DC",
    subject: "Partnership Proposal",
    status: "Released",
    date: "2024-02-15",
    conf: false,
    kind: "incoming",
    division: "Project Development, Investment Programming and Budget Division",
    disposalDate: "2025-02-15",
    retentionYears: 1,
    disposalAction: "Shred",
    daysUntilDisposal: -454,
  },
  {
    ref: "2022-11-200",
    type: "Bill / Financial",
    from: "Supplier ABC",
    to: "FAD",
    subject: "Equipment Procurement 2022",
    status: "Released",
    date: "2022-11-20",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    disposalDate: "2025-11-20",
    retentionYears: 3,
    disposalAction: "Secure Destroy",
    daysUntilDisposal: -175,
  },
  {
    ref: "2021-05-141",
    type: "Report",
    from: "Internal Audit",
    to: "RD",
    subject: "Yearly Audit Report 2021",
    status: "Approved",
    date: "2021-05-14",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    disposalDate: "2026-05-14", // Exactly 5 years for this report type in this example
    retentionYears: 5,
    disposalAction: "Shred",
    daysUntilDisposal: 0, // Due today
  },
  // DISPOSAL ALERT SAMPLES: Documents expiring within the next 30 days
  {
    ref: "2021-05-195",
    type: "Memorandum",
    from: "ORD",
    to: "FAD",
    subject: "Regional Office Restructuring 2021",
    status: "Released",
    date: "2021-05-19",
    conf: false,
    kind: "outgoing",
    division: "Office of the Regional Director",
  },
  {
    ref: "2023-05-260",
    type: "Letter",
    from: "City Government",
    to: "RD",
    subject: "Inter-Agency Cooperation Letter",
    status: "Approved",
    date: "2023-05-26",
    conf: false,
    kind: "incoming",
    division: "Office of the Regional Director",
  },
  {
    ref: "2016-06-010",
    type: "Report",
    from: "Internal Audit",
    to: "RD",
    subject: "Five-Year Strategic Audit",
    status: "Released",
    date: "2016-06-01",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
  },
  {
    ref: "2024-06-085",
    type: "Endorsement",
    from: "PFP Division",
    to: "RD",
    subject: "Project Endorsement",
    status: "Approved",
    date: "2024-06-08",
    conf: false,
    kind: "outgoing",
    division: "Policy Formulation and Planning Division",
  },
  // DISPOSAL SCHEDULE SAMPLES: Long-term documents for the schedule table
  {
    ref: "2026-05-100",
    type: "Contract",
    from: "Legal Office",
    to: "RD",
    subject: "Long-term Lease Agreement 2026",
    status: "Approved",
    date: "2026-05-10",
    conf: false,
    kind: "incoming",
    division: "Finance and Administrative Division",
    disposalDate: "2041-05-10", // 15 years
    retentionYears: 15,
    disposalAction: "Permanent Archive",
    daysUntilDisposal: 5475,
  },
  {
    ref: "2026-05-110",
    type: "Legal Document",
    from: "Regional Trial Court",
    to: "RD",
    subject: "Property Title Deeds - Region VII",
    status: "Approved",
    date: "2026-05-12",
    conf: true,
    kind: "incoming",
    division: "Office of the Regional Director",
    disposalDate: "2051-05-12", // 25 years
    retentionYears: 25,
    disposalAction: "Permanent Archive",
    daysUntilDisposal: 9129,
  },
  {
    ref: "2026-05-120",
    type: "Report",
    from: "Planning Division",
    to: "NEDA Central",
    subject: "Regional Development Plan 2023-2028",
    status: "Released",
    date: "2026-05-14",
    conf: false,
    kind: "outgoing",
    division: "Policy Formulation and Planning Division",
    disposalDate: "2036-05-14", // 10 years
    retentionYears: 10,
    disposalAction: "Archive",
    daysUntilDisposal: 3652,
  },
  {
    ref: "2026-05-130",
    type: "Memorandum",
    from: "RD",
    to: "All Personnel",
    subject: "Revised Office Protocols 2026",
    status: "Released",
    date: "2026-05-14",
    conf: false,
    kind: "outgoing",
    division: "Office of the Regional Director",
    disposalDate: "2031-05-14", // 5 years
    retentionYears: 5,
    disposalAction: "Shred",
    daysUntilDisposal: 1826,
  },
  // PHILIPPINE GOVERNMENT DISPOSAL SAMPLES (JSON format as requested)
  {
    ref: "REF-2024-0012",
    type: "Financial Record",
    from: "Budget Division",
    to: "Commission on Audit",
    subject: "2020 Disbursement Vouchers and Payroll Records (Batch A)",
    date: "2020-01-15",
    disposalDate: "11/20/2026",
    daysUntilDisposal: 190,
    disposalAction: "Destroy",
    status: "Scheduled for Disposal",
    division: "Finance and Administrative Division",
  },
  {
    ref: "REF-2024-0045",
    type: "Memorandum",
    from: "Office of the Secretary",
    to: "All Regional Offices",
    subject: "Implementation Guidelines for the 2021 Bayanihan Grant Program",
    date: "2021-03-10",
    disposalDate: "03/10/2027",
    daysUntilDisposal: 300,
    disposalAction: "Archive",
    status: "Pending Review",
    division: "Office of the Regional Director",
  },
  {
    ref: "REF-2024-0089",
    type: "Directive",
    from: "Regional Director",
    to: "HR Division",
    subject:
      "Internal Administrative Order No. 2018-012: Staff Rotation Policy",
    date: "2018-05-22",
    disposalDate: "05/22/2026",
    daysUntilDisposal: 8,
    disposalAction: "Transfer to National Archives",
    status: "Overdue",
    division: "Finance and Administrative Division",
  },
  {
    ref: "REF-2024-0112",
    type: "Letter",
    from: "National Economic and Development Authority",
    to: "RD",
    subject:
      "Project Endorsement for the 2022 Central Visayas Infrastructure Plan",
    date: "2022-09-05",
    disposalDate: "09/05/2026",
    daysUntilDisposal: 114,
    disposalAction: "Archive",
    status: "Scheduled for Disposal",
    division: "Policy Formulation and Planning Division",
  },
  {
    ref: "REF-2024-0156",
    type: "Report",
    from: "Monitoring Division",
    to: "Office of the President",
    subject:
      "Consolidated Accomplishment Report on 2019 Regional Poverty Alleviation Projects",
    date: "2019-12-15",
    disposalDate: "12/15/2026",
    daysUntilDisposal: 215,
    disposalAction: "Transfer to National Archives",
    status: "Pending Review",
    division: "Monitoring and Evaluation Division",
  },
  // USER PROVIDED SAMPLES: Specifically for Disposal Management Table
  {
    ref: "REF-2022-0041",
    type: "Memorandum",
    from: "HR Division",
    to: "All Personnel",
    subject: "Guidelines on Work-From-Home Policy AY 2022",
    date: "2022-06-15",
    disposalDate: "06/15/2025",
    daysUntilDisposal: -333,
    disposalAction: "Destroy",
    status: "Overdue",
    division: "Finance and Administrative Division",
  },
  {
    ref: "REF-2023-0088",
    type: "Financial Record",
    from: "Budget Office",
    to: "COA",
    subject: "FY 2023 Disbursement Vouchers – Q1 & Q2",
    date: "2023-08-30",
    disposalDate: "08/30/2025",
    daysUntilDisposal: -257,
    disposalAction: "Archive",
    status: "Overdue",
    division: "Finance and Administrative Division",
  },
  {
    ref: "REF-2023-0115",
    type: "Report",
    from: "Infrastructure Division",
    to: "RD",
    subject: "Annual Procurement Report – Infrastructure Division",
    date: "2023-09-10",
    disposalDate: "09/10/2025",
    daysUntilDisposal: -246,
    disposalAction: "Archive",
    status: "Pending Review",
    division: "Project Development, Investment Programming and Budget Division",
    deadline: "2026-05-18", // Adding deadline
  },
  {
    ref: "REF-2024-0009",
    type: "Letter",
    from: "RDC Secretariat",
    to: "RD",
    subject: "Correspondence re: Regional Dev't Council Meeting Q2",
    date: "2024-11-20",
    disposalDate: "11/20/2025",
    daysUntilDisposal: 190,
    disposalAction: "Destroy",
    status: "Pending Review",
    division: "Policy Formulation and Planning Division",
    deadline: "2026-05-16", // Adding deadline
  },
  {
    ref: "REF-2024-0057",
    type: "Directive",
    from: "NEDA Central",
    to: "RD",
    subject: "NEDA Circular No. 2024-03 – Updated Filing Standards",
    date: "2024-02-28",
    disposalDate: "02/28/2026",
    daysUntilDisposal: 290,
    disposalAction: "Transfer",
    status: "Scheduled",
    division: "Office of the Regional Director",
    deadline: "2026-05-20", // Adding deadline
  },
];

// Document tracking functions
// Document tracking functions
function ensureTrail(doc) {
  if (!doc) return;
  if (!doc.tracking) {
    doc.tracking = {
      lastActor: "",
      lastUpdated: new Date().toISOString(),
      trail: []
    };
  }
  if (!doc.tracking.trail) {
    doc.tracking.trail = [];
  }
  if (doc.tracking.trail.length === 0) {
    var baseDate = doc.date || formatDateISO(new Date());
    var t0 = baseDate + "T08:30:00Z";
    var t1 = baseDate + "T09:15:00Z";
    var t2 = baseDate + "T11:45:00Z";
    var t3 = baseDate + "T14:30:00Z";
    var t4 = baseDate + "T16:00:00Z";

    doc.tracking.trail.push({
      user: doc.from || "Sender",
      action: "Created",
      timestamp: t0
    });

    var status = doc.status || "";
    if (status === "For ARD Clearance") {
      doc.tracking.trail.push({
        user: "ORD",
        action: "Received",
        timestamp: t1
      });
    } else if (status === "For RD Approval") {
      doc.tracking.trail.push({
        user: "ORD",
        action: "Received",
        timestamp: t1
      });
      doc.tracking.trail.push({
        user: "ARD",
        action: "Cleared",
        timestamp: t2
      });
    } else if (status === "Approved") {
      doc.tracking.trail.push({
        user: "ORD",
        action: "Received",
        timestamp: t1
      });
      doc.tracking.trail.push({
        user: "ARD",
        action: "Cleared",
        timestamp: t2
      });
      doc.tracking.trail.push({
        user: "RD",
        action: "Approved",
        timestamp: t3
      });
    } else if (status === "Released" || status === "Archived" || status === "Disposed") {
      doc.tracking.trail.push({
        user: "ORD",
        action: "Received",
        timestamp: t1
      });
      doc.tracking.trail.push({
        user: "ARD",
        action: "Cleared",
        timestamp: t2
      });
      doc.tracking.trail.push({
        user: "RD",
        action: "Approved",
        timestamp: t3
      });
      doc.tracking.trail.push({
        user: "ORD",
        action: "Released",
        timestamp: t4
      });
      if (status === "Archived") {
        doc.tracking.trail.push({
          user: doc.archivedBy || "Archive",
          action: "Archived",
          timestamp: (doc.archivedDate ? doc.archivedDate + "T16:30:00Z" : t4)
        });
      } else if (status === "Disposed") {
        doc.tracking.trail.push({
          user: doc.disposalProcessedBy || "Disposal",
          action: "Disposed",
          timestamp: (doc.disposalProcessedDate ? doc.disposalProcessedDate + "T16:30:00Z" : t4)
        });
      }
    } else {
      doc.tracking.trail.push({
        user: "ORD",
        action: "Received",
        timestamp: t1
      });
    }
  }
}

function updateDocumentTracking(ref, action, user) {
  user = user || (currentUser ? currentUser.name : "System");
  var doc = DOCS.find(function (d) {
    return d.ref === ref;
  });
  if (doc) {
    ensureTrail(doc);
    // Add new trail entry
    var trailEntry = {
      user: user,
      action: action,
      timestamp: new Date().toISOString(),
    };

    doc.tracking.trail.push(trailEntry);
    doc.tracking.lastUpdated = new Date().toISOString();
    doc.tracking.lastActor = currentUser ? currentUser.role : "";
    doc.tracking.updatedBy = user;

    // Update status based on action
    if (action === "Approved") {
      doc.status = "Approved";
    } else if (action === "Released") {
      doc.status = "Released";
    } else if (action === "For RD Approval") {
      doc.status = "For RD Approval";
    } else if (action === "For ARD Clearance") {
      doc.status = "For ARD Clearance";
    }

    // Refresh current view if on logbook page
    if (currentPage === "logbook") {
      showPage("logbook");
    }
  }
}

function getDocumentTrail(ref) {
  var doc = DOCS.find(function (d) {
    return d.ref === ref;
  });
  return doc && doc.tracking ? doc.tracking.trail : [];
}

function formatTimestamp(timestamp) {
  var date = new Date(timestamp);
  return date.toLocaleString() + " (" + date.toLocaleTimeString() + ")";
}

function renderDocumentTrail(ref) {
  var trail = getDocumentTrail(ref);
  var h =
    '<div style="background:#fff;border-radius:8px;padding:1rem;margin-bottom:1rem;border:1px solid var(--border);">';
  h +=
    '<h3 style="margin:0 0 1rem 0;color:var(--navy);font-size:1.1rem;">Document Trail</h3>';

  if (trail.length === 0) {
    h +=
      '<p style="color:var(--muted);text-align:center;padding:2rem;">No tracking information available</p>';
  } else {
    h += '<div style="max-height:300px;overflow-y:auto;">';
    trail.forEach(function (entry, index) {
      h +=
        '<div style="display:flex;align-items:center;gap:1rem;padding:0.75rem;border-bottom:1px solid var(--border);' +
        (index === 0 ? "border-radius:8px 8px 0 0;" : "") +
        '">';
      h +=
        '<div style="min-width:120px;font-weight:600;color:var(--navy);">' +
        entry.user +
        "</div>";
      h +=
        '<div style="min-width:80px;color:var(--muted);">' +
        entry.action +
        "</div>";
      h +=
        '<div style="min-width:150px;color:var(--muted);">' +
        formatTimestamp(entry.timestamp) +
        "</div>";
      h += "</div>";
    });
    h += "</div>";
  }

  h += '<div style="margin-top:1rem;text-align:right;">';
  h +=
    '<button class="btn-sm" onclick="showPage(\'logbook\')">← Back to Logbook</button>';
  h += "</div>";
  h += "</div>";

  return h;
}

var MASTER_NAV = [
  {
    label: "Main",
    items: [
      { icon: "📊", text: "Dashboard", page: "dashboard" },
      { icon: "📥", text: "Incoming Documents", page: "incoming" },
      { icon: "📤", text: "Outgoing Documents", page: "outgoing" },
      { icon: "⏳", text: "Pending Documents", page: "pending-docs" },
      { icon: "✅", text: "Approved Documents", page: "approved" },
      { icon: "📋", text: "Document Logbook", page: "logbook" },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: "🔍", text: "Search Documents", page: "search" },
      { icon: "📁", text: "Archive", page: "archive" },
      { icon: "🗑️", text: "Disposal Management", page: "disposal" },
      { icon: "👥", text: "User Management", page: "users" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: "🔔", text: "Notifications", page: "notifications" },
      { icon: "📌", text: "Bulletin Board", page: "announcements" },
    ],
  },
  {
    label: "Reports",
    items: [{ icon: "📑", text: "Reports", page: "enhanced-reports" }],
  },
];

function getNav() {
  var r = currentUser.role;
  var account = USER_ACCOUNTS.find(function (u) {
    return u.email === currentUser.email || u.name === currentUser.name;
  });
  var features = account ? account.features : getFeaturesForRole(r);

  if (!features) return [];

  var nav = JSON.parse(JSON.stringify(MASTER_NAV));

  nav.forEach(function (section) {
    section.items = section.items.filter(function (item) {
      return features.includes(item.page);
    });
    // Add badges back if needed
    section.items.forEach(function (item) {
      if (item.page === "incoming") {
        if (r === "admin") item.badge = 3;
        if (r === "rd") item.badge = 4;
        if (r === "ard" || r === "oic") item.badge = 2;
        if (r === "dc") item.badge = 1;
        if (r === "staff") item.badge = 2;
      }
      if (item.page === "notifications") {
        if (r === "admin") item.badge = 5;
        if (r === "rd") item.badge = 4;
        if (r === "ard" || r === "oic") item.badge = 2;
        if (r === "dc") item.badge = 1;
        if (r === "staff") item.badge = 2;
      }
      // Customize text based on role
      if (item.page === "dashboard" && r === "dc")
        item.text = "Division Dashboard";
      if (item.page === "dashboard" && r === "staff")
        item.text = "My Dashboard";
      if (item.page === "pending-docs" && r === "rd")
        item.text = "Pending/For Approval";
      if (item.page === "pending-docs" && (r === "ard" || r === "oic"))
        item.text = "Pending/For Clearance";
      if (item.page === "pending-docs" && r === "dc")
        item.text = "For Clearance/Pending";
      if (item.page === "pending-docs" && r === "staff")
        item.text = "Assigned to Me";
      if (item.page === "outgoing" && (r === "ard" || r === "oic"))
        item.text = "For RD Routing";
      if (item.page === "outgoing" && r === "dc")
        item.text = "Division Outgoing";
      if (item.page === "outgoing" && r === "staff")
        item.text = "My Submissions";
      if (item.page === "logbook" && r === "dc") item.text = "Division Logbook";
      if (item.page === "archive" && r === "dc") item.text = "Division Archive";
      if (item.page === "users" && r === "dc")
        item.text = "Division User Management";
    });
  });

  // Remove empty sections
  nav = nav.filter(function (section) {
    return section.items.length > 0;
  });

  return nav;
}

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function prepareLogin(role) {
  var user = USERS[role];
  if (!user) return;
  
  var emailInput = document.getElementById("login-email");
  var passInput = document.getElementById("login-pass");
  
  if (emailInput) emailInput.value = user.email || "";
  if (passInput) passInput.value = "password";
  
  // Optional highlight to draw attention to the form
  var authCard = document.querySelector(".auth-card");
  if (authCard) {
    authCard.style.transition = "transform 0.3s, box-shadow 0.3s";
    authCard.style.transform = "scale(1.02)";
    authCard.style.boxShadow = "0 12px 30px rgba(15, 42, 86, 0.2)";
    
    // Smooth scroll to the top form area just in case it's off-screen on smaller monitors
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(function() {
      authCard.style.transform = "scale(1)";
      authCard.style.boxShadow = "";
    }, 500);
  }
}
function loginAs(role) {
  showLoading(true);
  currentUser = Object.assign({}, USERS[role]);

  // Sync with USER_ACCOUNTS to get OIC approval and other account details
  var accountData = USER_ACCOUNTS.find(function (u) {
    return u.email === currentUser.email || u.name === currentUser.name;
  });
  if (accountData) {
    // Merge in account-level properties (oicApproved, oicRequest, etc.)
    currentUser = Object.assign({}, currentUser, {
      id: accountData.id,
      oicApproved: accountData.oicApproved,
      oicRequest: accountData.oicRequest,
      docAccess: accountData.docAccess,
      funcAccess: accountData.funcAccess,
      features: accountData.features
    });
  }

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

  // Simulated backend registration call
  // currentUser is NOT set here because the account needs admin verification
  showLoading(true);
  setTimeout(() => {
    // Clear signup fields
    document.getElementById("signup-first-name").value = "";
    document.getElementById("signup-last-name").value = "";
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-password").value = "";
    document.getElementById("signup-confirm-password").value = "";
    document.getElementById("role-select").value = "";
    var divSelectBox = document.getElementById("div-select-box");
    if (divSelectBox) divSelectBox.classList.remove("show");
    document.querySelectorAll('input[name="div"]').forEach(el => el.checked = false);

    showScreen("screen-signup-success");
    showLoading(false);
  }, 500);
}
function doLogin() {
  var emailInput = ((document.getElementById("login-email") || {}).value || "").trim();
  var passInput = ((document.getElementById("login-pass") || {}).value || "").trim();

  // Basic field validation
  if (!emailInput) {
    showError("Please enter your email address.");
    return;
  }
  if (!passInput) {
    showError("Please enter your password.");
    return;
  }

  showLoading(true);

  setTimeout(function () {
    // Find matching account
    var acct = USER_ACCOUNTS.find(function (u) {
      return u.email && u.email.toLowerCase() === emailInput.toLowerCase();
    });

    // Email not found
    if (!acct) {
      showLoading(false);
      showError("No account found with that email address.");
      return;
    }

    // Account not yet active
    if (acct.status === "Pending") {
      showLoading(false);
      showError("Your account is pending administrator approval. Please wait for activation.");
      return;
    }

    if (acct.status === "Deactivated") {
      showLoading(false);
      showError("Your account has been deactivated. Please contact your administrator.");
      return;
    }

    // Password check — supports passwordless mode and temp passwords set by admin
    var isPasswordless = acct.passwordMode === "passwordless";
    var correctPassword = acct.tempPassword || "password"; // default is "password"
    if (!isPasswordless && passInput !== correctPassword) {
      showLoading(false);
      showError("Incorrect password. Please try again.");
      return;
    }

    // All good — log in
    currentUser = Object.assign({}, USERS[(acct.role || "").toLowerCase()] || {}, {
      name: acct.name,
      role: (acct.role || "").toLowerCase(),
      roleLabel: acct.role || acct.roleLabel || "",
      email: acct.email,
      division: acct.division || null,
      id: acct.id,
      oicApproved: acct.oicApproved || null,
      oicRequest: acct.oicRequest || null,
      features: acct.features,
    });

    showApp();
    showLoading(false);
    showSuccess("Welcome back, " + currentUser.name + ".");
  }, 400);
}

function sendPasswordReset() {
  var emailInput = ((document.getElementById("forgot-email") || {}).value || "").trim();

  // Basic field validation
  if (!emailInput) {
    showError("Please enter your email address.");
    return;
  }

  showLoading(true);

  setTimeout(function () {
    // Find matching account
    var acct = USER_ACCOUNTS.find(function (u) {
      return u.email && u.email.toLowerCase() === emailInput.toLowerCase();
    });

    // Email not found
    if (!acct) {
      showLoading(false);
      showError("No account found with that email address.");
      return;
    }

    // Account not yet active
    if (acct.status === "Pending") {
      showLoading(false);
      showError("Your account is pending administrator approval. Password reset is not available yet.");
      return;
    }

    if (acct.status === "Deactivated") {
      showLoading(false);
      showError("Your account has been deactivated. Please contact your administrator.");
      return;
    }

    // Success - show confirmation
    showLoading(false);
    showSuccess("Password reset instructions have been sent to " + emailInput);

    // Clear the input and go back to sign in after a moment
    setTimeout(function () {
      document.getElementById("forgot-email").value = "";
      showScreen("screen-signin");
    }, 2000);
  }, 500);
}

var originalUserState = null;

function toggleOICDuty(designation) {
  var dcAcct = getUserAccountById(currentUser.id || "u-dc");
  if (designation) {
    // Check if this designation is pre-authorized/approved
    var isApproved = dcAcct && dcAcct.oicApproved === designation;
    if (!isApproved) {
      // Not approved! Set request state
      if (dcAcct) {
        dcAcct.oicRequest = designation;
      }
      currentUser.oicRequest = designation;

      // Dispatch alert request modal
      showOICRequestModal(designation);

      // Send notifications to RD/ARD/Admin
      addOICRequestNotification(designation);

      // Refresh app to show pending state in dropdown
      showApp();
      return;
    }

    // Approved! Proceed with transition
    if (!originalUserState) {
      originalUserState = Object.assign({}, currentUser);
    }

    if (designation === "rd") {
      currentUser.role = "rd";
      currentUser.roleLabel = "OIC - Regional Director";
      currentUser.division = null;
      currentUser.docAccess = "Full";
      currentUser.funcAccess = "Approval";
      currentUser.features = getFeaturesForRole("rd");
    } else if (designation === "ard") {
      currentUser.role = "oic";
      currentUser.roleLabel = "OIC - Asst. Regional Director";
      currentUser.division = null;
      currentUser.docAccess = "Full";
      currentUser.funcAccess = "Clearance";
      currentUser.features = getFeaturesForRole("oic");
    }

    // Show custom OIC duty fade effect (use specific gradient/message)
    showOICDutyFade(true, designation);
    setTimeout(function () {
      showApp();
      showOICDutyFade(false);
      showSuccess("You have assumed " + currentUser.roleLabel + " duty.");
    }, 400);
    return;
  } else {
    // Restore normal Chief duty (keep original behavior - no fade)
    if (originalUserState) {
      currentUser = Object.assign({}, originalUserState);
      originalUserState = null;
    }
    // Also clear request states if any
    if (dcAcct) {
      dcAcct.oicRequest = null;
    }
    currentUser.oicRequest = null;
    showSuccess("Returned to " + currentUser.roleLabel + " duty.");
  }
  showApp();
}

function showOICRequestModal(designation) {
  var roleText = designation === "rd" ? "Regional Director (RD)" : "Assistant Regional Director (ARD)";
  var h =
    '<div class="modal-overlay open" id="oic-request-modal">' +
    '<div class="modal" style="max-width:500px; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:none;">' +
    '<div class="modal-head" style="background:linear-gradient(to right, #d97706, #f59e0b); color:#fff; padding:1.25rem 1.5rem;">' +
    '<h3 style="margin:0; font-size:1.15rem; font-weight:700; color:#fff;">🔒 Security Clearance Required</h3>' +
    '</div>' +
    '<div class="modal-body" style="padding:1.75rem; background:#fff; text-align:center;">' +
    '<div style="font-size:36px; margin-bottom:1rem;">⏳</div>' +
    '<h4 style="margin:0 0 0.5rem; color:#1e293b; font-size:1.1rem;">Request Sent for OIC Approval</h4>' +
    '<p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">' +
    'Your request to temporarily act as <strong>OIC for ' + roleText + '</strong> requires security authorization. ' +
    'A notification has been dispatched to the ' + (designation === "rd" ? "Regional Director" : "Assistant Regional Director") + ' for clearance.' +
    '</p>' +
    '<div style="margin-top:1.25rem; padding:0.75rem; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; font-size:12px; color:#b45309; font-weight:500;">' +
    'Status: Pending Clearance Approval' +
    '</div>' +
    '</div>' +
    '<div class="modal-footer" style="background:#f8fafc; padding:1rem 1.5rem; display:flex; justify-content:center;">' +
    '<button class="btn-send" onclick="document.getElementById(\'oic-request-modal\').remove()" style="background:#d97706; padding:0.6rem 2rem; color:#fff; border:none; border-radius:6px; cursor:pointer;">Acknowledge</button>' +
    '</div>' +
    '</div>' +
    '</div>';

  var div = document.createElement("div");
  div.innerHTML = h;
  document.body.appendChild(div.firstChild);
}

function addOICRequestNotification(roleType) {
  var notifPanel = document.getElementById("notif-panel");
  if (!notifPanel) return;

  var notifText = "<strong>Chief Reyes</strong> has requested temporary clearance to assume <strong>Acting OIC - " + (roleType === "rd" ? "RD" : "ARD") + "</strong> duty.";

  // Set badge count
  var badge = document.getElementById("notif-badge");
  if (badge) {
    var val = parseInt(badge.textContent || "0") + 1;
    updateNotificationBadge(val);
  }
}

function renderOICNotifications() {
  var notifPanel = document.getElementById("notif-panel");
  if (!notifPanel) return;

  // Remove existing OIC notifications to prevent duplicates
  var oicItems = notifPanel.querySelectorAll(".oic-notif-item");
  oicItems.forEach(function (item) { item.remove(); });

  var notifHead = notifPanel.querySelector(".notif-head");
  if (!notifHead) return;

  // Check if any Division Chief has a pending OIC request
  USER_ACCOUNTS.forEach(function (u) {
    if (u.oicRequest) {
      // Determine if current user has authorization to approve
      var canApprove = false;
      var activeRole = currentUser.role;
      if (activeRole === "admin") {
        canApprove = true;
      } else if (u.oicRequest === "rd" && activeRole === "rd") {
        canApprove = true;
      } else if (u.oicRequest === "ard" && (activeRole === "ard" || activeRole === "oic")) {
        canApprove = true;
      }

      if (canApprove) {
        var item = document.createElement("div");
        item.className = "notif-item unread oic-notif-item";
        item.style.borderLeft = "4px solid #f59e0b";
        item.style.background = "#fffbeb";
        item.style.display = "flex";
        item.style.padding = "0.75rem 1rem";

        var targetRole = u.oicRequest === "rd" ? "Regional Director (RD)" : "Asst. Regional Director (ARD)";

        item.innerHTML =
          '<div style="font-size: 18px; margin-right: 0.75rem; margin-top: 2px;">🔑</div>' +
          '<div style="flex:1">' +
          '<div class="notif-text" style="font-size: 13px; line-height: 1.4; color: #1e293b;"><strong>OIC Request:</strong> ' + u.name + ' requested temporary clearance to assume <strong>Acting OIC - ' + (u.oicRequest === "rd" ? "RD" : "ARD") + '</strong> duties.</div>' +
          '<div style="margin-top: 0.6rem; display: flex; gap: 0.5rem;">' +
          '<button class="btn-sm success" onclick="approveOICRequestDirectly(\'' + u.id + '\')" style="padding: 0.3rem 0.75rem; font-size: 11px; font-weight:600; border-radius:4px; border:none; background:#10b981; color:#fff; cursor:pointer;">Approve</button>' +
          '<button class="btn-sm danger" onclick="denyOICRequestDirectly(\'' + u.id + '\')" style="padding: 0.3rem 0.75rem; font-size: 11px; font-weight:600; border-radius:4px; border:none; background:#ef4444; color:#fff; cursor:pointer;">Deny</button>' +
          '</div>' +
          '<div class="notif-time" style="font-size:10px; color:#94a3b8; margin-top:0.4rem;">Just now</div>' +
          '</div>';

        notifPanel.insertBefore(item, notifHead.nextSibling);
      }
    }
  });
}

function approveOICRequestDirectly(userId) {
  var u = getUserAccountById(userId);
  if (u) {
    u.oicApproved = u.oicRequest;
    u.oicRequest = null;
    showSuccess("OIC Authority approved for " + u.name + ".");
    renderOICNotifications();

    // If the active user is the Division Chief themselves, update their state
    if (currentUser.id === userId) {
      currentUser.oicApproved = u.oicApproved;
      currentUser.oicRequest = null;
    }

    if (currentPage === "users") showPage("users");
  }
}

function denyOICRequestDirectly(userId) {
  var u = getUserAccountById(userId);
  if (u) {
    u.oicRequest = null;
    showSuccess("OIC Request denied for " + u.name + ".");
    renderOICNotifications();

    // If the active user is the Division Chief themselves, update their state
    if (currentUser.id === userId) {
      currentUser.oicRequest = null;
    }

    if (currentPage === "users") showPage("users");
  }
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

  // Inject OIC Designation selector for Division Chief in the topbar
  var topbarRight = document.querySelector(".topbar-right");
  if (topbarRight) {
    var existingOic = document.getElementById("oic-topbar-widget");
    if (existingOic) existingOic.remove();

    var isDC = u.role === "dc" || (originalUserState && originalUserState.role === "dc");
    if (isDC) {
      var oicWidget = document.createElement("div");
      oicWidget.id = "oic-topbar-widget";
      oicWidget.style.display = "flex";
      oicWidget.style.alignItems = "center";
      oicWidget.style.gap = "0.5rem";
      oicWidget.style.marginRight = "1rem";
      oicWidget.style.background = "#eff6ff";
      oicWidget.style.padding = "0.35rem 0.75rem";
      oicWidget.style.borderRadius = "20px";
      oicWidget.style.border = "1px solid #bfdbfe";
      oicWidget.style.fontSize = "12px";
      oicWidget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";

      var label = document.createElement("span");
      label.style.fontWeight = "600";
      label.style.color = "#1e40af";
      label.textContent = "Duty:";

      var select = document.createElement("select");
      select.style.border = "none";
      select.style.background = "transparent";
      select.style.fontSize = "12px";
      select.style.fontWeight = "700";
      select.style.color = "#1d4ed8";
      select.style.cursor = "pointer";
      select.style.outline = "none";
      select.style.padding = "0 0.25rem";
      select.onchange = function () {
        toggleOICDuty(this.value || null);
      };

      var optNormal = document.createElement("option");
      optNormal.value = "";
      optNormal.textContent = "💼 Division Chief";
      if (!originalUserState && !u.oicRequest) optNormal.selected = true;

      var optOicRd = document.createElement("option");
      optOicRd.value = "rd";
      var rdCleared = u.oicApproved === "rd";
      if (u.oicRequest === "rd") {
        optOicRd.textContent = "⏳ Pending OIC RD Approval...";
        optOicRd.selected = true;
        optOicRd.disabled = true; // pending — cannot re-select, only cancel
      } else if (rdCleared) {
        optOicRd.textContent = "👑 Acting OIC - RD (Cleared)";
        if (originalUserState && currentUser.role === "rd") optOicRd.selected = true;
      } else {
        // Not approved and not pending — disable so DC cannot click it
        optOicRd.textContent = "👑 Acting OIC - RD (Not Assigned)";
        optOicRd.disabled = true;
        optOicRd.title = "You have not been designated OIC for RD. Contact Admin or RD.";
      }

      var optOicArd = document.createElement("option");
      optOicArd.value = "ard";
      var ardCleared = u.oicApproved === "ard";
      if (u.oicRequest === "ard") {
        optOicArd.textContent = "⏳ Pending OIC ARD Approval...";
        optOicArd.selected = true;
        optOicArd.disabled = true; // pending — cannot re-select
      } else if (ardCleared) {
        optOicArd.textContent = "⚡ Acting OIC - ARD (Cleared)";
        if (originalUserState && currentUser.role === "oic") optOicArd.selected = true;
      } else {
        // Not approved and not pending — disable so DC cannot click it
        optOicArd.textContent = "⚡ Acting OIC - ARD (Not Assigned)";
        optOicArd.disabled = true;
        optOicArd.title = "You have not been designated OIC for ARD. Contact Admin, ARD, or RD.";
      }

      select.appendChild(optNormal);
      select.appendChild(optOicRd);
      select.appendChild(optOicArd);

      oicWidget.appendChild(label);
      oicWidget.appendChild(select);

      topbarRight.insertBefore(oicWidget, topbarRight.firstChild);
    }
  }

  // Initialize disposal system, expired document notifications, and deadline alerts
  if (["admin", "ard", "rd", "dc", "custodian"].includes(u.role)) {
    initializeDisposalSystem();
    initializeExpiredDocumentNotifications();
    updateNotificationPanelWithDeadlines();
  }
  renderOICNotifications();
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
  showConfirmDialog({
    title: "Sign Out",
    message: "Are you sure you want to sign out?",
    detail: "You will need to sign in again to access your account.",
    confirmLabel: "Sign Out",
    cancelLabel: "Cancel",
    variant: "neutral"
  }).then(function (confirmed) {
    if (confirmed) {
      showLoading(true);
      originalUserState = null;
      setTimeout(() => {
        showScreen("screen-signin");
        showLoading(false);
      }, 500);
    }
  });
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
        '" title="' + item.text + '" data-tooltip="' + item.text + '"><span class="sb-icon">' +
        item.icon +
        "</span><span class='sb-item-text'>" +
        item.text +
        "</span>" +
        (item.badge ? '<span class="sb-badge">' + item.badge + "</span>" : "") +
        "</div>";
    });
  });
  html +=
    '<div class="sb-item" onclick="doLogout()" id="nav-signout" title="Sign out" data-tooltip="Sign out"><span class="sb-icon">⬅</span><span class="sb-item-text">Sign out</span></div>';
  el.innerHTML = html;
}

function showPage(page) {
  closeSidebarOnMobile();
  showLoading(true);

  // Permission check
  var account = USER_ACCOUNTS.find(function (u) {
    return u.email === currentUser.email || u.name === currentUser.name;
  });
  var features = account
    ? account.features
    : getFeaturesForRole(currentUser.role);

  // Always allow profile, settings, logout, and dashboard as fallback
  var allowedPages = ["profile", "settings", "dashboard"];
  if (features) allowedPages = allowedPages.concat(features);

  if (!allowedPages.includes(page)) {
    showError(
      "Access denied. You do not have permission to view this section.",
    );
    page = "dashboard"; // Fallback to dashboard
  }

  currentPage = page;
  document
    .querySelectorAll(".sb-item")
    .forEach((i) => i.classList.remove("active"));
  var el = document.getElementById("nav-" + page);
  if (el) el.classList.add("active");
  var titles = {
    dashboard: "Dashboard",
    incoming:
      currentUser.role === "rd"
        ? "Pending/For Approval"
        : ["ard", "oic"].includes(currentUser.role)
          ? "Pending/For Clearance"
          : currentUser.role === "dc"
            ? "For Clearance/Pending"
            : "Incoming Documents",
    "pending-docs": "Pending Documents",
    outgoing: "Outgoing Documents",
    logbook: "Document Logbook",
    "document-trail": "Document Trail",
    users: "User Management",
    search: "Search Documents",
    archive: "Archive",
    disposal: "Disposal Management",
    notifications: "Notifications",
    reports: "Reports",
    approved: "Approved Documents",
    announcements: "Bulletin Board",
    "enhanced-reports": "Reports",
  };
  var pageTitle = titles[page] || (page.charAt(0).toUpperCase() + page.slice(1));
  document.title = pageTitle + " | DepDev DMS Prototype";
  var c = document.getElementById("main-content");
  var titleHeader = renderPageHeader(titles[page] || page);
  if (page === "dashboard") c.innerHTML = titleHeader + renderDashboard();
  else if (page === "enhanced-reports")
    c.innerHTML = titleHeader + renderEnhancedReports();
  else if (page === "archive") c.innerHTML = titleHeader + renderArchive();
  else if (page === "disposal") c.innerHTML = titleHeader + renderDisposal();
  else if (page === "users") c.innerHTML = titleHeader + renderUsers();
  else if (page === "search") c.innerHTML = titleHeader + renderSearch();
  else if (page === "reports") c.innerHTML = titleHeader + renderReports();
  else if (page === "approved") c.innerHTML = titleHeader + renderApproved();
  else if (page === "compose") c.innerHTML = titleHeader + renderCompose();
  else if (page === "profile") c.innerHTML = titleHeader + renderProfile();
  else if (page === "settings") c.innerHTML = titleHeader + renderSettings();
  else if (page === "notifications")
    c.innerHTML = titleHeader + renderNotifications();
  else if (page === "announcements") {
    c.innerHTML = titleHeader + renderAnnouncementsPage();
    renderAnnouncementsPageList("");
  }
  else if (page === "outgoing") c.innerHTML = titleHeader + renderOutgoing();
  else if (page === "incoming") c.innerHTML = titleHeader + renderIncoming();
  else if (page === "pending-docs") c.innerHTML = titleHeader + renderPendingDocs();
  else if (page === "logbook") c.innerHTML = titleHeader + renderLogbook();
  else if (page === "document-trail")
    c.innerHTML = titleHeader + renderDocumentTrail(currentEditingRef || "");
  else
    c.innerHTML =
      titleHeader +
      '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:1rem">🚧</div><div style="font-size:16px">This section is under development.</div></div>';
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
  if (s === "Approved")
    return '<span class="pill pill-green">' + s + "</span>";
  if (s === "Released")
    return '<span class="pill pill-purple">' + s + "</span>";
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

function getViewableUsers() {
  var currentRole = currentUser.role;
  var viewableUsers = [];

  if (currentRole === "admin") {
    // Admin can view RD and ARD logbooks
    viewableUsers = [
      { role: "rd", name: USERS.rd.name, label: "Regional Director (RD)" },
      {
        role: "ard",
        name: USERS.ard.name,
        label: "Assistant Regional Director (ARD)",
      },
    ];
  } else if (currentRole === "rd") {
    // RD can view Admin and ARD logbooks
    viewableUsers = [
      { role: "admin", name: USERS.admin.name, label: "Administrator" },
      {
        role: "ard",
        name: USERS.ard.name,
        label: "Assistant Regional Director (ARD)",
      },
    ];
  } else if (currentRole === "ard") {
    // ARD can view Admin and RD logbooks
    viewableUsers = [
      { role: "admin", name: USERS.admin.name, label: "Administrator" },
      { role: "rd", name: USERS.rd.name, label: "Regional Director (RD)" },
    ];
  }

  return viewableUsers;
}

function getUserLogbookDocs(userRole) {
  // Filter documents based on user role and their typical document access
  if (userRole === "admin") {
    return DOCS; // Admin sees all documents
  } else if (userRole === "rd") {
    // RD sees documents for their approval and approved documents
    return DOCS.filter(function (d) {
      return (
        d.to === "RD" || d.status === "Approved" || d.status === "Released"
      );
    });
  } else if (userRole === "ard") {
    // ARD sees documents for their clearance and related documents
    return DOCS.filter(function (d) {
      return (
        d.to === "ARD" ||
        d.status === "For ARD Clearance" ||
        d.from.includes("ARD")
      );
    });
  }
  return DOCS;
}

function getVisibleLogbookDocs() {
  var r = currentUser.role;
  var view = currentLogbookView || "my";
  var division = currentUser.division || "ORD";

  // Top Management Global Access
  if (isGlobalLogbookRole(r)) {
    if (view === "my")
      return DOCS.filter((d) => d.tracking && d.tracking.lastActor === r);
    if (view === "rd")
      return DOCS.filter((d) => d.tracking && d.tracking.lastActor === "rd");
    if (view === "ard")
      return DOCS.filter((d) => d.tracking && d.tracking.lastActor === "ard");
    if (view === "admin")
      return DOCS.filter((d) => d.tracking && d.tracking.lastActor === "admin");
    return DOCS; // Default for global/divisions view
  }

  // Division Chief Access
  if (r === "dc") {
    var divDocs = DOCS.filter((d) => (d.division || "ORD") === division);
    if (view === "my")
      return divDocs.filter((d) => d.tracking && d.tracking.lastActor === "dc");
    if (view === "staff")
      return divDocs.filter(
        (d) => d.tracking && d.tracking.lastActor === "staff",
      );
    if (view === "supervisor")
      return divDocs.filter(
        (d) => d.tracking && d.tracking.lastActor === "supervisor",
      );
    return divDocs;
  }

  // Division Custodian Access (Own division's Admin-like view)
  if (r === "custodian") {
    var divDocs = DOCS.filter((d) => (d.division || "ORD") === division);
    if (view === "my")
      return divDocs.filter((d) => d.tracking && d.tracking.lastActor === "custodian");
    return divDocs;
  }

  // Staff and Supervisor Access (Self-only)
  return DOCS.filter(function (d) {
    return (
      (d.division || "ORD") === division &&
      d.tracking &&
      d.tracking.lastActor === r
    );
  });
}

function getCurrentLogbookExportDocs() {
  if (currentLogbookView === "division" && currentLogbookDivision) {
    return DOCS.filter(function (d) {
      return (d.division || "ORD") === currentLogbookDivision;
    });
  }
  if (currentLogbookView === "user" && currentLogbookUser) {
    return getUserLogbookDocs(currentLogbookUser.role);
  }
  if (["rd", "ard", "admin"].includes(currentLogbookView)) {
    return getUserLogbookDocs(currentLogbookView);
  }
  if (currentLogbookView === "divisions" && isGlobalLogbookRole(currentUser.role)) {
    return DOCS;
  }
  return getVisibleLogbookDocs();
}

function csvEscape(val) {
  if (val == null) return '""';
  return '"' + String(val).replace(/"/g, '""') + '"';
}

function exportLogbookCSV() {
  var docs = getCurrentLogbookExportDocs();
  if (docs.length === 0) {
    showInfo("No logbook entries to export.");
    return;
  }

  var csvContent =
    "Reference No.,Direction,Date Received,Last Updated,Type,From / Sender,Division,Subject,Routed To,Status,Physical Copy\n";

  docs.forEach(function (d) {
    var lastUpdated =
      d.tracking && d.tracking.lastUpdated
        ? formatTimestamp(d.tracking.lastUpdated)
        : d.date || "";
    csvContent +=
      csvEscape(d.ref) + "," +
      csvEscape(d.kind || "") + "," +
      csvEscape(d.date || "") + "," +
      csvEscape(lastUpdated) + "," +
      csvEscape(d.type || "") + "," +
      csvEscape(d.from || "") + "," +
      csvEscape(d.division || "") + "," +
      csvEscape(d.subject || "") + "," +
      csvEscape(d.to || "") + "," +
      csvEscape(d.status || "") + "," +
      csvEscape(d.physicalCopy ? "Yes" : "No") + "\n";
  });

  var blob = new Blob([csvContent], { type: "text/csv" });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "logbook_" + formatDateISO(new Date()) + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showSuccess("Logbook exported successfully (" + docs.length + " records)");
}

function getVisibleDocumentsForRole() {
  if (isGlobalLogbookRole(currentUser.role)) return DOCS;
  return DOCS.filter(function (doc) {
    return (doc.division || "ORD") === currentUser.division;
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

/**
 * Renders a consistent empty state row for doc tables.
 * @param {number} colspan - number of columns to span
 * @param {string} icon - emoji icon
 * @param {string} title - bold heading
 * @param {string} subtitle - smaller hint text
 */
function emptyStateRow(colspan, icon, title, subtitle) {
  return '<tr><td colspan="' + colspan + '" style="text-align:center;padding:3rem 1rem;color:var(--muted);">' +
    '<div style="font-size:2.25rem;margin-bottom:.5rem;opacity:.6">' + icon + '</div>' +
    '<div style="font-weight:600;font-size:14px;color:var(--navy);margin-bottom:.3rem">' + title + '</div>' +
    '<div style="font-size:12px">' + subtitle + '</div>' +
    '</td></tr>';
}

function getDivisionAbbrev(div) {
  if (!div) return "—";
  var map = {
    "Monitoring and Evaluation Division": "MED",
    "Policy Formulation and Planning Division": "PFP",
    "Project Development, Investment Programming and Budget Division": "PDIP",
    "Development and Research Division": "DRD",
    "Finance and Administrative Division": "FAD",
    "Office of the Regional Director": "ORD",
    "Finance Division": "FAD",
    "Regional Staff": "RS"
  };
  if (map[div]) return map[div];
  if (div.length <= 6 && !div.includes(" ")) return div;
  // Fallback: take initials of up to 6 letters
  var parts = div
    .replace(/[,()]/g, "")
    .split(/\s+/)
    .filter(function (p) {
      return p && p.length > 0;
    });
  var abbr = parts.map(function (p) {
    return p[0].toUpperCase();
  }).join("");
  return abbr.slice(0, 6) || div.slice(0, 6).toUpperCase();
}


function renderActionsMenu(ref, editFn) {
  var ef = editFn || "openEditor";
  return (
    '<select class="btn-sm primary" onchange="handleActionMenu(this,\'' +
    ref +
    "','" +
    ef +
    "')\">" +
    '<option value="" disabled selected hidden>Options</option>' +
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
  var visibleDocs = getVisibleDocumentsForRole();
  var h = "";
  // Role-aware welcome
  h +=
    '<div style="background:linear-gradient(110deg,var(--navy) 0%,var(--navy3) 100%);border-radius:14px;padding:1.5rem 2rem;color:#fff;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">';
  // determine badge class for role (RD -> rd, OIC (ARD) -> ard)
  var badgeClass = "";
  if (currentUser.role === "rd") badgeClass = "rd";
  else if (currentUser.role === "oic") badgeClass = "ard";

  h +=
    '<div><div style="font-size:13px;color:rgba(255,255,255,.6);margin-bottom:.25rem">Good day,</div><div style="font-size:22px;font-weight:700">' +
    currentUser.name +
    '</div><div style="font-size:13px;color:rgba(255,255,255,.65);margin-top:.3rem">' +
    '<span class="role-badge ' + badgeClass + '">' +
    currentUser.roleLabel +
    (currentUser.division ? " · " + currentUser.division : "") +
    '</span>' +
    "</div></div>";
  h +=
    '<div style="text-align:right"><div style="font-size:13px;color:rgba(255,255,255,.5)">Today</div><div style="font-size:18px;font-weight:600">May 14, 2026</div></div>';
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
      "Pending/For Approval",
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
      "Pending/For Clearance",
      "2",
      "Pending endorsement",
      "var(--warn)",
    );
    h += statCard("➡️", "Forwarded to RD", "9", "This week", "var(--info)");
    h += statCard("✅", "Cleared", "5", "Documents endorsed", "var(--success)");
    h += statCard("🔔", "Alerts", "2", "Deadline reminders", "var(--danger)");
  } else if (r === "dc") {
    var incomingCount = visibleDocs.filter((d) => d.kind === "incoming").length;
    var completedCount = visibleDocs.filter(
      (d) => d.status === "Completed",
    ).length;
    var staffCount = USER_ACCOUNTS.filter(
      (u) => u.division === currentUser.division && u.role === "Staff",
    ).length;

    h += statCard(
      "📥",
      "For Clearance/Pending",
      incomingCount,
      "In your division",
      "var(--info)",
    );
    h += statCard("📤", "For Submission", "1", "Ready for ARD", "var(--warn)");
    h += statCard(
      "✅",
      "Completed",
      completedCount || "14",
      "This month",
      "var(--success)",
    );
    h += statCard(
      "👤",
      "Staff Assigned",
      staffCount || "3",
      "Active tasks",
      "var(--navy)",
    );
  } else {
    var assignedCount = visibleDocs.filter(
      (d) => d.kind === "incoming" && d.status === "Pending",
    ).length;
    h += statCard(
      "📌",
      "Assigned to Me",
      assignedCount || "2",
      "Requires action",
      "var(--warn)",
    );
    h += statCard("📝", "In Progress", "1", "Being prepared", "var(--info)");
    h += statCard("✅", "Submitted", "5", "This month", "var(--success)");
    h += statCard("🔔", "Notifications", "2", "Unread", "var(--danger)");
  }
  h += "</div>";

  h += '<div class="grid-three">';
  // Recent docs (filtered by visibility)
  h +=
    '<div class="card"><div class="card-head" style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;"><div class="card-title">Recent Documents</div><button class="btn-sm" onclick="showPage(\'incoming\')" style="font-size: 11px; padding: 0.25rem 0.6rem; min-height: unset;">View All</button></div>';
  h +=
    '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Status</th></tr></thead><tbody>';
  var recentDocs = visibleDocs.filter(function (d) {
    return !(d.conf && r === "staff");
  }).slice(0, 5);
  if (recentDocs.length === 0) {
    h += emptyStateRow(3, "📄", "No recent documents", "Your recent documents will appear here.");
  } else {
    recentDocs.forEach(function (d) {
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
  }
  h += "</tbody></table></div></div>";

  // Card 2: Latest Announcements
  h += '<div class="card">';
  h += '  <div class="card-head">';
  h += '    <div class="card-title">Latest Announcements</div>';
  h += '    <button class="btn-sm" onclick="showPage(\'announcements\')" style="font-size: 11px; padding: 0.25rem 0.6rem; min-height: unset;">View All</button>';
  h += '  </div>';
  h += '  <div id="latest-announcements-list">';
  h += renderLatestAnnouncementsList();
  h += '  </div>';
  h += '</div>';

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

  // Dynamic Deadline alerts
  var deadlines = checkNearDeadlines();
  h +=
    '<div class="card mb15 mt1" style="margin-top:1.25rem"><div class="card-head"><div class="card-title">⚠️ Deadline Alerts</div><div style="font-size:12px;color:var(--muted)">' +
    deadlines.length +
    " active alerts</div></div>";

  if (deadlines.length === 0) {
    h +=
      '<div style="padding:2rem;text-align:center;color:var(--muted)">No upcoming deadlines within 7 days.</div>';
  } else {
    h +=
      '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Deadline</th><th>Urgency</th><th>Actions</th></tr></thead><tbody>';
    deadlines.forEach(function (d) {
      var urgencyClass = d.daysUntilDeadline <= 2 ? "pill-red" : "pill-amber";
      h +=
        '<tr><td style="font-family:monospace;font-weight:600">' +
        d.ref +
        "</td><td>" +
        d.subject +
        '</td><td><span style="color:var(--navy);font-weight:600">' +
        d.deadline +
        '</span></td><td><span class="pill ' +
        urgencyClass +
        '">' +
        d.daysUntilDeadline +
        ' days left</span></td><td><div style="display:flex;gap:.35rem"><button class="btn-sm" onclick="viewDoc(\'' +
        d.ref +
        '\')">View</button><button class="btn-sm primary" onclick="openQuickSend(\'' +
        d.ref +
        "')\">Send</button></div></td></tr>";
    });
    h += "</tbody></table></div>";
  }
  h += "</div>";
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

function renderApproved() {
  var userDocs = getVisibleDocumentsForRole();
  var approvedDocs = userDocs.filter(function (d) {
    return d.status === "Approved" || d.status === "Released";
  });

  var h = "";
  h += '<div class="card">';
  h += '<div class="card-head">';
  h += '<div class="card-title">Approved Documents</div>';
  h +=
    '<div style="font-size:12px;color:var(--muted)">' +
    approvedDocs.length +
    " records found</div>";
  h += "</div>";

  if (approvedDocs.length === 0) {
    h += '<div class="doc-table-wrap"><table class="doc-table"><tbody>' + emptyStateRow(7, "✅", "No approved documents", "Documents that have been approved will appear here.") + '</tbody></table></div>';
  } else {
    h +=
      '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference</th><th>Type</th><th>Division</th><th>Subject</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    approvedDocs.forEach(function (d) {
      var divFull = d.division || "";
      var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
      h +=
        '<tr><td style="font-family:monospace;font-weight:600">' +
        d.ref +
        "</td><td>" +
        d.type +
        "</td><td title=\"" + escapeHtml(divFull) + "\">" +
        divAbbrev +
        "</td><td>" +
        d.subject +
        "</td><td>" +
        d.date +
        "</td><td>" +
        statusPill(d.status) +
        '</td><td style="text-align:right">' +
        '<div style="display:flex;gap:.35rem;justify-content:flex-end">' +
        '<button class="btn-sm" onclick="viewDoc(\'' +
        d.ref +
        "')\">View</button>" +
        '<button class="btn-sm" onclick="printDocument(\'' +
        d.ref +
        "')\">Print</button>" +
        "</div></td></tr>";
    });
    h += "</tbody></table></div>";
  }
  h += "</div>";
  return h;
}

function renderPendingDocs() {
  var visibleDocs = getVisibleDocumentsForRole();
  var pendingDocs = visibleDocs.filter(function (d) {
    var completedStates = ["Approved", "Released", "Archived", "Rejected"];
    return !completedStates.includes(d.status);
  });

  var h = "";
  h +=
    '<div style="font-size:12px;color:var(--muted);margin:-.5rem 0 1rem 0">Aggregated view of all in-progress incoming and outgoing records.</div>';
  h +=
    '<div class="card"><div class="card-head"><div class="card-title">Pending Documents</div><div style="font-size:12px;color:var(--muted)">' +
    pendingDocs.length +
    " records</div></div>";
  h +=
    '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference No.</th><th>Direction</th><th>Type</th><th>From</th><th>Division</th><th>Subject</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  if (pendingDocs.length === 0) {
    h += emptyStateRow(9, "⏳", "No pending documents", "In-progress documents will appear here.");
  } else {
    pendingDocs.forEach(function (d) {
      var conf = d.conf
        ? '<span class="pill pill-red" style="margin-left:4px">Conf.</span>'
        : "";
      var divFull = d.division || "";
      var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
      h +=
        "<tr><td style=\"font-family:monospace;font-size:12px\">" +
        d.ref +
        "</td><td>" +
        flowPill(d.kind) +
        "</td><td>" +
        d.type +
        conf +
        "</td><td>" +
        d.from +
        "</td><td title=\"" + escapeHtml(divFull) + "\">" +
        divAbbrev +
        "</td><td>" +
        d.subject +
        "</td><td>" +
        d.date +
        "</td><td>" +
        statusPill(d.status) +
        '</td><td style="text-align:right">' +
        '<div style="display:flex;gap:.35rem;justify-content:flex-end">' +
        '<button class="btn-sm" onclick="viewDoc(\'' +
        d.ref +
        "')\">View</button>" +
        '<button class="btn-sm" onclick="printDocument(\'' +
        d.ref +
        "')\">Print</button>" +
        "</div></td></tr>";
    });
  }

  h += "</tbody></table></div></div>";
  return h;
}

function renderIncoming() {
  currentIncomingTab = "all";
  var visibleDocs = getVisibleDocumentsForRole();
  var incomingDocs = visibleDocs.filter((d) => d.kind === "incoming");
  var h = "";
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h += '<div class="tab-bar" id="in-tabs"><div class="tab active" onclick="setTab(this,\'all\')">All</div><div class="tab" onclick="setTab(this,\'pending\')">Pending</div><div class="tab" onclick="setTab(this,\'approved\')">Approved</div><div class="tab" onclick="setTab(this,\'released\')">Released</div></div>';
  h += '<button class="btn-sm primary" onclick="openCompose()">+ Send Document</button>';
  h += "</div>";
  h += '<div class="card"><div class="card-head"><div class="card-title">' +
    (currentUser.role === "rd" ? "Pending/For Approval" : ["ard", "oic"].includes(currentUser.role) ? "Pending/For Clearance" : currentUser.role === "dc" ? "For Clearance/Pending" : "Incoming Documents") +
    '</div><div id="incoming-count" style="font-size:12px;color:var(--muted)">' + incomingDocs.length + " records</div></div>";
  h += '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference No.</th><th>Direction</th><th>Type</th><th>From</th><th>Division</th><th>Subject</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="incoming-tbody">';
  if (incomingDocs.length === 0) {
    h += emptyStateRow(9, "📭", "No incoming documents", "Documents addressed to you will appear here.");
  } else {
    incomingDocs.forEach(function (d) {
      var conf = d.conf ? '<span class="pill pill-red" style="margin-left:4px">Conf.</span>' : "";
      var divFull = d.division || "";
      var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
      h += '<tr><td style="font-family:monospace;font-size:12px">' + d.ref + "</td><td>" + flowPill(d.kind) + "</td><td>" + d.type + conf + "</td><td>" + d.from + "</td><td title=\"" + escapeHtml(divFull) + "\">" + divAbbrev + "</td><td>" + d.subject + "</td><td>" + d.date + "</td><td>" + statusPill(d.status) + "</td><td>" + renderActionsMenu(d.ref) + "</td></tr>";
    });
  }
  h += "</tbody></table></div></div>";
  return h;
}

function renderOutgoing() {
  currentOutgoingTab = "all";
  var visibleDocs = getVisibleDocumentsForRole();
  var outgoingDocs = visibleDocs.filter((d) => d.kind === "outgoing");
  var h = "";
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h += '<div class="tab-bar" id="out-tabs"><div class="tab active" onclick="setTab(this,\'all\')">All</div><div class="tab" onclick="setTab(this,\'pending\')">Pending</div><div class="tab" onclick="setTab(this,\'released\')">Released</div></div>';
  h += '<button class="btn-sm primary" onclick="openCompose()">+ Send Document</button>';
  h += "</div>";
  h += '<div class="card"><div class="card-head"><div class="card-title">Outgoing Documents</div><div id="outgoing-count" style="font-size:12px;color:var(--muted)">' + outgoingDocs.length + " records</div></div>";
  h += '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference No.</th><th>Direction</th><th>Type</th><th>To</th><th>Division</th><th>Subject</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="outgoing-tbody">';
  if (outgoingDocs.length === 0) {
    h += emptyStateRow(9, "📤", "No outgoing documents", "Documents you send will appear here.");
  } else {
    outgoingDocs.forEach(function (d) {
      var conf = d.conf ? '<span class="pill pill-red" style="margin-left:4px">Conf.</span>' : "";
      var divFull = d.division || "";
      var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
      h += '<tr><td style="font-family:monospace;font-size:12px">' + d.ref + "</td><td>" + flowPill(d.kind) + "</td><td>" + d.type + conf + "</td><td>" + d.to + "</td><td title=\"" + escapeHtml(divFull) + "\">" + divAbbrev + "</td><td>" + d.subject + "</td><td>" + d.date + "</td><td>" + statusPill(d.status) + "</td><td>" + renderActionsMenu(d.ref) + "</td></tr>";
    });
  }
  h += "</tbody></table></div></div>";
  return h;
}

function renderLogbook() {
  var h = "";

  // Set default view to "my" if not already set
  if (!currentLogbookView || currentLogbookView === "global") {
    currentLogbookView = "my";
  }

  // If admin is viewing a specific division, show that division's logbook
  if (
    isGlobalLogbookRole(currentUser.role) &&
    currentLogbookView === "division" &&
    currentLogbookDivision
  ) {
    return renderDivisionLogbook(currentLogbookDivision);
  }

  // If viewing a specific user's logbook
  if (
    isGlobalLogbookRole(currentUser.role) &&
    currentLogbookView === "user" &&
    currentLogbookUser
  ) {
    return renderUserLogbook(currentLogbookUser.role, currentLogbookUser.name);
  }

  // If admin is viewing RD logbook
  if (isGlobalLogbookRole(currentUser.role) && currentLogbookView === "rd") {
    return renderUserLogbook("rd", USERS.rd.name);
  }

  // If admin is viewing ARD logbook
  if (isGlobalLogbookRole(currentUser.role) && currentLogbookView === "ard") {
    return renderUserLogbook("ard", USERS.ard.name);
  }

  // If admin is viewing Admin logbook (for RD/ARD users)
  if (isGlobalLogbookRole(currentUser.role) && currentLogbookView === "admin") {
    return renderUserLogbook("admin", USERS.admin.name);
  }

  // If admin is viewing divisions logbook
  if (
    isGlobalLogbookRole(currentUser.role) &&
    currentLogbookView === "divisions"
  ) {
    var h =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
    h += '<div style="display:flex;align-items:center;gap:1rem;">';
    h +=
      '<div style="font-size:18px;font-weight:600;color:var(--navy);">Divisions Logbook</div>';
    h += "</div>";
    h +=
      '<div style="display:flex;gap:.5rem"><button class="btn-sm" onclick="openManualLogbook()">✍️ Manual Logbook</button><button class="btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn-sm" onclick="exportLogbookCSV()">⬇️ Export CSV</button></div>';
    h += "</div>";

    h += renderSimpleLogbookNavigation();

    h += renderDivisionFolders();
    return h;
  }

  var visibleDocs = getVisibleLogbookDocs();
  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h += "<div></div>";
  h +=
    '<div style="display:flex;gap:.5rem"><button class="btn-sm" onclick="openManualLogbook()">✍️ Manual Logbook</button><button class="btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn-sm" onclick="exportLogbookCSV()">⬇️ Export CSV</button></div>';
  h += "</div>";

  if (isGlobalLogbookRole(currentUser.role) || currentUser.role === "dc") {
    // Show simple navigation bar for Top Management and Division Chief
    h += renderSimpleLogbookNavigation();
  } else {
    h +=
      '<div style="font-size:12px;color:var(--muted);margin:-.5rem 0 1rem 0">Division logbook only: ' +
      currentUser.division +
      ". You cannot access other division logbooks.</div>";
    h += renderSimpleLogbookNavigation();
  }
  h +=
    '<div class="card"><div style="overflow-x:auto"><table class="doc-table"><thead><tr><th>#</th><th>Reference No.</th><th>Direction</th><th>Date Received</th><th>Last Updated</th><th>Type</th><th>From / Sender</th><th>Division</th><th>Subject</th><th>Routed To</th><th>Status</th><th>Physical Copy</th><th>Actions</th></tr></thead><tbody>';
  if (visibleDocs.length === 0) {
    h += emptyStateRow(13, "📋", "No logbook entries", "Documents logged in this view will appear here.");
  }
  visibleDocs.forEach(function (d, i) {
    var lastUpdated =
      d.tracking && d.tracking.lastUpdated
        ? formatTimestamp(d.tracking.lastUpdated)
        : d.date;
    var divFull = d.division || "";
    var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
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
      lastUpdated +
      "</td><td>" +
      d.type +
      "</td><td>" +
      d.from +
      "</td><td title=\"" + escapeHtml(divFull) + "\">" +
      divAbbrev +
      "</td><td>" +
      d.subject +
      "</td><td>" +
      d.to +
      "</td><td>" +
      statusPill(d.status) +
      "</td><td style=\"text-align:center\">" +
      (d.physicalCopy ? "✔️" : "—") +
      "</td><td>" +
      renderActionsMenu(d.ref, "openLogbookEdit") +
      "</td></tr>";
  });
  h += "</tbody></table></div></div>";
  return h;
}

function renderSimpleLogbookNavigation() {
  var h = '<div class="logbook-nav-bar">';
  var r = currentUser.role;

  if (r === "admin" || r === "rd" || r === "ard" || r === "oic") {
    // Top Management Navigation
    h +=
      '<button class="nav-btn ' +
      (currentLogbookView === "my" ? "active" : "") +
      '" onclick="openMyLogbook()">📋 My Logbook</button>';
    if (r === "admin") {
      h +=
        '<button class="nav-btn ' +
        ((currentLogbookView === "divisions" || currentLogbookView === "division") ? "active" : "") +
        '" onclick="openDivisionsLogbook()">📁 Divisions Logbook</button>';
      h +=
        '<button class="nav-btn ' +
        (currentLogbookView === "rd" ? "active" : "") +
        '" onclick="openRDLogbook()">👔 RD Logbook</button>';
      h +=
        '<button class="nav-btn ' +
        (currentLogbookView === "ard" ? "active" : "") +
        '" onclick="openARDLogbook()">👔 ARD Logbook</button>';
    } else if (r === "rd") {
      h +=
        '<button class="nav-btn ' +
        ((currentLogbookView === "divisions" || currentLogbookView === "division") ? "active" : "") +
        '" onclick="openDivisionsLogbook()">📁 Divisions Logbook</button>';
      h +=
        '<button class="nav-btn ' +
        (currentLogbookView === "admin" ? "active" : "") +
        '" onclick="openAdminLogbook()">👑 Admin Logbook</button>';
      h +=
        '<button class="nav-btn ' +
        (currentLogbookView === "ard" ? "active" : "") +
        '" onclick="openARDLogbook()">👔 ARD Logbook</button>';
    } else {
      h +=
        '<button class="nav-btn ' +
        ((currentLogbookView === "divisions" || currentLogbookView === "division") ? "active" : "") +
        '" onclick="openDivisionsLogbook()">📁 Divisions Logbook</button>';
      h +=
        '<button class="nav-btn ' +
        (currentLogbookView === "rd" ? "active" : "") +
        '" onclick="openRDLogbook()">👔 RD Logbook</button>';
      h +=
        '<button class="nav-btn ' +
        (currentLogbookView === "admin" ? "active" : "") +
        '" onclick="openAdminLogbook()">👑 Admin Logbook</button>';
    }
  } else if (r === "dc") {
    // Division Chief Navigation
    h +=
      '<button class="nav-btn ' +
      (currentLogbookView === "my" ? "active" : "") +
      '" onclick="openMyLogbook()">📋 My Logbook</button>';
    h +=
      '<button class="nav-btn ' +
      (currentLogbookView === "staff" ? "active" : "") +
      '" onclick="openLogbookView(\'staff\')">👥 Staff Logbook</button>';
    h +=
      '<button class="nav-btn ' +
      (currentLogbookView === "supervisor" ? "active" : "") +
      '" onclick="openLogbookView(\'supervisor\')">👤 Supervisor Logbook</button>';
  } else {
    // Staff and Supervisor Navigation
    h +=
      '<button class="nav-btn active" onclick="openMyLogbook()">📋 My Logbook</button>';
  }

  h += "</div>";
  return h;
}

function openLogbookView(view) {
  currentLogbookView = view;
  showPage("logbook");
}

function renderDivisionFolders() {
  var h = '<div class="logbook-section" style="margin-bottom:2rem;">';
  h +=
    '<div class="section-header"><span class="section-icon">📁</span><span class="section-title">Division Document Logbooks</span></div>';
  h += '<div class="folder-grid">';

  DIVISIONS.forEach(function (division) {
    var docCount = DOCS.filter(function (doc) {
      return (doc.division || "ORD") === division.name;
    }).length;

    h +=
      '<div class="logbook-folder division-folder" onclick="openDivisionLogbook(\'' +
      division.name +
      "')\">";
    h += '<div class="folder-icon">📁</div>';
    h += '<div class="folder-content">';
    h += '<div class="folder-name">' + division.shortName + "</div>";
    h += '<div class="folder-description">' + division.name + "</div>";
    h += '<div class="folder-count">' + docCount + " documents</div>";
    h += "</div>";
    h += '<div class="folder-arrow">→</div>';
    h += "</div>";
  });

  h += "</div>";
  h += "</div>";

  return h;
}

function renderUserLogbookFolders() {
  var viewableUsers = getViewableUsers();
  var h = '<div class="logbook-section" style="margin-bottom:2rem;">';
  h +=
    '<div class="section-header"><span class="section-icon">👥</span><span class="section-title">User Document Logbooks</span></div>';
  h += '<div class="folder-grid">';

  viewableUsers.forEach(function (user) {
    var userDocs = getUserLogbookDocs(user.role);
    var docCount = userDocs.length;

    h +=
      '<div class="logbook-folder user-folder" onclick="openUserLogbook(\'' +
      user.role +
      "', '" +
      user.name +
      "')\">";
    h += '<div class="folder-icon">👤</div>';
    h += '<div class="folder-content">';
    h += '<div class="folder-name">' + user.name + "</div>";
    h += '<div class="folder-description">' + user.label + "</div>";
    h += '<div class="folder-count">' + docCount + " documents</div>";
    h += "</div>";
    h += '<div class="folder-arrow">→</div>';
    h += "</div>";
  });

  h += "</div>";
  h += "</div>";

  return h;
}

function renderDivisionLogbook(divisionName) {
  var h = "";
  var divisionDocs = DOCS.filter(function (d) {
    return (d.division || "ORD") === divisionName;
  });

  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h += '<div style="display:flex;align-items:center;gap:1rem;">';
  h +=
    '<div style="font-size:18px;font-weight:600;color:var(--navy);">' +
    divisionName +
    " Document Logbook</div>";
  h += "</div>";
  h +=
    '<div style="display:flex;gap:.5rem"><button class="btn-sm" onclick="openManualLogbook()">✍️ Manual Logbook</button><button class="btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn-sm" onclick="exportLogbookCSV()">⬇️ Export CSV</button></div>';
  h += "</div>";

  h += renderSimpleLogbookNavigation();

  h +=
    '<div style="font-size:12px;color:var(--muted);margin:-.5rem 0 1rem 0">Showing ' +
    divisionDocs.length +
    " documents from " +
    divisionName +
    ".</div>";

  h +=
    '<div class="card"><table class="doc-table"><thead><tr><th>#</th><th>Reference No.</th><th>Direction</th><th>Date Received</th><th>Type</th><th>From / Sender</th><th>Subject</th><th>Routed To</th><th>Status</th><th>Physical Copy</th><th>Actions</th></tr></thead><tbody>';

  if (divisionDocs.length === 0) {
    h += emptyStateRow(11, "📋", "No logbook entries", "No documents found for this division.");
  } else {
    divisionDocs.forEach(function (d, i) {
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
  }

  h += "</tbody></table></div>";
  return h;
}

function openDivisionLogbook(divisionName) {
  currentLogbookView = "division";
  currentLogbookDivision = divisionName;
  showPage("logbook");
}

function backToGlobalLogbook() {
  currentLogbookView = "divisions";
  currentLogbookDivision = null;
  currentLogbookUser = null;
  showPage("logbook");
}

function backToMainLogbook() {
  currentLogbookView = "my";
  currentLogbookDivision = null;
  currentLogbookUser = null;
  showPage("logbook");
}

function renderUserLogbook(userRole, userName) {
  var h = "";
  var userDocs = getUserLogbookDocs(userRole);

  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">';
  h += '<div style="display:flex;align-items:center;gap:1rem;">';
  h +=
    '<div style="font-size:18px;font-weight:600;color:var(--navy);">' +
    userName +
    "'s Document Logbook</div>";
  h += "</div>";
  h +=
    '<div style="display:flex;gap:.5rem"><button class="btn-sm" onclick="openManualLogbook()">✍️ Manual Logbook</button><button class="btn-sm" onclick="window.print()">🖨️ Print</button><button class="btn-sm" onclick="exportLogbookCSV()">⬇️ Export CSV</button></div>';
  h += "</div>";

  h += renderSimpleLogbookNavigation();

  h +=
    '<div style="font-size:12px;color:var(--muted);margin:-.5rem 0 1rem 0">Showing ' +
    userDocs.length +
    " documents from " +
    userName +
    "'s logbook.</div>";

  h +=
    '<div class="card"><table class="doc-table"><thead><tr><th>#</th><th>Reference No.</th><th>Direction</th><th>Date Received</th><th>Type</th><th>From / Sender</th><th>Subject</th><th>Routed To</th><th>Status</th><th>Physical Copy</th><th>Actions</th></tr></thead><tbody>';

  if (userDocs.length === 0) {
    h += emptyStateRow(11, "📋", "No logbook entries", "No documents found in this user's logbook.");
  } else {
    userDocs.forEach(function (d, i) {
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
  }

  h += "</tbody></table></div>";
  return h;
}

function openUserLogbook(userRole, userName) {
  currentLogbookView = "user";
  currentLogbookUser = { role: userRole, name: userName };
  currentLogbookDivision = null;
  showPage("logbook");
}

function openMyLogbook() {
  currentLogbookView = "my";
  currentLogbookUser = null;
  currentLogbookDivision = null;
  showPage("logbook");
}

function openRDLogbook() {
  currentLogbookView = "rd";
  currentLogbookUser = { role: "rd", name: USERS.rd.name };
  currentLogbookDivision = null;
  showPage("logbook");
}

function openARDLogbook() {
  currentLogbookView = "ard";
  currentLogbookUser = { role: "ard", name: USERS.ard.name };
  currentLogbookDivision = null;
  showPage("logbook");
}

function openAdminLogbook() {
  currentLogbookView = "admin";
  currentLogbookUser = null;
  currentLogbookDivision = null;
  showPage("logbook");
}

function openDivisionsLogbook() {
  currentLogbookView = "divisions";
  currentLogbookUser = null;
  currentLogbookDivision = null;
  showPage("logbook");
}



function renderCompose() {
  return '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">Use the "New Document" button to compose or upload new records.</div>';
}

function renderProfile() {
  return (
    '<div class="card"><div class="card-head"><div class="card-title">User Profile</div></div>' +
    '<div style="padding:1rem"><strong>Name:</strong> ' +
    currentUser.name +
    "<br><strong>Role:</strong> " +
    currentUser.roleLabel +
    "<br><strong>Division:</strong> " +
    (currentUser.division || "N/A") +
    "</div></div>"
  );
}

function renderSettings() {
  return '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">System settings are managed by the Administrator.</div>';
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

  // Add expired document notifications for admin, ARD, RD, and Custodian roles
  if (["admin", "ard", "rd", "custodian"].includes(currentUser.role)) {
    var expiredDocStatus = checkExpiredDocuments();

    // Add expired documents
    expiredDocStatus.expired.forEach(function (doc) {
      notifs.unshift({
        icon: "🚨",
        text: `Document <strong>${doc.ref}</strong> has EXPIRED and needs immediate disposal`,
        time: "Just now",
        read: false,
      });
    });

    // Add near-expiry documents
    expiredDocStatus.nearExpiry.forEach(function (doc) {
      notifs.unshift({
        icon: "⚠️",
        text: `Document <strong>${doc.ref}</strong> expires in ${doc.daysUntilDisposal} days and needs disposal`,
        time: "Just now",
        read: false,
      });
    });
  }
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
  var r = currentUser.role;
  var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(r);
  if (!isTopMgmt && r !== "dc" && r !== "custodian") {
    return '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">User management is available for Admin, Regional Director, Division Chief, and Division Custodian only.</div>';
  }
  var h =
    '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:1.25rem"><button class="btn-sm primary" onclick="openAddUserModal()">+ Add User</button></div>';

  var authorityText = "";
  if (isTopMgmt) {
    authorityText =
      "Top Management Authority: full access over all users and system functions. Can add or modify users with any role.";
  } else if (r === "custodian") {
    authorityText =
      "Division Custodian Authority: manage users in your division only (access, password reset, activate/deactivate). Can add division users. New users remain Pending until Admin approval.";
  } else {
    authorityText =
      "Division Chief Authority: manage users in your division only (access, password reset, activate/deactivate). Can add Staff and Supervisor roles for your division. New users remain Pending until Admin approval.";
  }

  h +=
    '<div class="card" style="margin-bottom:.75rem;font-size:12px;color:var(--muted)">' +
    authorityText +
    "</div>";
  if (userMgmtNotice) {
    h +=
      '<div class="card" style="margin-bottom:.75rem;font-size:12px;color:var(--success)">' +
      userMgmtNotice +
      "</div>";
  }
  h += '<div class="card">';
  h +=
    '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Name</th><th>Role</th><th>Division</th><th>Email</th><th>Document Access</th><th>Function Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  var visibleUsers = USER_ACCOUNTS.filter(function (u) {
    if (isTopMgmt) return true;
    return u.division === currentUser.division;
  });

  if (visibleUsers.length === 0) {
    h += emptyStateRow(8, "👥", "No users found", "Users in your division will appear here.");
  }

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
      ? '<div style="display:flex;gap:.3rem;flex-wrap:nowrap;width:max-content;"><button class="btn-sm" onclick="openAccessModal(\'' +
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
  h += "</tbody></table></div></div>";
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
    tempPassword: "password",
    docAccess: "Full",
    funcAccess: "Full",
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs",
      "pending-docs",
      "approved",
      "logbook",
      "search",
      "archive",
      "disposal",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
  {
    id: "u-rd",
    name: "Dir. RDJEN",
    role: "RD",
    division: "ORD",
    email: "rdjen@depdev7.gov.ph",
    status: "Active",
    tempPassword: "password",
    docAccess: "Full",
    funcAccess: "Approval",
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","approved",
      "logbook",
      "search",
      "archive",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
  {
    id: "u-ard",
    name: "ARD Mark",
    role: "ARD",
    division: "ORD",
    email: "mark@depdev7.gov.ph",
    status: "Active",
    tempPassword: "password",
    docAccess: "Full",
    funcAccess: "Clearance",
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","approved",
      "logbook",
      "search",
      "archive",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
  {
    id: "u-dc",
    name: "Chief Reyes",
    role: "Division Chief",
    division: "Finance and Administrative Division",
    email: "reyes@depdev7.gov.ph",
    status: "Active",
    tempPassword: "password",
    docAccess: "Division",
    funcAccess: "Division Manager",
    oicApproved: null,
    oicRequest: null,
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
  {
    id: "u-custodian",
    name: "Clara Custodian",
    role: "Division Custodian",
    division: "Finance and Administrative Division",
    email: "clara@depdev7.gov.ph",
    status: "Active",
    tempPassword: "password",
    docAccess: "Division",
    funcAccess: "Division Manager",
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "search",
      "archive",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
  {
    id: "u-staff-ana",
    name: "Staff Ana",
    role: "Staff",
    division: "Finance and Administrative Division",
    email: "ana@depdev7.gov.ph",
    status: "Pending",
    tempPassword: "password",
    docAccess: "Division",
    funcAccess: "Basic",
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
  {
    id: "u-sup-jose",
    name: "Supervisor Jose",
    role: "Supervisor",
    division: "Monitoring and Evaluation Division",
    email: "jose@depdev7.gov.ph",
    status: "Active",
    tempPassword: "password",
    docAccess: "Division",
    funcAccess: "Supervisor",
    features: [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "notifications",
      "announcements",
      "enhanced-reports",
    ],
  },
];

function getFeaturesForRole(role) {
  var topMgmtRoles = ["admin", "Admin", "rd", "RD", "ard", "ARD", "oic", "OIC"];
  if (topMgmtRoles.includes(role)) {
    var f = [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "search",
      "archive",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ];
    if (role === "admin" || role === "Admin") {
      f.push("disposal");
    }
    return f;
  }
  if (role === "dc" || role === "Division Chief")
    return [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ];
  if (role === "custodian" || role === "Division Custodian")
    return [
      "dashboard",
      "incoming",
      "outgoing",
      "pending-docs","logbook",
      "search",
      "archive",
      "users",
      "notifications",
      "announcements",
      "enhanced-reports",
    ];
  return [
    "dashboard",
    "incoming",
    "outgoing",
      "pending-docs","logbook",
    "notifications",
    "announcements",
    "enhanced-reports",
  ];
}

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
  var r = currentUser.role;
  // Top management (Admin, RD, ARD, OIC) can manage all accounts
  if (["admin", "rd", "ard", "oic"].includes(r)) return true;
  // Division Custodian can manage all users in their division
  if (r === "custodian") {
    return userAccount.division === currentUser.division;
  }
  // Division Chiefs can only manage their division
  if (r === "dc") {
    if (userAccount.division !== currentUser.division) return false;
    return (
      userAccount.role === "Division Chief" ||
      userAccount.role === "Supervisor" ||
      userAccount.role === "Staff"
    );
  }
  return false;
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

  // Save OIC Approval
  var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(currentUser.role);
  var oicAppEl = document.getElementById("um-oic-approved");
  if (oicAppEl && isTopMgmt) {
    user.oicApproved = oicAppEl.value || null;
    user.oicRequest = null; // Clear pending request since admin resolved it!
  }

  // Save features
  var features = [];
  document
    .querySelectorAll('input[name="um-feature"]:checked')
    .forEach(function (cb) {
      features.push(cb.value);
    });
  user.features = features;

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
  var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(currentUser.role);
  if (user.status === "Pending" && !isTopMgmt) {
    setUserMgmtNotice(
      "Access denied. Only Top Management can approve pending accounts.",
    );
    showError(
      "Access denied. Only Top Management can approve pending accounts.",
    );
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
      setUserMgmtNotice("Account approved: " + user.name + " is now Active.");
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
      showSuccess(
        "Account status updated: " + user.name + " is now Deactivated.",
      );
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
  var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(currentUser.role);
  if (user.status === "Pending" && !isTopMgmt) {
    setUserMgmtNotice(
      "Access denied. Only Top Management can approve pending accounts.",
    );
    showError(
      "Access denied. Only Top Management can approve pending accounts.",
    );
    closeUserMgmtModal();
    showPage("users");
    return;
  }
  user.status = nextStatus;
  setUserMgmtNotice(
    "Account status updated: " + user.name + " is now " + nextStatus + ".",
  );
  showSuccess(
    "Account status updated: " + user.name + " is now " + nextStatus + ".",
  );
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
  var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(currentUser.role);

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
    !isTopMgmt &&
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

  // Division validation for non-top management
  if (!isTopMgmt && division !== currentUser.division) {
    userMgmtNotice =
      "Error: Division Chiefs can only add users to their own division.";
    showError(userMgmtNotice.replace(/^Error:\s*/, ""));
    showPage("users");
    return;
  }
  if (!isTopMgmt) {
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
    features: getFeaturesForRole(role),
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
    custodian: "Division",
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
    custodian: "Division Manager",
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
    var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(currentUser.role);
    var availableRoles = isTopMgmt
      ? '<option value="">- Select role -</option><option value="admin">Admin</option><option value="rd">RD</option><option value="ard">ARD</option><option value="oic">OIC</option><option value="dc">Division Chief</option><option value="custodian">Division Custodian</option><option value="supervisor">Supervisor</option><option value="staff">Staff</option>'
      : '<option value="">- Select role -</option><option value="supervisor">Supervisor</option><option value="staff">Staff</option>';

    var divisionOptions = isTopMgmt
      ? '<option value="">- Select division -</option><option value="Monitoring and Evaluation Division">Monitoring and Evaluation Division</option><option value="Policy Formulation and Planning Division">Policy Formulation and Planning Division</option><option value="Project Development, Investment Programming and Budget Division">Project Development, Investment Programming and Budget Division</option><option value="Development and Research Division">Development and Research Division</option><option value="Finance and Administrative Division">Finance and Administrative Division</option><option value="ORD">Office of the Regional Director</option>'
      : '<option value="' +
      currentUser.division +
      '" selected>' +
      currentUser.division +
      "</option>";
    var statusOptions = isTopMgmt
      ? '<option value="Active">Active</option><option value="Pending" selected>Pending</option>'
      : '<option value="Pending" selected>Pending (Admin approval required)</option>';

    h +=
      '<div class="modal-overlay open"><div class="modal" style="max-width:580px"><div class="modal-head"><h3>' +
      (isTopMgmt ? "Add New User" : "Add Division User") +
      '</h3><span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')">✕</span></div><div class="modal-body"><div class="form-row"><div class="field"><label>First Name</label><input id="add-user-first-name" type="text" placeholder="First name" /></div><div class="field"><label>Last Name</label><input id="add-user-last-name" type="text" placeholder="Last name" /></div></div><div class="field"><label>Email Address</label><input id="add-user-email" type="email" placeholder="user@deped.gov.ph" /></div><div class="field"><label>Role</label><select id="add-user-role">' +
      availableRoles +
      '</select></div><div class="field"><label>Division</label><select id="add-user-division">' +
      divisionOptions +
      '</select></div><div class="field"><label>Initial Status</label><select id="add-user-status">' +
      statusOptions +
      '</select></div><div style="font-size:12px;color:var(--muted);margin-top:1rem;">' +
      (isTopMgmt
        ? "Top Management can add users with any role and division."
        : "Division Chief can only add Staff and Supervisor roles within their division.") +
      '</div></div><div class="modal-footer"><button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')">Cancel</button><button class="btn-send" onclick="saveNewUser()">Add User</button></div></div></div>';
  }

  if (userMgmtModal.type === "access" && user) {
    var allFeatures = [
      { id: "dashboard", label: "Dashboard" },
      { id: "incoming", label: "Incoming Documents" },
      { id: "outgoing", label: "Outgoing Documents" },
      { id: "pending-docs", label: "Pending Documents" },
      { id: "approved", label: "Approved Documents" },
      { id: "logbook", label: "Document Logbook" },
      { id: "search", label: "Document Search" },
      { id: "archive", label: "Archive" },
      { id: "disposal", label: "Disposal Management" },
      { id: "users", label: "User Management" },
      { id: "notifications", label: "Notifications" },
      { id: "enhanced-reports", label: "Reports" },
    ];

    var featureCheckboxes = "";
    allFeatures.forEach(function (f) {
      var checked =
        user.features && user.features.includes(f.id) ? "checked" : "";
      featureCheckboxes +=
        '<label style="display:flex;align-items:center;gap:.5rem;font-size:13px;margin-bottom:.5rem;cursor:pointer">' +
        '<input type="checkbox" name="um-feature" value="' +
        f.id +
        '" ' +
        checked +
        ' style="width:auto;margin:0" /> ' +
        f.label +
        "</label>";
    });

    var oicSection = "";
    var isTopMgmt = ["admin", "rd", "ard", "oic"].includes(currentUser.role);
    if ((user.role === "Division Chief" || user.role === "dc") && isTopMgmt) {
      var currentOicApproved = user.oicApproved || "";
      var isARD = currentUser.role === "ard" || currentUser.role === "oic";

      var optionsHtml = '<option value=""' + (currentOicApproved === "" ? " selected" : "") + '>No OIC Designation (Normal Chief)</option>';
      if (!isARD) {
        optionsHtml += '<option value="rd"' + (currentOicApproved === "rd" ? " selected" : "") + '>Designate as OIC for Regional Director (RD)</option>';
      }
      optionsHtml += '<option value="ard"' + (currentOicApproved === "ard" ? " selected" : "") + '>Designate as OIC for Asst. Regional Director (ARD)</option>';

      oicSection =
        '<div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">' +
        '<label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #b78103; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">' +
        '<span style="font-size: 14px;">👑</span> Officer-in-Charge (OIC) Authority Designation</label>' +
        '<div style="display: flex; gap: 1rem; align-items: center;">' +
        '<select id="um-oic-approved" style="flex: 1; padding: 0.75rem; border: 1px solid #ffe082; border-radius: 8px; font-size: 14px; background: #fff; color: #475569; cursor: pointer;">' +
        optionsHtml +
        '</select>' +
        '</div>' +
        (user.oicRequest
          ? '<div style="margin-top: 0.75rem; font-size: 12px; color: #b78103; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">' +
          '<span>⚠️</span> Pending request to assume OIC ' + (user.oicRequest === "rd" ? "Regional Director" : "Assistant Regional Director") + ' duties.' +
          '</div>'
          : '') +
        '</div>';
    }

    h +=
      '<div class="modal-overlay open">' +
      '<div class="modal" style="max-width:650px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: none;">' +
      '<div class="modal-head" style="background: linear-gradient(to right, var(--navy), var(--navy2)); color: #fff; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between;">' +
      '<div><h3 style="margin:0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.025em;">Edit Access Control</h3>' +
      '<div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">User: ' +
      user.name +
      "</div></div>" +
      '<span class="modal-close" onclick="closeUserMgmtModal();showPage(\'users\')" style="color: #fff; opacity: 0.6; cursor: pointer; font-size: 1.5rem; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">✕</span>' +
      "</div>" +
      '<div class="modal-body" style="padding: 2rem; background: #fff;">' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">' +
      '<div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0;">' +
      '<label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--navy); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;">' +
      '<span style="font-size: 14px;">📄</span> Document Access</label>' +
      '<select id="um-doc-access" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #fff; color: var(--text); cursor: pointer; transition: border-color 0.2s;">' +
      "<option" +
      (user.docAccess === "Full" ? " selected" : "") +
      ">Full</option>" +
      "<option" +
      (user.docAccess === "Division" ? " selected" : "") +
      ">Division</option>" +
      "<option" +
      (user.docAccess === "None" ? " selected" : "") +
      ">None</option>" +
      "</select>" +
      "</div>" +
      '<div style="background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0;">' +
      '<label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--navy); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;">' +
      '<span style="font-size: 14px;">⚙️</span> Function Access</label>' +
      '<select id="um-func-access" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #fff; color: var(--text); cursor: pointer; transition: border-color 0.2s;">' +
      "<option" +
      (user.funcAccess === "Full" ? " selected" : "") +
      ">Full</option>" +
      "<option" +
      (user.funcAccess === "Division Manager" ? " selected" : "") +
      ">Division Manager</option>" +
      "<option" +
      (user.funcAccess === "Supervisor" ? " selected" : "") +
      ">Supervisor</option>" +
      "<option" +
      (user.funcAccess === "Basic" ? " selected" : "") +
      ">Basic</option>" +
      "<option" +
      (user.funcAccess === "None" ? " selected" : "") +
      ">None</option>" +
      "</select>" +
      "</div>" +
      "</div>" +
      oicSection +
      '<div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">' +
      '<label style="display: block; font-weight: 700; color: var(--navy); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem;">Custom Feature Access</label>' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">' +
      featureCheckboxes +
      "</div>" +
      "</div>" +
      '<div style="margin-top: 2rem; padding: 1rem; background: #eff6ff; border-radius: 10px; border: 1px solid #bfdbfe; display: flex; gap: 0.75rem; align-items: flex-start;">' +
      '<span style="font-size: 18px; margin-top: -2px;">ℹ️</span>' +
      '<p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.6;">' +
      "<strong>Administrative Note:</strong> Customizing feature access will override the system's default role-based navigation for this user. These changes will be applied instantly upon saving." +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="modal-footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 1.25rem 2rem; display: flex; justify-content: flex-end; gap: 1rem;">' +
      '<button class="btn-sec" onclick="closeUserMgmtModal();showPage(\'users\')" style="padding: 0.75rem 1.5rem; font-weight: 600; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; color: #475569; cursor: pointer; transition: all 0.2s;">Cancel</button>' +
      '<button class="btn-send" onclick="saveAccessChanges()" style="padding: 0.75rem 2rem; background: var(--navy); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0, 48, 96, 0.2); transition: all 0.2s;" onmouseover="this.style.transform=\'translateY(-1px)\'; this.style.boxShadow=\'0 10px 15px -3px rgba(0, 48, 96, 0.3)\'" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 4px 6px -1px rgba(0, 48, 96, 0.2)\'">Save Access Changes</button>' +
      "</div>" +
      "</div>";
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
    '<div id="um-acct-notice" style="display:none;margin-top:1rem;padding:0.75rem 1rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:13px;font-weight:500;"></div>' +
    '<div class="modal-footer">' +
    '<button class="btn-sec" onclick="closeAccountSettings()">Cancel</button>' +
    '<button class="btn-send" onclick="saveAccountSettings()">Save Changes</button>' +
    "</div>" +
    "</div></div>";

  var container = document.getElementById("global-modal-container");
  if (!container) return;
  container.innerHTML = html;
  document.body.classList.add("modal-open");
  // Set initial manual/passwordless state
  setAccountPassMode("manual");
}

function closeAccountSettings() {
  var container = document.getElementById("global-modal-container");
  if (container) container.innerHTML = "";
  document.body.classList.remove("modal-open");
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

  // Clear error message when switching modes
  var noticeEl = document.getElementById("um-acct-notice");
  if (noticeEl) {
    noticeEl.textContent = "";
    noticeEl.style.display = "none";
  }

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
    showError("Please enter your name.");
    return;
  }

  var modeEl = document.querySelector('input[name="um-pass-mode"]:checked');
  var passMode = modeEl ? modeEl.value : "manual";

  var noticeEl = document.getElementById("um-acct-notice");
  if (noticeEl) {
    noticeEl.textContent = "";
    noticeEl.style.display = "none";
  }

  if (passMode === "manual") {
    var newPassEl = document.getElementById("um-acct-new-password");
    var newPass = (newPassEl && newPassEl.value ? newPassEl.value : "").trim();
    if (!newPass) {
      if (noticeEl) {
        noticeEl.textContent = "⚠️ Please enter a new password (or choose passwordless login).";
        noticeEl.style.display = "block";
      }
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

  // Update currentUser
  var oldName = currentUser.name;
  currentUser.name = newName;
  currentUser.initial = (newName[0] || "U").toUpperCase();

  // Update profile picture
  PROFILE_PICS[key] = pendingProfilePicDataUrl || PROFILE_PICS[key] || "";

  // Update USERS entry so recipient dropdown shows the latest name
  Object.keys(USERS).forEach(function (k) {
    if (USERS[k].role === currentUser.role) {
      USERS[k].name = newName;
      USERS[k].initial = currentUser.initial;
    }
  });

  // Update USER_ACCOUNTS array
  var userAccount = USER_ACCOUNTS.find(function (u) {
    return u.id === currentUser.id || u.email === currentUser.email;
  });
  if (userAccount) {
    userAccount.name = newName;
    if (passMode === "manual") {
      userAccount.tempPassword = ACCOUNT_SECURITY_META[key].tempPassword;
      userAccount.passwordMode = "required";
    } else {
      userAccount.passwordMode = "passwordless";
      userAccount.tempPassword = "";
    }
  }

  // Update sidebar display immediately
  var sbName = document.getElementById("sb-name");
  var sbAvatar = document.getElementById("sb-avatar");
  if (sbName) sbName.textContent = newName;
  if (sbAvatar) {
    if (PROFILE_PICS[key]) {
      sbAvatar.style.backgroundImage = "url('" + PROFILE_PICS[key] + "')";
      sbAvatar.style.backgroundSize = "cover";
      sbAvatar.style.backgroundPosition = "center";
      sbAvatar.textContent = "";
    } else {
      sbAvatar.style.backgroundImage = "none";
      sbAvatar.textContent = currentUser.initial;
    }
  }

  // Close modal first
  closeAccountSettings();

  // Show success message and refresh dashboard to show the changes
  setTimeout(function () {
    showSuccess("Profile updated successfully!");
    showPage("dashboard");
  }, 100);

  // Log the change for debugging
  console.log("Profile updated: " + oldName + " → " + newName);
}

function renderSearch() {
  var visibleDocs = getVisibleDocumentsForRole();

  // Collect unique types and divisions from visible docs
  var types = ["All types"];
  var divisions = ["All divisions"];
  visibleDocs.forEach(function (d) {
    if (d.type && !types.includes(d.type)) types.push(d.type);
    if (d.division && !divisions.includes(d.division)) divisions.push(d.division);
  });
  types.sort();
  divisions.sort();

  var typeOptions = types.map(function (t) {
    return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
  }).join("");

  var statusOptions = [
    "All statuses",
    "For ARD Clearance",
    "For RD Approval",
    "Approved",
    "Released",
    "Archived",
  ].map(function (s) {
    return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
  }).join("");

  var divisionOptions = divisions.map(function (d) {
    return '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + '</option>';
  }).join("");

  var inputStyle = 'style="width:100%;padding:.5rem .85rem;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;background:#fff;"';

  var h = '<div class="card mb15">';
  h += '<div class="card-title" style="margin-bottom:1rem">Search Documents</div>';
  h += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:.75rem;margin-bottom:.75rem">';
  h += '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Keyword / Reference No.</label>';
  h += '<input id="search-keyword" ' + inputStyle + ' placeholder="e.g. 2026-04, memorandum, promotion..." oninput="executeSearch()" /></div>';
  h += '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Document Type</label>';
  h += '<select id="search-type" ' + inputStyle + ' onchange="executeSearch()">' + typeOptions + '</select></div>';
  h += '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Status</label>';
  h += '<select id="search-status" ' + inputStyle + ' onchange="executeSearch()">' + statusOptions + '</select></div>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;margin-bottom:.75rem">';
  h += '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Direction</label>';
  h += '<select id="search-kind" ' + inputStyle + ' onchange="executeSearch()">';
  h += '<option value="">All directions</option><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option>';
  h += '</select></div>';
  h += '<div><label style="font-size:12px;color:var(--muted);font-weight:600;display:block;margin-bottom:.3rem">Division</label>';
  h += '<select id="search-division" ' + inputStyle + ' onchange="executeSearch()">' + divisionOptions + '</select></div>';
  h += '<div style="display:flex;align-items:flex-end;gap:.5rem">';
  h += '<button class="btn-sm primary" onclick="executeSearch()" style="padding:.5rem 1.25rem;height:34px">🔍 Search</button>';
  h += '<button class="btn-sm" onclick="clearSearch()" style="padding:.5rem 1rem;height:34px">✕ Clear</button>';
  h += '</div></div></div>';

  // Results card — pre-populate with all visible docs
  h += '<div class="card">';
  h += '<div class="card-head">';
  h += '<div class="card-title">Results</div>';
  h += '<div id="search-count" style="font-size:12px;color:var(--muted)">' + visibleDocs.length + ' documents</div>';
  h += '</div>';
  h += '<div class="doc-table-wrap">';
  h += '<table class="doc-table"><thead><tr>';
  h += '<th>Reference No.</th><th>Direction</th><th>Type</th><th>From</th><th>To</th><th>Division</th><th>Subject</th><th>Date</th><th>Status</th><th>Actions</th>';
  h += '</tr></thead>';
  h += '<tbody id="search-results-tbody">';
  h += buildSearchRows(visibleDocs);
  h += '</tbody></table></div></div>';

  return h;
}

function buildSearchRows(docs) {
  if (docs.length === 0) {
    return '<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--muted);">' +
      '<div style="font-size:2rem;margin-bottom:.5rem">🔍</div>' +
      '<div style="font-weight:600;margin-bottom:.25rem">No documents found</div>' +
      '<div style="font-size:12px">Try adjusting your search filters</div>' +
      '</td></tr>';
  }
  return docs.map(function (d) {
    var divFull = d.division || "";
    var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
    var conf = d.conf ? '<span class="pill pill-red" style="margin-left:4px;font-size:9px">Conf.</span>' : "";
    return '<tr>' +
      '<td style="font-family:monospace;font-size:12px;font-weight:600">' + escapeHtml(d.ref || "") + '</td>' +
      '<td>' + flowPill(d.kind || "incoming") + '</td>' +
      '<td>' + escapeHtml(d.type || "—") + conf + '</td>' +
      '<td>' + escapeHtml(d.from || "—") + '</td>' +
      '<td>' + escapeHtml(d.to || "—") + '</td>' +
      '<td title="' + escapeHtml(divFull) + '">' + escapeHtml(divAbbrev) + '</td>' +
      '<td>' + escapeHtml(d.subject || "—") + '</td>' +
      '<td style="white-space:nowrap">' + escapeHtml(d.date || "—") + '</td>' +
      '<td>' + statusPill(d.status || "") + '</td>' +
      '<td><button class="btn-sm" onclick="viewDoc(\'' + escapeHtml(d.ref || "") + '\')">View</button></td>' +
      '</tr>';
  }).join("");
}

function executeSearch() {
  var keyword = ((document.getElementById("search-keyword") || {}).value || "").trim().toLowerCase();
  var type = ((document.getElementById("search-type") || {}).value || "").trim();
  var status = ((document.getElementById("search-status") || {}).value || "").trim();
  var kind = ((document.getElementById("search-kind") || {}).value || "").trim();
  var division = ((document.getElementById("search-division") || {}).value || "").trim();

  var visibleDocs = getVisibleDocumentsForRole();

  var results = visibleDocs.filter(function (d) {
    // Keyword — match ref, subject, from, to
    if (keyword) {
      var haystack = [d.ref, d.subject, d.from, d.to, d.type, d.division]
        .join(" ").toLowerCase();
      if (haystack.indexOf(keyword) === -1) return false;
    }
    // Type
    if (type && type !== "All types" && d.type !== type) return false;
    // Status
    if (status && status !== "All statuses" && d.status !== status) return false;
    // Direction
    if (kind && d.kind !== kind) return false;
    // Division
    if (division && division !== "All divisions" && (d.division || "") !== division) return false;

    return true;
  });

  var tbody = document.getElementById("search-results-tbody");
  if (tbody) tbody.innerHTML = buildSearchRows(results);

  var countEl = document.getElementById("search-count");
  if (countEl) {
    countEl.textContent = results.length + " document" + (results.length !== 1 ? "s" : "") + " found";
  }
}

function clearSearch() {
  var fields = ["search-keyword", "search-type", "search-status", "search-kind", "search-division"];
  fields.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "INPUT") el.value = "";
    else el.selectedIndex = 0;
  });
  executeSearch();
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
  var options = '<option value="" disabled selected hidden>Options</option>';
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
    "')\">" +
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

  var folderOptions = ARCHIVE_FOLDERS.map(
    (f) => '<option value="' + f.id + '">' + f.name + "</option>",
  ).join("");

  var currentFolder = doc.archiveFolder || "default";

  var dialog = document.createElement("div");
  dialog.className = "modal-overlay open";
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
            ${ARCHIVE_FOLDERS.find((f) => f.id === currentFolder)?.name || "General Archive"}
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
  dialog.querySelector("#move-folder-select").value = currentFolder;
}

function confirmMoveToFolder(ref, button) {
  var select = document.querySelector("#move-folder-select");
  var folderId = select.value;

  if (folderId) {
    moveDocumentToFolder(ref, folderId);
    button.closest(".modal-overlay").remove();
  }
}

function showCreateFolderDialog() {
  var dialog = document.createElement("div");
  dialog.className = "modal-overlay open";
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
  setTimeout(() => dialog.querySelector("#new-folder-name").focus(), 100);
}

function confirmCreateFolder(button) {
  var input = document.querySelector("#new-folder-name");
  var folderName = input.value.trim();

  if (folderName) {
    createArchiveFolder(folderName);
    button.closest(".modal-overlay").remove();
  }
}

function showRenameFolderDialog(folderId, currentName) {
  var dialog = document.createElement("div");
  dialog.className = "modal-overlay open";
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
    var input = dialog.querySelector("#rename-folder-name");
    input.focus();
    input.select();
  }, 100);
}

function confirmRenameFolder(folderId, button) {
  var input = document.querySelector("#rename-folder-name");
  var newName = input.value.trim();

  if (newName) {
    renameArchiveFolder(folderId, newName);
    button.closest(".modal-overlay").remove();
  }
}

function archiveDocument(ref) {
  var d = getDocByRef(ref);
  if (!d) return;
  if (!isArchiveAllowedForCurrentUser(d)) {
    showError(
      "Access denied. You can only archive documents in your division.",
    );
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

    ensureTrail(d);
    d.tracking.trail.push({
      user: currentUser.name,
      action: "Archived",
      timestamp: new Date().toISOString(),
    });
    d.tracking.lastUpdated = new Date().toISOString();
    d.tracking.lastActor = currentUser.role;
    d.tracking.updatedBy = currentUser.name;

    showSuccess("Document " + ref + " archived.");
    showPage("archive");
  });
}

function unarchiveDocument(ref) {
  var d = getDocByRef(ref);
  if (!d) return;
  if (!isArchiveAllowedForCurrentUser(d)) {
    showError(
      "Access denied. You can only unarchive documents in your division.",
    );
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

    ensureTrail(d);
    d.tracking.trail.push({
      user: currentUser.name,
      action: "Released",
      timestamp: new Date().toISOString(),
    });
    d.tracking.lastUpdated = new Date().toISOString();
    d.tracking.lastActor = currentUser.role;
    d.tracking.updatedBy = currentUser.name;

    showSuccess("Document " + ref + " restored to Released.");
    showPage("archive");
  });
}

function isArchiveAllowedForCurrentUser(doc) {
  if (isGlobalLogbookRole(currentUser.role)) return true;
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
  if (!isGlobalLogbookRole(currentUser.role) && currentUser.role !== "dc") {
    return (
      '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">' +
      "Archive management is available for Admin, RD, ARD, and Division Chief only." +
      "</div>"
    );
  }

  // If a specific folder is open
  if (currentArchiveFolderId) {
    return renderArchiveFolderContents(currentArchiveFolderId);
  }

  var h = "";

  // Archive Folders Section
  h +=
    '<div class="card mb15"><div class="card-head"><div class="card-title">Archive Folders</div>';
  h +=
    '<div class="card-action"><button class="btn-sm primary" onclick="showCreateFolderDialog()">+ New Folder</button></div></div>';
  h += '<div class="archive-folder-grid">';

  ARCHIVE_FOLDERS.forEach(function (folder) {
    var docCount = DOCS.filter(
      (d) =>
        d.status === "Archived" && (d.archiveFolder || "default") === folder.id,
    ).length;
    var isDefault = folder.id === "default";

    h +=
      '<div class="archive-folder-card" onclick="openArchiveFolder(\'' +
      folder.id +
      "')\">";

    // Actions (hover)
    if (!isDefault) {
      h += '<div class="archive-folder-actions">';
      h +=
        '<button class="archive-folder-btn" title="Rename" onclick="event.stopPropagation(); showRenameFolderDialog(\'' +
        folder.id +
        "', '" +
        folder.name +
        "')\">✏️</button>";
      h +=
        '<button class="archive-folder-btn danger" title="Delete" onclick="event.stopPropagation(); deleteArchiveFolder(\'' +
        folder.id +
        "')\">🗑️</button>";
      h += "</div>";
    }

    // Main Content
    h += '<div class="archive-folder-main">';
    h += '<div class="archive-folder-icon">📁</div>';
    h += '<div class="archive-folder-info">';
    h +=
      '<div class="archive-folder-name">' + escapeHtml(folder.name) + "</div>";
    h += '<div class="archive-folder-count">' + docCount + " documents</div>";
    h += "</div>";
    h += "</div>";

    // Meta
    h += '<div class="archive-folder-meta">';
    h += "<span>Created: " + folder.created + "</span>";
    h += "<span>" + folder.createdBy + "</span>";
    h += "</div>";

    h += "</div>";
  });

  h += "</div></div>";

  // Ready to Archive section
  var released = DOCS.filter(function (d) {
    if (d.status !== "Released") return false;
    if (isGlobalLogbookRole(currentUser.role)) return true;
    return (d.division || "ORD") === currentUser.division;
  });

  h += '<div class="archive-table-header">';
  h += '<div class="archive-table-title">📂 Ready to Archive</div>';
  h +=
    '<div style="font-size:12px;color:var(--muted)">' +
    released.length +
    " documents found</div>";
  h += "</div>";

  h += '<div class="card">';
  if (released.length === 0) {
    h += '<div style="padding:3rem;text-align:center;color:var(--muted)">';
    h += '<div style="font-size:32px;margin-bottom:1rem">✨</div>';
    h += "<div>No documents are currently ready for archiving.</div>";
    h += "</div>";
  } else {
    h +=
      '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Release Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    released.forEach(function (d) {
      h +=
        '<tr><td style="font-family:monospace;font-weight:600">' +
        d.ref +
        "</td><td>" +
        d.subject +
        '</td><td style="color:var(--muted)">' +
        d.date +
        "</td><td>" +
        statusPill(d.status) +
        '<td style="text-align:right">' +
        renderArchiveActionsMenu(d.ref, "released") +
        "</td></tr>";
    });
    h += "</tbody></table></div>";
  }
  h += "</div>";

  return h;
}

function openArchiveFolder(folderId) {
  currentArchiveFolderId = folderId;
  showPage("archive");
}

function closeArchiveFolder() {
  currentArchiveFolderId = null;
  showPage("archive");
}

function renderArchiveFolderContents(folderId) {
  var folder = ARCHIVE_FOLDERS.find((f) => f.id === folderId);
  if (!folder) return "";

  var docsInFolder = DOCS.filter(function (d) {
    if (d.status !== "Archived") return false;
    if ((d.archiveFolder || "default") !== folderId) return false;
    if (isGlobalLogbookRole(currentUser.role)) return true;
    return (d.division || "ORD") === currentUser.division;
  });

  var h = "";
  h += '<div style="margin-bottom: 1.5rem;">';
  h +=
    '<button class="btn-sm" onclick="closeArchiveFolder()">← Back to Archive</button>';
  h += "</div>";

  h += '<div class="card">';
  h += '<div class="card-head">';
  h += '<div class="card-title">📁 ' + escapeHtml(folder.name) + "</div>";
  h +=
    '<div style="font-size:12px;color:var(--muted)">' +
    docsInFolder.length +
    " archived documents</div>";
  h += "</div>";

  if (docsInFolder.length === 0) {
    h += '<div style="padding:4rem;text-align:center;color:var(--muted)">';
    h += '<div style="font-size:48px;margin-bottom:1rem;opacity:0.2">📁</div>';
    h += "<div>This folder is empty.</div>";
    h += "</div>";
  } else {
    h +=
      '<div class="doc-table-wrap"><table class="doc-table"><thead><tr><th>Reference</th><th>Subject</th><th>Archived Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    docsInFolder.forEach(function (d) {
      h +=
        '<tr><td style="font-family:monospace;font-weight:600">' +
        d.ref +
        "</td><td>" +
        d.subject +
        '</td><td style="color:var(--muted)">' +
        (d.archivedDate || d.date) +
        "</td><td>" +
        statusPill(d.status) +
        '<td style="text-align:right">' +
        renderArchiveActionsMenu(d.ref, "archived") +
        "</td></tr>";
    });
    h += "</tbody></table></div>";
  }
  h += "</div>";

  return h;
}

// Track where the user came from before viewing a document detail
var previousPage = null;
var previousLogbookContext = null;

function getPageDisplayName(page) {
  var names = {
    dashboard: "Dashboard",
    incoming: "Incoming Documents",
    outgoing: "Outgoing Documents",
    "pending-docs": "Pending Documents",
    logbook: "Document Logbook",
    search: "Search Documents",
    archive: "Archive",
    disposal: "Disposal Management",
    users: "User Management",
    approved: "Approved Documents",
    announcements: "Bulletin Board",
    notifications: "Notifications",
    "enhanced-reports": "Reports",
  };
  return names[page] || (page.charAt(0).toUpperCase() + page.slice(1));
}

function goBackFromDocView() {
  if (previousPage === "logbook" && previousLogbookContext) {
    currentLogbookView = previousLogbookContext.view;
    currentLogbookDivision = previousLogbookContext.division;
    currentLogbookUser = previousLogbookContext.user;
  }
  showPage(previousPage || "dashboard");
}

function viewDoc(ref) {
  var d = DOCS.find(function (x) { return x.ref === ref; });
  if (!d) return;
  if (
    !isGlobalLogbookRole(currentUser.role) &&
    (d.division || "ORD") !== currentUser.division
  ) {
    showError("Access denied. This document belongs to another division logbook.");
    return;
  }

  // Remember where we came from so the back button goes to the right page
  previousPage = currentPage;
  if (currentPage === "logbook") {
    previousLogbookContext = {
      view: currentLogbookView,
      division: currentLogbookDivision,
      user: currentLogbookUser
        ? { role: currentLogbookUser.role, name: currentLogbookUser.name }
        : null,
    };
  } else {
    previousLogbookContext = null;
  }

  var c = document.getElementById("main-content");

  // ── Header ──────────────────────────────────────────────────────────────
  var html = '<button class="btn-sm" onclick="goBackFromDocView()" style="margin-bottom:1rem">← Back to ' + getPageDisplayName(previousPage) + '</button>';
  html += '<div class="doc-view-card">';

  // Title row
  html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">';
  html += '<div>';
  html += '<div style="font-family:monospace;font-size:18px;font-weight:700;color:var(--navy)">' + escapeHtml(d.ref) + '</div>';
  html += '<div style="font-size:13px;color:var(--muted);margin-top:2px">' + escapeHtml(d.type || "—");
  if (d.conf) html += ' · <span class="pill pill-red">CONFIDENTIAL</span>';
  html += '</div></div>';
  html += statusPill(d.status || "");
  html += '</div>';

  // ── Meta grid ────────────────────────────────────────────────────────────
  html += '<div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">';
  html += '<div class="doc-meta-grid">';
  html += '<div class="meta-item"><label>Subject</label><span>' + escapeHtml(d.subject || "—") + '</span></div>';
  html += '<div class="meta-item"><label>From</label><span>' + escapeHtml(d.from || "—") + '</span></div>';
  html += '<div class="meta-item"><label>To / Routed To</label><span>' + escapeHtml(d.to || "—") + '</span></div>';
  html += '<div class="meta-item"><label>Date Received</label><span>' + escapeHtml(d.date || "—") + '</span></div>';
  html += '<div class="meta-item"><label>Direction</label><span style="text-transform:capitalize">' + escapeHtml(d.kind || "—") + '</span></div>';
  html += '<div class="meta-item"><label>Division</label><span>' + escapeHtml(d.division || "ORD") + '</span></div>';
  html += '<div class="meta-item"><label>Physical Copy</label><span>' + (d.physicalCopy ? "Yes" : "No") + '</span></div>';
  if (d.disposalDate) {
    html += '<div class="meta-item"><label>Disposal Date</label><span>' + escapeHtml(d.disposalDate) + '</span></div>';
  }
  html += '</div></div>';

  // ── Routing / Tracking Trail ─────────────────────────────────────────────
  html += '<div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">';
  html += '<div style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:.75rem">Routing History</div>';
  html += '<div class="timeline">';

  var trail = d.tracking && d.tracking.trail;

  if (trail && trail.length > 0) {
    // Render from actual trail data
    trail.forEach(function (entry, idx) {
      var isLast = idx === trail.length - 1;
      var ts = entry.timestamp ? formatTrailTimestamp(entry.timestamp) : "—";
      var actionIcon = getTrailActionIcon(entry.action);
      html += tlItem(true, actionIcon + ' <strong>' + escapeHtml(entry.user) + '</strong> — ' + escapeHtml(entry.action), ts);
    });

    // If document is not yet at a terminal state, show the next pending step
    var pendingStep = getNextPendingStep(d.status);
    if (pendingStep) {
      html += tlItem(false, pendingStep, 'Pending');
    }
  } else {
    // No trail data — generate a minimal trail from the document's own data
    var syntheticTrail = buildSyntheticTrail(d);
    syntheticTrail.forEach(function (entry) {
      html += tlItem(entry.done, entry.label, entry.time);
    });
  }

  html += '</div></div>';

  // ── Action buttons ───────────────────────────────────────────────────────
  html += '<div style="display:flex;gap:.5rem;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">';

  var canESign = false;
  var canApprove = false;
  var canClear = false;
  var canRelease = false;

  if (d.status === "Approved") {
    canRelease = currentUser.role === "admin";
  } else if (d.status === "For RD Approval") {
    canESign = canApprove = (["rd", "admin"].includes(currentUser.role) ||
      (currentUser.role === "oic" && currentUser.oicApproved));
  } else if (d.status === "For ARD Clearance") {
    canApprove = (["ard", "admin"].includes(currentUser.role) ||
      (currentUser.role === "oic" && currentUser.oicApproved));
  } else if (d.status === "For Division Clearance") {
    canClear = (["dc", "admin"].includes(currentUser.role) &&
      (d.division || "ORD") === currentUser.division);
  }

  if (canESign) {
    html += '<button class="btn-sm primary" onclick="openESignModal(\'' + escapeHtml(d.ref) + '\')">🖋️ E-Sign</button>';
  }
  if (canApprove) {
    html += '<button class="btn-sm primary" onclick="approveDocument(\'' + escapeHtml(d.ref) + '\')">✔ Approve</button>';
  }
  if (canClear) {
    html += '<button class="btn-sm primary" onclick="approveDocument(\'' + escapeHtml(d.ref) + '\')">✔ Clear</button>';
  }
  if (canRelease) {
    html += '<button class="btn-sm primary" onclick="approveDocument(\'' + escapeHtml(d.ref) + '\')">📤 Release</button>';
  }
  if (canESign || canApprove || canClear) {
    html += '<button class="btn-sm" onclick="showInfo(\'Document returned for revision.\')">↩ Return</button>';
  }

  html += '<button class="btn-sm" onclick="openQuickSend(\'' + escapeHtml(d.ref) + '\')">↗ Forward</button>';
  html += '<button class="btn-sm" onclick="printDocument(\'' + escapeHtml(d.ref) + '\')">🖨️ Print</button>';
  html += '</div>';

  html += '</div>'; // end doc-view-card
  c.innerHTML = html;
}

/* ── Trail helper functions ─────────────────────────────────────────────── */

function formatTrailTimestamp(ts) {
  try {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ts; }
}

function getTrailActionIcon(action) {
  if (action && action.indexOf("Sent") === 0) return "📤";
  if (action && action.indexOf("Status changed") === 0) return "🔄";
  var icons = {
    "Created": "📝",
    "Sent": "📤",
    "Received": "📥",
    "For ARD Clearance": "🔍",
    "For RD Approval": "📋",
    "Cleared": "✅",
    "Approved": "✅",
    "E-Signed": "🖋️",
    "E-Signed & Approved": "🖋️",
    "Released": "📬",
    "Archived": "🗄️",
    "Returned": "↩",
    "Disposed": "🗑️",
    "Edited details": "📝"
  };
  return icons[action] || "•";
}

function getNextPendingStep(status) {
  var steps = {
    "For ARD Clearance": "⏳ Awaiting ARD clearance",
    "For RD Approval": "⏳ Awaiting RD approval",
    "Approved": "⏳ Pending release",
  };
  return steps[status] || null;
}

function buildSyntheticTrail(d) {
  // Builds a minimal trail from status when no trail array exists
  var trail = [];
  var t0 = d.date ? formatTrailTimestamp(d.date + "T08:30:00") : "—";
  var t1 = d.date ? formatTrailTimestamp(d.date + "T09:15:00") : "—";
  var t2 = d.date ? formatTrailTimestamp(d.date + "T11:45:00") : "—";
  var t3 = d.date ? formatTrailTimestamp(d.date + "T14:30:00") : "—";
  var t4 = d.date ? formatTrailTimestamp(d.date + "T16:00:00") : "—";

  trail.push({ done: true, label: "📝 <strong>" + escapeHtml(d.from || "Sender") + "</strong> — Created / Submitted", time: t0 });

  if (d.status === "For ARD Clearance") {
    trail.push({ done: true, label: "📥 <strong>ORD</strong> — Received and logged", time: t1 });
    trail.push({ done: false, label: "⏳ Awaiting ARD clearance", time: "Pending" });
  } else if (d.status === "For RD Approval") {
    trail.push({ done: true, label: "📥 <strong>ORD</strong> — Received and logged", time: t1 });
    trail.push({ done: true, label: "✅ <strong>ARD</strong> — Cleared and forwarded", time: t2 });
    trail.push({ done: false, label: "⏳ Awaiting RD approval", time: "Pending" });
  } else if (d.status === "Approved") {
    trail.push({ done: true, label: "📥 <strong>ORD</strong> — Received and logged", time: t1 });
    trail.push({ done: true, label: "✅ <strong>ARD</strong> — Cleared and forwarded", time: t2 });
    trail.push({ done: true, label: "✅ <strong>RD</strong> — Approved", time: t3 });
    trail.push({ done: false, label: "⏳ Pending release", time: "Pending" });
  } else if (d.status === "Released") {
    trail.push({ done: true, label: "📥 <strong>ORD</strong> — Received and logged", time: t1 });
    trail.push({ done: true, label: "✅ <strong>ARD</strong> — Cleared and forwarded", time: t2 });
    trail.push({ done: true, label: "✅ <strong>RD</strong> — Approved", time: t3 });
    trail.push({ done: true, label: "📬 <strong>ORD</strong> — Released", time: t4 });
  } else if (d.status === "Archived") {
    trail.push({ done: true, label: "📥 <strong>ORD</strong> — Received, approved, and released", time: t1 });
    trail.push({ done: true, label: "🗄️ <strong>Archive</strong> — Document archived", time: t2 });
  } else {
    trail.push({ done: false, label: "⏳ " + escapeHtml(d.status || "In progress"), time: "Pending" });
  }

  return trail;
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
    showError(
      "Access denied. This document belongs to another division logbook.",
    );
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

/* ========= E-SIGNATURE SYSTEM ========= */

function openESignModal(ref) {
  var d = getDocByRef(ref);
  if (!d) return;

  var modal = document.createElement("div");
  modal.className = "modal-overlay open";
  modal.id = "esign-modal";

  var signName = currentUser.name;
  var signRole = currentUser.roleLabel;
  var today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  modal.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-head">
        <h3>E-Signature</h3>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</span>
      </div>
      <div class="modal-body" style="text-align: center; padding: 2rem;">
        <div style="margin-bottom: 1.5rem; font-size: 14px; color: var(--muted);">
          You are about to digitally sign document:
          <div style="font-weight: 700; color: var(--navy); margin-top: 0.5rem; font-size: 16px;">${d.ref}</div>
          <div style="font-style: italic; margin-top: 0.25rem;">"${d.subject}"</div>
        </div>

        <div id="signature-preview" style="border: 2px dashed var(--border); border-radius: 12px; padding: 2rem; background: #fff; position: relative; min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-family: 'Brush Script MT', cursive; font-size: 36px; color: var(--navy); line-height: 1;">${signName}</div>
          <div style="width: 80%; height: 1px; background: #333; margin: 10px 0;"></div>
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Digitally Signed By</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">${signRole}</div>
          <div style="font-size: 10px; color: var(--muted); margin-top: 2px;">Date: ${today}</div>
          
          <div style="position: absolute; top: 10px; right: 10px; opacity: 0.1; font-size: 40px;">🛡️</div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center; font-size: 12px; color: var(--muted);">
          <input type="checkbox" id="esign-consent" />
          <label for="esign-consent">I confirm that this is my official e-signature</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-sec" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-send" onclick="confirmESign('${ref}')">Sign</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function confirmESign(ref) {
  var consent = document.getElementById("esign-consent");
  if (!consent || !consent.checked) {
    showError("Please check the consent box to proceed.");
    return;
  }

  var d = getDocByRef(ref);
  if (d) {
    d.esignature = {
      signedBy: currentUser.name,
      role: currentUser.roleLabel,
      date: new Date().toISOString(),
    };

    // Update tracking
    ensureTrail(d);

    d.tracking.trail.push({
      user: currentUser.name,
      action: "E-Signed & Approved",
      timestamp: new Date().toISOString(),
    });
    d.tracking.lastUpdated = new Date().toISOString();
    d.tracking.lastActor = currentUser.role;
    d.tracking.updatedBy = currentUser.name;

    showSuccess("Document digitally signed!");
    document.getElementById("esign-modal").remove();

    // Refresh view
    viewDoc(ref);
  }
}

function approveDocument(ref) {
  var d = getDocByRef(ref);
  if (!d) return;

  var newStatus;
  var action;
  var verb;

  if (d.status === "Approved" && currentUser.role === "admin") {
    newStatus = "Released";
    action = "Released";
    verb = "Release";
  } else if (d.status === "For Division Clearance" && ["dc", "admin"].includes(currentUser.role)) {
    newStatus = "For ARD Clearance";
    action = "Cleared by Division";
    verb = "Clear";
  } else if (d.status === "For ARD Clearance" && ["ard", "admin", "oic"].includes(currentUser.role)) {
    newStatus = "For RD Approval";
    action = "Cleared";
    verb = "Clear";
  } else if (d.status === "For RD Approval" && ["rd", "admin", "oic"].includes(currentUser.role)) {
    newStatus = "Approved";
    action = "Approved";
    verb = "Approve";
  } else {
    showError("You are not authorized to approve this document at this stage.");
    return;
  }

  showConfirmDialog({
    title: verb + " Document",
    message: "Are you sure you want to " + verb.toLowerCase() + " this document?",
    detail: "This will advance the document to: " + newStatus,
    confirmLabel: "Yes, " + verb,
    cancelLabel: "Cancel",
    variant: "primary"
  }).then(function (confirmed) {
    if (confirmed) {
      d.status = newStatus;
      // update division routing if advancing from division → ARD
      if (newStatus === "For ARD Clearance") {
        d.division = "Office of the Regional Director";
      }

      // Update tracking
      ensureTrail(d);

      d.tracking.trail.push({
        user: currentUser.name,
        action: action,
        timestamp: new Date().toISOString(),
      });
      d.tracking.lastUpdated = new Date().toISOString();
      d.tracking.lastActor = currentUser.role;
      d.tracking.updatedBy = currentUser.name;

      showSuccess("Document " + action.toLowerCase() + " and advanced to: " + newStatus);

      // Refresh view
      viewDoc(ref);
    }
  });
}
function tlItem(done, label, time) {
  var weight = done ? "600" : "400";
  var dotClass = done ? "done" : "";
  var opacity = done ? "" : "opacity:.55;";
  return (
    '<div class="tl-item" style="' + opacity + '"><div class="tl-dot ' +
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
  const modal = document.getElementById("compose-modal");
  if (modal) {
    modal.classList.add("open");
    document.body.classList.add("modal-open"); /* ← NEW */
  }
}
function closeCompose() {
  const modal = document.getElementById("compose-modal");
  if (modal) {
    modal.classList.remove("open");
    document.body.classList.remove("modal-open"); /* ← NEW */
  }
}
function sendDoc() {
  var to = (document.getElementById("compose-to").value || "").trim();
  var subject = (document.getElementById("compose-subject").value || "").trim();
  var kind = document.getElementById("compose-kind").value || "outgoing";
  var type = document.getElementById("compose-type").value || "Memorandum";
  var remarks = (document.getElementById("compose-remarks").value || "").trim();
  var conf = document.querySelector('input[name="conf"]:checked');
  var isConf = conf && conf.value === "yes";

  if (!to) { showError("Please specify a recipient."); return; }
  if (!subject) { showError("Please enter a subject."); return; }

  var today = formatDateISO(new Date());
  var ref = nextSystemReference(today);

  DOCS.unshift({
    ref: ref,
    type: type,
    from: currentUser.name,
    to: to,
    subject: subject,
    status: "For ARD Clearance",
    date: today,
    conf: isConf,
    kind: kind,
    division: currentUser.division || "ORD",
    physicalCopy: false,
    content: remarks || "",
    tracking: {
      lastActor: currentUser.role,
      lastUpdated: new Date().toISOString(),
      trail: [{ user: currentUser.name, action: "Sent", timestamp: new Date().toISOString() }]
    }
  });

  showSuccess("Document sent and logged. Reference: " + ref);
  closeCompose();
  if (currentPage === "outgoing" || currentPage === "logbook") showPage(currentPage);
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
  document.body.classList.add("modal-open"); /* ← NEW */
}

function closeManualLogbook() {
  const modal = document.getElementById("manual-logbook-modal");
  if (modal) {
    modal.classList.remove("open");
    document.body.classList.remove("modal-open"); /* ← NEW */
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
    showError(
      "Access denied. This document belongs to another division logbook.",
    );
    return;
  }
  currentQuickSendRef = ref;
  document.getElementById("quick-send-title").textContent =
    "Send Document " + ref;
  document.getElementById("quick-send-to").value = d.to || "";
  document.getElementById("quick-send-remarks").value = d.sendRemarks || "";
  document.getElementById("quick-send-modal").classList.add("open");
  document.body.classList.add("modal-open"); /* ← NEW */
}

function closeQuickSend() {
  document.getElementById("quick-send-modal").classList.remove("open");
  document.body.classList.remove("modal-open"); /* ← NEW */
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

  ensureTrail(d);
  d.tracking.trail.push({
    user: currentUser.name,
    action: "Sent to " + to,
    timestamp: new Date().toISOString(),
  });
  d.tracking.lastUpdated = new Date().toISOString();
  d.tracking.lastActor = currentUser.role;
  d.tracking.updatedBy = currentUser.name;

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
    showError(
      "Access denied. This document belongs to another division logbook.",
    );
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
  document.body.classList.add("modal-open");
}

function openUploadDialog() {
  document.getElementById("local-upload-input").click();
}

function openOCRDialog() {
  // Open the advanced OCR scanner modal instead of simple file input
  document.getElementById("ocr-scanner-modal").classList.add("open");
  detectScanners(); // Auto-detect scanners on open
  document.body.classList.add("modal-open"); /* ← NEW */
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
  document.body.classList.add("modal-open");
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
  document.body.classList.add("modal-open");
  input.value = "";
}

function closeUploadEncodeModal() {
  document.getElementById("upload-encode-modal").classList.remove("open");
  document.body.classList.remove("modal-open");
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
    showError(
      "Access denied. This document belongs to another division logbook.",
    );
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
    showError(
      "Access denied. This document belongs to another division logbook.",
    );
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
  document.body.classList.add("modal-open");
}

function closeEditor() {
  document.getElementById("editor-modal").classList.remove("open");
  document.body.classList.remove("modal-open");
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
    var oldStatus = d.status;
    d.type = type;
    d.from = from;
    d.to = to;
    d.subject = subject;
    d.status = status;
    d.date = date;
    d.kind = kind;
    d.physicalCopy = physicalCopy;
    d.lastEditedBy = currentUser.name;

    ensureTrail(d);
    var editAction = (oldStatus !== status) ? ("Status changed to " + status) : "Edited details";
    d.tracking.trail.push({
      user: currentUser.name,
      action: editAction,
      timestamp: new Date().toISOString()
    });
    d.tracking.lastUpdated = new Date().toISOString();
    d.tracking.lastActor = currentUser.role;
    d.tracking.updatedBy = currentUser.name;

    closeManualLogbook();
    showSuccess("Logbook entry updated: " + currentLogbookEditRef);
  } else {
    var newDoc = {
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
      tracking: {
        lastActor: currentUser.role,
        lastUpdated: new Date().toISOString(),
        trail: [
          {
            user: currentUser.name,
            action: "Created",
            timestamp: new Date().toISOString()
          }
        ]
      }
    };
    if (status !== "For ARD Clearance") {
      newDoc.tracking.trail.push({
        user: currentUser.name,
        action: "Status set to " + status,
        timestamp: new Date().toISOString()
      });
    } else {
      newDoc.tracking.trail.push({
        user: "ORD",
        action: "Received",
        timestamp: new Date().toISOString()
      });
    }
    DOCS.unshift(newDoc);
    closeManualLogbook();
    showSuccess("Manual logbook entry added with reference: " + ref);
  }
  showPage("logbook");
}
function toggleNotif() {
  renderOICNotifications();
  document.getElementById("notif-panel").classList.toggle("open");
}
function closeNotif() {
  document.getElementById("notif-panel").classList.remove("open");
}
var currentIncomingTab = "all";
var currentOutgoingTab = "all";

function setTab(el, t) {
  el.parentNode.querySelectorAll(".tab").forEach(function (x) {
    x.classList.remove("active");
  });
  el.classList.add("active");

  // Determine which page we're on and re-render the table
  var tabBar = el.parentNode;
  if (tabBar.id === "in-tabs") {
    currentIncomingTab = t;
    renderIncomingTable(t);
  } else if (tabBar.id === "out-tabs") {
    currentOutgoingTab = t;
    renderOutgoingTable(t);
  }
}

function filterDocsByTab(docs, tab) {
  if (tab === "all") return docs;
  if (tab === "pending") return docs.filter(function (d) {
    return ["For ARD Clearance", "For RD Approval"].includes(d.status);
  });
  if (tab === "approved") return docs.filter(function (d) {
    return d.status === "Approved";
  });
  if (tab === "released") return docs.filter(function (d) {
    return d.status === "Released";
  });
  return docs;
}

function renderIncomingTable(tab) {
  var visibleDocs = getVisibleDocumentsForRole();
  var docs = filterDocsByTab(visibleDocs.filter(function (d) { return d.kind === "incoming"; }), tab);
  var tbody = document.getElementById("incoming-tbody");
  if (!tbody) return;
  var h = "";
  if (docs.length === 0) {
    h = emptyStateRow(9, "📭", "No incoming documents", tab === "all" ? "Documents addressed to you will appear here." : "No documents match this filter.");
  } else {
    docs.forEach(function (d) {
      var conf = d.conf ? '<span class="pill pill-red" style="margin-left:4px">Conf.</span>' : "";
      var divFull = d.division || "";
      var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
      h += '<tr><td style="font-family:monospace;font-size:12px">' + d.ref + "</td><td>" + flowPill(d.kind) + "</td><td>" + d.type + conf + "</td><td>" + d.from + "</td><td title=\"" + escapeHtml(divFull) + "\">" + divAbbrev + "</td><td>" + d.subject + "</td><td>" + d.date + "</td><td>" + statusPill(d.status) + "</td><td>" + renderActionsMenu(d.ref) + "</td></tr>";
    });
  }
  tbody.innerHTML = h;
  var countEl = document.getElementById("incoming-count");
  if (countEl) countEl.textContent = docs.length + " records";
}

function renderOutgoingTable(tab) {
  var visibleDocs = getVisibleDocumentsForRole();
  var docs = filterDocsByTab(visibleDocs.filter(function (d) { return d.kind === "outgoing"; }), tab);
  var tbody = document.getElementById("outgoing-tbody");
  if (!tbody) return;
  var h = "";
  if (docs.length === 0) {
    h = emptyStateRow(9, "📤", "No outgoing documents", tab === "all" ? "Documents you send will appear here." : "No documents match this filter.");
  } else {
    docs.forEach(function (d) {
      var conf = d.conf ? '<span class="pill pill-red" style="margin-left:4px">Conf.</span>' : "";
      var divFull = d.division || "";
      var divAbbrev = divFull ? getDivisionAbbrev(divFull) : "—";
      h += '<tr><td style="font-family:monospace;font-size:12px">' + d.ref + "</td><td>" + flowPill(d.kind) + "</td><td>" + d.type + conf + "</td><td>" + d.to + "</td><td title=\"" + escapeHtml(divFull) + "\">" + divAbbrev + "</td><td>" + d.subject + "</td><td>" + d.date + "</td><td>" + statusPill(d.status) + "</td><td>" + renderActionsMenu(d.ref) + "</td></tr>";
    });
  }
  tbody.innerHTML = h;
  var countEl = document.getElementById("outgoing-count");
  if (countEl) countEl.textContent = docs.length + " records";
}

function doSearch(v) {
  if (v.length > 1) {
    showPage("search");
    // Pre-fill the keyword after the page renders
    setTimeout(function () {
      var el = document.getElementById("search-keyword");
      if (el) {
        el.value = v;
        executeSearch();
      }
    }, 50);
  }
}

function handleSearchInput(value) {
  var icon = document.getElementById("search-icon");
  if (icon) {
    if (value.length > 0) {
      icon.style.display = "none";
    } else {
      icon.style.display = "flex";
    }
  }
  // Call the original search function
  doSearch(value);
}

function hideSearchIcon() {
  var icon = document.getElementById("search-icon");
  var input = document.getElementById("search-input");
  if (icon && input && input.value.length > 0) {
    icon.style.display = "none";
  }
}

function showSearchIconIfEmpty() {
  var icon = document.getElementById("search-icon");
  var input = document.getElementById("search-input");
  if (icon && input && input.value.length === 0) {
    icon.style.display = "flex";
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
    !e.target.closest(".icon-btn") &&
    !e.target.closest(".topbar-nav-link")
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
  document.body.classList.remove("modal-open");
}

function resetScannerState() {
  isScanning = false;
  currentScanData = null;
  document.getElementById("scan-preview").innerHTML = `
      <div style="text-align: center; opacity: 0.4;">
        <div style="font-size: 60px; margin-bottom: 1rem;">📑</div>
        <div style="font-weight: 600; color: var(--navy);">Waiting for scan...</div>
        <div style="font-size: 12px; color: var(--muted); margin-top: 0.5rem;">Document will appear here after scanning</div>
      </div>
    `;
  document.getElementById("ocr-results-section").style.display = "none";
  document.getElementById("ocr-extracted-text").value = "";
  document.getElementById("start-scan-btn").innerHTML =
    '<span style="font-size: 20px;">📷</span> Start Scanning';
  document.getElementById("start-scan-btn").disabled = false;
  document.getElementById("scan-status-pill").style.display = "none";
}

function detectScanners() {
  var statusDiv = document.getElementById("scanner-status");
  statusDiv.innerHTML = `
      <div style="padding: 1rem; background: #f0f9ff; border: 1.5px solid #0ea5e9; border-radius: 10px; display: flex; align-items: center; gap: 0.75rem;">
        <div class="spinner-sm" style="width: 16px; height: 16px; border-width: 2px; border-top-color: #0ea5e9;"></div>
        <span style="font-size: 12px; color: #0369a1; font-weight: 500;">Searching for scanners...</span>
      </div>
    `;

  // Simulate scanner detection
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
        var statusIcon = scanner.status === "ready" ? "🟢" : "🟠";
        return `
          <div onclick="selectScanner('${scanner.name}')" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 10px; margin-bottom: 0.5rem; background: #fff; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--navy3)'" onmouseout="this.style.borderColor='#e2e8f0'">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 32px; height: 32px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🖨️</div>
              <div>
                <div style="font-weight: 700; font-size: 13px; color: var(--navy);">${scanner.name}</div>
                <div style="font-size: 10px; color: var(--muted);">${scanner.connection} • ${scanner.type.toUpperCase()}</div>
              </div>
            </div>
            <div style="font-size: 10px;">${statusIcon}</div>
          </div>
        `;
      })
      .join("");

    statusDiv.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: var(--muted); margin-bottom: 0.75rem; text-transform: uppercase;">Detected Devices (${detectedScanners.length})</div>
        ${scannerList}
      `;
  }, 1500);
}

function selectScanner(scannerName) {
  var statusDiv = document.getElementById("scanner-status");
  var selectedScanner = detectedScanners.find((s) => s.name === scannerName);

  if (selectedScanner) {
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 10px;">
          <div style="width: 32px; height: 32px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1px solid #10b981;">🟢</div>
          <div>
            <div style="font-weight: 700; font-size: 13px; color: #065f46;">${selectedScanner.name}</div>
            <div style="font-size: 10px; color: #047857;">Ready to scan • ${selectedScanner.connection}</div>
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

    document.getElementById("scan-status-pill").style.display = "block";
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

  scanBtn.innerHTML = "⏳ Scanning...";
  scanBtn.disabled = true;

  // Show scanning animation
  previewDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
        <div style="font-size: 60px; margin-bottom: 1.5rem; animation: pulse 1.5s infinite;">📷</div>
        <div style="color: var(--navy); font-weight: 700; font-size: 18px; margin-bottom: 0.5rem;">Scanning Document...</div>
        <div style="color: var(--muted); font-size: 13px;">Capturing image from source</div>
        <div style="width: 250px; height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 1.5rem; overflow: hidden; position: relative;">
          <div style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--navy3), #0ea5e9); animation: scanProgress 3s ease-out forwards;"></div>
        </div>
      </div>
    `;

  // Simulate scanning process
  setTimeout(function () {
    // Generate a sample scanned image
    var canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    var ctx = canvas.getContext("2d");

    // Create a simple document preview
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    // Draw document lines
    for (var i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(50, 100 + i * 30);
      ctx.lineTo(550, 100 + i * 30);
      ctx.stroke();
    }

    // Add some sample text
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 16px Arial";
    ctx.fillText("DEPARTMENT OF EDUCATION", 50, 60);
    ctx.font = "12px Arial";
    ctx.fillText("Region VII - Central Visayas", 50, 80);
    ctx.fillText("Division Office - Prototype", 50, 100);

    // Convert to image
    var scannedImage = canvas.toDataURL("image/png");
    currentScanData = scannedImage;

    // Show preview
    previewDiv.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; position: relative; animation: fadeIn 0.5s ease-out;">
          <img src="${scannedImage}" style="max-width: 100%; max-height: 100%; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #e2e8f0;">
          <div style="position: absolute; top: 1.5rem; right: 1.5rem; background: #10b981; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 11px; font-weight: 700; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); display: flex; align-items: center; gap: 0.5rem;">
            <span>✅</span> Captured
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
  ocrText.value =
    "🔍 Initializing AI analysis...\n⏳ Analyzing document structure...\n📄 Extracting text layers...";

  // Simulate OCR processing
  setTimeout(function () {
    var language = document.getElementById("ocr-language").value;
    var autoEnhance = document.getElementById("ocr-auto-enhance").checked;

    // Sample OCR result
    var sampleText = `DEPARTMENT OF EDUCATION
Region VII - Central Visayas
Division Office - Prototype

DATE: May 14, 2026
REFERENCE: 2026-05-042

SUBJECT: ENHANCED OCR SYSTEM PROTOYPE

This is a demonstration of the new OCR scanning interface. The system now features:
- Side-by-side configuration and preview
- Real-time AI text extraction
- One-click encoding to the Document Logbook
- Enhanced mobile and desktop responsiveness

Please review the extracted text on the left and choose your encoding option on the right.

Approved by:
Sir Harry
Administrator
`;

    if (autoEnhance) {
      sampleText = sampleText.replace(/\s+/g, " ").trim();
    }

    ocrText.value = sampleText;

    // Update preview with actual data
    updateAutoEncodePreview();

    // Update modal footer buttons
    updateModalFooter();

    isScanning = false;

    // Show success notification
    showNotification("OCR processing completed successfully!", "success");
  }, 2500);
}

function toggleEncodingOption() {
  var autoOption = document.getElementById("auto-encode").checked;
  var autoPreview = document.getElementById("auto-encode-preview");
  var manualForm = document.getElementById("manual-encode-form");

  // Visual feedback for cards
  var autoWrap = document.getElementById("auto-encode-wrap");
  var manualWrap = document.getElementById("manual-encode-wrap");

  if (autoOption) {
    autoPreview.style.display = "block";
    manualForm.style.display = "none";
    autoWrap.classList.add("active");
    manualWrap.classList.remove("active");
    autoWrap.style.borderColor = "var(--navy3)";
    autoWrap.style.background = "#f0f7ff";
    manualWrap.style.borderColor = "#e2e8f0";
    manualWrap.style.background = "#fff";
  } else {
    autoPreview.style.display = "none";
    manualForm.style.display = "block";
    autoWrap.classList.remove("active");
    manualWrap.classList.add("active");
    manualWrap.style.borderColor = "var(--navy3)";
    manualWrap.style.background = "#f0f7ff";
    autoWrap.style.borderColor = "#e2e8f0";
    autoWrap.style.background = "#fff";
  }
}

function updateAutoEncodePreview() {
  var today = formatDateISO(new Date());
  var nextRef = nextSystemReference(today);

  var refEl = document.getElementById("preview-ref");
  var typeEl = document.getElementById("preview-type");
  var fromEl = document.getElementById("preview-from");
  var divisionEl = document.getElementById("preview-division");
  var subEl = document.getElementById("preview-subject");

  if (refEl) refEl.textContent = nextRef;
  if (typeEl) typeEl.textContent = "OCR Scanned Document";
  if (fromEl) fromEl.textContent = currentUser.name;
  if (divisionEl) divisionEl.textContent = currentUser.division || currentUser.roleLabel || "";
  if (subEl) subEl.textContent = "Document scanned on " + today;
}

function updateModalFooter() {
  var footer = document.getElementById("ocr-modal-footer");
  footer.innerHTML = `
      <button class="btn-sec" onclick="closeOCRScanner()" style="padding: 0.75rem 1.5rem; font-weight: 600;">Cancel</button>
      <button class="btn-sec" onclick="retryOCR()" style="padding: 0.75rem 1.5rem; font-weight: 600;">🔄 Retry OCR</button>
      <button class="btn-send" onclick="confirmEncoding()" style="padding: 0.75rem 2rem; font-weight: 700; background: var(--success); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
        ✅ Confirm & Encode
      </button>
    `;
}

function confirmEncoding() {
  var autoEncode = document.getElementById("auto-encode").checked;

  if (autoEncode) {
    autoEncodeDocument();
  } else {
    if (validateManualForm()) {
      manualEncodeDocument();
    }
  }
}

function autoEncodeDocument() {
  var today = formatDateISO(new Date());
  var ref = nextSystemReference(today);
  var ocrText = document.getElementById("ocr-extracted-text").value;

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
    tracking: {
      lastActor: currentUser.role,
      lastUpdated: new Date().toISOString(),
    },
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
  var subject = document.getElementById("manual-subject").value.trim();

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

  var newDoc = {
    ref: ref,
    type: document.getElementById("manual-doc-type").value,
    from: currentUser.name,
    to: currentUser.division || "ORD",
    subject: document.getElementById("manual-subject").value.trim(),
    status: "For Processing",
    date: today,
    conf: false,
    kind: document.getElementById("manual-direction").value,
    division: currentUser.division || "ORD",
    physicalCopy: true,
    content:
      "Manual encoding with OCR content: " + ocrText.substring(0, 200) + "...",
    tracking: {
      lastActor: currentUser.role,
      lastUpdated: new Date().toISOString(),
    },
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
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .spinner-sm {
      border: 2px solid rgba(0,0,0,.1);
      border-radius: 50%;
      border-top: 2px solid var(--navy);
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .encoding-card.active {
      border-color: var(--navy3) !important;
      background: #f0f7ff !important;
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
    const authContent = document.querySelector(".auth-content");
    const authFormWrap = document.querySelector(".auth-form-wrap");
    const authBranding = document.querySelector(".auth-branding");

    if (authContent && authFormWrap) {
      // Ensure consistent max-width based on screen size
      if (screenWidth >= 1920) {
        authContent.style.maxWidth = "1600px";
        if (authBranding) authBranding.style.flex = "0 0 600px";
      } else if (screenWidth >= 1400) {
        authContent.style.maxWidth = "1400px";
        if (authBranding) authBranding.style.flex = "0 0 500px";
      } else if (screenWidth >= 1025) {
        authContent.style.maxWidth = "1200px";
        authFormWrap.style.flex = "0 0 480px";
      } else if (screenWidth <= 1024) {
        // Mobile/tablet layout handled by CSS
        authContent.style.maxWidth = "";
        authFormWrap.style.flex = "";
      }
    }

    // Ensure app shell consistency
    const app = document.querySelector(".app");
    const sidebar = document.querySelector(".sidebar");
    const main = document.querySelector(".main");

    if (app && sidebar && main) {
      if (screenWidth <= 1024) {
        app.style.flexDirection = "column";
        sidebar.style.width = "100%";
        sidebar.style.height = "auto";
        main.style.width = "100%";
      } else {
        app.style.flexDirection = "";
        sidebar.style.width = "";
        sidebar.style.height = "";
        main.style.width = "";
      }
    }
  }

  // Initial adjustment
  adjustLayoutForScreenSize();

  // Listen for window resize
  window.addEventListener("resize", function () {
    // Debounce resize events
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(adjustLayoutForScreenSize, 100);
  });

  // Listen for orientation change
  window.addEventListener("orientationchange", function () {
    setTimeout(adjustLayoutForScreenSize, 200);
  });
}

// Initialize responsive consistency when DOM is ready
document.addEventListener("DOMContentLoaded", ensureResponsiveConsistency);

// Also initialize immediately if DOM is already loaded
/* ========= DOCUMENT DISPOSAL IDENTIFICATION SYSTEM ========= */

// Retention policies by document type
var RETENTION_POLICIES = {
  Memorandum: { retentionYears: 5, disposalAction: "Shred" },
  Letter: { retentionYears: 3, disposalAction: "Shred" },
  "Bill / Financial": { retentionYears: 7, disposalAction: "Shred" },
  Report: { retentionYears: 10, disposalAction: "Archive" },
  Endorsement: { retentionYears: 2, disposalAction: "Shred" },
  Confidential: { retentionYears: 10, disposalAction: "Secure Destroy" },
  Contract: { retentionYears: 15, disposalAction: "Archive" },
  "Legal Document": { retentionYears: 25, disposalAction: "Archive" },
};

// Disposal schedule tracking
var DISPOSAL_SCHEDULE = [];
var DISPOSAL_ALERTS = [];

function initializeDisposalSystem() {
  // Initialize disposal schedule for existing documents
  DOCS.forEach(function (doc) {
    if (!doc.disposalDate) {
      calculateDisposalDate(doc);
    }
  });
  updateDisposalSchedule();
  checkDisposalAlerts();
}

function calculateDisposalDate(doc) {
  var policy = RETENTION_POLICIES[doc.type] || RETENTION_POLICIES["Memorandum"]; // Default to 5 years
  var receivedDate = new Date(doc.date);
  var disposalDate = new Date(receivedDate);
  disposalDate.setFullYear(disposalDate.getFullYear() + policy.retentionYears);

  doc.disposalDate = formatDateISO(disposalDate);
  doc.retentionYears = policy.retentionYears;
  doc.disposalAction = policy.disposalAction;
  doc.daysUntilDisposal = Math.floor(
    (disposalDate - new Date()) / (1000 * 60 * 60 * 24),
  );
}

function updateDisposalSchedule() {
  var today = new Date();
  // Recalculate daysUntilDisposal live for all docs that have a disposalDate
  DOCS.forEach(function (doc) {
    if (doc.disposalDate) {
      var disposal = new Date(doc.disposalDate);
      doc.daysUntilDisposal = Math.floor((disposal - today) / (1000 * 60 * 60 * 24));
    }
  });
  DISPOSAL_SCHEDULE = DOCS.filter((doc) => doc.disposalDate)
    .map((doc) => ({
      ref: doc.ref,
      type: doc.type,
      subject: doc.subject,
      disposalDate: doc.disposalDate,
      daysUntilDisposal: doc.daysUntilDisposal,
      disposalAction: doc.disposalAction,
      status: doc.status,
      division: doc.division,
    }))
    .sort((a, b) => a.daysUntilDisposal - b.daysUntilDisposal);
}

function checkDisposalAlerts() {
  DISPOSAL_ALERTS = DISPOSAL_SCHEDULE.filter(
    (doc) => doc.daysUntilDisposal <= 30, // Include everything from 30 days remaining down to already expired
  );
}

/* ========= NEAR DEADLINE NOTIFICATION SYSTEM ========= */

function checkNearDeadlines() {
  var userDocs = getVisibleDocumentsForRole();
  var today = new Date("2026-05-14"); // System today

  var nearDeadlines = userDocs.filter((doc) => {
    if (!doc.deadline) return false;
    if (
      doc.status === "Released" ||
      doc.status === "Archived" ||
      doc.status === "Disposed"
    )
      return false;

    var deadlineDate = new Date(doc.deadline);
    var diffTime = deadlineDate - today;
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    doc.daysUntilDeadline = diffDays;
    return diffDays >= 0 && diffDays <= 7; // Deadlines within 7 days
  });

  return nearDeadlines.sort(
    (a, b) => a.daysUntilDeadline - b.daysUntilDeadline,
  );
}

function updateNotificationPanelWithDeadlines() {
  var notifPanel = document.getElementById("notif-panel");
  if (!notifPanel) return;

  var nearDeadlines = checkNearDeadlines();
  var notifItems = notifPanel.querySelectorAll(".notif-item");

  // Remove existing deadline notifications
  notifItems.forEach((item) => {
    var text = item.querySelector(".notif-text");
    if (text && text.textContent.includes("deadline")) {
      item.remove();
    }
  });

  var notifList = notifPanel.querySelector(".notif-head");
  nearDeadlines.forEach((doc) => {
    var notifItem = document.createElement("div");
    notifItem.className = "notif-item unread";

    var icon = doc.daysUntilDeadline <= 2 ? "🚨" : "⚠️";
    var urgency = doc.daysUntilDeadline <= 2 ? "High Priority" : "Reminder";

    notifItem.innerHTML = `
      <div class="notif-icon">${icon}</div>
      <div class="notif-content">
        <div class="notif-text"><strong>${urgency}:</strong> Document ${doc.ref} deadline in ${doc.daysUntilDeadline} days</div>
        <div class="notif-time">${doc.subject}</div>
      </div>
    `;

    notifItem.onclick = function () {
      viewDoc(doc.ref);
    };

    notifPanel.insertBefore(notifItem, notifList.nextSibling);
  });

  // Update badge count
  var currentBadge = parseInt(
    document.getElementById("notif-badge")?.textContent || "0",
  );
  updateNotificationBadge(currentBadge + nearDeadlines.length);
}

/* ========= EXPIRED DOCUMENT NOTIFICATION SYSTEM ========= */

function checkExpiredDocuments() {
  var userDocs = getVisibleDocumentsForRole();

  var expiredDocs = userDocs.filter((doc) => {
    if (!doc.disposalDate) return false;
    var daysUntil = doc.daysUntilDisposal || 0;
    return daysUntil <= 0; // Documents that have already expired
  });

  var nearExpiryDocs = userDocs.filter((doc) => {
    if (!doc.disposalDate) return false;
    var daysUntil = doc.daysUntilDisposal || 0;
    return daysUntil > 0 && daysUntil <= 30; // Documents expiring within 30 days
  });

  return {
    expired: expiredDocs,
    nearExpiry: nearExpiryDocs,
    total: expiredDocs.length + nearExpiryDocs.length,
  };
}

function updateNotificationPanelWithExpiredDocs() {
  var notifPanel = document.getElementById("notif-panel");
  if (!notifPanel) return;

  var expiredDocStatus = checkExpiredDocuments();
  var notifItems = notifPanel.querySelectorAll(".notif-item");

  // Remove existing expired document notifications to avoid duplicates
  notifItems.forEach((item) => {
    var text = item.querySelector(".notif-text");
    if (
      text &&
      (text.textContent.includes("expired") ||
        text.textContent.includes("needs disposal"))
    ) {
      item.remove();
    }
  });

  // Add new expired document notifications for admin, ARD, RD, DC, and Custodian roles
  if (["admin", "ard", "rd", "dc", "custodian"].includes(currentUser.role)) {
    var notifList = notifPanel.querySelector(".notif-head");

    // Add expired documents notifications
    expiredDocStatus.expired.forEach((doc) => {
      var notifItem = createExpiredDocNotification(doc, "expired");
      notifPanel.insertBefore(notifItem, notifList.nextSibling);
    });

    // Add near-expiry notifications
    expiredDocStatus.nearExpiry.forEach((doc) => {
      var notifItem = createExpiredDocNotification(doc, "near-expiry");
      notifPanel.insertBefore(notifItem, notifList.nextSibling);
    });

    // Update notification dot
    updateNotificationBadge(expiredDocStatus.total);
  }
}

function createExpiredDocNotification(doc, type) {
  var notifItem = document.createElement("div");
  notifItem.className = "notif-item";

  var urgencyText = type === "expired" ? "EXPIRED" : "expires soon";
  var urgencyIcon = type === "expired" ? "🚨" : "⚠️";
  var urgencyClass = type === "expired" ? "danger" : "warning";

  notifItem.innerHTML = `
    <div class="notif-dot2"></div>
    <div>
      <div class="notif-text">
        ${urgencyIcon} Document <strong>${doc.ref}</strong> ${urgencyText} and needs disposal
      </div>
      <div class="notif-time">Just now</div>
    </div>
  `;

  return notifItem;
}

function updateNotificationBadge(count) {
  var notifDot = document.querySelector(".notif-dot");
  if (notifDot) {
    if (count > 0) {
      notifDot.style.display = "block";
      notifDot.textContent = count > 9 ? "9+" : count.toString();
    } else {
      notifDot.style.display = "none";
    }
  }
}

function showExpiredDocumentAlerts() {
  var expiredDocStatus = checkExpiredDocuments();

  if (expiredDocStatus.expired.length > 0) {
    var message = `🚨 ${expiredDocStatus.expired.length} document(s) have expired and need immediate disposal`;
    showToast(message, "error", 5000);
  }

  if (expiredDocStatus.nearExpiry.length > 0) {
    var message = `⚠️ ${expiredDocStatus.nearExpiry.length} document(s) will expire within 30 days`;
    showToast(message, "warning", 4000);
  }
}

function initializeExpiredDocumentNotifications() {
  // Check for expired documents every 5 minutes
  setInterval(
    function () {
      updateNotificationPanelWithExpiredDocs();
    },
    5 * 60 * 1000,
  );

  // Initial check
  updateNotificationPanelWithExpiredDocs();

  // Show immediate alerts for critical expired documents
  showExpiredDocumentAlerts();
}

function renderDisposal() {
  if (!["admin", "rd", "ard", "dc", "custodian"].includes(currentUser.role)) {
    return '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)">Access denied. Disposal management is available for leadership and division heads only.</div>';
  }

  var h = "";
  h +=
    '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:1.25rem">';
  h += '<div style="display:flex;gap:.5rem">';
  h +=
    '<button class="btn-sm primary" onclick="openRetentionPolicyModal()">⚙️ Retention Policies</button>';
  h +=
    '<button class="btn-sm" onclick="exportDisposalReport()">📊 Export Report</button>';
  h += "</div></div>";

  // Filter schedule based on user role/division
  var userDisposalSchedule = DISPOSAL_SCHEDULE.filter(function (item) {
    if (isGlobalLogbookRole(currentUser.role)) return true;
    return (item.division || "ORD") === currentUser.division;
  });

  var userDisposalAlerts = DISPOSAL_ALERTS.filter(function (item) {
    if (isGlobalLogbookRole(currentUser.role)) return true;
    return (item.division || "ORD") === currentUser.division;
  });

  // Disposal alerts section
  h +=
    '<div class="card" style="margin-bottom:1rem;background:#fff3cd;border:1px solid #ffeaa7">';
  h +=
    '<div class="card-head"><div class="card-title">⚠️ Disposal Alerts</div></div>';
  if (userDisposalAlerts.length === 0) {
    h +=
      '<div style="padding:1rem;text-align:center;color:#856404">No documents due for disposal in the next 30 days</div>';
  } else {
    h += '<div style="padding:0.5rem">';
    userDisposalAlerts.forEach(function (alert) {
      var urgency = alert.daysUntilDisposal <= 7 ? "danger" : "warning";
      h +=
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;background:rgba(255,255,255,0.7);margin-bottom:0.5rem;border-radius:4px">';
      h +=
        "<div><strong>" + alert.ref + "</strong> - " + alert.subject + "</div>";
      h += '<div style="display:flex;gap:0.5rem;align-items:center">';
      h +=
        '<span class="pill pill-' +
        urgency +
        '">' +
        alert.daysUntilDisposal +
        " days</span>";
      h +=
        '<button class="btn-sm" onclick="processDisposal(\'' +
        alert.ref +
        "')\">Process</button>";
      h += "</div></div>";
    });
    h += "</div>";
  }
  h += "</div>";

  // Disposal schedule table
  h += '<div class="card">';
  h +=
    '<div class="card-head"><div class="card-title">Disposal Schedule</div></div>';
  h += '<div class="doc-table-wrap"><table class="doc-table">';
  h +=
    "<thead><tr><th>Reference No.</th><th>Document Type</th><th>Subject</th><th>Disposal Date</th><th>Days Until</th><th>Action</th><th>Status</th><th>Actions</th></tr></thead><tbody>";

  if (userDisposalSchedule.length === 0) {
    h += emptyStateRow(8, "🗑️", "No disposal schedule entries", "Documents scheduled for disposal will appear here.");
  }

  userDisposalSchedule.forEach(function (item) {
    var urgencyClass =
      item.daysUntilDisposal <= 30
        ? "pill-red"
        : item.daysUntilDisposal <= 90
          ? "pill-amber"
          : "pill-green";
    h += "<tr>";
    h += "<td>" + item.ref + "</td>";
    h += "<td>" + item.type + "</td>";
    h += "<td>" + item.subject + "</td>";
    h += "<td>" + item.disposalDate + "</td>";
    h +=
      '<td><span class="pill ' +
      urgencyClass +
      '">' +
      (item.daysUntilDisposal < 0
        ? "Overdue"
        : item.daysUntilDisposal + " days") +
      "</span></td>";
    h += "<td>" + item.disposalAction + "</td>";
    h += "<td>" + statusPill(item.status) + "</td>";
    h += "<td>";
    h += '<div style="display:flex;gap:0.5rem;">';
    h +=
      '<button class="btn-sm" onclick="viewDoc(\'' +
      item.ref +
      "')\">View</button>";
    h +=
      '<button class="btn-sm primary" onclick="processDisposal(\'' +
      item.ref +
      "')\">Dispose</button>";
    h += "</div>";
    h += "</td>";
    h += "</tr>";
  });

  h += "</tbody></table></div></div>";
  return h;
}

function processDisposal(ref) {
  showConfirmDialog({
    variant: "danger",
    title: "Process Document Disposal",
    message:
      "This will mark document " +
      ref +
      " for disposal. This action cannot be undone.",
    detail:
      "The document will be removed from active logs and recorded in the disposal registry.",
    confirmLabel: "Process Disposal",
    cancelLabel: "Cancel",
  }).then(function (ok) {
    if (!ok) return;

    var doc = getDocByRef(ref);
    if (doc) {
      doc.disposalProcessed = true;
      doc.disposalProcessedDate = formatDateISO(new Date());
      doc.disposalProcessedBy = currentUser.name;
      doc.status = "Disposed";

      ensureTrail(doc);
      doc.tracking.trail.push({
        user: currentUser.name,
        action: "Disposed",
        timestamp: new Date().toISOString(),
      });
      doc.tracking.lastUpdated = new Date().toISOString();
      doc.tracking.lastActor = currentUser.role;
      doc.tracking.updatedBy = currentUser.name;

      showSuccess("Document " + ref + " marked for disposal");
      showPage("disposal");
    }
  });
}

function openRetentionPolicyModal() {
  var modal = document.createElement("div");
  modal.className = "modal-overlay open";

  var policiesHtml = Object.keys(RETENTION_POLICIES)
    .map((type) => {
      var policy = RETENTION_POLICIES[type];
      return `
      <tr>
        <td>${type}</td>
        <td><input type="number" id="policy-${type}" value="${policy.retentionYears}" min="1" max="50" style="width:80px;padding:0.25rem;"></td>
        <td>
          <select id="action-${type}" style="padding:0.25rem;">
            <option value="Shred" ${policy.disposalAction === "Shred" ? "selected" : ""}>Shred</option>
            <option value="Secure Destroy" ${policy.disposalAction === "Secure Destroy" ? "selected" : ""}>Secure Destroy</option>
            <option value="Archive" ${policy.disposalAction === "Archive" ? "selected" : ""}>Permanent Archive</option>
          </select>
        </td>
      </tr>
    `;
    })
    .join("");

  modal.innerHTML = `
    <div class="modal" style="max-width: 800px;">
      <div class="modal-head">
        <h3>📋 Retention Policy Management</h3>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</span>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Configure retention policies by document type</label>
          <table style="width:100%;margin-top:1rem;">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Retention Years</th>
                <th>Disposal Action</th>
              </tr>
            </thead>
            <tbody>
              ${policiesHtml}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-sec" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-send" onclick="saveRetentionPolicies()">Save Policies</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function saveRetentionPolicies() {
  Object.keys(RETENTION_POLICIES).forEach((type) => {
    var yearsInput = document.getElementById("policy-" + type);
    var actionSelect = document.getElementById("action-" + type);

    if (yearsInput && actionSelect) {
      RETENTION_POLICIES[type].retentionYears = parseInt(yearsInput.value);
      RETENTION_POLICIES[type].disposalAction = actionSelect.value;
    }
  });

  // Recalculate disposal dates for all documents
  DOCS.forEach(function (doc) {
    calculateDisposalDate(doc);
  });

  updateDisposalSchedule();
  checkDisposalAlerts();

  showSuccess("Retention policies updated successfully");
  document.querySelector(".modal-overlay").remove();
  showPage("disposal");
}

function exportDisposalReport() {
  var csvContent =
    "Reference No.,Document Type,Subject,Disposal Date,Days Until,Disposal Action,Status,Division\n";

  DISPOSAL_SCHEDULE.forEach(function (item) {
    csvContent += `${item.ref},"${item.type}","${item.subject}",${item.disposalDate},${item.daysUntilDisposal},"${item.disposalAction}","${item.status}","${item.division}"\n`;
  });

  var blob = new Blob([csvContent], { type: "text/csv" });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "disposal_schedule_" + formatDateISO(new Date()) + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showSuccess("Disposal report exported successfully");
}

function renderEnhancedReports() {
  var h =
    '<div class="enhanced-reports-container">';

  // Main Header Section
  h +=
    '<div style="background:#fff;border-radius:12px;padding:2rem;margin-bottom:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;">';
  h += "<div>";
  h +=
    '<h1 style="margin:0;color:var(--navy);font-size:2rem;font-weight:700;margin-bottom:0.5rem;">Reports Dashboard</h1>';
  h +=
    '<p style="margin:0;color:var(--muted);font-size:1rem;">Visual analytics and comprehensive reporting</p>';
  h += "</div>";
  h += '<div style="display:flex;gap:1rem;">';
  h +=
    '<button onclick="openCustomizationModal()" style="background:var(--pill);border:1px solid var(--border);padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:500;">⚙️ Customize</button>';
  h +=
    '<button onclick="resetReportFilters()" style="background:var(--pill);border:1px solid var(--border);padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:500;">🔄 Reset</button>';
  h += "</div>";
  h += "</div>";
  h += "</div>";

  // Dashboard Visualization Section - MOVED TO TOP
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:2rem;margin-bottom:2rem;">';

  var firstRowVisible = false;

  // Document Status Chart
  if (dashboardPreferences.visibleWidgets.statusChart) {
    firstRowVisible = true;
    h += '<div style="background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
    h += '<h3 style="margin:0 0 1.5rem 0;color:var(--navy);font-size:1.3rem;font-weight:600;">📊 Document Status Overview</h3>';
    h += '<div id="status-chart" style="height:300px;position:relative;">';
    h += renderStatusChart();
    h += '</div>';
    h += '</div>';
  }

  // Division Distribution Chart
  if (dashboardPreferences.visibleWidgets.divisionChart) {
    firstRowVisible = true;
    h += '<div style="background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
    h += '<h3 style="margin:0 0 1.5rem 0;color:var(--navy);font-size:1.3rem;font-weight:600;">📁 Division Distribution</h3>';
    h += '<div id="division-chart" style="height:300px;position:relative;">';
    h += renderDivisionChart();
    h += '</div>';
    h += '</div>';
  }

  h += '</div>';

  // Second Row of Charts
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:2rem;margin-bottom:2rem;">';

  var secondRowVisible = false;

  // Document Type Breakdown
  if (dashboardPreferences.visibleWidgets.typeChart) {
    secondRowVisible = true;
    h += '<div style="background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
    h += '<h3 style="margin:0 0 1.5rem 0;color:var(--navy);font-size:1.3rem;font-weight:600;">📋 Document Types</h3>';
    h += '<div id="type-chart" style="height:300px;position:relative;">';
    h += renderTypeChart();
    h += '</div>';
    h += '</div>';
  }

  // Monthly Trend Chart
  if (dashboardPreferences.visibleWidgets.trendChart) {
    secondRowVisible = true;
    h += '<div style="background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
    h += '<h3 style="margin:0 0 1.5rem 0;color:var(--navy);font-size:1.3rem;font-weight:600;">📈 Monthly Trend</h3>';
    h += '<div id="trend-chart" style="height:300px;position:relative;">';
    h += renderTrendChart();
    h += '</div>';
    h += '</div>';
  }

  h += '</div>';

  // Show message if no charts are visible
  if (!firstRowVisible && !secondRowVisible) {
    h += '<div style="background:#fff;border-radius:12px;padding:3rem 2rem;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);margin-bottom:2rem;">';
    h += '<div style="font-size:3rem;margin-bottom:1rem;opacity:0.5;">📊</div>';
    h += '<h3 style="color:var(--muted);margin:0 0 0.5rem 0;">No Charts Visible</h3>';
    h += '<p style="color:var(--muted);margin:0 0 1rem 0;">All dashboard widgets are currently hidden.</p>';
    h += '<button onclick="openCustomizationModal()" class="btn-send" style="padding:0.75rem 2rem;">⚙️ Customize Dashboard</button>';
    h += '</div>';
  }

  // Reports Dashboard Configuration Section - MOVED TO MIDDLE
  h +=
    '<div style="background:#fff;border-radius:12px;padding:2rem;margin-bottom:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
  h +=
    '<h2 style="margin:0 0 1.5rem 0;color:var(--navy);font-size:1.5rem;font-weight:600;">📊 Reports Configuration</h2>';
  h +=
    '<p style="margin:0 0 2rem 0;color:var(--muted);font-size:1rem;">Customize your report parameters and generate detailed reports</p>';

  // Report Configuration Section
  h +=
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem;margin-bottom:2rem;">';

  // Report Type
  h += "<div>";
  h +=
    '<label style="display:block;margin-bottom:0.5rem;color:var(--navy);font-weight:600;font-size:0.9rem;">REPORT TYPE</label>';
  h +=
    '<select id="report-type" onchange="updateReportOptions()" style="width:100%;padding:0.75rem;border:2px solid var(--border);border-radius:8px;font-size:0.95rem;background:#fff;">';
  h += '<option value="document-summary">Document Summary Report</option>';
  h += '<option value="division-wise">Division-wise Report</option>';
  h += '<option value="status-wise">Status-wise Report</option>';
  h += '<option value="date-range">Date Range Report</option>';
  h += '<option value="user-activity">User Activity Report</option>';
  h += '<option value="custom">Custom Report</option>';
  h += "</select>";
  h += "</div>";

  // Date Range
  h += "<div>";
  h +=
    '<label style="display:block;margin-bottom:0.5rem;color:var(--navy);font-weight:600;font-size:0.9rem;">DATE RANGE</label>';
  h += '<div style="display:flex;gap:1rem;">';
  h +=
    '<input type="date" id="from-date" value="' +
    getDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) +
    '" style="flex:1;padding:0.75rem;border:2px solid var(--border);border-radius:8px;font-size:0.95rem;">';
  h +=
    '<input type="date" id="to-date" value="' +
    getDateString(new Date()) +
    '" style="flex:1;padding:0.75rem;border:2px solid var(--border);border-radius:8px;font-size:0.95rem;">';
  h += "</div>";
  h += "</div>";

  // Division Filter
  h += "<div>";
  h +=
    '<label style="display:block;margin-bottom:0.5rem;color:var(--navy);font-weight:600;font-size:0.9rem;">DIVISION FILTER</label>';
  h +=
    '<select id="division-filter" style="width:100%;padding:0.75rem;border:2px solid var(--border);border-radius:8px;font-size:0.95rem;background:#fff;">';
  if (isGlobalLogbookRole(currentUser.role)) {
    h += '<option value="all">All Divisions</option>';
    DIVISIONS.forEach(function (division) {
      h +=
        '<option value="' + division.name + '">' + division.name + "</option>";
    });
  } else {
    h +=
      '<option value="' +
      (currentUser.division || "ORD") +
      '">' +
      (currentUser.division || "ORD") +
      "</option>";
  }
  h += "</select>";
  h += "</div>";

  h += "</div>";

  // Generate Report Button
  h += '<div style="text-align:center;">';
  h +=
    '<button onclick="generateReport()" style="background:var(--navy);color:#fff;padding:1rem 3rem;border:none;border-radius:8px;font-size:1.1rem;font-weight:600;cursor:pointer;transition:all 0.3s ease;">📊 Generate Report</button>';
  h += "</div>";

  h += "</div>";

  // Export Options Section - MOVED TO BOTTOM
  h +=
    '<div style="background:#fff;border-radius:12px;padding:2rem;margin-bottom:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);">';
  h +=
    '<h2 style="margin:0 0 1.5rem 0;color:var(--navy);font-size:1.5rem;font-weight:600;">📤 Export Options</h2>';
  h +=
    '<p style="margin:0 0 2rem 0;color:var(--muted);font-size:1rem;">Choose your preferred export format for the generated report</p>';

  h +=
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;">';

  // PDF Export Card
  h +=
    '<div onclick="exportToPDF()" style="border:2px solid var(--border);border-radius:12px;padding:2rem;text-align:center;cursor:pointer;transition:all 0.3s ease;background:var(--pill);">';
  h += '<div style="font-size:3rem;margin-bottom:1rem;">📄</div>';
  h +=
    '<h3 style="margin:0 0 0.5rem 0;color:var(--navy);font-size:1.2rem;font-weight:600;">Export to PDF</h3>';
  h +=
    '<p style="margin:0;color:var(--muted);font-size:0.9rem;">Download as PDF file</p>';
  h += "</div>";

  // Excel Export Card
  h +=
    '<div onclick="exportToExcel()" style="border:2px solid var(--border);border-radius:12px;padding:2rem;text-align:center;cursor:pointer;transition:all 0.3s ease;background:var(--pill);">';
  h += '<div style="font-size:3rem;margin-bottom:1rem;">📊</div>';
  h +=
    '<h3 style="margin:0 0 0.5rem 0;color:var(--navy);font-size:1.2rem;font-weight:600;">Export to Excel</h3>';
  h +=
    '<p style="margin:0;color:var(--muted);font-size:0.9rem;">Download as Excel file</p>';
  h += "</div>";

  // Print Report Card
  h +=
    '<div onclick="printReport()" style="border:2px solid var(--border);border-radius:12px;padding:2rem;text-align:center;cursor:pointer;transition:all 0.3s ease;background:var(--pill);">';
  h += '<div style="font-size:3rem;margin-bottom:1rem;">🖨️</div>';
  h +=
    '<h3 style="margin:0 0 0.5rem 0;color:var(--navy);font-size:1.2rem;font-weight:600;">Print Report</h3>';
  h +=
    '<p style="margin:0;color:var(--muted);font-size:0.9rem;">Print directly</p>';
  h += "</div>";

  // Preview Card
  h +=
    '<div onclick="previewReport()" style="border:2px solid var(--border);border-radius:12px;padding:2rem;text-align:center;cursor:pointer;transition:all 0.3s ease;background:var(--pill);">';
  h += '<div style="font-size:3rem;margin-bottom:1rem;">👁️</div>';
  h +=
    '<h3 style="margin:0 0 0.5rem 0;color:var(--navy);font-size:1.2rem;font-weight:600;">Preview</h3>';
  h +=
    '<p style="margin:0;color:var(--muted);font-size:0.9rem;">View before export</p>';
  h += "</div>";

  h += "</div>";
  h += "</div>";

  // Report Preview Section
  h +=
    '<div id="report-preview-card" style="display:none;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid var(--border);overflow:hidden;">';
  h +=
    '<div style="background:linear-gradient(135deg,var(--navy) 0%,var(--navy2) 100%);color:#fff;padding:2rem;">';
  h +=
    '<div style="display:flex;align-items:center;justify-content:space-between;">';
  h += "<div>";
  h +=
    '<h2 style="margin:0 0 0.5rem 0;font-size:1.5rem;font-weight:600;">Report Preview</h2>';
  h +=
    '<p style="margin:0;font-size:1rem;opacity:0.9;">Your generated report is ready</p>';
  h += "</div>";
  h += '<div style="display:flex;gap:1rem;">';
  h +=
    '<button onclick="exportToPDF()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:500;">📄 PDF</button>';
  h +=
    '<button onclick="exportToExcel()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:500;">📊 Excel</button>';
  h +=
    '<button onclick="printReport()" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:0.75rem 1.5rem;border-radius:8px;cursor:pointer;font-weight:500;">🖨️ Print</button>';
  h += "</div>";
  h += "</div>";
  h += "</div>";
  h += '<div style="padding:2rem;">';
  h += '<div id="report-content"></div>';
  h += "</div>";
  h += "</div>";

  h += "</div>";

  return h;
}

function updateReportOptions() {
  var reportType = document.getElementById("report-type").value;
  // Update options based on report type
  console.log("Report type changed to:", reportType);
}

function generateReport() {
  var reportType = document.getElementById("report-type").value;
  var fromDate = document.getElementById("from-date").value;
  var toDate = document.getElementById("to-date").value;
  var divisionFilter = document.getElementById("division-filter").value;

  // Show preview card
  var previewCard = document.getElementById("report-preview-card");
  var reportContent = document.getElementById("report-content");

  previewCard.style.display = "block";

  // Generate report content based on type
  var reportHTML = generateReportContent(
    reportType,
    fromDate,
    toDate,
    divisionFilter,
  );
  reportContent.innerHTML = reportHTML;

  showSuccess("Report generated successfully!");
}

function generateReportContent(type, fromDate, toDate, division) {
  var filteredDocs = filterDocumentsForReport(fromDate, toDate, division);
  var h = '<div class="report-content">';

  // Report Header
  h +=
    '<div class="report-header" style="text-align:center;margin-bottom:2rem;border-bottom:2px solid var(--border);padding-bottom:1rem;">';
  h +=
    '<h2 style="color:var(--navy);margin-bottom:0.5rem;">' +
    getReportTitle(type) +
    "</h2>";
  h +=
    '<p style="color:var(--muted);margin:0;">Period: ' +
    formatDate(fromDate) +
    " to " +
    formatDate(toDate) +
    "</p>";
  h +=
    '<p style="color:var(--muted);margin:0;">Generated on: ' +
    formatDate(new Date()) +
    "</p>";
  h += "</div>";

  // Report Summary
  h +=
    '<div class="report-summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">';
  h +=
    '<div class="summary-card" style="background:var(--pill);padding:1rem;border-radius:8px;text-align:center;">';
  h +=
    '<div style="font-size:24px;font-weight:600;color:var(--navy);">' +
    filteredDocs.length +
    "</div>";
  h += '<div style="font-size:12px;color:var(--muted);">Total Documents</div>';
  h += "</div>";
  h +=
    '<div class="summary-card" style="background:var(--pill);padding:1rem;border-radius:8px;text-align:center;">';
  h +=
    '<div style="font-size:24px;font-weight:600;color:var(--success);">' +
    getDocumentCountByStatus(filteredDocs, "Approved") +
    "</div>";
  h += '<div style="font-size:12px;color:var(--muted);">Approved</div>';
  h += "</div>";
  h +=
    '<div class="summary-card" style="background:var(--pill);padding:1rem;border-radius:8px;text-align:center;">';
  h +=
    '<div style="font-size:24px;font-weight:600;color:var(--warn);">' +
    getDocumentCountByStatus(filteredDocs, "For RD Approval") +
    "</div>";
  h += '<div style="font-size:12px;color:var(--muted);">Pending Approval</div>';
  h += "</div>";
  h +=
    '<div class="summary-card" style="background:var(--pill);padding:1rem;border-radius:8px;text-align:center;">';
  h +=
    '<div style="font-size:24px;font-weight:600;color:var(--info);">' +
    getDocumentCountByStatus(filteredDocs, "Released") +
    "</div>";
  h += '<div style="font-size:12px;color:var(--muted);">Released</div>';
  h += "</div>";
  h += "</div>";

  // Report Table
  h += '<div class="report-table-container doc-table-wrap">';
  h += '<table class="doc-table">';
  h +=
    "<thead><tr><th>Reference No.</th><th>Date</th><th>Type</th><th>From</th><th>Subject</th><th>To</th><th>Status</th><th>Division</th></tr></thead>";
  h += "<tbody>";

  filteredDocs.forEach(function (doc, index) {
    h += "<tr>";
    h +=
      '<td style="font-family:monospace;font-size:12px;">' + doc.ref + "</td>";
    h += "<td>" + doc.date + "</td>";
    h += "<td>" + doc.type + "</td>";
    h += "<td>" + doc.from + "</td>";
    h += "<td>" + doc.subject + "</td>";
    h += "<td>" + doc.to + "</td>";
    h += "<td>" + statusPill(doc.status) + "</td>";
    h += "<td>" + (doc.division || "ORD") + "</td>";
    h += "</tr>";
  });

  h += "</tbody></table>";
  h += "</div>";

  h += "</div>";
  return h;
}

function filterDocumentsForReport(fromDate, toDate, division) {
  var visibleDocs = getVisibleDocumentsForRole();
  var filtered = visibleDocs.filter(function (doc) {
    var docDate = new Date(doc.date);
    var from = new Date(fromDate);
    var to = new Date(toDate);

    var dateMatch = docDate >= from && docDate <= to;
    var divisionMatch =
      division === "all" || (doc.division || "ORD") === division;

    return dateMatch && divisionMatch;
  });

  return filtered;
}

function getDocumentCountByStatus(docs, status) {
  return docs.filter(function (doc) {
    return doc.status === status;
  }).length;
}

function getReportTitle(type) {
  var titles = {
    "document-summary": "Document Summary Report",
    "division-wise": "Division-wise Report",
    "status-wise": "Status-wise Report",
    "date-range": "Date Range Report",
    "user-activity": "User Activity Report",
    custom: "Custom Report",
  };
  return titles[type] || "Document Report";
}

function exportToPDF() {
  var reportContent = document.getElementById("report-content");
  if (!reportContent || reportContent.innerHTML.trim() === "") {
    showError("Please generate a report first");
    return;
  }

  // Create a temporary window for PDF generation
  var printWindow = window.open("", "_blank");
  var reportHTML = "<html><head><title>Enhanced Report</title>";
  reportHTML += "<style>";
  reportHTML += "body { font-family: Arial, sans-serif; margin: 20px; }";
  reportHTML +=
    "table { width: 100%; border-collapse: collapse; margin: 20px 0; }";
  reportHTML +=
    "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }";
  reportHTML += "th { background-color: #f2f2f2; font-weight: bold; }";
  reportHTML += ".report-header { text-align: center; margin-bottom: 30px; }";
  reportHTML +=
    ".summary-card { background: #f8f9fa; padding: 15px; margin: 10px; border-radius: 8px; text-align: center; }";
  reportHTML += "</style>";
  reportHTML += "</head><body>";
  reportHTML += reportContent.innerHTML;
  reportHTML += "</body></html>";

  printWindow.document.write(reportHTML);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };

  showSuccess("PDF export initiated");
}

function exportToExcel() {
  var reportContent = document.getElementById("report-content");
  if (!reportContent || reportContent.innerHTML.trim() === "") {
    showError("Please generate a report first");
    return;
  }

  var fromDate = document.getElementById("from-date").value;
  var toDate = document.getElementById("to-date").value;
  var division = document.getElementById("division-filter").value;

  var filteredDocs = filterDocumentsForReport(fromDate, toDate, division);

  // Create CSV content
  var csvContent = "Reference No.,Date,Type,From,Subject,To,Status,Division\n";

  filteredDocs.forEach(function (doc) {
    csvContent += `"${doc.ref}","${doc.date}","${doc.type}","${doc.from}","${doc.subject}","${doc.to}","${doc.status}","${doc.division || "ORD"}"\n`;
  });

  // Create and download file
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "enhanced_report_" + formatDateISO(new Date()) + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showSuccess("Excel export completed");
}

function printReport() {
  var reportContent = document.getElementById("report-content");
  if (!reportContent || reportContent.innerHTML.trim() === "") {
    showError("Please generate a report first");
    return;
  }

  var printWindow = window.open("", "_blank");
  var reportHTML = "<html><head><title>Enhanced Report</title>";
  reportHTML += "<style>";
  reportHTML += "body { font-family: Arial, sans-serif; margin: 20px; }";
  reportHTML +=
    "table { width: 100%; border-collapse: collapse; margin: 20px 0; }";
  reportHTML +=
    "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }";
  reportHTML += "th { background-color: #f2f2f2; font-weight: bold; }";
  reportHTML += ".report-header { text-align: center; margin-bottom: 30px; }";
  reportHTML +=
    ".summary-card { background: #f8f9fa; padding: 15px; margin: 10px; border-radius: 8px; text-align: center; }";
  reportHTML += "@media print { .no-print { display: none; } }";
  reportHTML += "</style>";
  reportHTML += "</head><body>";
  reportHTML += reportContent.innerHTML;
  reportHTML += "</body></html>";

  printWindow.document.write(reportHTML);
  printWindow.document.close();

  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };

  showSuccess("Print dialog opened");
}

function previewReport() {
  var reportContent = document.getElementById("report-content");
  if (!reportContent || reportContent.innerHTML.trim() === "") {
    showError("Please generate a report first");
    return;
  }

  // Open in new window for preview
  var previewWindow = window.open(
    "",
    "_blank",
    "width=800,height=600,scrollbars=yes",
  );
  var reportHTML = "<html><head><title>Report Preview</title>";
  reportHTML += "<style>";
  reportHTML += "body { font-family: Arial, sans-serif; margin: 20px; }";
  reportHTML +=
    "table { width: 100%; border-collapse: collapse; margin: 20px 0; }";
  reportHTML +=
    "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }";
  reportHTML += "th { background-color: #f2f2f2; font-weight: bold; }";
  reportHTML += ".report-header { text-align: center; margin-bottom: 30px; }";
  reportHTML +=
    ".summary-card { background: #f8f9fa; padding: 15px; margin: 10px; border-radius: 8px; text-align: center; }";
  reportHTML += "</style>";
  reportHTML += "</head><body>";
  reportHTML += reportContent.innerHTML;
  reportHTML += "</body></html>";

  previewWindow.document.write(reportHTML);
  previewWindow.document.close();

  showSuccess("Report preview opened in new window");
}

// Dashboard customization preferences
var dashboardPreferences = {
  visibleWidgets: {
    statusChart: true,
    divisionChart: true,
    typeChart: true,
    trendChart: true
  },
  chartTypes: {
    statusChart: 'bar',
    divisionChart: 'donut',
    typeChart: 'bar',
    trendChart: 'line'
  },
  dateRange: 30 // days
};

function openCustomizationModal() {
  // Create customization modal with dashboard widget options
  var modalHTML = '<div class="modal-overlay" id="customization-modal" onclick="closeCustomizationModal(event)">';
  modalHTML += '<div class="modal" style="max-width:650px;" onclick="event.stopPropagation();">';
  modalHTML += '<div class="modal-head">';
  modalHTML += '<h3>⚙️ Customize Dashboard</h3>';
  modalHTML += '<span class="modal-close" onclick="closeCustomizationModal()">✕</span>';
  modalHTML += '</div>';
  modalHTML += '<div class="modal-body" style="max-height:500px;overflow-y:auto;">';

  // Visible Widgets Section
  modalHTML += '<div style="margin-bottom:1.5rem;">';
  modalHTML += '<label style="font-weight:600;font-size:14px;color:var(--navy);display:block;margin-bottom:0.75rem;">📊 VISIBLE WIDGETS</label>';
  modalHTML += '<div style="background:var(--pill);padding:1rem;border-radius:8px;display:flex;flex-direction:column;gap:0.75rem;">';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;padding:0.5rem;">';
  modalHTML += '<input type="checkbox" id="widget-status" ' + (dashboardPreferences.visibleWidgets.statusChart ? 'checked' : '') + ' style="cursor:pointer;width:18px;height:18px;">';
  modalHTML += '<span style="flex:1;font-size:14px;">Document Status Overview</span>';
  modalHTML += '</label>';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;padding:0.5rem;">';
  modalHTML += '<input type="checkbox" id="widget-division" ' + (dashboardPreferences.visibleWidgets.divisionChart ? 'checked' : '') + ' style="cursor:pointer;width:18px;height:18px;">';
  modalHTML += '<span style="flex:1;font-size:14px;">Division Distribution</span>';
  modalHTML += '</label>';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;padding:0.5rem;">';
  modalHTML += '<input type="checkbox" id="widget-type" ' + (dashboardPreferences.visibleWidgets.typeChart ? 'checked' : '') + ' style="cursor:pointer;width:18px;height:18px;">';
  modalHTML += '<span style="flex:1;font-size:14px;">Document Types</span>';
  modalHTML += '</label>';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;padding:0.5rem;">';
  modalHTML += '<input type="checkbox" id="widget-trend" ' + (dashboardPreferences.visibleWidgets.trendChart ? 'checked' : '') + ' style="cursor:pointer;width:18px;height:18px;">';
  modalHTML += '<span style="flex:1;font-size:14px;">Monthly Trend</span>';
  modalHTML += '</label>';

  modalHTML += '</div></div>';

  // Chart Types Section
  modalHTML += '<div style="margin-bottom:1.5rem;">';
  modalHTML += '<label style="font-weight:600;font-size:14px;color:var(--navy);display:block;margin-bottom:0.75rem;">🎨 CHART STYLE PREFERENCES</label>';
  modalHTML += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">';

  modalHTML += '<div>';
  modalHTML += '<label style="display:block;font-size:12px;color:var(--muted);margin-bottom:0.4rem;">Status Overview</label>';
  modalHTML += '<select id="chart-type-status" style="width:100%;padding:0.6rem;border:1.5px solid var(--border);border-radius:6px;font-size:13px;">';
  modalHTML += '<option value="bar" ' + (dashboardPreferences.chartTypes.statusChart === 'bar' ? 'selected' : '') + '>Horizontal Bar Chart</option>';
  modalHTML += '<option value="vertical" ' + (dashboardPreferences.chartTypes.statusChart === 'vertical' ? 'selected' : '') + '>Vertical Bar Chart</option>';
  modalHTML += '</select>';
  modalHTML += '</div>';

  modalHTML += '<div>';
  modalHTML += '<label style="display:block;font-size:12px;color:var(--muted);margin-bottom:0.4rem;">Division Distribution</label>';
  modalHTML += '<select id="chart-type-division" style="width:100%;padding:0.6rem;border:1.5px solid var(--border);border-radius:6px;font-size:13px;">';
  modalHTML += '<option value="donut" ' + (dashboardPreferences.chartTypes.divisionChart === 'donut' ? 'selected' : '') + '>Donut Chart</option>';
  modalHTML += '<option value="bar" ' + (dashboardPreferences.chartTypes.divisionChart === 'bar' ? 'selected' : '') + '>Bar Chart</option>';
  modalHTML += '</select>';
  modalHTML += '</div>';

  modalHTML += '<div>';
  modalHTML += '<label style="display:block;font-size:12px;color:var(--muted);margin-bottom:0.4rem;">Document Types</label>';
  modalHTML += '<select id="chart-type-type" style="width:100%;padding:0.6rem;border:1.5px solid var(--border);border-radius:6px;font-size:13px;">';
  modalHTML += '<option value="bar" ' + (dashboardPreferences.chartTypes.typeChart === 'bar' ? 'selected' : '') + '>Bar Chart</option>';
  modalHTML += '<option value="donut" ' + (dashboardPreferences.chartTypes.typeChart === 'donut' ? 'selected' : '') + '>Donut Chart</option>';
  modalHTML += '</select>';
  modalHTML += '</div>';

  modalHTML += '<div>';
  modalHTML += '<label style="display:block;font-size:12px;color:var(--muted);margin-bottom:0.4rem;">Monthly Trend</label>';
  modalHTML += '<select id="chart-type-trend" style="width:100%;padding:0.6rem;border:1.5px solid var(--border);border-radius:6px;font-size:13px;">';
  modalHTML += '<option value="line" ' + (dashboardPreferences.chartTypes.trendChart === 'line' ? 'selected' : '') + '>Line Chart</option>';
  modalHTML += '<option value="bar" ' + (dashboardPreferences.chartTypes.trendChart === 'bar' ? 'selected' : '') + '>Bar Chart</option>';
  modalHTML += '</select>';
  modalHTML += '</div>';

  modalHTML += '</div></div>';

  // Date Range Section
  modalHTML += '<div style="margin-bottom:1rem;">';
  modalHTML += '<label style="font-weight:600;font-size:14px;color:var(--navy);display:block;margin-bottom:0.75rem;">📅 DEFAULT DATE RANGE</label>';
  modalHTML += '<div style="background:var(--pill);padding:1rem;border-radius:8px;display:flex;flex-direction:column;gap:0.6rem;">';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
  modalHTML += '<input type="radio" name="date-range" value="7" ' + (dashboardPreferences.dateRange === 7 ? 'checked' : '') + ' style="cursor:pointer;">';
  modalHTML += '<span style="font-size:14px;">Last 7 days</span>';
  modalHTML += '</label>';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
  modalHTML += '<input type="radio" name="date-range" value="30" ' + (dashboardPreferences.dateRange === 30 ? 'checked' : '') + ' style="cursor:pointer;">';
  modalHTML += '<span style="font-size:14px;">Last 30 days</span>';
  modalHTML += '</label>';

  modalHTML += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
  modalHTML += '<input type="radio" name="date-range" value="90" ' + (dashboardPreferences.dateRange === 90 ? 'checked' : '') + ' style="cursor:pointer;">';
  modalHTML += '<span style="font-size:14px;">Last 90 days</span>';
  modalHTML += '</label>';

  modalHTML += '</div></div>';

  modalHTML += '</div>';
  modalHTML += '<div class="modal-footer" style="display:flex;gap:0.75rem;justify-content:space-between;">';
  modalHTML += '<button class="btn-sec" onclick="resetDashboardPreferences()" style="margin-right:auto;">Reset to Default</button>';
  modalHTML += '<div style="display:flex;gap:0.75rem;">';
  modalHTML += '<button class="btn-sec" onclick="closeCustomizationModal()">Cancel</button>';
  modalHTML += '<button class="btn-send" onclick="applyCustomization()">Save Changes</button>';
  modalHTML += '</div>';
  modalHTML += '</div>';
  modalHTML += '</div>';
  modalHTML += '</div>';

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function closeCustomizationModal(event) {
  if (!event || event.target.id === "customization-modal") {
    var modal = document.getElementById("customization-modal");
    if (modal) {
      modal.remove();
    }
  }
}

function applyCustomization() {
  // Save visible widgets preferences
  dashboardPreferences.visibleWidgets.statusChart = document.getElementById("widget-status").checked;
  dashboardPreferences.visibleWidgets.divisionChart = document.getElementById("widget-division").checked;
  dashboardPreferences.visibleWidgets.typeChart = document.getElementById("widget-type").checked;
  dashboardPreferences.visibleWidgets.trendChart = document.getElementById("widget-trend").checked;

  // Save chart type preferences
  dashboardPreferences.chartTypes.statusChart = document.getElementById("chart-type-status").value;
  dashboardPreferences.chartTypes.divisionChart = document.getElementById("chart-type-division").value;
  dashboardPreferences.chartTypes.typeChart = document.getElementById("chart-type-type").value;
  dashboardPreferences.chartTypes.trendChart = document.getElementById("chart-type-trend").value;

  // Save date range preference
  var selectedRange = document.querySelector('input[name="date-range"]:checked');
  if (selectedRange) {
    dashboardPreferences.dateRange = parseInt(selectedRange.value);
  }

  closeCustomizationModal();

  // Refresh the dashboard with new preferences
  showSuccess("Dashboard customization applied successfully!");
  showPage("enhanced-reports");
}

function resetDashboardPreferences() {
  // Reset to defaults
  dashboardPreferences = {
    visibleWidgets: {
      statusChart: true,
      divisionChart: true,
      typeChart: true,
      trendChart: true
    },
    chartTypes: {
      statusChart: 'bar',
      divisionChart: 'donut',
      typeChart: 'bar',
      trendChart: 'line'
    },
    dateRange: 30
  };

  closeCustomizationModal();
  showSuccess("Dashboard preferences reset to default");
  showPage("enhanced-reports");
}

function resetReportFilters() {
  document.getElementById("report-type").value = "document-summary";
  document.getElementById("from-date").value = getDateString(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  document.getElementById("to-date").value = getDateString(new Date());
  document.getElementById("division-filter").value = "all";

  // Hide preview
  var previewCard = document.getElementById("report-preview-card");
  if (previewCard) {
    previewCard.style.display = "none";
  }

  showSuccess("Filters reset successfully");
}

function getDateString(date) {
  return date.toISOString().split("T")[0];
}

function formatDate(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateISO(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
}

function renderStatusChart() {
  var statusData = getStatusData();
  var total = statusData.reduce((sum, item) => sum + item.value, 0);
  var chartType = dashboardPreferences.chartTypes.statusChart;

  var h = '<div style="display:flex;align-items:center;justify-content:center;height:100%;gap:2rem;">';

  if (chartType === 'vertical') {
    // Vertical bar chart
    h += '<div style="display:flex;align-items:flex-end;justify-content:space-around;width:100%;height:250px;gap:1rem;padding:1rem 0;">';
    statusData.forEach(function (item) {
      var percentage = total > 0 ? (item.value / total) * 100 : 0;
      var barHeight = (percentage / 100) * 200; // Max 200px height
      h += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;">';
      h += '<div style="font-weight:600;font-size:1.2rem;margin-bottom:0.5rem;">' + item.value + '</div>';
      h += '<div style="width:100%;background:' + item.color + ';border-radius:8px 8px 0 0;transition:height 1s ease;height:' + barHeight + 'px;"></div>';
      h += '<div style="font-size:0.85rem;font-weight:500;margin-top:0.5rem;text-align:center;">' + item.label + '</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    // Horizontal bar chart (default)
    h += '<div style="display:flex;flex-direction:column;gap:1rem;width:100%;">';
    statusData.forEach(function (item) {
      var percentage = total > 0 ? (item.value / total) * 100 : 0;
      var barWidth = percentage;
      h += '<div style="display:flex;align-items:center;gap:1rem;">';
      h += '<div style="width:100px;font-size:0.9rem;font-weight:500;">' + item.label + '</div>';
      h += '<div style="flex:1;background:var(--pill);border-radius:4px;height:24px;position:relative;overflow:hidden;">';
      h += '<div style="width:' + barWidth + '%;height:100%;background:' + item.color + ';transition:width 1s ease;"></div>';
      h += '</div>';
      h += '<div style="width:40px;text-align:right;font-weight:600;">' + item.value + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function renderDivisionChart() {
  var divisionData = getDivisionData();
  var total = divisionData.reduce((sum, item) => sum + item.value, 0);
  var chartType = dashboardPreferences.chartTypes.divisionChart;

  var h = '<div style="display:flex;align-items:center;justify-content:center;height:100%;">';

  if (chartType === 'bar') {
    // Bar chart view
    h += '<div style="display:flex;flex-direction:column;gap:1rem;width:100%;">';
    divisionData.forEach(function (item) {
      var percentage = total > 0 ? (item.value / total) * 100 : 0;
      h += '<div style="display:flex;align-items:center;gap:1rem;">';
      h += '<div style="width:50px;font-size:0.85rem;font-weight:500;">' + item.label + '</div>';
      h += '<div style="flex:1;background:var(--pill);border-radius:4px;height:22px;position:relative;overflow:hidden;">';
      h += '<div style="width:' + percentage + '%;height:100%;background:' + item.color + ';transition:width 1s ease;"></div>';
      h += '</div>';
      h += '<div style="width:35px;text-align:right;font-weight:600;font-size:0.9rem;">' + item.value + '</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    // Donut chart view (default)
    h += '<div style="width:200px;height:200px;border-radius:50%;background:conic-gradient(';
    var accumulated = 0;
    divisionData.forEach(function (item, index) {
      var percentage = total > 0 ? (item.value / total) * 100 : 0;
      if (index > 0) h += ", ";
      h += item.color + " " + accumulated + "% " + (accumulated + percentage) + "%";
      accumulated += percentage;
    });
    h += ');position:relative;">';
    h += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:50%;width:120px;height:120px;display:flex;align-items:center;justify-content:center;flex-direction:column;">';
    h += '<div style="font-size:1.5rem;font-weight:600;color:var(--navy);">' + total + '</div>';
    h += '<div style="font-size:0.8rem;color:var(--muted);">Total</div>';
    h += '</div>';
    h += '</div>';

    // Legend
    h += '<div style="margin-left:2rem;">';
    divisionData.forEach(function (item) {
      h += '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">';
      h += '<div style="width:12px;height:12px;border-radius:2px;background:' + item.color + ';"></div>';
      h += '<span style="font-size:0.9rem;">' + item.label + " (" + item.value + ")</span>";
      h += '</div>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function renderTypeChart() {
  var typeData = getTypeData();
  var total = typeData.reduce((sum, item) => sum + item.value, 0);
  var max = Math.max(...typeData.map((item) => item.value));
  var chartType = dashboardPreferences.chartTypes.typeChart;

  var h = '<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;">';

  if (chartType === 'donut') {
    // Donut chart view
    h += '<div style="width:200px;height:200px;border-radius:50%;background:conic-gradient(';
    var accumulated = 0;
    typeData.forEach(function (item, index) {
      var percentage = total > 0 ? (item.value / total) * 100 : 0;
      if (index > 0) h += ", ";
      h += item.color + " " + accumulated + "% " + (accumulated + percentage) + "%";
      accumulated += percentage;
    });
    h += ');position:relative;">';
    h += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:50%;width:120px;height:120px;display:flex;align-items:center;justify-content:center;flex-direction:column;">';
    h += '<div style="font-size:1.5rem;font-weight:600;color:var(--navy);">' + total + '</div>';
    h += '<div style="font-size:0.8rem;color:var(--muted);">Types</div>';
    h += '</div>';
    h += '</div>';

    // Legend
    h += '<div style="margin-left:2rem;">';
    typeData.forEach(function (item) {
      h += '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">';
      h += '<div style="width:12px;height:12px;border-radius:2px;background:' + item.color + ';"></div>';
      h += '<span style="font-size:0.9rem;">' + item.label + " (" + item.value + ")</span>";
      h += '</div>';
    });
    h += '</div>';
  } else {
    // Bar chart view (default)
    h += '<div style="width:100%;display:flex;flex-direction:column;gap:1rem;">';
    typeData.forEach(function (item) {
      var barWidth = max > 0 ? (item.value / max) * 100 : 0;
      h += '<div style="display:flex;align-items:center;gap:1rem;">';
      h += '<div style="width:100px;font-size:0.9rem;font-weight:500;">' + item.label + '</div>';
      h += '<div style="flex:1;background:var(--pill);border-radius:4px;height:20px;position:relative;">';
      h += '<div style="width:' + barWidth + '%;height:100%;background:' + item.color + ';transition:width 1s ease;"></div>';
      h += '</div>';
      h += '<div style="width:30px;text-align:right;font-weight:600;">' + item.value + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function renderTrendChart() {
  var trendData = getTrendData();
  var max = Math.max(...trendData.map((item) => item.value));
  var chartType = dashboardPreferences.chartTypes.trendChart;

  var h = '<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;">';

  if (chartType === 'bar') {
    // Bar chart view
    h += '<div style="display:flex;align-items:flex-end;justify-content:space-around;width:100%;height:200px;gap:0.5rem;padding:1rem 0;">';
    trendData.forEach(function (item) {
      var barHeight = max > 0 ? (item.value / max) * 160 : 0;
      h += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:40px;">';
      h += '<div style="font-weight:600;font-size:0.9rem;margin-bottom:0.3rem;color:var(--navy);">' + item.value + '</div>';
      h += '<div style="width:100%;max-width:50px;background:var(--navy);border-radius:4px 4px 0 0;transition:height 1s ease;height:' + barHeight + 'px;"></div>';
      h += '<div style="font-size:0.75rem;font-weight:500;margin-top:0.3rem;text-align:center;">' + item.label + '</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    // Line chart view (default)
    h += '<div style="width:100%;height:200px;position:relative;">';
    h += '<svg width="100%" height="100%" viewBox="0 0 400 200">';

    // Draw grid lines
    for (var i = 0; i <= 4; i++) {
      var y = (i / 4) * 180 + 10;
      h += '<line x1="40" y1="' + y + '" x2="380" y2="' + y + '" stroke="#e5e7eb" stroke-width="1"/>';
    }

    // Draw line
    var points = trendData.map(function (item, index) {
      var x = 40 + (index / (trendData.length - 1)) * 340;
      var y = 190 - (item.value / max) * 170;
      return x + "," + y;
    }).join(" ");

    h += '<polyline points="' + points + '" fill="none" stroke="var(--navy)" stroke-width="3"/>';

    // Draw points
    trendData.forEach(function (item, index) {
      var x = 40 + (index / (trendData.length - 1)) * 340;
      var y = 190 - (item.value / max) * 170;
      h += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--navy)"/>';
      h += '<text x="' + x + '" y="195" text-anchor="middle" font-size="10" fill="#666">' + item.label + '</text>';
    });

    h += '</svg>';
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function getStatusData() {
  var visibleDocs = getVisibleDocumentsForRole();
  var approved = getDocumentCountByStatus(visibleDocs, "Approved");
  var pending = getDocumentCountByStatus(visibleDocs, "For RD Approval");
  var released = getDocumentCountByStatus(visibleDocs, "Released");
  var clearance = getDocumentCountByStatus(visibleDocs, "For ARD Clearance");

  return [
    { label: "Approved", value: approved, color: "#10b981" },
    { label: "Pending", value: pending, color: "#f59e0b" },
    { label: "Released", value: released, color: "#3b82f6" },
    { label: "Clearance", value: clearance, color: "#8b5cf6" },
  ];
}

function getDivisionData() {
  var visibleDocs = getVisibleDocumentsForRole();
  var divisionCounts = {};
  visibleDocs.forEach(function (doc) {
    var division = doc.division || "ORD";
    divisionCounts[division] = (divisionCounts[division] || 0) + 1;
  });

  var colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#06b6d4",
    "#eab308",
  ];
  var data = [];
  var colorIndex = 0;

  Object.keys(divisionCounts).forEach(function (division) {
    data.push({
      label: division,
      value: divisionCounts[division],
      color: colors[colorIndex % colors.length],
    });
    colorIndex++;
  });

  return data;
}

function getTypeData() {
  var visibleDocs = getVisibleDocumentsForRole();
  var typeCounts = {};
  visibleDocs.forEach(function (doc) {
    var t = doc.type || "Other";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  var colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  var sortedTypes = Object.keys(typeCounts).map(function (type) {
    return { label: type, value: typeCounts[type] };
  }).sort(function (a, b) {
    return b.value - a.value;
  });

  var data = [];
  var colorIndex = 0;

  if (sortedTypes.length > 5) {
    var top4 = sortedTypes.slice(0, 4);
    var otherSum = sortedTypes.slice(4).reduce(function (sum, item) {
      return sum + item.value;
    }, 0);

    top4.forEach(function (item) {
      data.push({
        label: item.label,
        value: item.value,
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    });

    data.push({
      label: "Other",
      value: otherSum,
      color: "#64748b"
    });
  } else {
    sortedTypes.forEach(function (item) {
      data.push({
        label: item.label,
        value: item.value,
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    });
  }

  return data;
}

function getTrendData() {
  var visibleDocs = getVisibleDocumentsForRole();
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  // Generate trend data based on visible documents
  return months.map(function (month, index) {
    // For demo purposes, generate some realistic trend data
    var baseValue = Math.floor(visibleDocs.length / 6);
    var variation = Math.floor(Math.random() * 10) - 5;
    return {
      label: month,
      value: Math.max(1, baseValue + variation),
    };
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensureResponsiveConsistency);
} else {
  ensureResponsiveConsistency();
}

/* ==========================================================================
   LATEST ANNOUNCEMENTS LOGIC
   ========================================================================== */

function getSortedAnnouncements() {
  const todayStr = formatDateISO(new Date());
  return announcements
    .filter(function (ann) {
      if (ann.expiryDate && ann.expiryDate < todayStr) return false;
      return true;
    })
    .sort(function (a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.datePosted) - new Date(a.datePosted);
    });
}

function renderLatestAnnouncementsList() {
  var sorted = getSortedAnnouncements();
  var latest = sorted.slice(0, 3);
  var h = "";
  if (latest.length === 0) {
    h += '<div style="padding:1.5rem;text-align:center;color:var(--muted)">No active announcements.</div>';
  } else {
    h += '<div class="ann-widget-list">';
    latest.forEach(function (ann) {
      var badgeClass = "pill-gray";
      if (ann.priority === "Urgent") badgeClass = "pill-red";
      else if (ann.priority === "Important") badgeClass = "pill-amber";
      else if (ann.priority === "Normal") badgeClass = "pill-blue";

      var pinHtml = ann.pinned
        ? '<span style="font-size:16px;flex-shrink:0;" title="Pinned">📌</span>'
        : '';

      h += '<div class="ann-widget-item" onclick="viewAnnouncementDetail(' + ann.id + ')">' +
        '<div style="display:flex;align-items:center;gap:0.5rem;">' +
        '<span class="ann-widget-item-title">' + escapeHtml(ann.title) + '</span>' +
        '<span class="pill ' + badgeClass + '">' + escapeHtml(ann.priority) + '</span>' +
        pinHtml +
        '</div>' +
        '<div class="ann-widget-item-meta">' +
        '<span>By ' + escapeHtml(ann.postedBy) + '</span>' +
        '<span>' + escapeHtml(ann.datePosted) + '</span>' +
        '</div>' +
        '</div>';
    });
    h += '</div>';
  }
  return h;
}

function renderAnnouncementsPage() {
  var canCreate = ["admin", "rd", "ard", "oic", "dc"].includes(currentUser.role);
  var html = '';
  html += '<div class="page-toolbar" style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.75rem;align-items:center;margin-bottom:1rem;">';
  html += '<div style="flex:1;max-width:50%;min-width:260px;position:relative;">';
  html += '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px;">🔍</span>';
  html += '<input id="announcement-page-search-input" placeholder="Search Announcements by title..." oninput="renderAnnouncementsPageList(this.value)" style="width:100%;padding:0.75rem 1rem 0.75rem 2.5rem;border:1.5px solid var(--border);border-radius:10px;background:#fff;color:var(--text);font-size:14px;outline:none;" />';
  html += '</div>';
  html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:flex-end;">';
  if (canCreate) html += '<button class="btn-send" onclick="openCreateAnnouncementModal()">Create Announcement</button>';
  html += '</div>';
  html += '</div>';
  html += '<div id="announcement-page-list"></div>';
  return html;
}

function renderAnnouncementsPageList(query) {
  var listEl = document.getElementById("announcement-page-list");
  if (!listEl) return;
  var sorted = getSortedAnnouncements();
  if (query) {
    query = query.toLowerCase().trim();
    sorted = sorted.filter(function (ann) {
      return ann.title.toLowerCase().indexOf(query) !== -1;
    });
  }
  var h = "";
  if (sorted.length === 0) {
    h += '<div style="padding:2rem;text-align:center;color:var(--muted)">No announcements found.</div>';
  } else {
    h += '<div class="announcement-list">';
    sorted.forEach(function (ann) {
      var pin = ann.pinned ? '<span class="ann-pin-icon" title="Pinned">📌</span>' : "";
      var badgeClass = "pill-gray";
      if (ann.priority === "Urgent") badgeClass = "pill-red";
      else if (ann.priority === "Important") badgeClass = "pill-amber";
      else if (ann.priority === "Normal") badgeClass = "pill-blue";
      var contentPreview = escapeHtml(ann.content || "");
      if (contentPreview.length > 80) contentPreview = contentPreview.substring(0, 80) + '...';

      h += '<div class="announcement-item" onclick="viewAnnouncementDetail(' + ann.id + ')">' +
        '<div class="ann-item-header">' +
        '<span class="ann-item-title">' + pin + escapeHtml(ann.title) + '</span>' +
        '<span class="pill ' + badgeClass + '">' + escapeHtml(ann.priority) + '</span>' +
        '</div>' +
        '<div class="ann-item-meta">' +
        '<span>By ' + escapeHtml(ann.postedBy) + '</span>' +
        '<span>' + escapeHtml(ann.datePosted) + '</span>' +
        '</div>' +
        '</div>';
    });
    h += '</div>';
  }
  listEl.innerHTML = h;
}


function openCreateAnnouncementModal() {
  // Clear fields
  document.getElementById("new-ann-title").value = "";
  document.getElementById("new-ann-content").value = "";
  document.getElementById("new-ann-priority").value = "Normal";
  document.getElementById("new-ann-expiry").value = "";
  document.getElementById("new-ann-pinned").checked = false;

  document.getElementById("create-announcement-modal").classList.add("open");
  document.body.classList.add("modal-open");
}

function closeCreateAnnouncementModal() {
  document.getElementById("create-announcement-modal").classList.remove("open");
  document.body.classList.remove("modal-open");
}

function publishAnnouncement() {
  var title = (document.getElementById("new-ann-title").value || "").trim();
  var content = (document.getElementById("new-ann-content").value || "").trim();
  var priority = document.getElementById("new-ann-priority").value;
  var expiry = document.getElementById("new-ann-expiry").value;
  var pinned = document.getElementById("new-ann-pinned").checked;

  if (!title) {
    showError("Announcement Title is required.");
    return;
  }
  if (!content) {
    showError("Announcement Content is required.");
    return;
  }

  var postedBy = currentUser.roleLabel;
  if (currentUser.role === "admin") postedBy = "System Administrator";

  var newId = announcements.length > 0 ? Math.max.apply(null, announcements.map(function (o) { return o.id; })) + 1 : 1;

  var newAnn = {
    id: newId,
    title: title,
    content: content,
    postedBy: postedBy,
    priority: priority,
    pinned: pinned,
    datePosted: formatDateISO(new Date())
  };

  if (expiry) {
    newAnn.expiryDate = expiry;
  }

  announcements.push(newAnn);
  showSuccess("Announcement published successfully.");
  closeCreateAnnouncementModal();

  // Automatically navigate to announcements page to see the new widget
  showPage("announcements");
}


function viewAnnouncementDetail(id) {
  var ann = announcements.find(function (a) { return a.id === id; });
  if (!ann) return;

  document.getElementById("detail-ann-title").textContent = ann.title;
  document.getElementById("detail-ann-content").textContent = ann.content;
  document.getElementById("detail-ann-date").textContent = "Posted on: " + ann.datePosted;
  document.getElementById("detail-ann-postedby").textContent = "By: " + ann.postedBy;

  var badgeContainer = document.getElementById("detail-ann-priority-badge");
  var badgeClass = "pill-gray";
  if (ann.priority === "Urgent") badgeClass = "pill-red";
  else if (ann.priority === "Important") badgeClass = "pill-amber";
  else if (ann.priority === "Normal") badgeClass = "pill-blue";
  badgeContainer.innerHTML = '<span class="pill ' + badgeClass + '">' + escapeHtml(ann.priority) + '</span>';

  var pinnedContainer = document.getElementById("detail-ann-pinned-status");
  pinnedContainer.textContent = ann.pinned ? "📌 Pinned Announcement" : "";

  // Open the detail modal
  document.getElementById("announcement-detail-modal").classList.add("open");
  document.body.classList.add("modal-open");
}

function closeAnnouncementDetailModal() {
  document.getElementById("announcement-detail-modal").classList.remove("open");
  document.body.classList.remove("modal-open");
}

