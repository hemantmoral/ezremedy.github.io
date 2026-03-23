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

// Demo dashboard data/state
const memberForm = document.getElementById("memberForm");
const memberNameInput = document.getElementById("memberName");
const memberList = document.getElementById("memberList");
const emptyState = document.getElementById("emptyState");
const totalMembersEl = document.getElementById("totalMembers");
const medicineDoneEl = document.getElementById("medicineDone");
const checkupDoneEl = document.getElementById("checkupDone");

const members = [];

function updateStats() {
  const totalMembers = members.length;
  const medicineDone = members.filter((member) => member.medicineTaken).length;
  const checkupDone = members.filter((member) => member.checkupDone).length;

  totalMembersEl.textContent = String(totalMembers);
  medicineDoneEl.textContent = String(medicineDone);
  checkupDoneEl.textContent = String(checkupDone);

  emptyState.style.display = totalMembers === 0 ? "block" : "none";
}

function createMemberItem(member, index) {
  const item = document.createElement("li");
  item.className = "member-item";

  const name = document.createElement("span");
  name.className = "member-name";
  name.textContent = member.name;

  const checkGroup = document.createElement("div");
  checkGroup.className = "check-group";

  const medicineLabel = document.createElement("label");
  const medicineCheckbox = document.createElement("input");
  medicineCheckbox.type = "checkbox";
  medicineCheckbox.checked = member.medicineTaken;
  medicineCheckbox.addEventListener("change", (event) => {
    members[index].medicineTaken = event.target.checked;
    updateStats();
  });
  medicineLabel.append(medicineCheckbox, " Medicine Taken");

  const checkupLabel = document.createElement("label");
  const checkupCheckbox = document.createElement("input");
  checkupCheckbox.type = "checkbox";
  checkupCheckbox.checked = member.checkupDone;
  checkupCheckbox.addEventListener("change", (event) => {
    members[index].checkupDone = event.target.checked;
    updateStats();
  });
  checkupLabel.append(checkupCheckbox, " Checkup Done");

  checkGroup.append(medicineLabel, checkupLabel);
  item.append(name, checkGroup);
  return item;
}

function renderMembers() {
  memberList.innerHTML = "";
  members.forEach((member, index) => {
    memberList.appendChild(createMemberItem(member, index));
  });
  updateStats();
}

if (memberForm) {
  memberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = memberNameInput.value.trim();
    if (!name) {
      return;
    }

    members.push({
      name,
      medicineTaken: false,
      checkupDone: false
    });

    memberNameInput.value = "";
    memberNameInput.focus();
    renderMembers();
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
updateStats();
