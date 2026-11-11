'use strict';
/* ============ utilidades ============ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const brl0 = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => new Date(s + 'T12:00:00');
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return iso(d); };
const TODAY = iso(new Date());
const NOW_MIN = new Date().getHours() * 60 + new Date().getMinutes();
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const fmtDate = (s, o) => pd(s).toLocaleDateString('pt-BR', o || { day: '2-digit', month: '2-digit' });
const fmtFull = s => pd(s).toLocaleDateString('pt-BR');
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const fmtLong = s => pd(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const ym = s => s.slice(0, 7);
const addMonths = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const mLabel = m => { const [y, mo] = m.split('-'); return `${MESES[+mo - 1]} ${y}`; };
const mEnd = m => m + '-31';
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const sum = (a, f = x => x) => a.reduce((t, x) => t + f(x), 0);
const pct = (a, b) => b ? ((a - b) / b) * 100 : null;
const initials = n => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const PAG = { pix: 'Pix', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' };
const STATUS = {
  agendado: { l: 'Agendado', c: 'st-sched' }, confirmado: { l: 'Confirmado', c: 'st-conf' },
  andamento: { l: 'Em atendimento', c: 'st-live' }, concluido: { l: 'Concluído', c: 'st-done' },
  faltou: { l: 'Faltou', c: 'st-miss' }, cancelado: { l: 'Cancelado', c: 'st-cancel' }
};
const digits = s => String(s || '').replace(/\D/g, '');
const wa = (tel, msg) => `https://wa.me/55${digits(tel)}?text=${encodeURIComponent(msg || '')}`;
const fillMsg = (tpl, o) => tpl.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

/* ============ ícones ============ */
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  receipt: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h3"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5.5-5-6.5"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  print: '<path d="M6 9V3h12v6M6 18H4v-8h16v8h-2"/><rect x="6" y="14" width="12" height="7"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="m5 12 5 5L20 7"/>', alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h0"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  cake: '<path d="M4 21h16v-8H4zM4 17c2 0 2-1.5 4-1.5S10 17 12 17s2-1.5 4-1.5S18 17 20 17M12 13V8M12 8c-1-1-1-2 0-3 1 1 1 2 0 3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ============ persistência (somente navegador) ============ */
const KEY = 'barbearia-demo-v3';
let DB, M = {};
function load() {
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.seedDay === TODAY) { DB = r; reindex(); return; } } catch (e) { }
  DB = seedData(); reindex(); save();
}
function save() { reindex(); try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }
function resetDemo() { try { localStorage.removeItem(KEY); } catch (e) { } DB = seedData(); reindex(); save(); }
const nextId = () => ++DB.seq;
function reindex() {
  for (const k of ['clients', 'barbers', 'services', 'products', 'appts', 'sales', 'expenses']) M[k] = new Map(DB[k].map(x => [x.id, x]));
  M.salesByDate = new Map(); M.salesByClient = new Map(); M.apptsByDate = new Map();
  for (const s of DB.sales) {
    (M.salesByDate.get(s.date) || M.salesByDate.set(s.date, []).get(s.date)).push(s);
    if (s.clientId) (M.salesByClient.get(s.clientId) || M.salesByClient.set(s.clientId, []).get(s.clientId)).push(s);
  }
  for (const a of DB.appts) (M.apptsByDate.get(a.date) || M.apptsByDate.set(a.date, []).get(a.date)).push(a);
}
const client = id => M.clients.get(id), barber = id => M.barbers.get(id), service = id => M.services.get(id), product = id => M.products.get(id);
const salesOn = d => M.salesByDate.get(d) || [];
const apptsOn = d => M.apptsByDate.get(d) || [];
const sessionGet = () => { try { return JSON.parse(sessionStorage.getItem('bm-session')); } catch (e) { return null; } };

/* ============ cálculos ============ */
const feeRate = p => ({ pix: DB.cfg.taxaPix, debito: DB.cfg.taxaDeb, credito: DB.cfg.taxaCred, dinheiro: 0 }[p] || 0);
function calcSale(s) {
  const sub = sum(s.items, i => i.qtd * i.preco);
  const total = Math.max(0, sub - (s.desc || 0));
  const r = sub ? total / sub : 0;
  const serv = sum(s.items.filter(i => i.t === 's'), i => i.qtd * i.preco) * r;
  const prod = sum(s.items.filter(i => i.t === 'p'), i => i.qtd * i.preco) * r;
  return { sub, total, serv, prod, fee: total * feeRate(s.pag) / 100 };
}
function stmt(bid, m) {
  const b = barber(bid);
  const rows = DB.sales.filter(s => s.barberId === bid && ym(s.date) === m).map(s => {
    const c = calcSale(s);
    return { s, c, com: c.serv * b.comServ / 100 + c.prod * b.comProd / 100 };
  }).sort((a, b) => (b.s.date + b.s.time).localeCompare(a.s.date + a.s.time));
  const serv = sum(rows, r => r.c.serv), prod = sum(rows, r => r.c.prod), com = sum(rows, r => r.com), tips = sum(rows, r => r.s.tip || 0);
  const valesList = DB.vales.filter(v => v.barberId === bid && ym(v.date) === m);
  const vales = sum(valesList, v => v.valor);
  const aluguel = (b.aluguel && m <= ym(TODAY)) ? b.aluguel : 0;
  return { b, rows, serv, prod, com, tips, vales, valesList, aluguel, n: rows.length, fat: serv + prod, net: com + tips - vales - aluguel, paid: DB.payouts[bid + '_' + m] || null };
}
function monthStats(m) {
  const sales = DB.sales.filter(s => ym(s.date) === m);
  let bruta = 0, taxas = 0, serv = 0, prod = 0; const porPag = { pix: 0, credito: 0, debito: 0, dinheiro: 0 };
  for (const s of sales) { const c = calcSale(s); bruta += c.total; taxas += c.fee; serv += c.serv; prod += c.prod; porPag[s.pag] += c.total; }
  let comiss = 0, aluguel = 0;
  for (const b of DB.barbers) { const st = stmt(b.id, m); comiss += st.com; aluguel += st.aluguel; }
  const exps = DB.expenses.filter(e => ym(e.date) === m);
  const parcial = m === ym(TODAY);
  if (parcial) aluguel = aluguel * (+TODAY.slice(8)) / new Date(+m.slice(0, 4), +m.slice(5), 0).getDate();
  const despesas = sum(exps.filter(e => !parcial || e.pago || e.date <= TODAY), e => e.valor);
  const lucro = bruta + aluguel - taxas - comiss - despesas;
  return { parcial, sales, n: sales.length, bruta, serv, prod, taxas, comiss, aluguel, despesas, exps, lucro, margem: bruta ? lucro / (bruta + aluguel) * 100 : 0, porPag, ticket: sales.length ? bruta / sales.length : 0 };
}
function cliStats(c) {
  const sales = M.salesByClient.get(c.id) || [];
  const total = sum(sales, s => calcSale(s).total);
  const ultima = sales.reduce((m, s) => s.date > m ? s.date : m, '');
  const dias = ultima ? Math.round((pd(TODAY) - pd(ultima)) / 864e5) : null;
  let tag = 'Ativo';
  if (!sales.length) tag = 'Sem visitas'; else if (dias > 45) tag = 'Sumido'; else if (sales.length >= 12) tag = 'Fiel'; else if (sales.length <= 2 && ultima >= addDays(TODAY, -30)) tag = 'Novo';
  return { sales, n: sales.length, total, ultima, dias, ticket: sales.length ? total / sales.length : 0, tag };
}
function hasConflict(bid, date, start, dur, ignoreId) {
  const e = start + dur;
  return apptsOn(date).find(a => a.id !== ignoreId && a.barberId === bid && !['cancelado', 'faltou'].includes(a.status) && toMin(a.time) < e && toMin(a.time) + a.dur > start);
}
const apptSvcNames = a => a.svc.map(id => service(id)?.nome).filter(Boolean).join(' + ');
const apptValue = a => sum(a.svc, id => service(id)?.preco || 0);

/* ============ interface: modal, toast, confirm ============ */
function toast(msg, type = '') {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = (type === 'bad' ? ic('alert', 16) : ic('check', 16)) + `<span>${esc(msg)}</span>`;
  box.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 3200);
}
function openModal({ title, body, foot = '', wide = false, cls = '' }) {
  closeModal();
  const el = document.createElement('div'); el.className = 'modal-back'; el.id = 'modal';
  el.innerHTML = `<div class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-h"><h3>${title}</h3><button class="icon-btn" data-act="closeModal" aria-label="Fechar">${ic('x')}</button></div><div class="modal-b">${body}</div>${foot ? `<div class="modal-f">${foot}</div>` : ''}</div>`;
  el.addEventListener('mousedown', e => { if (e.target === el) closeModal(); });
  document.body.appendChild(el); document.body.classList.add('noscroll');
  const f = $('input:not([type=hidden]):not([type=checkbox]),select', el); if (f && !matchMedia('(pointer:coarse)').matches) f.focus();
}
function closeModal() { $('#modal')?.remove(); document.body.classList.remove('noscroll'); }
function confirmBox(msg, onYes, label = 'Confirmar', danger = false) {
  window._confirmYes = () => { closeModal(); onYes(); };
  openModal({ title: 'Confirmar', body: `<p class="muted-p">${msg}</p>`, foot: `<button class="btn" data-act="closeModal">Voltar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirmYes">${label}</button>` });
}
function printModal() { document.body.classList.add('print-modal'); window.print(); setTimeout(() => document.body.classList.remove('print-modal'), 500); }
function download(name, text, type = 'text/csv') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

/* ============ componentes de formulário e gráfico ============ */
const fld = (label, input, cls = '') => `<label class="field ${cls}"><span>${label}</span>${input}</label>`;
const inp = (name, val = '', type = 'text', extra = '') => `<input name="${name}" type="${type}" value="${esc(val)}" ${extra}>`;
const sel = (name, options, cur, extra = '') => `<select name="${name}" ${extra}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const formData = form => Object.fromEntries(new FormData(form).entries());
const num2 = v => parseFloat(String(v).replace(',', '.')) || 0;
const avatar = (b, s = 30) => `<span class="avatar" style="--c:${b.cor};width:${s}px;height:${s}px;font-size:${Math.round(s * .38)}px">${esc(initials(b.nome))}</span>`;
const badge = (txt, cls = '') => `<span class="badge ${cls}">${esc(txt)}</span>`;
const delta = (a, b) => { const p = pct(a, b); if (p === null) return ''; return `<span class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%</span>`; };
function bars(data, { h = 190, fmt = brl0, every = 5 } = {}) {
  const max = Math.max(...data.map(d => d.v), 1);
  return `<div class="bars" style="height:${h}px"><div class="bars-max">${fmt(max)}</div>${data.map((d, i) => `<div class="bar-col" title="${esc(d.t || '')}"><div class="bar ${d.hl ? 'hl' : ''} ${d.v === 0 ? 'zero' : ''}" style="height:${Math.max(d.v / max * 100, d.v ? 2 : 0)}%"></div><span class="bar-l">${(i % every === 0 || d.hl) ? esc(d.l) : ''}</span></div>`).join('')}</div>`;
}
const hbar = (label, v, max, right, color = 'var(--ink)') => `<div class="hbar"><div class="hbar-top"><span>${label}</span><b>${right}</b></div><div class="hbar-track"><div style="width:${max ? Math.min(100, v / max * 100) : 0}%;background:${color}"></div></div></div>`;
const monthNav = (key, m) => `<div class="datenav"><button class="icon-btn" data-act="monthNav" data-k="${key}" data-n="-1" aria-label="Mês anterior">${ic('left')}</button><span class="datenav-l">${mLabel(m)}</span><button class="icon-btn" data-act="monthNav" data-k="${key}" data-n="1" aria-label="Próximo mês">${ic('right')}</button></div>`;
const empty = (msg) => `<div class="empty">${msg}</div>`;
const clientPicker = (name = 'cliente', cur = '') => `<input name="${name}" list="cl-list" value="${esc(cur)}" placeholder="Digite o nome ou telefone" autocomplete="off"><datalist id="cl-list">${DB.clients.map(c => `<option value="${esc(c.nome + ' · ' + c.tel)}"></option>`).join('')}</datalist>`;
function resolveClient(txt, tel) {
  txt = (txt || '').trim(); if (!txt) return null;
  const hit = DB.clients.find(c => (c.nome + ' · ' + c.tel) === txt) || DB.clients.find(c => c.nome.toLowerCase() === txt.toLowerCase());
  if (hit) return hit.id;
  const c = { id: nextId(), nome: txt, tel: tel || '', nasc: '', criado: TODAY, obs: '' };
  DB.clients.push(c); return c.id;
}
