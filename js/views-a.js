'use strict';
const UI = { route: 'dashboard', agDate: TODAY, agBarbers: null, dashRange: 30, cxDate: TODAY, cliFilter: 'todos', cliQ: '', cliLimit: 50, cliSort: 'nome', catTab: 'servicos', finMonth: ym(TODAY), comMonth: ym(TODAY), comBarber: null, relRange: 'mes', finFilter: 'todas' };
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
  const ap = apptsOn(TODAY).filter(a => a.status !== 'cancelado');
  const feitos = ap.filter(a => a.status === 'concluido').length;
  const ms = monthStats(m);
  const openDays = d => { let n = 0; const [y, mo] = d.split('-').map(Number); const last = new Date(y, mo, 0).getDate(); for (let i = 1; i <= last; i++) if (DB.cfg.dias.includes(new Date(y, mo - 1, i).getDay())) n++; return n; };
  const elapsed = (() => { let n = 0; for (let i = 1; i <= day; i++) if (DB.cfg.dias.includes(new Date(+m.slice(0, 4), +m.slice(5) - 1, i).getDay())) n++; return n; })();
  const proj = elapsed ? mes / elapsed * openDays(m) : 0;
  const meta = DB.cfg.metaMes;

  const days = []; for (let i = UI.dashRange - 1; i >= 0; i--) { const d = addDays(TODAY, -i); const v = sum(salesOn(d), s => calcSale(s).total); days.push({ v, l: fmtDate(d), hl: d === TODAY, t: `${fmtDate(d)} · ${brl(v)}` }); }

  const prox = apptsOn(TODAY).filter(a => ['agendado', 'confirmado', 'andamento'].includes(a.status)).sort((a, b) => a.time.localeCompare(b.time)).slice(0, 7);
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
      <div class="hero-acts"><button class="btn btn-brass" data-act="newAppt">${ic('plus', 16)} Novo agendamento</button><button class="btn btn-ghost-d" data-act="newSale">${ic('receipt', 16)} Nova venda</button></div></div>
    <div class="hero-n"><small>Faturamento hoje</small><b>${brl(hoje)}</b><div class="kpi-line">${delta(hoje, semPas)}<span>vs. mesmo dia da semana passada</span></div></div>
  </section>
  <div class="grid g3 mt">
    <div class="card kpi"><small>Atendimentos hoje</small><b>${feitos} <span class="muted" style="font-size:18px;font-weight:500">/ ${ap.length}</span></b><div class="sub">${ap.length - feitos} restante(s) na agenda</div></div>
    <div class="card kpi"><small>Faturamento do mês</small><b>${brl0(mes)}</b><div class="kpi-line">${delta(mes, mesPas)}<span class="sub">vs. ${MESES[+pm.slice(5) - 1].toLowerCase()} até hoje</span></div></div>
    <div class="card kpi"><small>Ticket médio do mês</small><b>${brl(ms.ticket)}</b><div class="sub">${ms.n} atendimentos pagos</div></div>
  </div>
  <div class="grid g-main mt">
    <div class="card"><div class="card-h"><h3>Faturamento por dia</h3><div class="chips">${[15, 30, 60].map(n => `<button class="chip ${UI.dashRange === n ? 'on' : ''}" data-act="dashRange" data-n="${n}">${n} dias</button>`).join('')}</div></div>
      <div class="card-b">${bars(days, { every: Math.ceil(UI.dashRange / 6) })}</div></div>
    <div class="card"><div class="card-h"><h3>Próximos na agenda</h3><button class="btn btn-sm" data-act="go" data-r="agenda">Ver agenda</button></div>
      ${prox.length ? prox.map(a => { const b = barber(a.barberId), c = client(a.clientId); return `<div class="list-row" data-act="appt" data-id="${a.id}"><span class="time-pill">${a.time}</span><div class="grow"><b>${esc(c?.nome || 'Cliente avulso')}</b><small>${esc(apptSvcNames(a))}</small></div>${avatar(b, 26)}</div>`; }).join('') : empty('Nada mais agendado para hoje.')}</div>
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

/* ================= AGENDA ================= */
const HH = 22; // px por 15 min
VIEWS.agenda = () => {
  const open = toMin(DB.cfg.abre), close = toMin(DB.cfg.fecha), rows = (close - open) / 15, hh = HH * 4;
  const all = visibleBarbers();
  if (!UI.agBarbers) UI.agBarbers = new Set(all.map(b => b.id));
  const cols = all.filter(b => UI.agBarbers.has(b.id));
  const d = UI.agDate, openDay = DB.cfg.dias.includes(pd(d).getDay());
  const appts = apptsOn(d);
  const counts = { total: appts.filter(a => !['cancelado', 'faltou'].includes(a.status)).length };
  const nowTop = d === TODAY && NOW_MIN >= open && NOW_MIN <= close ? (NOW_MIN - open) / 15 * HH : null;
  return `
  <div class="page-h"><div><h1>Agenda</h1><p>${cap(fmtLong(d))} · ${counts.total} atendimento(s)${openDay ? '' : ' · <b>fechado</b>'}</p></div>
    <div class="acts"><button class="btn btn-primary" data-act="newAppt">${ic('plus', 16)} Novo agendamento</button></div></div>
  <div class="toolbar">
    <div class="datenav"><button class="icon-btn" data-act="agNav" data-n="-1" aria-label="Dia anterior">${ic('left')}</button><span class="datenav-l">${d === TODAY ? 'Hoje' : fmtDate(d, { weekday: 'short', day: '2-digit', month: 'short' })}</span><button class="icon-btn" data-act="agNav" data-n="1" aria-label="Próximo dia">${ic('right')}</button></div>
    <button class="btn" data-act="agToday">Hoje</button>
    <input type="date" value="${d}" data-change="agDate" style="width:auto" aria-label="Ir para a data">
    ${SESSION.role !== 'barbeiro' ? `<div class="chips" style="margin-left:auto">${all.map(b => `<button class="chip ${UI.agBarbers.has(b.id) ? 'on' : ''}" data-act="agBarber" data-id="${b.id}">${esc(b.nome.split(' ')[0])}</button>`).join('')}</div>` : ''}
  </div>
  <div class="card"><div class="ag-wrap"><div class="ag" style="grid-template-columns:56px repeat(${cols.length},minmax(190px,1fr));--hh:${hh}px">
    <div class="ag-corner"></div>
    ${cols.map(b => { const n = appts.filter(a => a.barberId === b.id && !['cancelado', 'faltou'].includes(a.status)); return `<div class="ag-head">${avatar(b, 30)}<div><b>${esc(b.nome)}</b><small>${n.length} atend. · ${brl0(sum(n, apptValue))}</small></div></div>`; }).join('')}
    <div class="ag-times" style="height:${rows * HH}px">${Array.from({ length: Math.floor(rows / 4) + 1 }, (_, i) => `<div class="ag-t" style="position:absolute;top:${Math.max(i * hh - 8, 3)}px;right:0;left:0">${toTime(open + i * 60)}</div>`).join('')}</div>
    ${cols.map(b => `<div class="ag-col ${openDay ? '' : 'off'}" data-act="slot" data-b="${b.id}" style="height:${rows * HH}px;--c:${b.cor}">
      ${appts.filter(a => a.barberId === b.id).map(a => { const top = (toMin(a.time) - open) / 15 * HH, h = Math.max(a.dur / 15 * HH - 2, 24), c = client(a.clientId);
    return `<div class="appt ${STATUS[a.status].c}" data-act="appt" data-id="${a.id}" style="top:${top}px;height:${h}px;--c:${b.cor}" title="${esc(STATUS[a.status].l)}"><b>${a.time} · ${esc(c?.nome || 'Cliente avulso')}</b><span>${esc(apptSvcNames(a))}</span></div>`; }).join('')}
      ${nowTop !== null ? `<div class="now-line" style="top:${nowTop}px"></div>` : ''}</div>`).join('')}
  </div></div></div>
  <div class="legend mt">${['agendado', 'confirmado', 'andamento', 'concluido', 'faltou'].map(k => `<span><i style="background:${{ agendado: '#fff', confirmado: '#fff', andamento: 'var(--brass-bg)', concluido: '#eef6f1', faltou: '#f3f1ed' }[k]}"></i>${STATUS[k].l}</span>`).join('')}<span>Ponto verde = cliente confirmou</span><span>Clique em um horário vazio para agendar</span></div>`;
};
ACT.agNav = el => { UI.agDate = addDays(UI.agDate, +el.dataset.n); render(); };
ACT.agToday = () => { UI.agDate = TODAY; render(); };
CHG.agDate = el => { if (el.value) { UI.agDate = el.value; render(); } };
ACT.agBarber = el => { const id = +el.dataset.id; UI.agBarbers.has(id) ? UI.agBarbers.delete(id) : UI.agBarbers.add(id); if (!UI.agBarbers.size) UI.agBarbers.add(id); render(); };
ACT.slot = (el, ev) => {
  const r = el.getBoundingClientRect(); const mins = toMin(DB.cfg.abre) + Math.floor((ev.clientY - r.top) / HH) * 15;
  apptForm({ barberId: +el.dataset.b, date: UI.agDate, time: toTime(Math.min(mins, toMin(DB.cfg.fecha) - 15)) });
};
ACT.newAppt = () => apptForm({ date: UI.route === 'agenda' ? UI.agDate : TODAY });

function apptForm(a = {}) {
  const edit = !!a.id; const bs = visibleBarbers();
  const times = []; for (let t = toMin(DB.cfg.abre); t < toMin(DB.cfg.fecha); t += 15) times.push([toTime(t), toTime(t)]);
  const cl = a.clientId ? client(a.clientId) : null, svcSel = new Set(a.svc || []);
  openModal({
    title: edit ? 'Editar agendamento' : 'Novo agendamento', wide: true,
    body: `<form id="f-appt" class="form-grid" onsubmit="return false">
      ${fld('Cliente', clientPicker('cliente', cl ? cl.nome + ' · ' + cl.tel : ''), 'full')}
      ${fld('Telefone (só para cliente novo)', inp('tel', '', 'tel', 'placeholder="(11) 90000-0000"'))}
      ${fld('Barbeiro', sel('barberId', bs.map(b => [b.id, b.nome]), a.barberId || bs[0].id))}
      ${fld('Data', inp('date', a.date, 'date', 'required'))}${fld('Horário', sel('time', times, a.time || '09:00'))}
      <div class="full"><span class="muted" style="font-size:13px;font-weight:500">Serviços</span><div class="svc-pick" style="margin-top:6px">${DB.services.filter(s => s.ativo || svcSel.has(s.id)).map(s => `<label class="svc-opt"><input type="checkbox" name="svc" value="${s.id}" data-change="apptCalc" ${svcSel.has(s.id) ? 'checked' : ''}><span class="grow">${esc(s.nome)}<small>${s.dur} min</small></span><b>${brl0(s.preco)}</b></label>`).join('')}</div></div>
      ${fld('Duração (min)', inp('dur', a.dur || 40, 'number', 'min="15" step="5" required'))}
      <div class="field"><span>Valor previsto</span><div id="ap-total" style="height:38px;display:flex;align-items:center;font-weight:600">${brl(0)}</div></div>
      ${fld('Observações', `<textarea name="obs" rows="2" placeholder="Ex.: prefere máquina 1, vai com o filho…">${esc(a.obs || '')}</textarea>`, 'full')}
      <div class="full" id="ap-err" style="color:var(--bad);font-weight:500"></div></form>`,
    foot: `${edit ? `<button class="btn btn-danger spacer" data-act="apptDel" data-id="${a.id}">Excluir</button>` : ''}<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="apptSave" data-id="${a.id || ''}">Salvar agendamento</button>`
  });
  CHG.apptCalc(); if (a.dur) $('#f-appt [name=dur]').value = a.dur;
}
CHG.apptCalc = () => {
  const f = $('#f-appt'); if (!f) return; const ids = $$('[name=svc]:checked', f).map(i => +i.value);
  $('#ap-total').textContent = brl(sum(ids, id => service(id).preco));
  if (ids.length) f.dur.value = sum(ids, id => service(id).dur);
};
ACT.apptSave = el => {
  const f = $('#f-appt'), d = formData(f), svc = $$('[name=svc]:checked', f).map(i => +i.value), err = $('#ap-err'), id = +el.dataset.id || null;
  if (!d.cliente.trim()) return err.textContent = 'Informe o cliente.';
  if (!svc.length) return err.textContent = 'Escolha pelo menos um serviço.';
  const bid = +d.barberId, st = toMin(d.time), dur = +d.dur;
  if (st + dur > toMin(DB.cfg.fecha)) return err.textContent = 'O atendimento passa do horário de fechamento.';
  const c = hasConflict(bid, d.date, st, dur, id); if (c) return err.textContent = `Conflito: ${barber(bid).nome.split(' ')[0]} já tem ${client(c.clientId)?.nome || 'um atendimento'} às ${c.time}.`;
  const cid = resolveClient(d.cliente, d.tel);
  if (id) Object.assign(M.appts.get(id), { clientId: cid, barberId: bid, svc, date: d.date, time: d.time, dur, obs: d.obs });
  else DB.appts.push({ id: nextId(), clientId: cid, barberId: bid, svc, date: d.date, time: d.time, dur, status: 'agendado', obs: d.obs, saleId: null });
  save(); closeModal(); toast(id ? 'Agendamento atualizado' : 'Horário agendado'); render();
};
ACT.apptDel = el => confirmBox('Excluir este agendamento?', () => { DB.appts = DB.appts.filter(a => a.id !== +el.dataset.id); save(); toast('Agendamento excluído'); render(); }, 'Excluir', true);

ACT.appt = el => {
  const a = M.appts.get(+el.dataset.id); if (!a) return; const c = client(a.clientId), b = barber(a.barberId), s = STATUS[a.status];
  const msg = fillMsg(DB.cfg.msgConfirma, { nome: (c?.nome || '').split(' ')[0], barbearia: DB.cfg.nome, data: fmtDate(a.date), hora: a.time, servico: apptSvcNames(a), barbeiro: b.nome.split(' ')[0] });
  const next = { agendado: [['confirmado', 'Confirmar presença', 'btn-brass']], confirmado: [['andamento', 'Iniciar atendimento', 'btn-brass']], andamento: [] }[a.status] || [];
  const canPay = ['agendado', 'confirmado', 'andamento'].includes(a.status);
  openModal({
    title: 'Agendamento', body: `
    <div class="who-cell" style="gap:12px"><div style="flex:1"><h3 style="font-size:18px">${esc(c?.nome || 'Cliente avulso')}</h3><span class="muted">${esc(c?.tel || 'sem telefone')}</span></div>${badge(s.l, { agendado: 'info', confirmado: 'ok', andamento: 'brass', concluido: 'ok', faltou: 'bad', cancelado: '' }[a.status])}</div>
    <dl class="kv"><dt>Data e horário</dt><dd style="text-transform:capitalize">${fmtDate(a.date, { weekday: 'short', day: '2-digit', month: 'short' })} · ${a.time} às ${toTime(toMin(a.time) + a.dur)}</dd>
    <dt>Barbeiro</dt><dd>${esc(b.nome)}</dd><dt>Serviços</dt><dd>${esc(apptSvcNames(a))}</dd><dt>Valor previsto</dt><dd>${brl(apptValue(a))}</dd>${a.obs ? `<dt>Observação</dt><dd>${esc(a.obs)}</dd>` : ''}${c?.obs ? `<dt>Ficha do cliente</dt><dd>${esc(c.obs)}</dd>` : ''}</dl>`,
    foot: `${canPay ? `<button class="btn btn-danger btn-sm" data-act="apptStatus" data-id="${a.id}" data-s="cancelado">Cancelar</button><button class="btn btn-sm spacer" data-act="apptStatus" data-id="${a.id}" data-s="faltou">Faltou</button>` : '<span class="spacer"></span>'}
    ${c?.tel ? `<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${wa(c.tel, msg)}">${ic('chat', 15)} WhatsApp</a>` : ''}
    ${a.status !== 'concluido' ? `<button class="btn btn-sm" data-act="apptEdit" data-id="${a.id}">${ic('edit', 15)} Editar</button>` : ''}
    ${next.map(n => `<button class="btn btn-sm ${n[2]}" data-act="apptStatus" data-id="${a.id}" data-s="${n[0]}">${n[1]}</button>`).join('')}
    ${canPay ? `<button class="btn btn-sm btn-primary" data-act="apptPay" data-id="${a.id}">Finalizar e cobrar</button>` : ''}
    ${a.status === 'concluido' && a.saleId ? `<button class="btn btn-sm" data-act="sale" data-id="${a.saleId}">Ver venda</button>` : ''}`
  });
};
ACT.apptEdit = el => apptForm(M.appts.get(+el.dataset.id));
ACT.apptStatus = el => { M.appts.get(+el.dataset.id).status = el.dataset.s; save(); closeModal(); toast('Status: ' + STATUS[el.dataset.s].l); render(); };
ACT.apptPay = el => checkout({ apptId: +el.dataset.id });

/* ================= CAIXA ================= */
VIEWS.caixa = () => {
  const d = UI.cxDate, sales = salesOn(d).slice().sort((a, b) => b.time.localeCompare(a.time));
  const cs = sales.map(calcSale), total = sum(cs, c => c.total), tips = sum(sales, s => s.tip || 0);
  const por = { pix: 0, credito: 0, debito: 0, dinheiro: 0 }; sales.forEach((s, i) => por[s.pag] += cs[i].total);
  const aCobrar = d === TODAY ? apptsOn(d).filter(a => ['agendado', 'confirmado', 'andamento'].includes(a.status) && toMin(a.time) <= NOW_MIN + 60).sort((a, b) => a.time.localeCompare(b.time)) : [];
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
  ${aCobrar.length ? `<div class="card mt no-print"><div class="card-h"><h3>Aguardando pagamento</h3><span class="muted">${aCobrar.length} atendimento(s)</span></div>${aCobrar.map(a => `<div class="list-row"><span class="time-pill">${a.time}</span><div class="grow"><b>${esc(client(a.clientId)?.nome || 'Cliente avulso')}</b><small>${esc(apptSvcNames(a))} · ${esc(barber(a.barberId).nome)}</small></div><b>${brl(apptValue(a))}</b><button class="btn btn-sm btn-primary" data-act="apptPay" data-id="${a.id}">Cobrar</button></div>`).join('')}</div>` : ''}
  <div class="card mt"><div class="card-h"><h3>Vendas do dia</h3></div>${sales.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Hora</th><th>Cliente</th><th>Itens</th><th>Barbeiro</th><th>Pagamento</th><th class="num">Total</th></tr></thead><tbody>
    ${sales.map((s, i) => `<tr data-act="sale" data-id="${s.id}"><td>${s.time}</td><td>${esc(client(s.clientId)?.nome || 'Cliente avulso')}</td><td class="muted">${esc(s.items.map(i => (i.qtd > 1 ? i.qtd + '× ' : '') + i.nome).join(', '))}</td><td>${esc(barber(s.barberId).nome.split(' ')[0])}</td><td>${badge(PAG[s.pag])}</td><td class="num"><b>${brl(cs[i].total)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="5">Total</td><td class="num">${brl(total)}</td></tr></tfoot></table></div>` : empty('Nenhuma venda neste dia.')}</div>`;
};
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
  const sale = { id: nextId(), date: a ? a.date : TODAY, time: a ? a.time : toTime(NOW_MIN), clientId: resolveClient(d.cliente, ''), barberId: +d.barberId, items: CK.items, desc: Math.min(num2(d.desc), sub), tip: num2(d.tip), pag: d.pag, apptId: CK.apptId || null };
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
ACT.saleDel = el => confirmBox('Estornar esta venda? Os produtos voltam ao estoque e o atendimento volta para a agenda.', () => {
  const s = M.sales.get(+el.dataset.id);
  for (const i of s.items) if (i.t === 'p' && product(i.id)) product(i.id).estoque += i.qtd;
  const a = s.apptId && M.appts.get(s.apptId); if (a) { a.status = 'confirmado'; a.saleId = null; }
  DB.sales = DB.sales.filter(x => x.id !== s.id); save(); toast('Venda estornada'); render();
}, 'Estornar', true);
