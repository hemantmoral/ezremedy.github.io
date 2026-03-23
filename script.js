"use strict";

// Mobile menu toggle
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Generic vanilla stepper (used for auth and reminders)
function initSteppers() {
  const steppers = document.querySelectorAll(".stepper-shell");
  steppers.forEach((stepper) => {
    const total = Number(stepper.getAttribute("data-total-steps")) || 1;
    const indicators = Array.from(stepper.querySelectorAll(".step-indicator"));
    const connectors = Array.from(stepper.querySelectorAll(".step-connector-inner"));
    const panels = Array.from(stepper.querySelectorAll(".step-panel"));
    const backBtn = stepper.querySelector("[data-stepper-back]");
    const nextBtn = stepper.querySelector("[data-stepper-next]");
    let current = 1;

    function render() {
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", Number(panel.getAttribute("data-step")) === current);
      });
      indicators.forEach((indicator, idx) => {
        indicator.classList.toggle("is-active", idx + 1 === current);
        indicator.classList.toggle("is-complete", idx + 1 < current);
        const number = indicator.querySelector(".step-number");
        const dot = indicator.querySelector(".active-dot");
        if (number) number.textContent = idx + 1 < current ? "✓" : String(idx + 1);
        if (dot) dot.style.display = idx + 1 === current ? "inline-block" : "none";
      });
      connectors.forEach((connector, idx) => {
        connector.style.width = idx + 1 < current ? "100%" : "0";
      });
      if (backBtn) backBtn.disabled = current === 1;
      if (nextBtn) {
        nextBtn.disabled = current === total;
        nextBtn.textContent = current === total ? "Completed" : "Next";
      }
      if (backBtn) {
        backBtn.style.visibility = current === 1 ? "hidden" : "visible";
      }
    }

    indicators.forEach((indicator) => {
      indicator.addEventListener("click", () => {
        const target = Number(indicator.getAttribute("data-step-target"));
        if (target >= 1 && target <= total) {
          current = target;
          render();
        }
      });
    });
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        current = Math.max(1, current - 1);
        render();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        current = Math.min(total, current + 1);
        render();
      });
    }
    render();
  });
}

// Profile card tilt/glow effect
function initProfileCards() {
  const cards = document.querySelectorAll("[data-profile-card]");
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  cards.forEach((card) => {
    const shell = card.querySelector(".pc-card");
    if (!shell) return;

    function setPointerVars(clientX, clientY) {
      const rect = shell.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      const y = clamp(clientY - rect.top, 0, rect.height);
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      const cx = px - 50;
      const cy = py - 50;
      card.style.setProperty("--pointer-x", `${px}%`);
      card.style.setProperty("--pointer-y", `${py}%`);
      card.style.setProperty("--pointer-from-left", String(px / 100));
      card.style.setProperty("--pointer-from-top", String(py / 100));
      card.style.setProperty("--pointer-from-center", String(Math.min(1, Math.hypot(cx, cy) / 70)));
      card.style.setProperty("--rotate-x", `${-(cx / 6)}deg`);
      card.style.setProperty("--rotate-y", `${cy / 7}deg`);
      card.style.setProperty("--card-opacity", "1");
    }

    card.addEventListener("pointermove", (event) => setPointerVars(event.clientX, event.clientY));
    card.addEventListener("pointerenter", (event) => setPointerVars(event.clientX, event.clientY));
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--pointer-x", "50%");
      card.style.setProperty("--pointer-y", "50%");
      card.style.setProperty("--pointer-from-left", "0.5");
      card.style.setProperty("--pointer-from-top", "0.5");
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
      card.style.setProperty("--card-opacity", "0");
    });
  });
}

function initProfileImageFallbacks() {
  const avatars = document.querySelectorAll(".profile-avatar");
  avatars.forEach((img) => {
    const sources = (img.dataset.fallbacks || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    let idx = 0;
    img.addEventListener("error", () => {
      idx += 1;
      if (idx < sources.length) {
        img.src = sources[idx];
      } else {
        img.alt = `${img.alt} (image unavailable)`;
      }
    });
  });
}

// Auth + dashboard state
const STORAGE_KEY = "ezremedy_app_v1";
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const authMessage = document.getElementById("authMessage");
const sessionInfo = document.getElementById("sessionInfo");
const currentRoleEl = document.getElementById("currentRole");
const currentUserEl = document.getElementById("currentUser");

const memberForm = document.getElementById("memberForm");
const memberNameInput = document.getElementById("memberName");
const memberList = document.getElementById("memberList");
const emptyState = document.getElementById("emptyState");
const totalMembersEl = document.getElementById("totalMembers");
const medicineDoneEl = document.getElementById("medicineDone");
const checkupDoneEl = document.getElementById("checkupDone");

const reminderForm = document.getElementById("reminderForm");
const reminderTitleInput = document.getElementById("reminderTitle");
const reminderMemberSelect = document.getElementById("reminderMember");
const reminderTypeSelect = document.getElementById("reminderType");
const reminderTimeInput = document.getElementById("reminderTime");
const reminderList = document.getElementById("reminderList");
const reminderEmpty = document.getElementById("reminderEmpty");

const appState = {
  users: [],
  sessionUserId: null,
  families: {}
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      appState.users = Array.isArray(parsed.users) ? parsed.users : [];
      appState.sessionUserId = parsed.sessionUserId || null;
      appState.families = parsed.families && typeof parsed.families === "object" ? parsed.families : {};
    }
  } catch (error) {
    console.error("Failed to parse saved app state", error);
  }
}

function getCurrentUser() {
  return appState.users.find((u) => u.id === appState.sessionUserId) || null;
}

function getFamilyOwnerId(user) {
  if (!user) return null;
  return user.role === "owner" ? user.id : user.ownerId || null;
}

function ensureFamily(ownerId) {
  if (!ownerId) return null;
  if (!appState.families[ownerId]) {
    appState.families[ownerId] = { members: [], reminders: [] };
  }
  return appState.families[ownerId];
}

function getActiveFamily() {
  const user = getCurrentUser();
  const ownerId = getFamilyOwnerId(user) || "guest";
  return ensureFamily(ownerId);
}

function canManageFamily() {
  const user = getCurrentUser();
  if (!user) return true;
  return user.role === "owner";
}

function setAuthMessage(msg) {
  authMessage.textContent = msg || "";
}

function updateStats() {
  const family = getActiveFamily();
  const members = family ? family.members : [];
  const totalMembers = members.length;
  const medicineDone = members.filter((member) => member.medicineTaken).length;
  const checkupDone = members.filter((member) => member.checkupDone).length;
  totalMembersEl.textContent = String(totalMembers);
  medicineDoneEl.textContent = String(medicineDone);
  checkupDoneEl.textContent = String(checkupDone);
  emptyState.style.display = totalMembers === 0 ? "block" : "none";
}

function renderMemberOptions() {
  const family = getActiveFamily();
  const members = family ? family.members : [];
  reminderMemberSelect.innerHTML = '<option value="all">All Members</option>';
  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.name;
    reminderMemberSelect.appendChild(option);
  });
}

function renderMembers() {
  const family = getActiveFamily();
  const user = getCurrentUser();
  const members = family ? family.members : [];
  memberList.innerHTML = "";

  members.forEach((member) => {
    const item = document.createElement("li");
    item.className = "member-item";
    const name = document.createElement("span");
    name.className = "member-name";
    name.textContent = member.name;

    const badge = document.createElement("span");
    badge.className = member.role === "owner" ? "badge-owner" : "badge-member";
    badge.textContent = member.role === "owner" ? "Owner" : "Member";

    const checkGroup = document.createElement("div");
    checkGroup.className = "check-group";

    const medicineLabel = document.createElement("label");
    const medicineCheckbox = document.createElement("input");
    medicineCheckbox.type = "checkbox";
    medicineCheckbox.checked = member.medicineTaken;
    medicineCheckbox.disabled = !canManageFamily();
    medicineCheckbox.addEventListener("change", (event) => {
      member.medicineTaken = event.target.checked;
      saveState();
      updateStats();
    });
    medicineLabel.append(medicineCheckbox, " Medicine Taken");

    const checkupLabel = document.createElement("label");
    const checkupCheckbox = document.createElement("input");
    checkupCheckbox.type = "checkbox";
    checkupCheckbox.checked = member.checkupDone;
    checkupCheckbox.disabled = !canManageFamily();
    checkupCheckbox.addEventListener("change", (event) => {
      member.checkupDone = event.target.checked;
      saveState();
      updateStats();
    });
    checkupLabel.append(checkupCheckbox, " Checkup Done");

    checkGroup.append(medicineLabel, checkupLabel);
    item.append(name, badge, checkGroup);
    memberList.appendChild(item);
  });

  if (user && user.role === "member" && members.length === 0) {
    emptyState.textContent = "No family linked yet. Ask the owner to add members.";
  } else {
    emptyState.textContent = "No family members added yet.";
  }
  updateStats();
  renderMemberOptions();
}

function renderReminders() {
  const family = getActiveFamily();
  const user = getCurrentUser();
  const reminders = family ? family.reminders : [];
  reminderList.innerHTML = "";

  reminders.forEach((reminder) => {
    const item = document.createElement("li");
    item.className = "reminder-item";
    const memberName =
      reminder.memberId === "all"
        ? "All Members"
        : (family.members.find((m) => m.id === reminder.memberId) || {}).name || "Unknown Member";
    item.innerHTML = `<strong>${reminder.title}</strong><span>${reminder.type}</span><span>${reminder.time}</span><span>${memberName}</span>`;

    const statusWrap = document.createElement("label");
    statusWrap.className = "check-group";
    const done = document.createElement("input");
    done.type = "checkbox";
    done.checked = Boolean(reminder.done);
    done.disabled = !canManageFamily();
    done.addEventListener("change", (event) => {
      reminder.done = event.target.checked;
      saveState();
    });
    statusWrap.append(done, " Completed");
    item.appendChild(statusWrap);
    reminderList.appendChild(item);
  });

  const hasReminders = reminders.length > 0;
  reminderEmpty.style.display = hasReminders ? "none" : "block";
  if (user && user.role === "member" && !hasReminders) {
    reminderEmpty.textContent = "No routines configured by the owner yet.";
  } else {
    reminderEmpty.textContent = "No reminders configured yet.";
  }
}

function renderSession() {
  const user = getCurrentUser();
  const loggedIn = Boolean(user);
  currentRoleEl.textContent = loggedIn ? (user.role === "owner" ? "Parent / Owner" : "Family Member") : "Guest";
  currentUserEl.textContent = loggedIn ? user.name : "Not Logged In";
  sessionInfo.textContent = loggedIn ? `Logged in as ${user.email}` : "Guest mode active (no login required)";
  logoutBtn.classList.toggle("hidden", !loggedIn);

  const ownerOnly = canManageFamily();
  memberNameInput.disabled = !ownerOnly;
  memberForm.querySelector("button").disabled = !ownerOnly;
  reminderTitleInput.disabled = !ownerOnly;
  reminderMemberSelect.disabled = !ownerOnly;
  reminderTypeSelect.disabled = !ownerOnly;
  reminderTimeInput.disabled = !ownerOnly;
  reminderForm.querySelector("button").disabled = !ownerOnly;

  renderMembers();
  renderReminders();
}

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("signupRole").value;
    if (!name || !email || !password) {
      setAuthMessage("Please fill all sign up fields.");
      return;
    }
    if (appState.users.some((u) => u.email === email)) {
      setAuthMessage("Account already exists with this email.");
      return;
    }

    let ownerId = null;
    if (role === "owner") {
      ownerId = uid();
    } else {
      const owners = appState.users.filter((u) => u.role === "owner");
      if (!owners.length) {
        setAuthMessage("Please create a parent/owner account first.");
        return;
      }
      ownerId = owners[0].id;
    }

    const newUser = { id: uid(), name, email, password, role, ownerId: role === "owner" ? null : ownerId };
    appState.users.push(newUser);
    if (role === "owner") {
      ensureFamily(newUser.id);
      appState.families[newUser.id].members.push({
        id: uid(),
        name: `${name} (Owner)`,
        role: "owner",
        medicineTaken: false,
        checkupDone: false
      });
    } else {
      const family = ensureFamily(ownerId);
      family.members.push({ id: uid(), name, role: "member", medicineTaken: false, checkupDone: false });
    }

    appState.sessionUserId = newUser.id;
    saveState();
    signupForm.reset();
    setAuthMessage("Account created successfully. You are now logged in.");
    renderSession();
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const user = appState.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      setAuthMessage("Invalid email or password.");
      return;
    }
    appState.sessionUserId = user.id;
    saveState();
    loginForm.reset();
    setAuthMessage("Login successful.");
    renderSession();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    appState.sessionUserId = null;
    saveState();
    setAuthMessage("Logged out successfully.");
    renderSession();
  });
}

if (memberForm) {
  memberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canManageFamily()) {
      setAuthMessage("Only parent/owner can add family members.");
      return;
    }
    const name = memberNameInput.value.trim();
    if (!name) return;
    const family = getActiveFamily();
    family.members.push({ id: uid(), name, role: "member", medicineTaken: false, checkupDone: false });
    saveState();
    memberNameInput.value = "";
    memberNameInput.focus();
    renderMembers();
  });
}

if (reminderForm) {
  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!canManageFamily()) {
      setAuthMessage("Only parent/owner can configure reminders.");
      return;
    }
    const title = reminderTitleInput.value.trim();
    const memberId = reminderMemberSelect.value;
    const type = reminderTypeSelect.value;
    const time = reminderTimeInput.value;
    if (!title || !time) return;
    const family = getActiveFamily();
    family.reminders.push({ id: uid(), title, memberId, type, time, done: false });
    saveState();
    reminderForm.reset();
    renderReminders();
  });
}

// Scroll reveal animation
const revealElements = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealElements.forEach((el) => observer.observe(el));

// Vanilla "ScrollFloat" effect
function initScrollFloat() {
  const floatBlocks = document.querySelectorAll("[data-scroll-float]");
  floatBlocks.forEach((block) => {
    const text = block.querySelector(".scroll-float-text");
    if (!text) return;
    const raw = text.textContent || "";
    text.textContent = "";
    [...raw].forEach((char, idx) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = char === " " ? "\u00a0" : char;
      span.style.transitionDelay = `${idx * 0.03}s`;
      text.appendChild(span);
    });
  });

  const floatObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    { threshold: 0.35 }
  );
  floatBlocks.forEach((block) => floatObserver.observe(block));
}

// Vanilla "Counter" effect
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  const animateCounter = (el) => {
    const target = Number(el.getAttribute("data-counter")) || 0;
    const duration = 1400;
    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(from + (target - from) * eased);
      el.textContent = target > 100 ? value.toLocaleString() : `${value}%`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.started) {
          entry.target.dataset.started = "1";
          animateCounter(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

// Vanilla "DomeGallery" effect
function initDomeGallery() {
  const gallery = document.getElementById("domeGallery");
  const track = document.getElementById("domeTrack");
  if (!gallery || !track) return;

  const items = Array.from(track.querySelectorAll(".dome-item"));
  const count = items.length;
  const radius = 420;
  let rotationY = 0;
  let isDragging = false;
  let startX = 0;
  let startRotation = 0;

  function layoutItems() {
    items.forEach((item, idx) => {
      const angle = (360 / count) * idx;
      item.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    });
  }

  function render() {
    track.style.transform = `translate(-50%, -50%) rotateX(-10deg) rotateY(${rotationY}deg)`;
  }

  gallery.addEventListener("pointerdown", (event) => {
    isDragging = true;
    startX = event.clientX;
    startRotation = rotationY;
    gallery.setPointerCapture(event.pointerId);
  });

  gallery.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const dx = event.clientX - startX;
    rotationY = startRotation + dx * 0.2;
    render();
  });

  gallery.addEventListener("pointerup", () => {
    isDragging = false;
  });

  function autoRotate() {
    if (!isDragging) {
      rotationY += 0.08;
      render();
    }
    requestAnimationFrame(autoRotate);
  }

  layoutItems();
  render();
  autoRotate();
}

// Vanilla "LiquidEther-like" background effect
function initLiquidBackground() {
  const canvas = document.getElementById("liquidCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const palette = [
    [82, 39, 255],
    [255, 159, 252],
    [177, 158, 239]
  ];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const feedbackCanvas = document.createElement("canvas");
  const feedbackCtx = feedbackCanvas.getContext("2d");
  if (!feedbackCtx) return;

  const mouse = {
    x: -9999,
    y: -9999,
    px: -9999,
    py: -9999,
    active: false,
    intensity: 2.2
  };
  const auto = {
    enabled: true,
    t: 0,
    speed: 0.5,
    resumeDelay: 3000,
    lastInteract: performance.now(),
    rampDuration: 600
  };
  const fluid = {
    time: 0,
    trailFade: 0.08,
    viscous: 0.94,
    cursorSize: 100,
    mouseForce: 20
  };

  const blobs = Array.from({ length: 20 }, (_, i) => ({
    x: 0.2 + (i % 5) * 0.14,
    y: 0.2 + Math.floor(i / 5) * 0.16,
    vx: (Math.random() - 0.5) * 0.004,
    vy: (Math.random() - 0.5) * 0.004,
    radius: 80 + Math.random() * 80,
    color: palette[i % palette.length]
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = w;
    canvas.height = h;
    feedbackCanvas.width = w;
    feedbackCanvas.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    feedbackCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateAutoCursor(dt, w, h) {
    const now = performance.now();
    const shouldAuto = auto.enabled && now - auto.lastInteract > auto.resumeDelay;
    if (!shouldAuto && !mouse.active) return;
    if (shouldAuto) {
      auto.t += dt * auto.speed;
      const ramp = Math.min(1, (now - auto.lastInteract - auto.resumeDelay) / auto.rampDuration);
      const k = ramp * ramp * (3 - 2 * ramp);
      const nx = 0.5 + Math.cos(auto.t * 1.7) * 0.32 + Math.cos(auto.t * 0.7) * 0.08;
      const ny = 0.5 + Math.sin(auto.t * 1.1) * 0.24 + Math.sin(auto.t * 2.3) * 0.06;
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = nx * w;
      mouse.y = ny * h;
      mouse.intensity = 1.4 + 0.8 * k;
    }
  }

  function applyMouseForce(blob, w, h) {
    const mx = mouse.x;
    const my = mouse.y;
    if (mx < 0 || my < 0) return;
    const bx = blob.x * w;
    const by = blob.y * h;
    const dx = mx - bx;
    const dy = my - by;
    const dist = Math.hypot(dx, dy) || 1;
    const effectRadius = fluid.cursorSize * 2.4;
    if (dist > effectRadius) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const influence = (1 - dist / effectRadius) ** 2;
    const dragVx = mouse.px > -1000 ? (mouse.x - mouse.px) * 0.02 : 0;
    const dragVy = mouse.py > -1000 ? (mouse.y - mouse.py) * 0.02 : 0;
    blob.vx += (nx * fluid.mouseForce * 0.00035 + dragVx * 0.003) * influence * mouse.intensity;
    blob.vy += (ny * fluid.mouseForce * 0.00035 + dragVy * 0.003) * influence * mouse.intensity;
  }

  function drawBlob(targetCtx, b, w, h) {
    const x = b.x * w;
    const y = b.y * h;
    const g = targetCtx.createRadialGradient(x, y, 0, x, y, b.radius);
    g.addColorStop(0, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.19)`);
    g.addColorStop(0.55, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0.1)`);
    g.addColorStop(1, `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, 0)`);
    targetCtx.fillStyle = g;
    targetCtx.beginPath();
    targetCtx.arc(x, y, b.radius, 0, Math.PI * 2);
    targetCtx.fill();
  }

  let last = performance.now();
  function draw(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    fluid.time += dt;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    updateAutoCursor(dt, w, h);

    // Feedback pass for pseudo-advection trails
    feedbackCtx.globalCompositeOperation = "source-over";
    feedbackCtx.fillStyle = `rgba(245, 251, 255, ${fluid.trailFade})`;
    feedbackCtx.fillRect(0, 0, w, h);
    feedbackCtx.save();
    feedbackCtx.globalAlpha = 0.88;
    feedbackCtx.filter = "blur(6px)";
    feedbackCtx.drawImage(canvas, 0, 0, w, h);
    feedbackCtx.restore();

    blobs.forEach((b, i) => {
      // Swirl/noise term approximates fluid advection
      const a = fluid.time * 0.8 + i * 0.9;
      b.vx += Math.sin(a + b.y * 7.0) * 0.00022;
      b.vy += Math.cos(a * 1.1 + b.x * 8.0) * 0.00022;
      applyMouseForce(b, w, h);

      b.vx *= fluid.viscous;
      b.vy *= fluid.viscous;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < -0.08 || b.x > 1.08) b.vx *= -1;
      if (b.y < -0.08 || b.y > 1.08) b.vy *= -1;
      b.x = Math.max(-0.08, Math.min(1.08, b.x));
      b.y = Math.max(-0.08, Math.min(1.08, b.y));
      drawBlob(feedbackCtx, b, w, h);
    });

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(feedbackCanvas, 0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    blobs.forEach((b) => drawBlob(ctx, b, w, h));
    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(draw);
  }

  function pointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.active = true;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.intensity = 2.2;
    auto.lastInteract = performance.now();
  }

  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerenter", pointerMove);
  canvas.addEventListener("pointerleave", () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.px = -9999;
    mouse.py = -9999;
    auto.lastInteract = performance.now();
  });

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

initScrollFloat();
initCounters();
initDomeGallery();
initLiquidBackground();
initSteppers();
initProfileCards();
initProfileImageFallbacks();
loadState();
renderSession();
