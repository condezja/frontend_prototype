
  var currentUser = { role: "admin", name: "Sir Harry", division: null };
  var currentPage = "dashboard";
  var REF_COUNTER_BY_MONTH = {};
  var currentEditingRef = null;
  var currentLogbookEditRef = null;
  var pendingUploadFileName = "";
  var currentQuickSendRef = null;

  var USERS = {
    admin: {
      role: "admin",
      name: "Sir Harry",
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
      division: "Finance and Administrative Division",
      email: "reyes@depdev7.gov.ph",
    },
    supervisor: {
      role: "supervisor",
      name: "Supervisor Jose",
      initial: "J",
      roleLabel: "Supervisor",
      division: "Finance and Administrative Division",
      email: "jose@depdev7.gov.ph",
    },
    staff: {
      role: "staff",
      name: "Staff Ana",
      initial: "A",
      roleLabel: "Staff",
      division: "Finance and Administrative Division",
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
        { icon: "🗑️", text: "Disposal Schedule", page: "disposal" },
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
    currentUser = Object.assign({}, USERS[role]);
    showApp();
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

  function doSignup() {
    var firstName = (document.getElementById("signup-first-name").value || "").trim();
    var lastName = (document.getElementById("signup-last-name").value || "").trim();
    var role = document.getElementById("role-select").value;

    if (!firstName || !lastName) {
      alert("Please enter your first name and last name.");
      return;
    }
    if (!role || !USERS[role]) {
      alert("Please select a valid role.");
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
      alert("Please select your division.");
      return;
    }
    if (division) base.division = division;

    currentUser = base;
    USERS[currentUser.role] = Object.assign({}, USERS[currentUser.role], base);
    showApp();
  }
  function doLogin() {
    showApp();
  }
  function showApp() {
    var u = currentUser;
    document.getElementById("sb-avatar").textContent = u.initial || u.name[0];
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
    showScreen("screen-signin");
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
          (item.badge
            ? '<span class="sb-badge">' + item.badge + "</span>"
            : "") +
          "</div>";
      });
    });
    html +=
      '<div class="sb-item" onclick="doLogout()" id="nav-signout"><span class="sb-icon">⬅</span>Sign out</div>';
    el.innerHTML = html;
  }

  function showPage(page) {
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
      disposal: "Disposal Schedule",
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
    else if (page === "notifications") c.innerHTML = titleHeader + renderNotifications();
    else if (page === "users") c.innerHTML = titleHeader + renderUsers();
    else if (page === "search") c.innerHTML = titleHeader + renderSearch();
    else if (page === "reports") c.innerHTML = titleHeader + renderReports();
    else if (page === "disposal") c.innerHTML = titleHeader + renderDisposal();
    else
      c.innerHTML =
        titleHeader +
        '<div class="card" style="padding:2rem;text-align:center;color:var(--muted)"><div style="font-size:40px;margin-bottom:1rem">🚧</div><div style="font-size:16px;font-weight:600">' +
        titles[page] +
        '</div><div style="font-size:13px;margin-top:.5rem">This section is under development.</div></div>';
  }

  function renderPageHeader(title) {
    return (
      '<div class="page-header"><div class="page-header-title">' +
      title +
      "</div></div>"
    );
  }

  function statusPill(s) {
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
      '<select class="btn-sm" onchange="handleActionMenu(this,\'' +
      ref +
      "','" +
      ef +
      '\')">' +
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
      h += statCard(
        "✅",
        "Cleared",
        "5",
        "Documents endorsed",
        "var(--success)",
      );
      h += statCard("🔔", "Alerts", "2", "Deadline reminders", "var(--danger)");
    } else if (r === "dc") {
      h += statCard(
        "📥",
        "Division Incoming",
        "6",
        "Unread/pending",
        "var(--info)",
      );
      h += statCard(
        "📤",
        "For Submission",
        "1",
        "Ready for ARD",
        "var(--warn)",
      );
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
    h += '<div></div>';
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
    h +=
      '<div class="card"><div class="card-head"><div class="card-title">Conversations</div></div>';
    var contacts = [
      {
        name: "ARD Mark",
        msg: "Please review the attached endorsement.",
        time: "10:24 AM",
        unread: 2,
      },
      {
        name: "Chief Reyes (FAD)",
        msg: "Budget doc is ready for routing.",
        time: "9:15 AM",
        unread: 0,
      },
      {
        name: "Sir Harry (Admin)",
        msg: "Document 2026-04-163 received.",
        time: "Yesterday",
        unread: 0,
      },
      {
        name: "Dir. RDJEN",
        msg: "Approved. Please release.",
        time: "Yesterday",
        unread: 0,
      },
    ];
    contacts.forEach(function (c, i) {
      h +=
        '<div onclick="selectChat(' +
        i +
        ')" style="display:flex;align-items:center;gap:.75rem;padding:.75rem;border-radius:10px;cursor:pointer;' +
        (i === 0 ? "background:var(--pill)" : "") +
        ';margin-bottom:2px">';
      h +=
        '<div style="width:40px;height:40px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">' +
        c.name[0] +
        "</div>";
      h +=
        '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><span style="font-size:13px;font-weight:600">' +
        c.name +
        '</span><span style="font-size:11px;color:var(--muted)">' +
        c.time +
        "</span></div>";
      h +=
        '<div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
        c.msg +
        "</div></div>";
      if (c.unread)
        h +=
          '<div style="background:var(--navy3);color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center">' +
          c.unread +
          "</div>";
      h += "</div>";
    });
    h += "</div>";

    h +=
      '<div class="card"><div class="card-head"><div class="card-title">ARD Mark</div><button class="btn-sm" onclick="openCompose()">📎 Attach Doc</button></div>';
    h += '<div class="chat-wrap">';
    var msgs = [
      {
        me: false,
        text: "Good morning! Please review the attached endorsement for Document 2026-04-163.",
        time: "9:05 AM",
      },
      {
        me: true,
        text: "Good morning, Sir. I'll review it now and forward to RD.",
        time: "9:10 AM",
      },
      {
        me: false,
        text: "Thank you. Please note the deadline is April 30.",
        time: "9:12 AM",
      },
      {
        me: true,
        text: "Noted, Sir. I'll prioritize this today.",
        time: "9:15 AM",
      },
      {
        me: false,
        text: "Also, please make sure the physical copy is on file.",
        time: "10:22 AM",
      },
      {
        me: true,
        text: "Yes sir, the physical copy is already logged.",
        time: "10:24 AM",
      },
    ];
    msgs.forEach(function (m) {
      h +=
        '<div class="chat-bubble ' +
        (m.me ? "me" : "them") +
        '"><div class="bubble-text">' +
        m.text +
        '</div><div class="bubble-meta">' +
        m.time +
        "</div></div>";
    });
    h += "</div>";
    h +=
      '<div class="chat-input-row"><input placeholder="Type a message..." id="chat-in"><button class="chat-send" onclick="sendChat()">Send</button></div>';
    h += "</div>";
    h += "</div>";
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
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem"><div class="section-title" style="margin:0">User Management</div><button class="btn-sm primary">+ Add User</button></div>';
    h += '<div class="card">';
    var users = [
      {
        name: "Sir Harry",
        role: "Admin",
        div: "ORD",
        email: "harry@depdev7.gov.ph",
        status: "Active",
      },
      {
        name: "Dir. RDJEN",
        role: "RD",
        div: "ORD",
        email: "rdjen@depdev7.gov.ph",
        status: "Active",
      },
      {
        name: "ARD Mark",
        role: "ARD",
        div: "ORD",
        email: "mark@depdev7.gov.ph",
        status: "Active",
      },
      {
        name: "Chief Reyes",
        role: "Division Chief",
        div: "FAD",
        email: "reyes@depdev7.gov.ph",
        status: "Active",
      },
      {
        name: "Staff Ana",
        role: "Staff",
        div: "FAD",
        email: "ana@depdev7.gov.ph",
        status: "Pending",
      },
      {
        name: "Supervisor Jose",
        role: "Supervisor",
        div: "MED",
        email: "jose@depdev7.gov.ph",
        status: "Active",
      },
    ];
    h +=
      '<table class="doc-table"><thead><tr><th>Name</th><th>Role</th><th>Division</th><th>Email</th><th>Status</th><th></th></tr></thead><tbody>';
    var visibleUsers = users.filter(function (u) {
      if (currentUser.role === "admin") return true;
      return (
        u.div === "FAD" &&
        (u.role === "Division Chief" || u.role === "Staff" || u.role === "Supervisor")
      );
    });
    visibleUsers.forEach(function (u) {
      h +=
        '<tr><td style="font-weight:600">' +
        u.name +
        "</td><td>" +
        u.role +
        "</td><td>" +
        u.div +
        '</td><td style="font-size:12px;color:var(--muted)">' +
        u.email +
        "</td><td>" +
        (u.status === "Active"
          ? '<span class="pill pill-green">Active</span>'
          : '<span class="pill pill-amber">Pending</span>') +
        '</td><td><div style="display:flex;gap:.3rem"><button class="btn-sm">Edit</button>' +
        (u.status === "Pending"
          ? '<button class="btn-sm primary">Activate</button>'
          : "") +
        "</div></td></tr>";
    });
    h += "</tbody></table></div>";
    return h;
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

  function renderDisposal() {
    var h = '<div class="section-title">Document Disposal Schedule</div>';
    h +=
      '<div class="card"><div class="card-head"><div class="card-title">Documents Due for Disposal</div><div style="font-size:12px;color:var(--muted)">Based on retention schedule</div></div>';
    h +=
      '<table class="doc-table"><thead><tr><th>Reference No.</th><th>Type</th><th>Subject</th><th>Date Received</th><th>Retention Period</th><th>Disposal Date</th><th>Status</th><th></th></tr></thead><tbody>';
    var dis = [
      {
        ref: "2021-03-015",
        type: "Report",
        sub: "Annual Report 2020",
        rec: "2021-03-10",
        ret: "5 years",
        dis: "2026-03-10",
        stat: "Due",
      },
      {
        ref: "2021-06-043",
        type: "Letter",
        sub: "External Coordination",
        rec: "2021-06-15",
        ret: "5 years",
        dis: "2026-06-15",
        stat: "Upcoming",
      },
      {
        ref: "2020-12-200",
        type: "Memorandum",
        sub: "Year-End Memo",
        rec: "2020-12-20",
        ret: "5 years",
        dis: "2025-12-20",
        stat: "Overdue",
      },
    ];
    dis.forEach(function (d) {
      h +=
        '<tr><td style="font-family:monospace;font-size:12px">' +
        d.ref +
        "</td><td>" +
        d.type +
        "</td><td>" +
        d.sub +
        "</td><td>" +
        d.rec +
        "</td><td>" +
        d.ret +
        "</td><td>" +
        d.dis +
        "</td><td>" +
        (d.stat === "Overdue"
          ? '<span class="pill pill-red">Overdue</span>'
          : d.stat === "Due"
            ? '<span class="pill pill-amber">Due</span>'
            : '<span class="pill pill-blue">Upcoming</span>') +
        '</td><td><button class="btn-sm danger">Mark Disposed</button></td></tr>';
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
      alert("Access denied. This document belongs to another division logbook.");
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
        ? '<button class="btn-sm primary" onclick="alert(\'Action recorded\')">Approve</button><button class="btn-sm" onclick="alert(\'Returned for revision\')">Return</button>'
        : "") +
      '<button class="btn-sm" onclick="openCompose()">Forward</button>' +
      '<button class="btn-sm" onclick="alert(\'File preview would open here\')">View File</button>' +
      '<button class="btn-sm" onclick="alert(\'Printed\')">Print</button>' +
      "</div>" +
      "</div>";
  }

  function printDocument(ref) {
    var d = getDocByRef(ref);
    if (!d) {
      alert("Document not found.");
      return;
    }
    if (
      !isGlobalLogbookRole(currentUser.role) &&
      (d.division || "ORD") !== currentUser.division
    ) {
      alert("Access denied. This document belongs to another division logbook.");
      return;
    }
    var printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) {
      alert("Please allow pop-ups to print this document.");
      return;
    }
    var html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\">",
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
    document.getElementById("compose-modal").classList.add("open");
  }
  function closeCompose() {
    document.getElementById("compose-modal").classList.remove("open");
  }
  function sendDoc() {
    var to = (document.getElementById("compose-to").value || "").trim();
    var subject = (document.getElementById("compose-subject").value || "").trim();
    alert(
      "Document sent to users successfully." +
        (to ? " Recipient: " + to + "." : "") +
        (subject ? " Subject: " + subject + "." : "")
    );
    closeCompose();
  }

  function openManualLogbook(defaultSubject) {
    currentLogbookEditRef = null;
    var today = formatDateISO(new Date());
    var ref = nextSystemReference(today);
    document.getElementById("manual-logbook-modal").classList.add("open");
    document.querySelector("#manual-logbook-modal h3").textContent = "Manual Logbook Entry";
    document.querySelector("#manual-logbook-modal .btn-send").textContent =
      "Save Logbook Entry";
    document.getElementById("manual-ref").value = ref;
    document.getElementById("manual-date").value = today;
    document.getElementById("manual-kind").value = "incoming";
    document.getElementById("manual-type").value = "";
    document.getElementById("manual-from").value = currentUser.division || currentUser.name;
    document.getElementById("manual-subject").value = defaultSubject || "";
    document.getElementById("manual-to").value = "ORD";
    document.getElementById("manual-status").value = "For ARD Clearance";
    document.getElementById("manual-physical").value = "no";
  }

  function closeManualLogbook() {
    document.getElementById("manual-logbook-modal").classList.remove("open");
  }

  function openQuickSend(ref) {
    var d = getDocByRef(ref);
    if (!d) {
      alert("Document not found.");
      return;
    }
    if (
      !isGlobalLogbookRole(currentUser.role) &&
      (d.division || "ORD") !== currentUser.division
    ) {
      alert("Access denied. This document belongs to another division logbook.");
      return;
    }
    currentQuickSendRef = ref;
    document.getElementById("quick-send-title").textContent = "Send Document " + ref;
    document.getElementById("quick-send-to").value = d.to || "";
    document.getElementById("quick-send-remarks").value = d.sendRemarks || "";
    document.getElementById("quick-send-modal").classList.add("open");
  }

  function closeQuickSend() {
    document.getElementById("quick-send-modal").classList.remove("open");
  }

  function submitQuickSend() {
    if (!currentQuickSendRef) return;
    var d = getDocByRef(currentQuickSendRef);
    if (!d) return;
    var to = (document.getElementById("quick-send-to").value || "").trim();
    var remarks = (document.getElementById("quick-send-remarks").value || "").trim();
    if (!to) {
      alert("Please fill in where to send the document.");
      return;
    }

    d.to = to;
    d.sendRemarks = remarks;
    d.status = "Sent to " + to;
    d.lastSentBy = currentUser.name;
    d.lastSentDate = formatDateISO(new Date());

    closeQuickSend();
    alert("Document " + currentQuickSendRef + " sent successfully to " + to + ".");
    showPage(currentPage);
  }

  function openLogbookEdit(ref) {
    var d = getDocByRef(ref);
    if (!d) return;
    if (
      !isGlobalLogbookRole(currentUser.role) &&
      (d.division || "ORD") !== currentUser.division
    ) {
      alert("Access denied. This document belongs to another division logbook.");
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
    document.getElementById("manual-status").value = d.status || "For ARD Clearance";
    document.getElementById("manual-physical").value = d.physicalCopy ? "yes" : "no";
  }

  function openUploadDialog() {
    document.getElementById("local-upload-input").click();
  }

  function handleLocalUpload(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    pendingUploadFileName = file.name;
    document.getElementById("upload-file-name").textContent = file.name;
    document.getElementById("upload-encode-modal").classList.add("open");
    input.value = "";
  }

  function closeUploadEncodeModal() {
    document.getElementById("upload-encode-modal").classList.remove("open");
  }

  function submitUploadEncodeChoice(autoEncode) {
    if (!pendingUploadFileName) {
      closeUploadEncodeModal();
      return;
    }
    var fileName = pendingUploadFileName;
    closeUploadEncodeModal();
    if (autoEncode) {
      var today = formatDateISO(new Date());
      var ref = nextSystemReference(today);
      DOCS.unshift({
        ref: ref,
        type: "Uploaded File",
        from: currentUser.name,
        to: currentUser.division || "ORD",
        subject: "Uploaded: " + fileName,
        status: "For ARD Clearance",
        date: today,
        conf: false,
        kind: "incoming",
        physicalCopy: false,
        division: currentUser.division || "ORD",
        content: "Local upload file: " + fileName,
      });
      alert("Document uploaded and automatically encoded to logbook. Ref: " + ref);
      showPage("logbook");
    } else {
      openManualLogbook("Uploaded: " + fileName);
    }
    pendingUploadFileName = "";
  }

  function deleteLogbookEntry(ref) {
    var d = getDocByRef(ref);
    if (!d) {
      alert("Document not found.");
      return;
    }
    if (
      !isGlobalLogbookRole(currentUser.role) &&
      (d.division || "ORD") !== currentUser.division
    ) {
      alert("Access denied. This document belongs to another division logbook.");
      return;
    }
    var ok = confirm("Delete document entry " + ref + "? This cannot be undone.");
    if (!ok) return;

    DOCS = DOCS.filter(function (x) {
      return x.ref !== ref;
    });

    // Rebuild monthly counters from remaining references so the sequence
    // can continue from the latest existing value after deletions.
    registerExistingReferences();
    alert("Document entry deleted: " + ref);
    showPage("logbook");
  }

  function openEditor(ref) {
    var d = getDocByRef(ref);
    if (!d) {
      alert("Document not found.");
      return;
    }
    if (
      !isGlobalLogbookRole(currentUser.role) &&
      (d.division || "ORD") !== currentUser.division
    ) {
      alert("Access denied. This document belongs to another division logbook.");
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
  }

  function closeEditor() {
    document.getElementById("editor-modal").classList.remove("open");
  }

  function saveEditor() {
    if (!currentEditingRef) return;
    var d = getDocByRef(currentEditingRef);
    if (!d) return;
    d.content = document.getElementById("editor-content").value;
    d.lastEditedBy = currentUser.name;
    d.editTool = document.getElementById("editor-tool").value;
    alert(
      "Document " +
        currentEditingRef +
        " updated inside the system using " +
        d.editTool +
        "."
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
      alert("Please fill out all required manual logbook fields.");
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
      alert("Logbook entry updated: " + currentLogbookEditRef);
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
      alert("Manual logbook entry added with reference: " + ref);
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
  function selectChat(i) {}
  function sendChat() {
    var el = document.getElementById("chat-in");
    if (el && el.value) {
      el.value = "";
    }
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
