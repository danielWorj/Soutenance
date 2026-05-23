/**
 * dashboard.js
 * Logique complète du dashboard CacaoForecast
 * Consomme les APIs Flask via fetch()
 */

const API = {
  DATA:      { PRIX: '/api/data/import/prix', PRECIP: '/api/data/import/precipitations',
               TOUT: '/api/data/import/tout', HISTORIQUE: '/api/data/historique-imports',
               APERCU: '/api/data/apercu', ENSO: '/api/data/import/enso' },
  EXPERT:    { ENTRAINER: '/api/expert/entrainer', STATUT: '/api/expert/statut',
               ACTIF: '/api/expert/modele-actif', HISTORIQUE: '/api/expert/historique-modeles',
               ACTIVER: (id) => `/api/expert/activer/${id}`,
               SUPPRIMER: (id) => `/api/expert/modele/${id}` },
  PREVISION: { GENERER: '/api/prevision/generer', HISTORIQUE: '/api/prevision/historique',
               SEUILS: '/api/prevision/seuils', SEUILS_ACTUELS: '/api/prevision/seuils/actuels' },
  GRAPHIQUE: { PRIX: '/api/graphique/prix', PRECIP: '/api/graphique/precipitations',
               COMBINE: '/api/graphique/combine', PREVISION: '/api/graphique/prevision' },
};

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────

function navigate(page) {
  document.querySelectorAll('.cf-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.cf-nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  const link = document.querySelector(`[data-page="${page}"]`);
  if (link) link.classList.add('active');

  // Update topbar title
  const titles = {
    dashboard:  { title: 'Tableau de bord',        sub: 'Vue d\'ensemble du système' },
    data:       { title: 'Import des Données',      sub: 'Gestion des sources de données' },
    expert:     { title: 'Système Expert',          sub: 'Administration SARIMAX' },
    prevision:  { title: 'Prévisions des Prix',     sub: 'Génération et analyse' },
    graphique:  { title: 'Graphiques',              sub: 'Visualisation des données' },
  };

  if (titles[page]) {
    document.getElementById('topbar-title').textContent    = titles[page].title;
    document.getElementById('topbar-subtitle').textContent = titles[page].sub;
  }

  // Fermer sidebar mobile
  closeSidebar();

  // Charger les données de la page
  if (page === 'dashboard') loadDashboard();
  if (page === 'expert')    loadExpertPage();
  if (page === 'prevision') loadPrevisionPage();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

// ─────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────

function showSpinner(id)  { const el = document.getElementById(id); if (el) el.classList.add('active'); }
function hideSpinner(id)  { const el = document.getElementById(id); if (el) el.classList.remove('active'); }

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const id = 'toast-' + Date.now();
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const colors = { success: 'var(--cf-green)', error: 'var(--cf-red)',
                   warning: 'var(--cf-orange)', info: '#2563eb' };
  const html = `
    <div id="${id}" class="toast show align-items-center border-0"
         style="border-left:3px solid ${colors[type]}!important;border-radius:10px;min-width:280px;box-shadow:0 4px 20px rgba(0,0,0,.1)">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-start gap-2" style="font-size:.82rem">
          <span>${icons[type]}</span>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" onclick="document.getElementById('${id}').remove()"></button>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', html);
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 4500);
}

async function fetchAPI(method, url, spinnerId = null) {
  if (spinnerId) showSpinner(spinnerId);
  try {
    const r    = await fetch(url, { method });
    const data = await r.json();
    return data;
  } catch (e) {
    return { statut: false, message: 'Erreur réseau : ' + e.message };
  } finally {
    if (spinnerId) hideSpinner(spinnerId);
  }
}

async function fetchAPIJson(method, url, body, spinnerId = null) {
  if (spinnerId) showSpinner(spinnerId);
  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    return { statut: false, message: 'Erreur réseau : ' + e.message };
  } finally {
    if (spinnerId) hideSpinner(spinnerId);
  }
}

function formatDate(d)  { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }
function formatMoney(v) { return v ? Number(v).toLocaleString('fr-FR') + ' $' : '—'; }
function formatNum(v)   { return v !== null && v !== undefined ? Number(v).toLocaleString('fr-FR') : '—'; }

const SIGNAL_HTML = {
  vert:   '<span class="cf-signal cf-signal-vert">Stable</span>',
  orange: '<span class="cf-signal cf-signal-orange">Attention</span>',
  rouge:  '<span class="cf-signal cf-signal-rouge">Risque</span>',
};

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

async function checkHealth() {
  try {
    const r = await fetch('/health');
    const ok = r.ok;
    document.getElementById('status-dot').className    = 'cf-status-dot ' + (ok ? 'online' : 'offline');
    document.getElementById('status-text').textContent = ok ? 'API en ligne' : 'API hors ligne';
    document.getElementById('topbar-status').className = 'cf-ticker-change ' + (ok ? 'up' : 'down');
    document.getElementById('topbar-status').textContent = ok ? '● EN LIGNE' : '● HORS LIGNE';
  } catch {
    document.getElementById('status-dot').className = 'cf-status-dot offline';
  }
}

// ─────────────────────────────────────────────
// DASHBOARD — Vue d'ensemble
// ─────────────────────────────────────────────

async function loadDashboard() {
  // Statut système
  const statut = await fetchAPI('GET', API.EXPERT.STATUT);
  if (statut.statut) {
    const d = statut.data;
    document.getElementById('kpi-prix').textContent  = formatNum(d.nb_prix_disponibles);
    document.getElementById('kpi-precip').textContent = formatNum(d.nb_precipitations_disponibles);
    document.getElementById('kpi-pret').innerHTML = d.pret_pour_entrainement
      ? '<span class="cf-badge cf-badge-green">✓ Prêt</span>'
      : '<span class="cf-badge cf-badge-red">✗ Insuffisant</span>';

    if (d.modele_actif) {
      const m = d.modele_actif;
      document.getElementById('kpi-modele').textContent = m.nom || '—';
      document.getElementById('dash-mae').textContent   = m.mae  ? m.mae.toFixed(2)  : '—';
      document.getElementById('dash-rmse').textContent  = m.rmse ? m.rmse.toFixed(2) : '—';
      document.getElementById('dash-mape').textContent  = m.mape ? m.mape.toFixed(2) + '%' : '—';
      document.getElementById('dash-aic').textContent   = m.aic  ? m.aic.toFixed(1)  : '—';
    }
  }

  // Dernières prévisions
  const prev = await fetchAPI('GET', API.PREVISION.HISTORIQUE + '?limit=5');
  if (prev.statut && prev.data.previsions.length > 0) {
    const tbody = document.getElementById('dash-prev-tbody');
    tbody.innerHTML = prev.data.previsions.slice(0, 5).map(p => `
      <tr>
        <td class="td-mono">${formatDate(p.date_prev)}</td>
        <td class="td-price">${formatMoney(p.prix_prevu)}</td>
        <td><span style="font-size:.72rem;font-family:'DM Mono',monospace;color:var(--cf-text-3)">[${formatMoney(p.ic_bas)} – ${formatMoney(p.ic_haut)}]</span></td>
        <td>${SIGNAL_HTML[p.signal] || p.signal}</td>
      </tr>`).join('');
  }

  // Derniers imports
  const logs = await fetchAPI('GET', API.DATA.HISTORIQUE);
  if (logs.statut) {
    renderLogs(logs.data.logs.slice(0, 5), 'dash-logs');
  }
}

function renderLogs(logs, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!logs || logs.length === 0) {
    el.innerHTML = '<p class="text-cf-muted font-mono" style="font-size:.75rem;padding:12px 0">Aucun import enregistré</p>';
    return;
  }
  el.innerHTML = logs.map(l => `
    <div class="cf-log-item">
      <div class="cf-log-dot ${l.statut}"></div>
      <div class="cf-log-info">
        <div class="cf-log-source">${l.source} — ${l.type_data}</div>
        <div class="cf-log-msg">${l.message}</div>
      </div>
      <div class="cf-log-time">${formatDate(l.created_at)}</div>
    </div>`).join('');
}

// ─────────────────────────────────────────────
// DATA — Import des données
// ─────────────────────────────────────────────

async function submitImportTout() {
  const debut = document.getElementById('imp-debut').value;
  const fin   = document.getElementById('imp-fin').value;
  if (!debut || !fin) { showToast('Veuillez sélectionner les deux dates', 'warning'); return; }

  showSpinner('spin-imp-tout');
  const r = await fetchAPI('POST', `${API.DATA.TOUT}?date_debut=${debut}&date_fin=${fin}`);
  hideSpinner('spin-imp-tout');

  if (r.statut) {
    showToast(`Import réussi : ${r.data.prix?.nb_lignes || 0} prix + ${r.data.precipitations?.nb_lignes || 0} précipitations`, 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalImportTout'))?.hide();
    loadDashboard();
  } else {
    showToast(r.message, 'error');
  }
}

async function submitImportPrix() {
  const debut = document.getElementById('imp-prix-debut').value;
  const fin   = document.getElementById('imp-prix-fin').value;
  if (!debut || !fin) { showToast('Veuillez sélectionner les deux dates', 'warning'); return; }

  showSpinner('spin-imp-prix');
  const r = await fetchAPI('POST', `${API.DATA.PRIX}?date_debut=${debut}&date_fin=${fin}`);
  hideSpinner('spin-imp-prix');

  showToast(r.message, r.statut ? 'success' : 'error');
  if (r.statut) { bootstrap.Modal.getInstance(document.getElementById('modalImportPrix'))?.hide(); loadHistoriqueImports(); }
}

async function submitImportPrecip() {
  const debut = document.getElementById('imp-pr-debut').value;
  const fin   = document.getElementById('imp-pr-fin').value;
  const pays  = document.getElementById('imp-pr-pays').value;
  if (!debut || !fin) { showToast('Veuillez sélectionner les deux dates', 'warning'); return; }

  showSpinner('spin-imp-precip');
  let url = `${API.DATA.PRECIP}?date_debut=${debut}&date_fin=${fin}`;
  if (pays) url += `&pays=${pays}`;
  const r = await fetchAPI('POST', url);
  hideSpinner('spin-imp-precip');

  showToast(r.message, r.statut ? 'success' : 'error');
  if (r.statut) { bootstrap.Modal.getInstance(document.getElementById('modalImportPrecip'))?.hide(); loadHistoriqueImports(); }
}

async function submitImportEnso() {
  const debut = document.getElementById('imp-enso-debut').value;
  const fin   = document.getElementById('imp-enso-fin').value;
  let url = API.DATA.ENSO;
  if (debut) url += `?date_debut=${debut}`;
  if (fin)   url += `${debut ? '&' : '?'}date_fin=${fin}`;

  showSpinner('spin-imp-enso');
  const r = await fetchAPI('POST', url);
  hideSpinner('spin-imp-enso');

  showToast(r.message, r.statut ? 'success' : 'error');
  if (r.statut) { bootstrap.Modal.getInstance(document.getElementById('modalImportEnso'))?.hide(); loadHistoriqueImports(); }
}

async function loadHistoriqueImports() {
  const r = await fetchAPI('GET', API.DATA.HISTORIQUE);
  if (r.statut) renderLogs(r.data.logs, 'data-logs');
}

async function loadApercuData() {
  showSpinner('spin-apercu');
  const r = await fetchAPI('GET', API.DATA.APERCU + '?limit=8');
  hideSpinner('spin-apercu');
  if (!r.statut || !r.data.apercu) return;

  document.getElementById('apercu-total').textContent  = r.data.total_mois + ' mois';
  document.getElementById('apercu-debut').textContent  = formatDate(r.data.date_debut);
  document.getElementById('apercu-fin').textContent    = formatDate(r.data.date_fin);

  const tbody = document.getElementById('apercu-tbody');
  tbody.innerHTML = r.data.apercu.map(row => `
    <tr>
      <td class="td-mono">${row.date || '—'}</td>
      <td class="td-price">${row.prix_usd ? Number(row.prix_usd).toFixed(0) + ' $' : '—'}</td>
      <td class="td-mono">${row.precip_ci ? Number(row.precip_ci).toFixed(1) : '—'}</td>
      <td class="td-mono">${row.precip_ghana ? Number(row.precip_ghana).toFixed(1) : '—'}</td>
      <td class="td-mono">${row.precip_cameroun ? Number(row.precip_cameroun).toFixed(1) : '—'}</td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────
// EXPERT — Système expert
// ─────────────────────────────────────────────

async function loadExpertPage() {
  // Statut
  const s = await fetchAPI('GET', API.EXPERT.STATUT);
  if (s.statut) {
    const d = s.data;
    document.getElementById('exp-pret').innerHTML = d.pret_pour_entrainement
      ? '<span class="cf-badge cf-badge-green">✓ Prêt pour l\'entraînement</span>'
      : '<span class="cf-badge cf-badge-red">✗ Données insuffisantes</span>';
    document.getElementById('exp-nb-prix').textContent  = formatNum(d.nb_prix_disponibles);
    document.getElementById('exp-nb-prec').textContent  = formatNum(d.nb_precipitations_disponibles);
  }

  // Modèle actif
  const m = await fetchAPI('GET', API.EXPERT.ACTIF);
  if (m.statut && m.data) {
    renderModeleActif(m.data);
  } else {
    document.getElementById('exp-modele-actif').innerHTML =
      '<div class="cf-alert cf-alert-warning">⚠️ Aucun modèle actif. Lancez un entraînement.</div>';
  }

  // Historique
  loadHistoriqueModeles();
}

function renderModeleActif(m) {
  document.getElementById('exp-modele-actif').innerHTML = `
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div class="cf-metric">
          <span class="cf-metric-label">Ordre ARIMA</span>
          <span class="cf-metric-value">(${m.ordre_p},${m.ordre_d},${m.ordre_q})</span>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="cf-metric">
          <span class="cf-metric-label">Ordre Saisonnier</span>
          <span class="cf-metric-value">(${m.ordre_sp},${m.ordre_sd},${m.ordre_sq},${m.saisonnalite})</span>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="cf-metric"><span class="cf-metric-label">AIC</span><span class="cf-metric-value">${m.aic?.toFixed(1) || '—'}</span></div>
      </div>
      <div class="col-6 col-md-2">
        <div class="cf-metric"><span class="cf-metric-label">MAE</span><span class="cf-metric-value">${m.mae?.toFixed(2) || '—'}</span></div>
      </div>
      <div class="col-6 col-md-2">
        <div class="cf-metric"><span class="cf-metric-label">MAPE</span><span class="cf-metric-value">${m.mape?.toFixed(2) || '—'}%</span></div>
      </div>
    </div>
    <div class="mt-3 pt-3 border-top d-flex align-items-center gap-3 flex-wrap">
      <span class="cf-badge cf-badge-green">✓ Actif</span>
      <span class="font-mono text-cf-muted" style="font-size:.72rem">${m.nom}</span>
      <span class="font-mono text-cf-muted" style="font-size:.72rem">${formatDate(m.date_debut)} → ${formatDate(m.date_fin)}</span>
    </div>`;
}

async function loadHistoriqueModeles() {
  const r = await fetchAPI('GET', API.EXPERT.HISTORIQUE);
  if (!r.statut) return;
  const tbody = document.getElementById('exp-modeles-tbody');
  if (!r.data.modeles.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-cf-muted font-mono py-4" style="font-size:.75rem">Aucun modèle entraîné</td></tr>';
    return;
  }
  tbody.innerHTML = r.data.modeles.map(m => `
    <tr>
      <td class="td-mono">#${m.id}</td>
      <td><span class="font-mono" style="font-size:.75rem">${m.nom}</span></td>
      <td class="td-mono">(${m.ordre_p},${m.ordre_d},${m.ordre_q})(${m.ordre_sp},${m.ordre_sd},${m.ordre_sq},${m.saisonnalite})</td>
      <td class="td-mono">${m.aic?.toFixed(1) || '—'}</td>
      <td class="td-mono">${m.mae?.toFixed(2) || '—'}</td>
      <td>${m.actif ? '<span class="cf-badge cf-badge-green">Actif</span>' : '<span class="cf-badge cf-badge-gray">Inactif</span>'}</td>
      <td>
        <div class="d-flex gap-1">
          ${!m.actif ? `<button class="btn-cf-outline py-1 px-2" style="font-size:.72rem" onclick="activerModele(${m.id})">Activer</button>` : ''}
          ${!m.actif ? `<button class="btn-cf-danger py-1 px-2" style="font-size:.72rem" onclick="supprimerModele(${m.id})">Supprimer</button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

async function submitEntrainement() {
  const saison = document.getElementById('train-saison').value;
  const debut  = document.getElementById('train-debut').value;
  const fin    = document.getElementById('train-fin').value;

  let url = `${API.EXPERT.ENTRAINER}?saisonnalite=${saison}`;
  if (debut) url += `&date_debut=${debut}`;
  if (fin)   url += `&date_fin=${fin}`;

  showSpinner('spin-train');
  const btn = document.getElementById('btn-train');
  btn.disabled = true;
  btn.textContent = 'Entraînement en cours...';

  const r = await fetchAPI('POST', url);
  hideSpinner('spin-train');
  btn.disabled = false;
  btn.textContent = 'Lancer l\'entraînement';

  if (r.statut) {
    showToast(`Modèle entraîné avec succès (ID: ${r.data.modele_id})`, 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalEntrainer'))?.hide();
    loadExpertPage();
  } else {
    showToast(r.message, 'error');
  }
}

async function activerModele(id) {
  const r = await fetchAPI('PUT', API.EXPERT.ACTIVER(id));
  showToast(r.message, r.statut ? 'success' : 'error');
  if (r.statut) loadHistoriqueModeles();
}

async function supprimerModele(id) {
  if (!confirm(`Supprimer le modèle #${id} ?`)) return;
  const r = await fetchAPI('DELETE', API.EXPERT.SUPPRIMER(id));
  showToast(r.message, r.statut ? 'success' : 'error');
  if (r.statut) loadHistoriqueModeles();
}

// ─────────────────────────────────────────────
// PRÉVISIONS
// ─────────────────────────────────────────────

async function loadPrevisionPage() {
  const s = await fetchAPI('GET', API.PREVISION.SEUILS_ACTUELS);
  if (s.statut) {
    document.getElementById('seuil-bas-display').textContent  = formatMoney(s.data.seuil_bas);
    document.getElementById('seuil-haut-display').textContent = formatMoney(s.data.seuil_haut);
    document.getElementById('upd-seuil-bas').value  = s.data.seuil_bas;
    document.getElementById('upd-seuil-haut').value = s.data.seuil_haut;
  }
  loadHistoriquePrevisions();
}

async function submitPrevision() {
  const horizon = document.getElementById('prev-horizon').value;
  const bas     = document.getElementById('prev-seuil-bas').value;
  const haut    = document.getElementById('prev-seuil-haut').value;

  let url = `${API.PREVISION.GENERER}?horizon=${horizon}`;
  if (bas)  url += `&seuil_bas=${bas}`;
  if (haut) url += `&seuil_haut=${haut}`;

  showSpinner('spin-prev');
  const btn = document.getElementById('btn-prev');
  btn.disabled = true;

  const r = await fetchAPI('POST', url);
  hideSpinner('spin-prev');
  btn.disabled = false;

  if (!r.statut) { showToast(r.message, 'error'); return; }

  bootstrap.Modal.getInstance(document.getElementById('modalPrevision'))?.hide();
  renderPrevisionResult(r.data);
  showToast(`Prévision générée sur ${horizon} mois`, 'success');
  loadHistoriquePrevisions();
}

function renderPrevisionResult(data) {
  const resume = data.resume;
  const el = document.getElementById('prev-result');
  el.style.display = 'block';

  // KPIs résumé
  document.getElementById('prev-moyen').textContent  = formatMoney(resume.prix_moyen);
  document.getElementById('prev-min').textContent    = formatMoney(resume.prix_min);
  document.getElementById('prev-max').textContent    = formatMoney(resume.prix_max);
  document.getElementById('prev-signal').innerHTML   = SIGNAL_HTML[resume.signal_global] || resume.signal_global;
  document.getElementById('prev-modele').textContent = resume.modele_utilise || '—';

  // Tableau
  const tbody = document.getElementById('prev-tbody');
  tbody.innerHTML = data.previsions.map(p => `
    <tr>
      <td class="td-mono">M+${p.mois}</td>
      <td class="td-mono">${formatDate(p.date)}</td>
      <td class="td-price">${formatMoney(p.prix_prevu)}</td>
      <td class="td-mono" style="font-size:.72rem;color:var(--cf-text-3)">[${formatMoney(p.ic_bas)} – ${formatMoney(p.ic_haut)}]</td>
      <td>${SIGNAL_HTML[p.signal] || p.signal}</td>
    </tr>`).join('');
}

async function loadHistoriquePrevisions() {
  const r = await fetchAPI('GET', API.PREVISION.HISTORIQUE + '?limit=20');
  if (!r.statut) return;
  const tbody = document.getElementById('prev-hist-tbody');
  if (!r.data.previsions.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-cf-muted font-mono py-4" style="font-size:.75rem">Aucune prévision générée</td></tr>';
    return;
  }
  tbody.innerHTML = r.data.previsions.map(p => `
    <tr>
      <td class="td-mono">${formatDate(p.date_prev)}</td>
      <td class="td-price">${formatMoney(p.prix_prevu)}</td>
      <td class="td-mono" style="font-size:.72rem">[${formatMoney(p.ic_bas)} – ${formatMoney(p.ic_haut)}]</td>
      <td>${SIGNAL_HTML[p.signal] || p.signal}</td>
      <td class="font-mono" style="font-size:.7rem;color:var(--cf-text-3)">${p.modele_nom || '—'}</td>
    </tr>`).join('');
}

async function submitUpdateSeuils() {
  const bas  = parseFloat(document.getElementById('upd-seuil-bas').value);
  const haut = parseFloat(document.getElementById('upd-seuil-haut').value);
  if (!bas || !haut || bas >= haut) { showToast('Seuils invalides', 'warning'); return; }
  const r = await fetchAPIJson('PUT', API.PREVISION.SEUILS, { seuil_bas: bas, seuil_haut: haut });
  showToast(r.message, r.statut ? 'success' : 'error');
  if (r.statut) {
    bootstrap.Modal.getInstance(document.getElementById('modalSeuils'))?.hide();
    loadPrevisionPage();
  }
}

// ─────────────────────────────────────────────
// GRAPHIQUES
// ─────────────────────────────────────────────

async function genererGraphiquePrix() {
  const debut = document.getElementById('g-prix-debut').value;
  const fin   = document.getElementById('g-prix-fin').value;
  const gran  = document.getElementById('g-prix-gran').value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates', 'warning'); return; }

  showSpinner('spin-g-prix');
  const url = `${API.GRAPHIQUE.PRIX}?date_debut=${debut}&date_fin=${fin}&granularite=${gran}&_t=${Date.now()}`;
  afficherImage('zone-g-prix', 'img-g-prix', url);
  hideSpinner('spin-g-prix');
  document.getElementById('btn-dl-prix').href = url;
}

async function genererGraphiquePrecip() {
  const debut = document.getElementById('g-pr-debut').value;
  const fin   = document.getElementById('g-pr-fin').value;
  const gran  = document.getElementById('g-pr-gran').value;
  const pays  = [...document.querySelectorAll('.pays-check:checked')].map(c => c.value).join(',');
  if (!debut || !fin) { showToast('Sélectionnez les deux dates', 'warning'); return; }

  showSpinner('spin-g-precip');
  let url = `${API.GRAPHIQUE.PRECIP}?date_debut=${debut}&date_fin=${fin}&granularite=${gran}&_t=${Date.now()}`;
  if (pays) url += `&pays=${pays}`;
  afficherImage('zone-g-precip', 'img-g-precip', url);
  hideSpinner('spin-g-precip');
  document.getElementById('btn-dl-precip').href = url;
}

async function genererGraphiqueCombine() {
  const debut = document.getElementById('g-cb-debut').value;
  const fin   = document.getElementById('g-cb-fin').value;
  const pays  = document.getElementById('g-cb-pays').value;
  const gran  = document.getElementById('g-cb-gran').value;
  if (!debut || !fin) { showToast('Sélectionnez les deux dates', 'warning'); return; }

  showSpinner('spin-g-comb');
  const url = `${API.GRAPHIQUE.COMBINE}?date_debut=${debut}&date_fin=${fin}&pays_precip=${pays}&granularite=${gran}&_t=${Date.now()}`;
  afficherImage('zone-g-comb', 'img-g-comb', url);
  hideSpinner('spin-g-comb');
  document.getElementById('btn-dl-comb').href = url;
}

async function genererGraphiquePrevision() {
  const mois = document.getElementById('g-pv-mois').value;
  showSpinner('spin-g-prev');
  const url = `${API.GRAPHIQUE.PREVISION}?nb_mois_historique=${mois}&_t=${Date.now()}`;
  afficherImage('zone-g-prev', 'img-g-prev', url);
  hideSpinner('spin-g-prev');
  document.getElementById('btn-dl-prev').href = url;
}

function afficherImage(zoneId, imgId, url) {
  const img  = document.getElementById(imgId);
  const zone = document.getElementById(zoneId);

  img.onload  = () => { zone.innerHTML = ''; zone.appendChild(img); };
  img.onerror = () => {
    zone.innerHTML = `
      <div class="cf-chart-empty">
        <div class="chart-empty-icon">📊</div>
        <p>Impossible de charger le graphique.<br>Vérifiez que des données sont disponibles.</p>
      </div>`;
  };
  img.src = url;
  img.style.width = '100%';
}

// ─────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Health check toutes les 30 secondes
  checkHealth();
  setInterval(checkHealth, 30000);

  // Page par défaut
  navigate('dashboard');

  // Sliders
  const horizonSlider = document.getElementById('prev-horizon');
  if (horizonSlider) {
    horizonSlider.addEventListener('input', function() {
      document.getElementById('prev-horizon-val').textContent = this.value + ' mois';
    });
  }
});
