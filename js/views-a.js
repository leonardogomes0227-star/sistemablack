'use strict';
const UI = { route: 'dashboard', dashRange: 30, cxDate: TODAY, cliFilter: 'todos', cliQ: '', cliLimit: 50, cliSort: 'nome', exPeriod: 'mes', exTipo: 'todas', exBarber: '', catTab: 'servicos', finMonth: ym(TODAY), comMonth: ym(TODAY), comBarber: null, prodMonth: ym(TODAY), gasMonth: ym(TODAY), gasFilter: 'todas', gasCat: '', estQ: '', relRange: 'mes', finFilter: 'todas' };
const ACT = {}; const CHG = {}; const VIEWS = {};
let SESSION = null;
const isDono = () => SESSION.role === 'dono';
const visibleBarbers = () => DB.barbers.filter(b => b.ativo && (SESSION.role !== 'barbeiro' || b.id === SESSION.me));

/* ================= PAINEL: só o resumo; cada bloco leva ao seu destino ================= */
const rangeTotal = (a, b, bid) => sum(DB.sales.filter(s => s.date >= a && s.date <= b && (!bid || s.barberId === bid)), s => calcSale(s).total);
const openDaysIn = m => { let n = 0; const [y, mo] = m.split('-').map(Number); const last = new Date(y, mo, 0).getDate(); for (let i = 1; i <= last; i++) if (DB.cfg.dias.includes(new Date(y, mo - 1, i).getDay())) n++; return n; };
const openDaysElapsed = m => { let n = 0; for (let i = 1; i <= +TODAY.slice(8); i++) if (DB.cfg.dias.includes(new Date(+m.slice(0, 4), +m.slice(5) - 1, i).getDay())) n++; return n; };
const seeAll = (r, label) => `<button class="link-btn" data-act="go" data-r="${r}">${label} ${ic('right', 14)}</button>`;
VIEWS.dashboard = () => {
  const m = ym(TODAY), pm = addMonths(m, -1), day = +TODAY.slice(8);
  const hoje = rangeTotal(TODAY, TODAY), semPas = rangeTotal(addDays(TODAY, -7), addDays(TODAY, -7));
  const ms = monthStats(m);
  const mesPas = rangeTotal(pm + '-01', pm + '-' + pad(Math.min(day, 28)));
  const base = ms.bruta + ms.aluguel, saidas = ms.despesas + ms.comiss + ms.taxas;
  const elapsed = openDaysElapsed(m), proj = elapsed ? ms.bruta / elapsed * openDaysIn(m) : 0, meta = DB.cfg.metaMes;
  const days = []; for (let i = UI.dashRange - 1; i >= 0; i--) { const d = addDays(TODAY, -i); const v = rangeTotal(d, d); days.push({ v, l: fmtDate(d), hl: d === TODAY, t: `${fmtDate(d)} · ${brl(v)}` }); }
  const rows = DB.barbers.map(b => ({ b, st: stmt(b.id, m), h: rangeTotal(TODAY, TODAY, b.id) })).filter(r => r.b.ativo || r.st.n).sort((a, b) => b.st.fat - a.st.fat);
  const topMax = Math.max(...rows.map(r => r.st.fat), 1);
  const cats = {}; ms.exps.filter(e => e.pago || e.date <= TODAY).forEach(e => cats[e.categoria] = (cats[e.categoria] || 0) + e.valor);
  const flows = [['Comissões dos barbeiros', ms.comiss, 'var(--ink)'], ...Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => [k, v, 'var(--brass)']), ['Taxas de cartão', ms.taxas, '#8a8a92']];
  const baixo = DB.products.filter(p => p.ativo && p.estoque <= p.min);
  const venc = DB.expenses.filter(e => !e.pago && e.date >= TODAY && e.date <= addDays(TODAY, 7));
  const atraso = DB.expenses.filter(e => !e.pago && e.date < TODAY);
  const anivs = DB.clients.filter(c => { if (!c.nasc) return false; for (let i = 0; i < 7; i++) if (addDays(TODAY, i).slice(5) === c.nasc.slice(5)) return true; return false; });
  const sumidos = DB.clients.filter(c => cliStats(c).tag === 'Sumido').length;
  const comPend = sum(DB.barbers.filter(b => !DB.payouts[b.id + '_' + pm]), b => Math.max(0, stmt(b.id, pm).net));
  const alerts = [];
  if (atraso.length) alerts.push(['bad', 'alert', `${atraso.length} conta(s) em atraso`, brl(sum(atraso, e => e.valor)) + ' · ' + atraso.map(e => e.descricao).join(', '), 'gastos', 'Gastos']);
  if (venc.length) alerts.push(['warn', 'clock', `${venc.length} conta(s) vencem em 7 dias`, brl(sum(venc, e => e.valor)), 'gastos', 'Gastos']);
  if (comPend > 0) alerts.push(['brass', 'percent', 'Comissões de ' + mLabel(pm) + ' em aberto', brl(comPend) + ' a pagar aos barbeiros', 'comissoes', 'Equipe']);
  if (baixo.length) alerts.push(['warn', 'box', `${baixo.length} produto(s) com estoque baixo`, baixo.map(p => `${p.nome} (${p.estoque})`).join(', '), 'estoque', 'Estoque']);
  if (anivs.length) alerts.push(['info', 'cake', `${anivs.length} cliente(s) fazem aniversário em 7 dias`, anivs.slice(0, 3).map(c => c.nome.split(' ')[0]).join(', ') + (anivs.length > 3 ? '…' : ''), 'retorno', 'Clientes']);
  if (sumidos) alerts.push(['info', 'users', `${sumidos} clientes sem voltar há mais de 45 dias`, 'Vale chamar no WhatsApp', 'retorno', 'Clientes']);
  const hr = new Date().getHours(); const saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const mn = MESES[+m.slice(5) - 1];
  return `
  <section class="hero"><span class="pole" aria-hidden="true"></span>
    <div><span class="hero-eyebrow">${cap(fmtLong(TODAY))}</span><h1>${saud}</h1>
      <div class="hero-acts"><button class="btn btn-brass" data-act="newSale">${ic('plus', 16)} Lançar atendimento</button><button class="btn btn-ghost-d" data-act="expNew">${ic('wallet', 16)} Lançar despesa</button></div></div>
    <div class="hero-n"><small>Entrou hoje</small><b>${brl(hoje)}</b><div class="kpi-line">${delta(hoje, semPas)}<span>vs. mesmo dia da semana passada</span></div></div>
  </section>

  <div class="sec-h"><h2>${mn} em uma conta</h2><span class="muted">Clique em cada bloco para abrir os detalhes</span></div>
  <div class="eq">
    <button class="eq-b in" data-act="go" data-r="extrato"><span class="eq-i">${ic('arrowIn', 18)}</span><small>Entrou</small><b>${brl0(base)}</b><em>${delta(ms.bruta, mesPas) || ''} <span>vs. ${MESES[+pm.slice(5) - 1].slice(0, 3).toLowerCase()} até hoje</span></em><span class="eq-go">Ver entradas e saídas ${ic('right', 13)}</span></button>
    <span class="eq-op" aria-hidden="true">−</span>
    <button class="eq-b out" data-act="go" data-r="gastos"><span class="eq-i">${ic('arrowOut', 18)}</span><small>Saiu</small><b>${brl0(saidas)}</b><em><span>comissões + despesas + taxas</span></em><span class="eq-go">Ver gastos e contas ${ic('right', 13)}</span></button>
    <span class="eq-op" aria-hidden="true">=</span>
    <button class="eq-b net" data-act="go" data-r="financeiro"><span class="eq-i">${ic('trend', 18)}</span><small>Sobrou (lucro)</small><b style="color:${ms.lucro >= 0 ? 'var(--ok)' : 'var(--bad)'}">${brl0(ms.lucro)}</b><em><span>margem de ${ms.margem.toFixed(0)}%</span></em><span class="eq-go">Ver lucro do mês ${ic('right', 13)}</span></button>
  </div>
  <div class="card meta-bar"><div class="hbar-top"><span><b>Meta da barbearia</b> · ${ms.n} atendimentos · ticket médio ${brl(ms.ticket)}</span><b>${brl0(ms.bruta)} de ${brl0(meta)}</b></div><div class="progress"><div style="width:${Math.min(100, ms.bruta / meta * 100)}%"></div></div><div class="muted" style="font-size:12.5px;margin-top:6px">Se o ritmo continuar, o mês fecha em <b style="color:var(--ink)">${brl0(proj)}</b> (${(proj / meta * 100).toFixed(0)}% da meta)</div></div>

  <div class="grid g-split mt">
    <div class="card"><div class="card-h"><h3>${ic('trophy', 15)} Equipe · quem produziu em ${mn.toLowerCase()}</h3>${seeAll('producao', 'Ver produção completa')}</div>
      <div class="card-b rank">${rows.map((r, i) => `<div class="rank-row" data-act="barStmt" data-id="${r.b.id}"><span class="rank-n">${i + 1}</span>${avatar(r.b, 34)}<div class="grow"><div class="hbar-top"><b>${esc(r.b.nome)}</b><b>${brl0(r.st.fat)}</b></div><div class="hbar-track"><div style="width:${r.st.fat / topMax * 100}%;background:${r.b.cor}"></div></div><small class="muted">${r.st.n} atend. · hoje ${brl0(r.h)} · meta ${(r.st.fat / r.b.meta * 100).toFixed(0)}%</small></div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>${ic('alert', 15)} Precisa de atenção</h3><span class="muted">${alerts.length} aviso(s)</span></div>
      ${alerts.length ? alerts.map(a => `<div class="list-row" data-act="go" data-r="${a[4]}"><span class="alert-i ${a[0]}">${ic(a[1], 18)}</span><div class="grow"><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div><span class="dest">${a[5]}</span>${ic('right', 16)}</div>`).join('') : empty('Tudo em dia.')}</div>
  </div>
  <div class="grid g-split mt">
    <div class="card"><div class="card-h"><h3>${ic('arrowIn', 15)} Entradas por dia</h3><div class="chips">${[15, 30, 60].map(n => `<button class="chip ${UI.dashRange === n ? 'on' : ''}" data-act="dashRange" data-n="${n}">${n} dias</button>`).join('')}</div></div><div class="card-b">${bars(days, { every: Math.ceil(UI.dashRange / 6), h: 170 })}</div></div>
    <div class="card"><div class="card-h"><h3>${ic('arrowOut', 15)} Para onde foi o dinheiro</h3>${seeAll('gastos', 'Ver gastos')}</div><div class="card-b">
      ${flows.map(f => hbar(esc(f[0]), f[1], Math.max(base, 1), `${brl0(f[1])} <span class="muted" style="font-weight:400">· ${base ? (f[1] / base * 100).toFixed(0) : 0}%</span>`, f[2])).join('')}</div></div>
  </div>`;
};
ACT.dashRange = el => { UI.dashRange = +el.dataset.n; render(); };
ACT.goAlert = el => { const [r, f] = el.dataset.r.split(':'); if (f) { UI.cliFilter = f; UI.cliLimit = 50; } go(r); };

/* ================= CAIXA ================= */
VIEWS.caixa = () => {
  const d = UI.cxDate, sales = salesOn(d).slice().sort((a, b) => b.time.localeCompare(a.time));
  const cs = sales.map(calcSale), total = sum(cs, c => c.total), tips = sum(sales, s => s.tip || 0);
  const por = { pix: 0, credito: 0, debito: 0, dinheiro: 0 }; sales.forEach((s, i) => por[s.pag] += cs[i].total);
  const aCobrar = false ? apptsOn(d).filter(a => a.status === 'andamento').sort((a, b) => a.time.localeCompare(b.time)) : [];
  return `
  <div class="page-h"><div><h1>Caixa</h1><p>Lance cada atendimento e venda, confira recebimentos e feche o dia</p></div>
    <div class="acts"><button class="btn no-print" onclick="window.print()">${ic('print', 16)} Imprimir fechamento</button><button class="btn btn-primary no-print" data-act="newSale">${ic('plus', 16)} Lançar atendimento</button></div></div>
  <div class="toolbar no-print"><div class="datenav"><button class="icon-btn" data-act="cxNav" data-n="-1" aria-label="Dia anterior">${ic('left')}</button><span class="datenav-l">${d === TODAY ? 'Hoje' : fmtDate(d, { weekday: 'short', day: '2-digit', month: 'short' })}</span><button class="icon-btn" data-act="cxNav" data-n="1" aria-label="Próximo dia">${ic('right')}</button></div>
    <input type="date" value="${d}" data-change="cxDate" style="width:auto" aria-label="Data"></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Total vendido</small><b>${brl(total)}</b><div class="sub">${sales.length} venda(s)</div></div>
    <div class="card kpi"><small>Ticket médio</small><b>${brl(sales.length ? total / sales.length : 0)}</b></div>
    <div class="card kpi"><small>Gorjetas (100% do barbeiro)</small><b>${brl(tips)}</b></div>
    <div class="card kpi"><small>Taxas de cartão</small><b>${brl(sum(cs, c => c.fee))}</b><div class="sub">Líquido: ${brl(total - sum(cs, c => c.fee))}</div></div></div>
  <div class="pay-pills mt">${Object.keys(PAG).map(k => `<div class="pay-pill"><small>${PAG[k]}</small><b>${brl(por[k])}</b></div>`).join('')}</div>
  ${gavetaCard(d)}
  ${aCobrar.length ? `<div class="card mt no-print"><div class="card-h"><h3>Em atendimento (cobrar ao finalizar)</h3><span class="muted">${aCobrar.length} atendimento(s)</span></div>${aCobrar.map(a => `<div class="list-row"><span class="time-pill">${a.time}</span><div class="grow"><b>${esc(client(a.clientId)?.nome || 'Cliente avulso')}</b><small>${esc(apptSvcNames(a))} · ${esc(barber(a.barberId).nome)}</small></div><b>${brl(apptValue(a))}</b><button class="btn btn-sm btn-primary" data-act="apptPay" data-id="${a.id}">Cobrar</button></div>`).join('')}</div>` : ''}
  <div class="card mt"><div class="card-h"><h3>Vendas do dia</h3></div>${sales.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Hora</th><th>Cliente</th><th>Itens</th><th>Barbeiro</th><th>Pagamento</th><th class="num">Total</th></tr></thead><tbody>
    ${sales.map((s, i) => `<tr data-act="sale" data-id="${s.id}"><td>${s.time}</td><td>${esc(client(s.clientId)?.nome || 'Cliente avulso')}</td><td class="muted">${esc(s.items.map(i => (i.qtd > 1 ? i.qtd + '× ' : '') + i.nome).join(', '))}</td><td>${esc(barber(s.barberId).nome.split(' ')[0])}</td><td>${badge(PAG[s.pag])}</td><td class="num"><b>${brl(cs[i].total)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="5">Total</td><td class="num">${brl(total)}</td></tr></tfoot></table></div>` : empty('Nenhuma venda neste dia.')}</div>`;
};
function gavetaCard(d) {
  const g = gaveta(d), r = g.r, ed = d === TODAY, fech = r?.fechamento;
  const dif = fech ? fech.contado - g.esperado : 0;
  const head = `<div class="card-h"><h3>Gaveta de dinheiro</h3><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${!r ? badge('Caixa não aberto', 'warn') : fech ? badge('Fechado às ' + fech.hora, 'ok') : badge('Aberto', 'brass')}${ed && r && !fech ? `<button class="btn btn-sm" data-act="cxMov" data-t="suprimento">+ Suprimento</button><button class="btn btn-sm" data-act="cxMov" data-t="sangria">− Sangria</button><button class="btn btn-sm btn-primary" data-act="cxClose">Fechar caixa</button>` : ''}${ed && fech ? '<button class="btn btn-sm" data-act="cxReopen">Reabrir</button>' : ''}</div></div>`;
  if (!r) return `<div class="card mt no-print">${head}<div class="card-b">${ed ? '<p class="muted-p" style="margin-bottom:12px">Informe o troco inicial para começar o dia e conferir a gaveta no fechamento.</p><button class="btn btn-brass" data-act="cxOpen">Abrir caixa</button>' : '<span class="muted">Sem registro de caixa neste dia.</span>'}</div></div>`;
  return `<div class="card mt no-print">${head}<div class="card-b grid g2" style="align-items:start"><dl class="kv"><dt>Troco inicial</dt><dd>${brl(r.abertura)}</dd><dt>+ Vendas em dinheiro</dt><dd>${brl(g.din)}</dd><dt>+ Suprimentos</dt><dd>${brl(g.sup)}</dd><dt>− Sangrias</dt><dd>${brl(g.sang)}</dd><dt class="tot">Esperado na gaveta</dt><dd class="tot">${brl(g.esperado)}</dd>${fech ? `<dt>Valor contado</dt><dd>${brl(fech.contado)}</dd><dt>Diferença</dt><dd>${badge(dif === 0 ? 'Confere' : (dif > 0 ? 'Sobra ' : 'Falta ') + brl(Math.abs(dif)), dif === 0 ? 'ok' : 'bad')}</dd>` : ''}</dl>
    <div>${r.movs.length ? r.movs.map(m => `<div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><b>${m.tipo === 'sangria' ? 'Sangria' : 'Suprimento'}</b><small>${esc(m.desc)} · ${m.hora}</small></div><b>${m.tipo === 'sangria' ? '− ' : '+ '}${brl(m.valor)}</b></div>`).join('') : '<span class="muted">Sem retiradas ou reforços no dia.</span>'}</div></div></div>`;
}
ACT.cxOpen = () => openModal({ title: 'Abrir caixa', body: `<form id="f-cx" onsubmit="return false">${fld('Troco inicial na gaveta (R$)', inp('valor', 100, 'number', 'min="0" step="1"'))}</form>`, foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="cxOpenSave">Abrir caixa</button>` });
ACT.cxOpenSave = () => { DB.caixa[TODAY] = { abertura: num2(formData($('#f-cx')).valor), movs: [], fechamento: null }; save(); closeModal(); toast('Caixa aberto'); render(); };
ACT.cxMov = el => { const sang = el.dataset.t === 'sangria'; openModal({ title: sang ? 'Sangria (retirada)' : 'Suprimento (reforço de troco)', body: `<form id="f-cx" class="form-grid" onsubmit="return false">${fld('Valor (R$)', inp('valor', '', 'number', 'min="1" step="1"'))}${fld('Motivo', inp('desc', sang ? 'Retirada do dono' : 'Reforço de troco'))}</form>`, foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="cxMovSave" data-t="${el.dataset.t}">Registrar</button>` }); };
ACT.cxMovSave = el => { const d = formData($('#f-cx')); if (!num2(d.valor)) return toast('Informe o valor', 'bad'); DB.caixa[TODAY].movs.push({ id: nextId(), tipo: el.dataset.t, valor: num2(d.valor), desc: d.desc, hora: toTime(nowMin()) }); save(); closeModal(); toast('Lançamento registrado'); render(); };
ACT.cxClose = () => { const g = gaveta(TODAY); openModal({ title: 'Fechar caixa', body: `<p class="muted-p">Conte o dinheiro da gaveta. O sistema espera <b>${brl(g.esperado)}</b>.</p><form id="f-cx" onsubmit="return false">${fld('Valor contado (R$)', inp('valor', g.esperado.toFixed(2), 'number', 'min="0" step="0.01"'))}</form>`, foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="cxCloseSave">Fechar caixa</button>` }); };
ACT.cxCloseSave = () => { DB.caixa[TODAY].fechamento = { contado: num2(formData($('#f-cx')).valor), hora: toTime(nowMin()) }; save(); closeModal(); toast('Caixa fechado'); render(); };
ACT.cxReopen = () => { DB.caixa[TODAY].fechamento = null; save(); toast('Caixa reaberto'); render(); };
ACT.cxNav = el => { UI.cxDate = addDays(UI.cxDate, +el.dataset.n); render(); };
CHG.cxDate = el => { if (el.value) { UI.cxDate = el.value; render(); } };
ACT.newSale = () => checkout({});

let CK = null;
function checkout({ apptId, clientId }) {
  const a = apptId ? M.appts.get(apptId) : null;
  CK = { apptId, items: a ? a.svc.map(id => { const s = service(id); return { t: 's', id, nome: s.nome, qtd: 1, preco: s.preco }; }) : [] };
  const bs = DB.barbers.filter(b => b.ativo), c = a ? client(a.clientId) : clientId ? client(clientId) : null;
  openModal({
    title: a ? 'Finalizar e cobrar' : 'Lançar atendimento', wide: true,
    body: `<form id="f-ck" class="form-grid" onsubmit="return false">
      ${fld('Cliente', clientPicker('cliente', c ? c.nome + ' · ' + c.tel : ''))}${fld('Barbeiro', sel('barberId', bs.map(b => [b.id, b.nome]), a ? a.barberId : (SESSION.role === 'barbeiro' ? SESSION.me : bs[0].id)))}
      <div class="full"><div class="form-grid">
        ${fld('Adicionar serviço', sel('addS', [['', 'Selecionar…'], ...DB.services.filter(s => s.ativo).map(s => [s.id, `${s.nome} · ${brl0(s.preco)}`])], '', 'data-change="ckAdd"'))}
        ${fld('Adicionar produto', sel('addP', [['', 'Selecionar…'], ...DB.products.filter(p => p.ativo && p.estoque > 0).map(p => [p.id, `${p.nome} · ${brl0(p.preco)} (${p.estoque} un.)`])], '', 'data-change="ckAdd"'))}</div></div>
      <div class="full" id="ck-items"></div>
      ${fld('Desconto (R$)', inp('desc', 0, 'number', 'min="0" step="0.5" data-input="ckTotals"'))}${fld('Gorjeta (R$)', inp('tip', 0, 'number', 'min="0" step="1" data-input="ckTotals"'))}
      <div class="full"><span class="muted" style="font-size:13px;font-weight:500">Forma de pagamento</span><div class="seg" style="margin-top:6px" data-change="ckTotals">${Object.keys(PAG).map((k, i) => `<label><input type="radio" name="pag" value="${k}" ${i === 0 ? 'checked' : ''}>${PAG[k]}</label>`).join('')}</div></div>
      <div class="full total-box" id="ck-total"></div><div class="full" id="ck-err" style="color:var(--bad);font-weight:500"></div></form>`,
    foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-brass" data-act="ckPay">Receber pagamento</button>`
  });
  ckItems();
}
function ckItems() {
  $('#ck-items').innerHTML = CK.items.length ? CK.items.map((i, n) => `<div class="ck-item"><div class="grow"><b>${esc(i.nome)}</b><small>${i.t === 's' ? 'Serviço' : 'Produto'} · ${brl(i.preco)}</small></div>
    ${i.t === 'p' ? `<div class="qty"><button type="button" data-act="ckQty" data-n="${n}" data-d="-1" aria-label="Menos">−</button><span>${i.qtd}</span><button type="button" data-act="ckQty" data-n="${n}" data-d="1" aria-label="Mais">+</button></div>` : ''}
    <b style="min-width:80px;text-align:right">${brl(i.preco * i.qtd)}</b><button type="button" class="icon-btn" data-act="ckRm" data-n="${n}" aria-label="Remover">${ic('x', 16)}</button></div>`).join('') : '<div class="empty" style="padding:16px">Adicione serviços ou produtos.</div>';
  ckTotals();
}
function ckTotals() {
  const f = $('#f-ck'); if (!f) return; const sub = sum(CK.items, i => i.qtd * i.preco), desc = Math.min(num2(f.desc.value), sub), tip = num2(f.tip.value), total = sub - desc;
  const pag = f.pag.value, fee = total * feeRate(pag) / 100;
  $('#ck-total').innerHTML = `<dl class="kv"><dt>Subtotal</dt><dd>${brl(sub)}</dd>${desc ? `<dt>Desconto</dt><dd>− ${brl(desc)}</dd>` : ''}${tip ? `<dt>Gorjeta para o barbeiro</dt><dd>${brl(tip)}</dd>` : ''}${fee ? `<dt>Taxa ${PAG[pag].toLowerCase()} (${feeRate(pag)}%)</dt><dd class="muted">− ${brl(fee)}</dd>` : ''}<dt class="tot">Total a receber</dt><dd class="tot">${brl(total + tip)}</dd></dl>`;
}
CHG.ckAdd = el => {
  if (!el.value) return; const id = +el.value;
  if (el.name === 'addS') { const s = service(id); CK.items.push({ t: 's', id, nome: s.nome, qtd: 1, preco: s.preco }); }
  else { const p = product(id), ex = CK.items.find(i => i.t === 'p' && i.id === id); if (ex) ex.qtd = Math.min(ex.qtd + 1, p.estoque); else CK.items.push({ t: 'p', id, nome: p.nome, qtd: 1, preco: p.preco }); }
  el.value = ''; ckItems();
};
CHG.ckTotals = ckTotals; ACT.ckTotals = ckTotals;
ACT.ckQty = el => { const i = CK.items[+el.dataset.n]; i.qtd = Math.max(1, Math.min(i.qtd + +el.dataset.d, product(i.id).estoque)); ckItems(); };
ACT.ckRm = el => { CK.items.splice(+el.dataset.n, 1); ckItems(); };
ACT.ckPay = () => {
  const f = $('#f-ck'), d = formData(f); if (!CK.items.length) return $('#ck-err').textContent = 'Adicione pelo menos um item.';
  const sub = sum(CK.items, i => i.qtd * i.preco), a = CK.apptId ? M.appts.get(CK.apptId) : null;
  const sale = { id: nextId(), date: a ? a.date : TODAY, time: a ? a.time : toTime(nowMin()), clientId: resolveClient(d.cliente, ''), barberId: +d.barberId, items: CK.items, desc: Math.min(num2(d.desc), sub), tip: num2(d.tip), pag: d.pag, apptId: CK.apptId || null };
  for (const i of CK.items) if (i.t === 'p') product(i.id).estoque = Math.max(0, product(i.id).estoque - i.qtd);
  DB.sales.push(sale); if (a) { a.status = 'concluido'; a.saleId = sale.id; }
  save(); closeModal(); toast('Pagamento registrado · ' + brl(calcSale(sale).total + sale.tip)); render();
};
ACT.sale = el => {
  const s = M.sales.get(+el.dataset.id); if (!s) return; const c = calcSale(s), cl = client(s.clientId), b = barber(s.barberId);
  openModal({
    title: 'Comprovante de venda', cls: 'receipt-modal', body: `<div class="receipt"><b style="font-size:15px">${esc(DB.cfg.nome)}</b><br>${esc(DB.cfg.endereco)}<br><br>
    Venda #${s.id} · ${fmtFull(s.date)} ${s.time}<br>Cliente: ${esc(cl?.nome || 'Cliente avulso')}<br>Barbeiro: ${esc(b.nome)}<hr style="border:0;border-top:1px dashed #aaa;margin:10px 0">
    ${s.items.map(i => `<div style="display:flex;justify-content:space-between"><span>${i.qtd}× ${esc(i.nome)}</span><span>${brl(i.qtd * i.preco)}</span></div>`).join('')}<hr style="border:0;border-top:1px dashed #aaa;margin:10px 0">
    ${s.desc ? `<div style="display:flex;justify-content:space-between"><span>Desconto</span><span>− ${brl(s.desc)}</span></div>` : ''}${s.tip ? `<div style="display:flex;justify-content:space-between"><span>Gorjeta</span><span>${brl(s.tip)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px"><span>TOTAL (${PAG[s.pag]})</span><span>${brl(c.total + (s.tip || 0))}</span></div></div>`,
    foot: `${SESSION.role !== 'barbeiro' ? `<button class="btn btn-danger btn-sm spacer" data-act="saleDel" data-id="${s.id}">Estornar venda</button>` : ''}<button class="btn btn-sm" data-act="printModal">${ic('print', 15)} Imprimir</button><button class="btn btn-sm btn-primary" data-act="closeModal">Fechar</button>`
  });
};
ACT.printModal = printModal;
ACT.saleDel = el => confirmBox('Estornar esta venda? Os produtos voltam ao estoque e o atendimento volta para a fila.', () => {
  const s = M.sales.get(+el.dataset.id);
  for (const i of s.items) if (i.t === 'p' && product(i.id)) product(i.id).estoque += i.qtd;
  const a = s.apptId && M.appts.get(s.apptId); if (a) { a.status = 'andamento'; a.saleId = null; }
  DB.sales = DB.sales.filter(x => x.id !== s.id); save(); toast('Venda estornada'); render();
}, 'Estornar', true);
