async function loadLinks() {
  const linksEl = document.getElementById("links");
  const nameEl = document.getElementById("name");
  const taglineEl = document.getElementById("tagline");
  const avatarEl = document.getElementById("avatar");

  try {
    const res = await fetch("links.json", { cache: "no-store" });
    if (!res.ok) throw new Error("links.json introuvable");
    const data = await res.json();

    const profile = data.profile || {};
    nameEl.textContent = profile.name || "Sans nom";
    taglineEl.textContent = profile.tagline || "";

    if (profile.avatar) {
      avatarEl.innerHTML = `<img src="${escapeAttr(profile.avatar)}" alt="${escapeAttr(profile.name || "")}" />`;
    } else {
      avatarEl.textContent = profile.initials || "?";
    }

    const links = Array.isArray(data.links) ? data.links : [];

    if (links.length === 0) {
      linksEl.innerHTML = `<div class="empty-state">Aucun lien pour l'instant. Ajoute-en depuis l'espace admin.</div>`;
      return;
    }

    linksEl.innerHTML = links
      .map(
        (link) => `
        <a class="link-card" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">
          <i class="${escapeAttr(link.icon || "fa-solid fa-link")}"></i>
          <span>${escapeHtml(link.title || link.url)}</span>
        </a>`
      )
      .join("");
  } catch (err) {
    nameEl.textContent = "Erreur de chargement";
    taglineEl.textContent = "Vérifie que links.json est bien présent à côté de cette page.";
    linksEl.innerHTML = "";
    console.error(err);
  }
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

function escapeAttr(str) {
  return escapeHtml(str);
}

loadLinks();
