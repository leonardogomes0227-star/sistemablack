'use strict';
/* ================= CLIENTES ================= */
const CLI_FILTERS = [['todos', 'Todos'], ['aniversario', 'Aniversariantes (7 dias)'], ['sumido', 'Sumidos (+45 dias)'], ['novo', 'Novos'], ['fiel', 'Fiéis (12+ visitas)']];
function cliList() {
  const q = UI.cliQ.trim().toLowerCase(), qd = digits(UI.cliQ);
  let list = DB.clients.map(c => ({ c, s: cliStats(c) }));
  if (q) list = list.filter(x => x.c.nome.toLowerCase().includes(q) || (qd && digits(x.c.tel).includes(qd)));
  const f = UI.cliFilter;
  if (f === 'aniversario') list = list.filter(x => { if (!x.c.nasc) return false; for (let i = 0; i < 7; i++) if (addDays(TODAY, i).slice(5) === x.c.nasc.slice(5)) return true; return false; });
  else if (f === 'sumido') list = list.filter(x => x.s.tag === 'Sumido');
  else if (f === 'novo') list = list.filter(x => x.s.tag === 'Novo');
  else if (f === 'fiel') list = list.filter(x => x.s.n >= 12);
  const so = UI.cliSort;
  list.sort((a, b) => so === 'gasto' ? b.s.total - a.s.total : so === 'visitas' ? b.s.n - a.s.n : so === 'recente' ? (b.s.ultima || '').localeCompare(a.s.ultima || '') : a.c.nome.localeCompare(b.c.nome));
  return list;
}
function cliTable() {
  const list = cliList(), shown = list.slice(0, UI.cliLimit);
  if (!list.length) return empty('Nenhum cliente encontrado.');
  const tagCls = { Sumido: 'warn', Fiel: 'brass', Novo: 'info', Ativo: 'ok' };
  return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Cliente</th><th>Telefone</th><th>Última visita</th><th class="num">Visitas</th><th class="num">Total gasto</th><th>Situação</th></tr></thead><tbody>
  ${shown.map(({ c, s }) => `<tr data-act="cliOpen" data-id="${c.id}"><td><b>${esc(c.nome)}</b></td><td>${esc(c.tel)}</td><td>${s.ultima ? fmtFull(s.ultima) + ` <span class="muted">· ${s.dias}d</span>` : '—'}</td><td class="num">${s.n}</td><td class="num">${brl(s.total)}</td><td>${badge(s.tag, tagCls[s.tag])}${s.brindes ? ' ' + badge('Brinde', 'brass') : ''}</td></tr>`).join('')}</tbody></table></div>
  <div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center" class="muted"><span>Mostrando ${shown.length} de ${list.length}</span>${list.length > shown.length ? '<button class="btn btn-sm" data-act="cliMore">Mostrar mais</button>' : ''}</div>`;
}
VIEWS.clientes = () => `
  <div class="page-h"><div><h1>Clientes</h1><p>${DB.clients.length} cadastrados · histórico, preferências e contato</p></div>
    <div class="acts"><button class="btn" data-act="cliExport">${ic('download', 16)} Exportar CSV</button><button class="btn btn-primary" data-act="cliNew">${ic('plus', 16)} Novo cliente</button></div></div>
  <div class="toolbar"><div class="search">${ic('search', 16)}<input type="search" placeholder="Buscar por nome ou telefone" value="${esc(UI.cliQ)}" data-input="cliSearch" aria-label="Buscar cliente"></div>
    <select data-change="cliSort" style="width:auto" aria-label="Ordenar">${[['nome', 'Ordem alfabética'], ['recente', 'Visita mais recente'], ['gasto', 'Maior gasto'], ['visitas', 'Mais visitas']].map(([v, l]) => `<option value="${v}" ${UI.cliSort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  <div class="chips" style="margin-bottom:14px">${CLI_FILTERS.map(([k, l]) => `<button class="chip ${UI.cliFilter === k ? 'on' : ''}" data-act="cliFilter" data-f="${k}">${l}</button>`).join('')}</div>
  <div class="card" id="cli-table">${cliTable()}</div>`;
ACT.cliFilter = el => { UI.cliFilter = el.dataset.f; UI.cliLimit = 50; render(); };
ACT.cliMore = () => { UI.cliLimit += 50; $('#cli-table').innerHTML = cliTable(); };
CHG.cliSort = el => { UI.cliSort = el.value; $('#cli-table').innerHTML = cliTable(); };
ACT.cliSearch = el => { UI.cliQ = el.value; UI.cliLimit = 50; $('#cli-table').innerHTML = cliTable(); };
ACT.cliExport = () => download('clientes.csv', ['Nome;Telefone;Nascimento;Visitas;Total gasto;Última visita', ...cliList().map(({ c, s }) => [c.nome, c.tel, c.nasc, s.n, s.total.toFixed(2).replace('.', ','), s.ultima].map(csvCell).join(';'))].join('\n'));
ACT.cliNew = () => cliForm({});
function cliForm(c) {
  openModal({
    title: c.id ? 'Editar cliente' : 'Novo cliente', body: `<form id="f-cli" class="form-grid" onsubmit="return false">${fld('Nome completo', inp('nome', c.nome, 'text', 'required'), 'full')}${fld('Telefone / WhatsApp', inp('tel', c.tel, 'tel', 'placeholder="(11) 90000-0000"'))}${fld('Nascimento', inp('nasc', c.nasc, 'date'))}
    ${fld('Observações e preferências', `<textarea name="obs" rows="3" placeholder="Tipo de corte, máquina, alergias, assuntos…">${esc(c.obs || '')}</textarea>`, 'full')}</form>`,
    foot: `${c.id ? `<button class="btn btn-danger spacer" data-act="cliDel" data-id="${c.id}">Excluir</button>` : ''}<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="cliSave" data-id="${c.id || ''}">Salvar</button>`
  });
}
ACT.cliSave = el => {
  const d = formData($('#f-cli')); if (!d.nome.trim()) return toast('Informe o nome do cliente', 'bad'); const id = +el.dataset.id;
  if (id) Object.assign(client(id), { nome: d.nome.trim(), tel: d.tel, nasc: d.nasc, obs: d.obs }); else DB.clients.push({ id: nextId(), nome: d.nome.trim(), tel: d.tel, nasc: d.nasc, criado: TODAY, obs: d.obs });
  save(); closeModal(); toast('Cliente salvo'); render();
};
ACT.cliDel = el => confirmBox('Excluir este cliente? O histórico de vendas é mantido como cliente avulso.', () => { const id = +el.dataset.id; DB.clients = DB.clients.filter(c => c.id !== id); save(); toast('Cliente excluído'); render(); }, 'Excluir', true);
ACT.cliBrinde = el => { const c = client(+el.dataset.id); c.resgates = (c.resgates || 0) + 1; save(); closeModal(); toast('Brinde resgatado: dê um serviço sem custo e registre na venda com desconto'); render(); };
ACT.cliEdit = el => cliForm(client(+el.dataset.id));
ACT.cliAgenda = el => { closeModal(); checkout({ clientId: +el.dataset.id }); };
ACT.cliOpen = el => {
  const c = client(+el.dataset.id), s = cliStats(c), fut = [];
  const hist = s.sales.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 10);
  const bc = {}; s.sales.forEach(x => bc[x.barberId] = (bc[x.barberId] || 0) + 1); const fav = Object.entries(bc).sort((a, b) => b[1] - a[1])[0];
  const firstName = c.nome.split(' ')[0];
  const isAniv = c.nasc && addDays(TODAY, 0).slice(5) === c.nasc.slice(5);
  const msgA = fillMsg(s.tag === 'Sumido' ? DB.cfg.msgSumido : DB.cfg.msgAniv, { nome: firstName, barbearia: DB.cfg.nome });
  openModal({
    title: esc(c.nome), wide: true, body: `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${badge(s.tag, { Sumido: 'warn', Fiel: 'brass', Novo: 'info', Ativo: 'ok' }[s.tag])}<span class="muted">${esc(c.tel || 'sem telefone')}</span>${c.nasc ? `<span class="muted">· ${ic('cake', 14)} ${fmtDate(c.nasc)}</span>` : ''}${isAniv ? badge('Aniversário hoje', 'brass') : ''}</div>
    <div class="stat-row"><div><small>Visitas</small><b>${s.n}</b></div><div><small>Total gasto</small><b>${brl0(s.total)}</b></div><div><small>Ticket médio</small><b>${brl0(s.ticket)}</b></div><div><small>Barbeiro preferido</small><b>${fav ? esc(barber(+fav[0]).nome.split(' ')[0]) : '—'}</b></div></div>
    <div class="note" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div style="flex:1;min-width:200px"><b>Cartão fidelidade</b> · ${s.ciclo}/10 atendimentos<div class="progress" style="margin-top:6px"><div style="width:${s.ciclo * 10}%"></div></div></div>${s.brindes ? `<button class="btn btn-sm btn-brass" data-act="cliBrinde" data-id="${c.id}">Resgatar brinde (${s.brindes})</button>` : '<span class="muted">Brinde a cada 10 atendimentos</span>'}</div>
    ${c.obs ? `<div class="note"><b>Preferências:</b> ${esc(c.obs)}</div>` : ''}
    ${fut.length ? `<div><b>Próximos horários</b>${fut.slice(0, 3).map(a => `<div class="list-row" style="padding-left:0;padding-right:0"><span class="time-pill">${fmtDate(a.date)}</span><div class="grow">${a.time} · ${esc(apptSvcNames(a))}<small>${esc(barber(a.barberId).nome)}</small></div>${badge(STATUS[a.status].l)}</div>`).join('')}</div>` : ''}
    <div><b>Histórico de atendimentos</b>${hist.length ? `<div class="tbl-wrap"><table class="t"><tbody>${hist.map(h => `<tr><td>${fmtFull(h.date)}</td><td>${esc(h.items.map(i => i.nome).join(', '))}</td><td>${esc(barber(h.barberId).nome.split(' ')[0])}</td><td class="num">${brl(calcSale(h).total)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted" style="margin-top:6px">Nenhuma visita registrada.</p>'}</div>`,
    foot: `<button class="btn btn-sm spacer" data-act="cliEdit" data-id="${c.id}">${ic('edit', 15)} Editar</button>${c.tel ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${wa(c.tel, msgA)}">${ic('chat', 15)} WhatsApp</a>` : ''}<button class="btn btn-primary btn-sm" data-act="cliAgenda" data-id="${c.id}">Lançar atendimento</button>`
  });
};

/* ================= EQUIPE ================= */
VIEWS.barbeiros = () => {
  const m = ym(TODAY), pm = addMonths(m, -1);
  return `<div class="page-h"><div><h1>Equipe</h1><p>Barbeiros, regras de comissão e metas</p></div><div class="acts"><button class="btn btn-primary" data-act="barNew">${ic('plus', 16)} Novo barbeiro</button></div></div>
  <div class="grid g2">${DB.barbers.map(b => {
    const st = stmt(b.id, m), pst = stmt(b.id, pm), modelo = b.aluguel ? `Aluguel de cadeira · ${brl0(b.aluguel)}/mês` : `Comissão ${b.comServ}% serviços · ${b.comProd}% produtos`;
    return `<div class="card barber-card" style="${b.ativo ? '' : 'opacity:.55'}"><div class="barber-top">${avatar(b, 46)}<div style="flex:1"><h3>${esc(b.nome)} ${b.ativo ? '' : badge('Inativo')}</h3><small>${modelo}</small></div><button class="icon-btn" data-act="barEdit" data-id="${b.id}" aria-label="Editar">${ic('edit')}</button></div>
    <div class="mini-stats"><div><small>Atendimentos</small><b>${st.n}</b></div><div><small>Faturamento</small><b>${brl0(st.fat)}</b></div><div><small>Ticket médio</small><b>${brl0(st.n ? st.fat / st.n : 0)}</b></div><div><small>Comissão no mês</small><b>${brl0(st.com)}</b></div><div><small>Gorjetas</small><b>${brl0(st.tips)}</b></div><div><small>${delta(st.fat, pst.fat) ? 'Vs. mês anterior' : 'Mês anterior'}</small><b>${delta(st.fat, pst.fat) || '—'}</b></div></div>
    <div><div class="hbar-top"><span>Meta individual</span><b>${brl0(st.fat)} / ${brl0(b.meta)}</b></div><div class="progress"><div style="width:${Math.min(100, st.fat / b.meta * 100)}%"></div></div></div>
    <button class="btn btn-sm" data-act="barStmt" data-id="${b.id}">Ver extrato de comissão</button></div>`;
  }).join('')}</div>`;
};
ACT.barNew = () => barForm({ cor: ['#2f6f6a', '#8a5a2b', '#4b5d8a', '#8a3f4e', '#5b6b2f', '#6a4b8a'][DB.barbers.length % 6], comServ: 40, comProd: 10, aluguel: 0, meta: 8000, ativo: true });
ACT.barEdit = el => barForm(barber(+el.dataset.id));
ACT.barStmt = el => { UI.comBarber = +el.dataset.id; UI.comMonth = ym(TODAY); go('comissoes'); };
function barForm(b) {
  openModal({
    title: b.id ? 'Editar barbeiro' : 'Novo barbeiro', body: `<form id="f-bar" class="form-grid" onsubmit="return false">${fld('Nome', inp('nome', b.nome, 'text', 'required'))}${fld('Telefone', inp('tel', b.tel, 'tel'))}
    ${fld('Comissão sobre serviços (%)', inp('comServ', b.comServ, 'number', 'min="0" max="100" step="1"'))}${fld('Comissão sobre produtos (%)', inp('comProd', b.comProd, 'number', 'min="0" max="100" step="1"'))}
    ${fld('Aluguel de cadeira (R$/mês)', inp('aluguel', b.aluguel, 'number', 'min="0" step="10"'))}${fld('Meta mensal (R$)', inp('meta', b.meta, 'number', 'min="0" step="500"'))}
    ${fld('Cor na agenda', inp('cor', b.cor, 'color', 'style="padding:3px"'))}<label class="check" style="align-self:end;height:38px"><input type="checkbox" name="ativo" ${b.ativo ? 'checked' : ''}> Ativo na agenda</label>
    <div class="full note">Para barbeiro que paga <b>aluguel de cadeira</b>, use comissão de 100% sobre serviços e informe o valor do aluguel: ele fica com tudo e o aluguel é descontado no fechamento.</div></form>`,
    foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="barSave" data-id="${b.id || ''}">Salvar</button>`
  });
}
ACT.barSave = el => {
  const f = $('#f-bar'), d = formData(f); if (!d.nome.trim()) return toast('Informe o nome', 'bad'); const id = +el.dataset.id;
  const v = { nome: d.nome.trim(), tel: d.tel, comServ: num2(d.comServ), comProd: num2(d.comProd), aluguel: num2(d.aluguel), meta: num2(d.meta), cor: d.cor, ativo: f.ativo.checked };
  if (id) Object.assign(barber(id), v); else DB.barbers.push({ id: nextId(), ...v });
  save(); closeModal(); toast('Barbeiro salvo'); render();
};

/* ================= COMISSÕES ================= */
VIEWS.comissoes = () => {
  const m = UI.comMonth; if (SESSION.role === 'barbeiro') UI.comBarber = SESSION.me;
  const head = `<div class="page-h"><div><h1>Comissões e repasses</h1><p>Fechamento mensal por barbeiro, vales e gorjetas</p></div><div class="acts">${monthNav('comMonth', m)}</div></div>`;
  if (UI.comBarber) return head + comDetail(UI.comBarber, m);
  const sts = DB.barbers.map(b => stmt(b.id, m)).filter(s => s.n || s.b.ativo);
  const tot = k => sum(sts, s => s[k]);
  return head + `<div class="grid g4 keep2"><div class="card kpi"><small>Faturamento da equipe</small><b>${brl0(tot('fat'))}</b></div><div class="card kpi"><small>Comissões</small><b>${brl0(tot('com'))}</b></div><div class="card kpi"><small>Gorjetas</small><b>${brl0(tot('tips'))}</b></div><div class="card kpi"><small>Total a pagar à equipe</small><b>${brl0(sum(sts, s => s.paid ? 0 : Math.max(0, s.net)))}</b><div class="sub">${sts.filter(s => s.paid).length} de ${sts.length} já pagos</div></div></div>
  <div class="card mt"><div class="tbl-wrap"><table class="t"><thead><tr><th>Barbeiro</th><th>Modelo</th><th class="num">Atend.</th><th class="num">Serviços</th><th class="num">Produtos</th><th class="num">Comissão</th><th class="num">Gorjetas</th><th class="num">Vales</th><th class="num">Aluguel</th><th class="num">A pagar</th><th>Status</th></tr></thead><tbody>
  ${sts.map(s => `<tr data-act="comOpen" data-id="${s.b.id}"><td><span class="who-cell">${avatar(s.b, 28)}<b>${esc(s.b.nome)}</b></span></td><td class="muted">${s.b.aluguel ? 'Aluguel' : s.b.comServ + '% / ' + s.b.comProd + '%'}</td><td class="num">${s.n}</td><td class="num">${brl(s.serv)}</td><td class="num">${brl(s.prod)}</td><td class="num">${brl(s.com)}</td><td class="num">${brl(s.tips)}</td><td class="num">${s.vales ? '− ' + brl(s.vales) : '—'}</td><td class="num">${s.aluguel ? '− ' + brl(s.aluguel) : '—'}</td><td class="num"><b>${brl(s.net)}</b></td><td>${s.paid ? badge('Pago ' + fmtDate(s.paid.date), 'ok') : badge(m < ym(TODAY) ? 'Em aberto' : 'Em andamento', m < ym(TODAY) ? 'warn' : 'info')}</td></tr>`).join('')}</tbody>
  <tfoot><tr><td colspan="5">Total</td><td class="num">${brl(tot('com'))}</td><td class="num">${brl(tot('tips'))}</td><td class="num">${brl(tot('vales'))}</td><td class="num">${brl(tot('aluguel'))}</td><td class="num">${brl(tot('net'))}</td><td></td></tr></tfoot></table></div></div>
  <p class="muted mt" style="font-size:13px">Comissão = % sobre o valor líquido de cada venda (já com desconto). Gorjeta é repassada integralmente ao barbeiro. Vales e aluguel de cadeira são descontados do total.</p>`;
};
ACT.comOpen = el => { UI.comBarber = +el.dataset.id; render(); };
ACT.comBack = () => { UI.comBarber = null; render(); };
function comDetail(bid, m) {
  const s = stmt(bid, m), b = s.b;
  return `<div class="toolbar">${SESSION.role !== 'barbeiro' ? `<button class="btn btn-sm" data-act="comBack">${ic('left', 15)} Todos os barbeiros</button>` : ''}<span class="who-cell" style="margin-left:4px">${avatar(b, 30)}<b style="font-size:16px">${esc(b.nome)}</b></span>
    <div style="margin-left:auto;display:flex;gap:8px">${isDono() ? `<button class="btn btn-sm" data-act="valeNew" data-id="${bid}">${ic('plus', 15)} Lançar vale</button>` : ''}<button class="btn btn-sm" data-act="comRecibo" data-id="${bid}">${ic('print', 15)} Recibo</button>
    ${isDono() ? (s.paid ? `<button class="btn btn-sm" data-act="comUnpay" data-id="${bid}">Desfazer pagamento</button>` : `<button class="btn btn-sm btn-brass" data-act="comPay" data-id="${bid}">Marcar como pago</button>`) : ''}</div></div>
  <div class="grid g-main"><div class="card"><div class="card-h"><h3>Atendimentos de ${mLabel(m)}</h3><span class="muted">${s.n} venda(s)</span></div>${s.rows.length ? `<div class="tbl-wrap" style="max-height:520px;overflow:auto"><table class="t"><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th class="num">Valor</th><th class="num">Comissão</th></tr></thead><tbody>
    ${s.rows.map(r => `<tr><td>${fmtDate(r.s.date)} ${r.s.time}</td><td>${esc(client(r.s.clientId)?.nome || 'Avulso')}</td><td class="muted">${esc(r.s.items.map(i => i.nome).join(', '))}</td><td class="num">${brl(r.c.total)}</td><td class="num"><b>${brl(r.com)}</b></td></tr>`).join('')}</tbody></table></div>` : empty('Sem atendimentos neste mês.')}</div>
  <div class="grid" style="align-content:start"><div class="card"><div class="card-h"><h3>Resumo do fechamento</h3>${s.paid ? badge('Pago', 'ok') : ''}</div><div class="card-b"><dl class="kv">
    <dt>Serviços</dt><dd>${brl(s.serv)}</dd><dt>Produtos</dt><dd>${brl(s.prod)}</dd>
    <dt>Comissão serviços (${b.comServ}%)</dt><dd>${brl(s.serv * b.comServ / 100)}</dd><dt>Comissão produtos (${b.comProd}%)</dt><dd>${brl(s.prod * b.comProd / 100)}</dd>
    <dt>Gorjetas</dt><dd>+ ${brl(s.tips)}</dd>${s.vales ? `<dt>Vales e adiantamentos</dt><dd>− ${brl(s.vales)}</dd>` : ''}${s.aluguel ? `<dt>Aluguel de cadeira</dt><dd>− ${brl(s.aluguel)}</dd>` : ''}
    <dt class="tot">${s.net < 0 ? 'Barbeiro deve à casa' : 'Total a pagar'}</dt><dd class="tot">${brl(Math.abs(s.net))}</dd></dl>${s.paid ? `<p class="muted" style="margin-top:10px;font-size:13px">Pago em ${fmtFull(s.paid.date)}</p>` : ''}</div></div>
  ${s.valesList.length ? `<div class="card"><div class="card-h"><h3>Vales do mês</h3></div>${s.valesList.map(v => `<div class="list-row"><div class="grow"><b>${esc(v.desc || 'Vale')}</b><small>${fmtFull(v.date)}</small></div><b>${brl(v.valor)}</b>${isDono() ? `<button class="icon-btn" data-act="valeDel" data-id="${v.id}" aria-label="Remover vale">${ic('trash', 16)}</button>` : ''}</div>`).join('')}</div>` : ''}</div></div>`;
}
ACT.comPay = el => { const bid = +el.dataset.id, s = stmt(bid, UI.comMonth); confirmBox(`Registrar o pagamento de <b>${brl(s.net)}</b> para ${esc(s.b.nome)} referente a ${mLabel(UI.comMonth)}?`, () => { DB.payouts[bid + '_' + UI.comMonth] = { date: TODAY, valor: s.net }; save(); toast('Pagamento registrado'); render(); }); };
ACT.comUnpay = el => { delete DB.payouts[el.dataset.id + '_' + UI.comMonth]; save(); toast('Pagamento desfeito'); render(); };
ACT.valeNew = el => openModal({
  title: 'Lançar vale / adiantamento', body: `<form id="f-vale" class="form-grid" onsubmit="return false">${fld('Valor (R$)', inp('valor', '', 'number', 'min="1" step="1" required'))}${fld('Data', inp('date', TODAY, 'date'))}${fld('Descrição', inp('desc', 'Adiantamento'), 'full')}</form>`,
  foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="valeSave" data-id="${el.dataset.id}">Lançar</button>`
});
ACT.valeSave = el => { const d = formData($('#f-vale')); if (!num2(d.valor)) return toast('Informe o valor', 'bad'); DB.vales.push({ id: nextId(), barberId: +el.dataset.id, date: d.date, valor: num2(d.valor), desc: d.desc }); UI.comMonth = ym(d.date); save(); closeModal(); toast('Vale lançado'); render(); };
ACT.valeDel = el => { DB.vales = DB.vales.filter(v => v.id !== +el.dataset.id); save(); toast('Vale removido'); render(); };
ACT.comRecibo = el => {
  const bid = +el.dataset.id, m = UI.comMonth, s = stmt(bid, m), b = s.b;
  openModal({
    title: 'Recibo de comissão', body: `<div class="receipt"><b style="font-size:15px">${esc(DB.cfg.nome)}</b><br>Fechamento de ${mLabel(m)}<br><br>Profissional: <b>${esc(b.nome)}</b><br>Atendimentos: ${s.n}<hr style="border:0;border-top:1px dashed #aaa;margin:10px 0">
    ${[['Serviços realizados', s.serv], ['Produtos vendidos', s.prod], [`Comissão serviços (${b.comServ}%)`, s.serv * b.comServ / 100], [`Comissão produtos (${b.comProd}%)`, s.prod * b.comProd / 100], ['Gorjetas', s.tips], ['(−) Vales', -s.vales], ['(−) Aluguel de cadeira', -s.aluguel]].filter(r => r[1]).map(r => `<div style="display:flex;justify-content:space-between"><span>${r[0]}</span><span>${brl(r[1])}</span></div>`).join('')}
    <hr style="border:0;border-top:1px dashed #aaa;margin:10px 0"><div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px"><span>TOTAL</span><span>${brl(s.net)}</span></div><br><br>_______________________________<br>Assinatura do profissional</div>`,
    foot: `<button class="btn btn-sm" data-act="printModal">${ic('print', 15)} Imprimir</button><button class="btn btn-sm btn-primary" data-act="closeModal">Fechar</button>`
  });
};
