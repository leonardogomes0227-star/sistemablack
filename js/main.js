'use strict';
const NAV = [
  ['Operação', [['dashboard', 'Painel', 'grid', ['dono', 'recepcao']], ['fila', 'Fila', 'clock', ['dono', 'recepcao', 'barbeiro']], ['caixa', 'Caixa', 'receipt', ['dono', 'recepcao']], ['clientes', 'Clientes', 'users', ['dono', 'recepcao', 'barbeiro']]]],
  ['Gestão', [['barbeiros', 'Equipe', 'scissors', ['dono']], ['comissoes', 'Comissões', 'percent', ['dono', 'barbeiro']], ['catalogo', 'Serviços e produtos', 'box', ['dono', 'recepcao']], ['financeiro', 'Financeiro', 'wallet', ['dono']], ['relatorios', 'Relatórios', 'chart', ['dono']]]],
  ['Sistema', [['config', 'Configurações', 'sliders', ['dono']]]]
];
const allowed = r => NAV.some(g => g[1].some(n => n[0] === r && n[3].includes(SESSION.role)));
const firstRoute = () => SESSION.role === 'barbeiro' ? 'fila' : 'dashboard';

function loginScreen() {
  $('#root').innerHTML = `<div class="login"><div class="login-art"><div class="pole" aria-hidden="true"></div><span class="wordmark">${esc(DB.cfg.nome)}</span>
    <div><h1>Tudo da barbearia em um só lugar</h1><p>Fila de atendimento, caixa, comissões dos barbeiros, estoque e financeiro. Simples de usar no balcão e completo para quem administra.</p></div><span style="color:#6d6d75;font-size:13px">Versão de demonstração</span></div>
    <div class="login-form"><form id="f-login" onsubmit="return false"><h2>Entrar no sistema</h2><div class="demo-note">Demonstração com dados de exemplo. Escolha um perfil para ver o que cada pessoa enxerga.</div>
    ${fld('E-mail', inp('email', 'dono@barbearia.com', 'email', 'autocomplete="off"'))}${fld('Senha', inp('senha', '••••••••', 'password', 'autocomplete="off"'))}
    ${fld('Entrar como', sel('perfil', [['dono', 'Dono (acesso total)'], ['recepcao', 'Recepção'], ...DB.barbers.filter(b => b.ativo).map(b => ['b' + b.id, 'Barbeiro · ' + b.nome])], 'dono'))}
    <button class="btn btn-primary btn-block" style="height:42px" data-act="login">Entrar</button></form></div></div>`;
}
ACT.login = () => {
  const p = $('#f-login').perfil.value; SESSION = p.startsWith('b') ? { role: 'barbeiro', me: +p.slice(1) } : { role: p };
  try { sessionStorage.setItem('bm-session', JSON.stringify(SESSION)); } catch (e) { }
  UI.route = firstRoute(); shell();
};
ACT.logout = () => { try { sessionStorage.removeItem('bm-session'); } catch (e) { } SESSION = null; document.body.classList.remove('nav-open'); loginScreen(); };

function shell() {
  const me = SESSION.role === 'barbeiro' ? barber(SESSION.me) : null;
  $('#root').innerHTML = `<div class="app"><aside class="side" id="side"><span class="wordmark">${esc(DB.cfg.nome)}</span><nav class="nav" aria-label="Menu principal">
    ${NAV.map(([g, items]) => { const v = items.filter(i => i[3].includes(SESSION.role)); return v.length ? `<div class="nav-g">${g}</div>${v.map(i => `<a data-act="go" data-r="${i[0]}" data-nav="${i[0]}">${ic(i[2])}${i[1]}</a>`).join('')}` : ''; }).join('')}</nav>
    <div class="side-foot"><div class="who">${me ? avatar(me, 32) : `<span class="avatar" style="--c:#3a3a40;width:32px;height:32px;font-size:12px">${SESSION.role === 'dono' ? 'DN' : 'RC'}</span>`}<div>${me ? esc(me.nome) : SESSION.role === 'dono' ? 'Proprietário' : 'Recepção'}<small>${{ dono: 'Acesso total', recepcao: 'Recepção', barbeiro: 'Barbeiro' }[SESSION.role]}</small></div></div>
    <a class="nav" style="display:block"><button class="btn btn-block" style="background:transparent;color:var(--side-ink);border-color:#2f2f35" data-act="logout">${ic('logout', 16)} Sair</button></a></div></aside>
    <div><div class="topbar"><button class="icon-btn" data-act="toggleNav" aria-label="Abrir menu">${ic('menu', 22)}</button><span class="wordmark" style="font-size:17px">${esc(DB.cfg.nome)}</span></div><main class="main" id="view"></main></div></div>`;
  render(true);
}

function render(top) {
  if (!SESSION) return;
  if (!allowed(UI.route)) UI.route = firstRoute();
  const v = $('#view'); const y = window.scrollY;
  v.innerHTML = VIEWS[UI.route]();
  if (!$('.demo-tag')) { const h = $('.page-h h1, .hero h1', v); if (h) h.insertAdjacentHTML('beforeend', '<span class="demo-tag">Demonstração</span>'); }
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === UI.route));
  document.body.classList.remove('nav-open');
  window.scrollTo(0, top ? 0 : y);
}
function go(r) { UI.route = r; try { history.replaceState(null, '', '#' + r); } catch (e) { } render(true); }
ACT.go = el => go(el.dataset.r);
ACT.toggleNav = () => document.body.classList.toggle('nav-open');
ACT.closeModal = closeModal;
ACT.confirmYes = () => window._confirmYes();
ACT.monthNav = el => { const k = el.dataset.k; UI[k] = addMonths(UI[k], +el.dataset.n); render(); };

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (fn) { if (el.tagName === 'A' && !el.href) e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHG[el.dataset.change]) CHG[el.dataset.change](e.target.matches('input,select') ? e.target : el, e); });
document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (el && ACT[el.dataset.input]) ACT[el.dataset.input](el, e); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

load();
try { SESSION = JSON.parse(sessionStorage.getItem('bm-session')); } catch (e) { SESSION = null; }
if (SESSION) { const h = location.hash.slice(1); UI.route = VIEWS[h] ? h : firstRoute(); shell(); } else loginScreen();
