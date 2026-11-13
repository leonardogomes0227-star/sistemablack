'use strict';
/* Menu organizado por DESTINO: cada grupo responde "o que eu vou fazer aqui?" */
const NAV = [
  ['Hoje', 'Dia a dia do balcão', [
    ['dashboard', 'Painel', 'home', ['dono'], 'Resumo e avisos'],
    ['caixa', 'Caixa', 'receipt', ['dono', 'recepcao'], 'Lançar e fechar o dia']]],
  ['Dinheiro', 'Entradas, saídas e lucro', [
    ['extrato', 'Entradas e saídas', 'list', ['dono'], 'Extrato do caixa'],
    ['gastos', 'Gastos e contas', 'arrowOut', ['dono'], 'Contas a pagar', 'Gastos'],
    ['financeiro', 'Lucro do mês', 'trend', ['dono'], 'Resultado e margem'],
    ['relatorios', 'Relatórios', 'chart', ['dono'], 'Mais vendidos e picos']]],
  ['Equipe', 'Barbeiros e produção', [
    ['producao', 'Produção', 'trophy', ['dono'], 'Quanto cada um fez', 'Equipe'],
    ['comissoes', 'Comissões', 'percent', ['dono', 'barbeiro'], 'Fechar e pagar'],
    ['barbeiros', 'Cadastro e regras', 'scissors', ['dono'], 'Percentuais e metas']]],
  ['Clientes', 'Quem frequenta a casa', [
    ['clientes', 'Clientes', 'users', ['dono', 'recepcao', 'barbeiro'], 'Histórico e contatos'],
    ['retorno', 'Trazer de volta', 'heart', ['dono', 'recepcao'], 'Aniversário e sumidos', 'Retorno']]],
  ['Produtos e preços', 'O que a casa vende', [
    ['catalogo', 'Serviços e preços', 'tag', ['dono', 'recepcao'], 'Tabela de serviços'],
    ['estoque', 'Estoque', 'box', ['dono', 'recepcao'], 'Reposição e margem']]],
  ['Sistema', 'Ajustes da barbearia', [
    ['config', 'Configurações', 'sliders', ['dono'], 'Horários e taxas']]]
];
const TABS = { dono: ['dashboard', 'caixa', 'gastos', 'producao'], recepcao: ['caixa', 'clientes', 'retorno', 'estoque'], barbeiro: ['comissoes', 'clientes'] };
const navGroup = r => NAV.find(g => g[2].some(n => n[0] === r));
const navItem = r => NAV.flatMap(g => g[2]).find(n => n[0] === r);
const allowed = r => NAV.some(g => g[2].some(n => n[0] === r && n[3].includes(SESSION.role)));
const firstRoute = () => ({ dono: 'dashboard', recepcao: 'caixa', barbeiro: 'comissoes' })[SESSION.role];

function loginScreen() {
  $('#root').innerHTML = `<div class="login"><div class="login-art"><div class="pole" aria-hidden="true"></div><span class="wordmark">${esc(DB.cfg.nome)}</span>
    <div><h1>Tudo da barbearia em um só lugar</h1><p>Tudo que entra e sai da barbearia, o que cada barbeiro produziu, comissões, estoque e lucro. Simples de usar no balcão e completo para quem administra.</p></div><span style="color:#6d6d75;font-size:13px">Versão de demonstração</span></div>
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
    ${NAV.map(([g, , items]) => { const v = items.filter(i => i[3].includes(SESSION.role)); return v.length ? `<div class="nav-g">${g}</div>${v.map(i => `<a data-act="go" data-r="${i[0]}" data-nav="${i[0]}" title="${esc(i[4])}">${ic(i[2])}<span class="nav-t">${i[1]}<small>${i[4]}</small></span></a>`).join('')}` : ''; }).join('')}</nav>
    <div class="side-foot"><div class="who">${me ? avatar(me, 32) : `<span class="avatar" style="--c:#3a3a40;width:32px;height:32px;font-size:12px">${SESSION.role === 'dono' ? 'DN' : 'RC'}</span>`}<div>${me ? esc(me.nome) : SESSION.role === 'dono' ? 'Proprietário' : 'Recepção'}<small>${{ dono: 'Acesso total', recepcao: 'Recepção', barbeiro: 'Barbeiro' }[SESSION.role]}</small></div></div>
    <a class="nav" style="display:block"><button class="btn btn-block" style="background:transparent;color:var(--side-ink);border-color:#2f2f35" data-act="logout">${ic('logout', 16)} Sair</button></a></div></aside>
    <div><div class="topbar"><button class="icon-btn" data-act="toggleNav" aria-label="Abrir menu">${ic('menu', 22)}</button><span class="wordmark" style="font-size:17px">${esc(DB.cfg.nome)}</span></div><main class="main" id="view"></main></div>
    <nav class="tabbar" aria-label="Atalhos">${TABS[SESSION.role].map(r => { const n = navItem(r); return `<a data-act="go" data-r="${r}" data-nav="${r}">${ic(n[2], 22)}<span>${n[5] || n[1]}</span></a>`; }).join('')}<a data-act="toggleNav">${ic('menu', 22)}<span>Menu</span></a></nav></div>`;
  render(true);
}

function labelTables(root) {
  $$('table.t', root).forEach(t => {
    const heads = $$('thead th', t).map(h => h.textContent.trim());
    $$('tr', t).forEach(tr => { let i = 0; [...tr.children].forEach(td => { if (td.tagName === 'TD') td.dataset.label = td.colSpan > 1 ? '' : (heads[i] || ''); i += td.colSpan || 1; }); });
  });
}
function render(top) {
  if (!SESSION) return;
  if (!allowed(UI.route)) UI.route = firstRoute();
  const v = $('#view'); const y = window.scrollY;
  v.innerHTML = VIEWS[UI.route](); labelTables(v);
  const ng = navGroup(UI.route), box = $('.page-h > div:first-child', v);
  if (ng && box) box.insertAdjacentHTML('afterbegin', `<span class="eyebrow">${ng[0]} <i>/</i> ${esc(navItem(UI.route)[1])}</span>`);
  if (!$('.demo-tag')) { const h = $('.page-h h1, .hero h1', v); if (h) h.insertAdjacentHTML('beforeend', '<span class="demo-tag">Demonstração</span>'); }
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === UI.route));
  document.body.classList.remove('nav-open');
  window.scrollTo(0, top ? 0 : y);
}
function go(r) { UI.route = r; try { history.replaceState(null, '', '#' + r); } catch (e) { } render(true); }
ACT.go = el => go(el.dataset.r);
ACT.toggleNav = () => document.body.classList.toggle('nav-open');
document.addEventListener('click', e => { if (document.body.classList.contains('nav-open') && !e.target.closest('.side,[data-act=toggleNav]')) document.body.classList.remove('nav-open'); });
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
