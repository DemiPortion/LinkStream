const STORAGE_HASH_KEY = "linktree_admin_hash";
const STORAGE_DRAFT_KEY = "linktree_admin_draft";
const STORAGE_UNLOCKED_KEY = "linktree_admin_unlocked"; // sessionStorage: unlocked for this tab session

const ICONS = [
  { label: "GitHub", value: "fa-brands fa-github" },
  { label: "LinkedIn", value: "fa-brands fa-linkedin" },
  { label: "Instagram", value: "fa-brands fa-instagram" },
  { label: "X (Twitter)", value: "fa-brands fa-x-twitter" },
  { label: "TikTok", value: "fa-brands fa-tiktok" },
  { label: "YouTube", value: "fa-brands fa-youtube" },
  { label: "Discord", value: "fa-brands fa-discord" },
  { label: "Twitch", value: "fa-brands fa-twitch" },
  { label: "Spotify", value: "fa-brands fa-spotify" },
  { label: "Email", value: "fa-solid fa-envelope" },
  { label: "Site web", value: "fa-solid fa-globe" },
  { label: "Lien générique", value: "fa-solid fa-link" },
];

let draft = { profile: { name: "", tagline: "", initials: "", avatar: "" }, links: [] };

// ---------- Utils ----------

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function saveDraft() {
  localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
  renderAll();
}

// ---------- Gate (password) ----------

const gateEl = document.getElementById("gate");
const adminPanelEl = document.getElementById("adminPanel");
const gateBadge = document.getElementById("gateBadge");
const gateTitle = document.getElementById("gateTitle");
const gateLede = document.getElementById("gateLede");
const gateStatus = document.getElementById("gateStatus");
const pwInput = document.getElementById("pwInput");
const gateSubmit = document.getElementById("gateSubmit");

function hasStoredPassword() {
  return !!localStorage.getItem(STORAGE_HASH_KEY);
}

function setGateMode() {
  if (hasStoredPassword()) {
    gateBadge.textContent = "Accès protégé";
    gateTitle.textContent = "Entrer le mot de passe";
    gateLede.textContent = "Cette page est protégée dans ce navigateur.";
  } else {
    gateBadge.textContent = "Première visite";
    gateTitle.textContent = "Créer un mot de passe";
    gateLede.textContent =
      "Ce mot de passe protège juste l'accès à cette page dans ce navigateur. Ce n'est pas une vraie sécurité — le code source reste lisible par n'importe qui, donc n'y mets rien de sensible.";
  }
}

async function handleGateSubmit() {
  const value = pwInput.value.trim();
  if (!value) {
    gateStatus.textContent = "Entre un mot de passe.";
    gateStatus.className = "status-msg error";
    return;
  }

  if (!hasStoredPassword()) {
    const hash = await sha256(value);
    localStorage.setItem(STORAGE_HASH_KEY, hash);
    unlock();
    return;
  }

  const hash = await sha256(value);
  const stored = localStorage.getItem(STORAGE_HASH_KEY);
  if (hash === stored) {
    unlock();
  } else {
    gateStatus.textContent = "Mot de passe incorrect.";
    gateStatus.className = "status-msg error";
    pwInput.value = "";
  }
}

function unlock() {
  sessionStorage.setItem(STORAGE_UNLOCKED_KEY, "1");
  gateEl.style.display = "none";
  adminPanelEl.style.display = "block";
  loadDraft();
}

function lock() {
  sessionStorage.removeItem(STORAGE_UNLOCKED_KEY);
  adminPanelEl.style.display = "none";
  gateEl.style.display = "block";
  pwInput.value = "";
  setGateMode();
}

gateSubmit.addEventListener("click", handleGateSubmit);
pwInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleGateSubmit();
});

document.getElementById("lockBtn").addEventListener("click", lock);

document.getElementById("changePwBtn").addEventListener("click", async () => {
  const current = prompt("Mot de passe actuel :");
  if (current === null) return;
  const currentHash = await sha256(current);
  if (currentHash !== localStorage.getItem(STORAGE_HASH_KEY)) {
    alert("Mot de passe actuel incorrect.");
    return;
  }
  const next = prompt("Nouveau mot de passe :");
  if (!next) return;
  const nextHash = await sha256(next);
  localStorage.setItem(STORAGE_HASH_KEY, nextHash);
  alert("Mot de passe mis à jour.");
});

// ---------- Draft loading ----------

async function loadDraft() {
  const stored = localStorage.getItem(STORAGE_DRAFT_KEY);
  if (stored) {
    try {
      draft = JSON.parse(stored);
    } catch {
      draft = { profile: {}, links: [] };
    }
  } else {
    // First time in this browser: seed from the committed links.json if reachable
    try {
      const res = await fetch("links.json", { cache: "no-store" });
      if (res.ok) draft = await res.json();
    } catch {
      // fine, start empty — likely opened via file:// or links.json not deployed yet
    }
  }
  if (!draft.profile) draft.profile = {};
  if (!Array.isArray(draft.links)) draft.links = [];
  renderAll();
}

// ---------- Icon select ----------

const linkIconSelect = document.getElementById("linkIcon");
linkIconSelect.innerHTML = ICONS.map((i) => `<option value="${i.value}">${i.label}</option>`).join("");

// ---------- Profile fields ----------

const profName = document.getElementById("profName");
const profTagline = document.getElementById("profTagline");
const profInitials = document.getElementById("profInitials");
const profAvatar = document.getElementById("profAvatar");

[profName, profTagline, profInitials, profAvatar].forEach((el) => {
  el.addEventListener("input", () => {
    draft.profile.name = profName.value;
    draft.profile.tagline = profTagline.value;
    draft.profile.initials = profInitials.value;
    draft.profile.avatar = profAvatar.value;
    saveDraft();
  });
});

// ---------- Add link ----------

document.getElementById("addLinkBtn").addEventListener("click", () => {
  const title = document.getElementById("linkTitle").value.trim();
  const url = document.getElementById("linkUrl").value.trim();
  const icon = linkIconSelect.value;

  if (!title || !url) {
    alert("Titre et lien sont obligatoires.");
    return;
  }

  draft.links.push({ title, url, icon });
  document.getElementById("linkTitle").value = "";
  document.getElementById("linkUrl").value = "";
  saveDraft();
});

// ---------- Render link list (editable) ----------

const linkListEl = document.getElementById("linkList");
const emptyHint = document.getElementById("emptyHint");

function renderLinkList() {
  emptyHint.style.display = draft.links.length ? "none" : "block";

  linkListEl.innerHTML = draft.links
    .map(
      (link, i) => `
      <div class="link-row">
        <i class="icon-preview ${escapeHtml(link.icon || "fa-solid fa-link")}"></i>
        <div class="info">
          <strong>${escapeHtml(link.title)}</strong>
          <span>${escapeHtml(link.url)}</span>
        </div>
        <div class="actions">
          <button class="icon-btn" data-action="up" data-index="${i}" title="Monter"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="icon-btn" data-action="down" data-index="${i}" title="Descendre"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="icon-btn" data-action="edit" data-index="${i}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" data-action="delete" data-index="${i}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`
    )
    .join("");
}

linkListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const index = Number(btn.dataset.index);
  const action = btn.dataset.action;

  if (action === "delete") {
    if (confirm("Supprimer ce lien ?")) {
      draft.links.splice(index, 1);
      saveDraft();
    }
  } else if (action === "up" && index > 0) {
    [draft.links[index - 1], draft.links[index]] = [draft.links[index], draft.links[index - 1]];
    saveDraft();
  } else if (action === "down" && index < draft.links.length - 1) {
    [draft.links[index + 1], draft.links[index]] = [draft.links[index], draft.links[index + 1]];
    saveDraft();
  } else if (action === "edit") {
    const link = draft.links[index];
    const newTitle = prompt("Titre :", link.title);
    if (newTitle === null) return;
    const newUrl = prompt("Lien :", link.url);
    if (newUrl === null) return;
    link.title = newTitle.trim() || link.title;
    link.url = newUrl.trim() || link.url;
    saveDraft();
  }
});

// ---------- Live preview ----------

function renderPreview() {
  const p = draft.profile || {};
  document.getElementById("pvName").textContent = p.name || "Ton nom";
  document.getElementById("pvTagline").textContent = p.tagline || "";

  const pvAvatar = document.getElementById("pvAvatar");
  if (p.avatar) {
    pvAvatar.innerHTML = `<img src="${escapeHtml(p.avatar)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  } else {
    pvAvatar.textContent = p.initials || "?";
  }

  const pvLinks = document.getElementById("pvLinks");
  if (!draft.links.length) {
    pvLinks.innerHTML = `<div class="empty-state">Aucun lien pour l'instant.</div>`;
    return;
  }
  pvLinks.innerHTML = draft.links
    .map(
      (link) => `
      <a class="link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        <i class="${escapeHtml(link.icon || "fa-solid fa-link")}"></i>
        <span>${escapeHtml(link.title)}</span>
      </a>`
    )
    .join("");
}

// ---------- Export ----------

const exportBox = document.getElementById("exportBox");

function renderExport() {
  exportBox.value = JSON.stringify(draft, null, 2);
}

document.getElementById("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "links.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    const btn = document.getElementById("copyBtn");
    const original = btn.textContent;
    btn.textContent = "Copié !";
    setTimeout(() => (btn.textContent = original), 1500);
  } catch {
    exportBox.select();
    document.execCommand("copy");
  }
});

// ---------- Render orchestration ----------

function renderAll() {
  profName.value = draft.profile.name || "";
  profTagline.value = draft.profile.tagline || "";
  profInitials.value = draft.profile.initials || "";
  profAvatar.value = draft.profile.avatar || "";
  renderLinkList();
  renderPreview();
  renderExport();
}

// ---------- Init ----------

setGateMode();
if (sessionStorage.getItem(STORAGE_UNLOCKED_KEY) === "1" && hasStoredPassword()) {
  unlock();
}
