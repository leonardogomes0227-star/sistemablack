'use strict';
const UI = { route: 'dashboard', dashRange: 30, cxDate: TODAY, cliFilter: 'todos', cliQ: '', cliLimit: 50, cliSort: 'nome', catTab: 'servicos', finMonth: ym(TODAY), comMonth: ym(TODAY), comBarber: null, relRange: 'mes', finFilter: 'todas' };
const ACT = {}; const CHG = {}; const VIEWS = {};
let SESSION = null;
const isDono = () => SESSION.role === 'dono';
const visibleBarbers = () => DB.barbers.filter(b => b.ativo && (SESSION.role !== 'barbeiro' || b.id === SESSION.me));

/* ================= PAINEL ================= */
VIEWS.dashboard = () => {
  const m = ym(TODAY), pm = addMonths(m, -1), day = +TODAY.slice(8);
  const mtd = d => sum(DB.sales.filter(s => s.date >= d.slice(0, 7) + '-01' && s.date <= d), s => calcSale(s).total);
  const hoje = sum(salesOn(TODAY), s => calcSale(s).total), semPas = sum(salesOn(addDays(TODAY, -7)), s => calcSale(s).total);
  const mes = mtd(TODAY), mesPas = mtd(`${pm}-${pad(Math.min(day, 28))}`);
  const ap = apptsOn(TODAY).filter(a => a.status !== 'desistiu');
  const waitN = ap.filter(a => a.status === 'aguardando').length, liveN = ap.filter(a => a.status === 'andamento').length;
  const feitos = ap.filter(a => a.status === 'concluido').length;
  const ms = monthStats(m);
  const openDays = d => { let n = 0; const [y, mo] = d.split('-').map(Number); const last = new Date(y, mo, 0).getDate(); for (let i = 1; i <= last; i++) if (DB.cfg.dias.includes(new Date(y, mo - 1, i).getDay())) n++; return n; };
  const elapsed = (() => { let n = 0; for (let i = 1; i <= day; i++) if (DB.cfg.dias.includes(new Date(+m.slice(0, 4), +m.slice(5) - 1, i).getDay())) n++; return n; })();
  const proj = elapsed ? mes / elapsed * openDays(m) : 0;
  const meta = DB.cfg.metaMes;

  const days = []; for (let i = UI.dashRange - 1; i >= 0; i--) { const d = addDays(TODAY, -i); const v = sum(salesOn(d), s => calcSale(s).total); days.push({ v, l: fmtDate(d), hl: d === TODAY, t: `${fmtDate(d)} · ${brl(v)}` }); }

  const rank = DB.barbers.filter(b => b.ativo).map(b => ({ b, st: stmt(b.id, m) })).sort((a, b) => b.st.fat - a.st.fat);
  const maxFat = Math.max(...rank.map(r => r.st.fat), 1);

  const baixo = DB.products.filter(p => p.ativo && p.estoque <= p.min);
  const venc = DB.expenses.filter(e => !e.pago && e.date >= TODAY && e.date <= addDays(TODAY, 7));
  const atraso = DB.expenses.filter(e => !e.pago && e.date < TODAY);
  const anivs = DB.clients.filter(c => { if (!c.nasc) return false; const md = c.nasc.slice(5); for (let i = 0; i < 7; i++) if (addDays(TODAY, i).slice(5) === md) return true; return false; });
  const sumidos = DB.clients.filter(c => cliStats(c).tag === 'Sumido').length;
  const comPend = sum(DB.barbers.filter(b => !DB.payouts[b.id + '_' + pm]), b => Math.max(0, stmt(b.id, pm).net));
  const alerts = [];
  if (atraso.length) alerts.push(['bad', 'alert', `${atraso.length} conta(s) em atraso`, brl(sum(atraso, e => e.valor)) + ' · ' + atraso.map(e => e.descricao).join(', '), 'financeiro']);
  if (venc.length) alerts.push(['warn', 'clock', `${venc.length} conta(s) vencem em 7 dias`, brl(sum(venc, e => e.valor)), 'financeiro']);
  if (baixo.length) alerts.push(['warn', 'box', `${baixo.length} produto(s) com estoque baixo`, baixo.map(p => `${p.nome} (${p.estoque})`).join(', '), 'catalogo']);
  if (comPend > 0) alerts.push(['brass', 'percent', 'Comissões de ' + mLabel(pm) + ' em aberto', brl(comPend) + ' a pagar à equipe', 'comissoes']);
  if (anivs.length) alerts.push(['info', 'cake', `${anivs.length} aniversariante(s) nos próximos 7 dias`, anivs.slice(0, 3).map(c => c.nome.split(' ')[0]).join(', ') + (anivs.length > 3 ? '…' : ''), 'clientes:aniversario']);
  if (sumidos) alerts.push(['info', 'users', `${sumidos} clientes sem voltar há mais de 45 dias`, 'Envie uma mensagem para trazê-los de volta', 'clientes:sumido']);

  const hr = new Date().getHours(); const saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  return `
  <section class="hero"><span class="pole" aria-hidden="true"></span>
    <div><span class="hero-eyebrow">${cap(fmtLong(TODAY))}</span><h1>${saud}</h1>
      <div class="hero-acts"><button class="btn btn-brass" data-act="newQueue">${ic('plus', 16)} Colocar na fila</button><button class="btn btn-ghost-d" data-act="newSale">${ic('receipt', 16)} Nova venda</button></div></div>
    <div class="hero-n"><small>Faturamento hoje</small><b>${brl(hoje)}</b><div class="kpi-line">${delta(hoje, semPas)}<span>vs. mesmo dia da semana passada</span></div></div>
  </section>
  <div class="grid g3 mt">
    <div class="card kpi"><small>Atendimentos hoje</small><b>${feitos}</b><div class="sub">${waitN} na fila · ${liveN} em atendimento</div></div></div>
    <div class="card kpi"><small>Faturamento do mês</small><b>${brl0(mes)}</b><div class="kpi-line">${delta(mes, mesPas)}<span class="sub">vs. ${MESES[+pm.slice(5) - 1].toLowerCase()} até hoje</span></div></div>
    <div class="card kpi"><small>Ticket médio do mês</small><b>${brl(ms.ticket)}</b><div class="sub">${ms.n} atendimentos pagos</div></div>
  </div>
  <div class="grid g-main mt">
    <div class="card"><div class="card-h"><h3>Faturamento por dia</h3><div class="chips">${[15, 30, 60].map(n => `<button class="chip ${UI.dashRange === n ? 'on' : ''}" data-act="dashRange" data-n="${n}">${n} dias</button>`).join('')}</div></div>
      <div class="card-b">${bars(days, { every: Math.ceil(UI.dashRange / 6) })}</div></div>
    <div class="card"><div class="card-h"><h3>Fila agora</h3><button class="btn btn-sm" data-act="go" data-r="fila">Abrir fila</button></div>
      ${(() => { const l = apptsOn(TODAY).filter(a => ['aguardando', 'andamento'].includes(a.status)).sort((a, b) => (a.status === b.status ? a.time.localeCompare(b.time) : a.status === 'andamento' ? -1 : 1)).slice(0, 7); return l.length ? l.map(a => { const b = a.barberId ? barber(a.barberId) : null, c = client(a.clientId); return `<div class="list-row" data-act="qItem" data-id="${a.id}"><span class="time-pill">${a.time}</span><div class="grow"><b>${esc(c?.nome || 'Cliente avulso')}</b><small>${esc(apptSvcNames(a))}</small></div>${a.status === 'andamento' ? badge('Atendendo', 'brass') : badge('Aguardando', 'info')}${b ? avatar(b, 26) : ''}</div>`; }).join('') : empty('Ninguém na fila agora.'); })()}</div>
  </div>
  <div class="grid g2 mt">
    <div class="card"><div class="card-h"><h3>Desempenho da equipe · ${mLabel(m)}</h3></div><div class="card-b">
      <div style="margin-bottom:18px"><div class="hbar-top"><span>Meta da barbearia</span><b>${brl0(ms.bruta)} de ${brl0(meta)}</b></div><div class="progress"><div style="width:${Math.min(100, ms.bruta / meta * 100)}%"></div></div>
      <div class="muted" style="font-size:12.5px;margin-top:6px">Projeção para o fim do mês: <b style="color:var(--ink)">${brl0(proj)}</b> (${(proj / meta * 100).toFixed(0)}% da meta)</div></div>
      ${rank.map(r => hbar(`<span class="who-cell">${avatar(r.b, 22)} ${esc(r.b.nome)}</span>`, r.st.fat, maxFat, `${brl0(r.st.fat)} <span class="muted" style="font-weight:400">· ${r.st.n} atend.</span>`, r.b.cor)).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Atenção</h3></div>
      ${alerts.length ? alerts.map(a => `<div class="list-row" data-act="goAlert" data-r="${a[4]}"><span class="alert-i ${a[0]}">${ic(a[1], 18)}</span><div class="grow"><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div>${ic('right', 16)}</div>`).join('') : empty('Tudo em dia.')}</div>
  </div>`;
};
ACT.dashRange = el => { UI.dashRange = +el.dataset.n; render(); };
ACT.goAlert = el => { const [r, f] = el.dataset.r.split(':'); if (f) { UI.cliFilter = f; UI.cliLimit = 50; } go(r); };

/* ================= FILA DE ATENDIMENTO ================= */
const queueToday = () => {
  const t = apptsOn(TODAY);
  return { wait: t.filter(a => a.status === 'aguardando').sort((a, b) => a.time.localeCompare(b.time)), live: t.filter(a => a.status === 'andamento'), done: t.filter(a => a.status === 'concluido').sort((a, b) => b.time.localeCompare(a.time)) };
};
const chairCard = (b, q) => {
  const a = q.live.find(x => x.barberId === b.id);
  if (!a) return `<div class="chair">${'<div class="who-cell">' + avatar(b, 38) + '<div><b>' + esc(b.nome) + '</b><br><span class="badge ok">Livre</span></div></div>'}<p class="muted" style="font-size:13px">Cadeira disponível.</p><button class="btn btn-sm btn-brass" data-act="callNext" data-id="${b.id}">Chamar próximo</button></div>`;
  const el = Math.max(0, nowMin() - toMin(a.time)), c = client(a.clientId);
  return `<div class="chair busy"><div class="who-cell">${avatar(b, 38)}<div><b>${esc(b.nome)}</b><br><span class="badge brass">Atendendo</span></div></div>
    <div><b>${esc(c?.nome || 'Cliente avulso')}</b><div class="muted" style="font-size:13px">${esc(apptSvcNames(a))}</div></div>
    <div><div class="hbar-top"><span class="muted">${el} min em atendimento</span><span class="muted">previsto ${a.dur} min</span></div><div class="progress"><div style="width:${Math.min(100, el / a.dur * 100)}%"></div></div></div>
    <button class="btn btn-sm btn-primary" data-act="apptPay" data-id="${a.id}">Finalizar e cobrar</button></div>`;
};
VIEWS.fila = () => {
  const q = queueToday(), all = visibleBarbers(), active = DB.barbers.filter(b => b.ativo);
  const free = active.filter(b => !q.live.some(a => a.barberId === b.id)).length;
  const esp = q.wait.length ? Math.ceil(sum(q.wait, a => a.dur) / Math.max(1, active.length)) : 0;
  return `
  <div class="page-h"><div><h1>Fila de atendimento</h1><p>Ordem de chegada, sem hora marcada · ${cap(fmtLong(TODAY))}</p></div>
    <div class="acts"><button class="btn btn-primary" data-act="newQueue">${ic('plus', 16)} Colocar na fila</button></div></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Na fila</small><b>${q.wait.length}</b><div class="sub">cliente(s) aguardando</div></div>
    <div class="card kpi"><small>Espera estimada</small><b>${esp} <span class="muted" style="font-size:18px;font-weight:500">min</span></b><div class="sub">para quem chegar agora</div></div>
    <div class="card kpi"><small>Cadeiras</small><b>${active.length - free} <span class="muted" style="font-size:18px;font-weight:500">/ ${active.length}</span></b><div class="sub">${free} livre(s)</div></div>
    <div class="card kpi"><small>Atendidos hoje</small><b>${q.done.length}</b><div class="sub">${brl0(sum(q.done, apptValue))} em serviços</div></div></div>
  <div class="grid g-main mt">
    <div class="card"><div class="card-h"><h3>Cadeiras</h3></div><div class="card-b"><div class="chairs">${all.map(b => chairCard(b, q)).join('')}</div></div></div>
    <div class="card"><div class="card-h"><h3>Fila de espera</h3><span class="muted">${q.wait.length} aguardando</span></div>
      ${q.wait.length ? q.wait.map((a, i) => { const b = a.barberId && barber(a.barberId), c = client(a.clientId); return `<div class="list-row" data-act="qItem" data-id="${a.id}"><span class="pos">${i + 1}</span><div class="grow"><b>${esc(c?.nome || 'Cliente avulso')}</b><small>${esc(apptSvcNames(a))} · ${b ? 'prefere ' + esc(b.nome.split(' ')[0]) : 'qualquer barbeiro'}</small></div><span class="muted nowrap">${Math.max(0, nowMin() - toMin(a.time))} min</span></div>`; }).join('') : empty('Ninguém aguardando. Clique em "Colocar na fila" quando um cliente chegar.')}</div>
  </div>
  <div class="card mt"><div class="card-h"><h3>Atendidos hoje</h3></div>${q.done.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Chegada</th><th>Cliente</th><th>Serviços</th><th>Barbeiro</th><th class="num">Valor</th></tr></thead><tbody>
    ${q.done.map(a => `<tr data-act="sale" data-id="${a.saleId}"><td>${a.time}</td><td>${esc(client(a.clientId)?.nome || 'Cliente avulso')}</td><td class="muted">${esc(apptSvcNames(a))}</td><td>${esc(barber(a.barberId).nome.split(' ')[0])}</td><td class="num"><b>${brl(apptValue(a))}</b></td></tr>`).join('')}</tbody></table></div>` : empty('Nenhum atendimento concluído ainda.')}</div>`;
};
ACT.newQueue = () => queueForm({});
function queueForm(a) {
  const edit = !!a.id, bs = DB.barbers.filter(b => b.ativo), cl = a.clientId ? client(a.clientId) : null, svcSel = new Set(a.svc || []);
  openModal({
    title: edit ? 'Editar item da fila' : 'Colocar na fila', wide: true,
    body: `<form id="f-q" class="form-grid" onsubmit="return false">
      ${fld('Cliente', clientPicker('cliente', cl ? cl.nome + ' · ' + cl.tel : ''), 'full')}
      ${fld('Telefone (só para cliente novo)', inp('tel', '', 'tel', 'placeholder="(11) 90000-0000"'))}
      ${fld('Barbeiro de preferência', sel('barberId', [['', 'Qualquer um'], ...bs.map(b => [b.id, b.nome])], a.barberId || ''))}
      <div class="full"><span class="muted" style="font-size:13px;font-weight:500">Serviços</span><div class="svc-pick" style="margin-top:6px">${DB.services.filter(s => s.ativo || svcSel.has(s.id)).map(s => `<label class="svc-opt"><input type="checkbox" name="svc" value="${s.id}" ${svcSel.has(s.id) ? 'checked' : ''}><span class="grow">${esc(s.nome)}<small>${s.dur} min</small></span><b>${brl0(s.preco)}</b></label>`).join('')}</div></div>
      ${fld('Observações', `<textarea name="obs" rows="2" placeholder="Ex.: vai com o filho, tem pressa…">${esc(a.obs || '')}</textarea>`, 'full')}
      <div class="full" id="q-err" style="color:var(--bad);font-weight:500"></div></form>`,
    foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="queueSave" data-id="${a.id || ''}">${edit ? 'Salvar' : 'Entrar na fila'}</button>`
  });
}
ACT.queueSave = el => {
  const f = $('#f-q'), d = formData(f), svc = $$('[name=svc]:checked', f).map(i => +i.value), id = +el.dataset.id || null;
  if (!d.cliente.trim()) return $('#q-err').textContent = 'Informe o cliente.';
  if (!svc.length) return $('#q-err').textContent = 'Escolha pelo menos um serviço.';
  const v = { clientId: resolveClient(d.cliente, d.tel), barberId: d.barberId ? +d.barberId : null, svc, dur: sum(svc, sid => service(sid).dur), obs: d.obs };
  if (id) Object.assign(M.appts.get(id), v); else DB.appts.push({ id: nextId(), date: TODAY, time: toTime(nowMin()), status: 'aguardando', saleId: null, ...v });
  save(); closeModal(); toast(id ? 'Fila atualizada' : 'Cliente na fila'); render();
};
const callTo = (a, bid) => {
  if (apptsOn(TODAY).some(x => x.status === 'andamento' && x.barberId === bid)) return toast(barber(bid).nome.split(' ')[0] + ' está ocupado com outro cliente', 'bad');
  a.barberId = bid; a.status = 'andamento'; save(); closeModal(); toast(`${client(a.clientId)?.nome.split(' ')[0] || 'Cliente'} chamado para a cadeira de ${barber(bid).nome.split(' ')[0]}`); render();
};
ACT.callNext = el => {
  const bid = +el.dataset.id, q = queueToday(), a = q.wait.find(x => x.barberId === bid) || q.wait.find(x => !x.barberId) || q.wait[0];
  if (!a) return toast('Ninguém aguardando na fila', 'bad'); callTo(a, bid);
};
ACT.qItem = el => {
  const a = M.appts.get(+el.dataset.id); if (!a) return; const c = client(a.clientId), live = a.status === 'andamento';
  const busy = new Set(apptsOn(TODAY).filter(x => x.status === 'andamento').map(x => x.barberId));
  const msg = fillMsg(DB.cfg.msgVez, { nome: (c?.nome || '').split(' ')[0], barbearia: DB.cfg.nome, barbeiro: (a.barberId ? barber(a.barberId) : DB.barbers[0]).nome.split(' ')[0] });
  openModal({
    title: esc(c?.nome || 'Cliente avulso'), body: `<div class="who-cell" style="gap:10px">${badge(STATUS[a.status].l, live ? 'brass' : 'info')}<span class="muted">chegou às ${a.time} · ${c?.tel ? esc(c.tel) : 'sem telefone'}</span></div>
    <dl class="kv"><dt>Serviços</dt><dd>${esc(apptSvcNames(a))}</dd><dt>Valor previsto</dt><dd>${brl(apptValue(a))}</dd><dt>Duração prevista</dt><dd>${a.dur} min</dd>${a.barberId ? `<dt>Barbeiro</dt><dd>${esc(barber(a.barberId).nome)}</dd>` : ''}${a.obs ? `<dt>Observação</dt><dd>${esc(a.obs)}</dd>` : ''}${c?.obs ? `<dt>Ficha do cliente</dt><dd>${esc(c.obs)}</dd>` : ''}</dl>
    ${!live ? `<div class="form-grid">${fld('Chamar para a cadeira de', sel('qb', DB.barbers.filter(b => b.ativo).map(b => [b.id, b.nome + (busy.has(b.id) ? ' (ocupado)' : '')]), a.barberId || (DB.barbers.find(b => b.ativo && !busy.has(b.id)) || DB.barbers[0]).id, 'id="q-barber"'), 'full')}</div>` : ''}`,
    foot: `<button class="btn btn-danger btn-sm spacer" data-act="queueLeave" data-id="${a.id}">Desistiu</button>${c?.tel && !live ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${wa(c.tel, msg)}">${ic('chat', 15)} Avisar</a>` : ''}<button class="btn btn-sm" data-act="queueEdit" data-id="${a.id}">${ic('edit', 15)} Editar</button>
    ${live ? `<button class="btn btn-sm btn-primary" data-act="apptPay" data-id="${a.id}">Finalizar e cobrar</button>` : `<button class="btn btn-sm btn-brass" data-act="queueCall" data-id="${a.id}">Chamar para a cadeira</button>`}`
  });
};
ACT.queueCall = el => callTo(M.appts.get(+el.dataset.id), +$('#q-barber').value);
ACT.queueEdit = el => queueForm(M.appts.get(+el.dataset.id));
ACT.queueLeave = el => confirmBox('Tirar este cliente da fila (desistiu)?', () => { M.appts.get(+el.dataset.id).status = 'desistiu'; save(); toast('Cliente removido da fila'); render(); }, 'Tirar da fila', true);
ACT.apptPay = el => checkout({ apptId: +el.dataset.id });

/* ================= CAIXA ================= */
VIEWS.caixa = () => {
  const d = UI.cxDate, sales = salesOn(d).slice().sort((a, b) => b.time.localeCompare(a.time));
  const cs = sales.map(calcSale), total = sum(cs, c => c.total), tips = sum(sales, s => s.tip || 0);
  const por = { pix: 0, credito: 0, debito: 0, dinheiro: 0 }; sales.forEach((s, i) => por[s.pag] += cs[i].total);
  const aCobrar = d === TODAY ? apptsOn(d).filter(a => a.status === 'andamento').sort((a, b) => a.time.localeCompare(b.time)) : [];
  return `
  <div class="page-h"><div><h1>Caixa</h1><p>Vendas, recebimentos e fechamento do dia</p></div>
    <div class="acts"><button class="btn no-print" onclick="window.print()">${ic('print', 16)} Imprimir fechamento</button><button class="btn btn-primary no-print" data-act="newSale">${ic('plus', 16)} Nova venda</button></div></div>
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
function checkout({ apptId }) {
  const a = apptId ? M.appts.get(apptId) : null;
  CK = { apptId, items: a ? a.svc.map(id => { const s = service(id); return { t: 's', id, nome: s.nome, qtd: 1, preco: s.preco }; }) : [] };
  const bs = DB.barbers.filter(b => b.ativo), c = a && client(a.clientId);
  openModal({
    title: a ? 'Finalizar e cobrar' : 'Nova venda', wide: true,
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
