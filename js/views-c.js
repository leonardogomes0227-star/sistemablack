'use strict';
/* ================= SERVIÇOS E PRODUTOS ================= */
VIEWS.catalogo = () => {
  const m = ym(TODAY), mSales = DB.sales.filter(s => ym(s.date) === m);
  const tabs = [['servicos', 'Serviços'], ['produtos', 'Produtos e estoque']];
  const qtd = (t, id) => sum(mSales, s => sum(s.items.filter(i => i.t === t && i.id === id), i => i.qtd));
  let body;
  if (UI.catTab === 'servicos') body = `<div class="card"><div class="tbl-wrap"><table class="t"><thead><tr><th>Serviço</th><th>Categoria</th><th class="num">Duração</th><th class="num">Preço</th><th class="num">Vendas no mês</th><th>Status</th><th></th></tr></thead><tbody>
    ${DB.services.map(s => `<tr style="${s.ativo ? '' : 'opacity:.5'}"><td><b>${esc(s.nome)}</b></td><td class="muted">${esc(s.cat)}</td><td class="num">${s.dur} min</td><td class="num"><b>${brl(s.preco)}</b></td><td class="num">${qtd('s', s.id)}</td><td>${badge(s.ativo ? 'Ativo' : 'Inativo', s.ativo ? 'ok' : '')}</td><td class="num"><button class="btn btn-sm" data-act="svcEdit" data-id="${s.id}">Editar</button></td></tr>`).join('')}</tbody></table></div></div>`;
  else body = `<div class="card"><div class="tbl-wrap"><table class="t"><thead><tr><th>Produto</th><th class="num">Custo</th><th class="num">Preço</th><th class="num">Margem</th><th class="num">Estoque</th><th class="num">Vendidos no mês</th><th>Situação</th><th></th></tr></thead><tbody>
    ${DB.products.map(p => { const low = p.estoque <= p.min; return `<tr style="${p.ativo ? '' : 'opacity:.5'}"><td class="cell-2"><b>${esc(p.nome)}</b><small>${esc(p.cat)}</small></td><td class="num">${brl(p.custo)}</td><td class="num"><b>${brl(p.preco)}</b></td><td class="num">${((p.preco - p.custo) / p.preco * 100).toFixed(0)}%</td><td class="num"><b>${p.estoque}</b> <span class="muted">/ mín. ${p.min}</span></td><td class="num">${qtd('p', p.id)}</td><td>${badge(p.estoque === 0 ? 'Sem estoque' : low ? 'Repor' : 'Ok', p.estoque === 0 ? 'bad' : low ? 'warn' : 'ok')}</td><td class="num nowrap"><button class="btn btn-sm" data-act="stockIn" data-id="${p.id}">+ Entrada</button> <button class="btn btn-sm" data-act="prodEdit" data-id="${p.id}">Editar</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
  return `<div class="page-h"><div><h1>Serviços e produtos</h1><p>Preços, duração, estoque e margem</p></div><div class="acts"><button class="btn btn-primary" data-act="${UI.catTab === 'servicos' ? 'svcNew' : 'prodNew'}">${ic('plus', 16)} ${UI.catTab === 'servicos' ? 'Novo serviço' : 'Novo produto'}</button></div></div>
  <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${UI.catTab === k ? 'on' : ''}" data-act="catTab" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
};
ACT.catTab = el => { UI.catTab = el.dataset.k; render(); };
ACT.svcNew = () => svcForm({ nome: '', cat: 'Cabelo', preco: 50, dur: 30, ativo: true });
ACT.svcEdit = el => svcForm(service(+el.dataset.id));
function svcForm(s) {
  openModal({
    title: s.id ? 'Editar serviço' : 'Novo serviço', body: `<form id="f-svc" class="form-grid" onsubmit="return false">${fld('Nome', inp('nome', s.nome, 'text', 'required'), 'full')}${fld('Categoria', inp('cat', s.cat))}${fld('Preço (R$)', inp('preco', s.preco, 'number', 'min="0" step="0.5"'))}${fld('Duração (min)', inp('dur', s.dur, 'number', 'min="5" step="5"'))}<label class="check" style="align-self:end;height:38px"><input type="checkbox" name="ativo" ${s.ativo ? 'checked' : ''}> Ativo (aparece na agenda)</label></form>`,
    foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="svcSave" data-id="${s.id || ''}">Salvar</button>`
  });
}
ACT.svcSave = el => { const f = $('#f-svc'), d = formData(f); if (!d.nome.trim()) return toast('Informe o nome', 'bad'); const id = +el.dataset.id; const v = { nome: d.nome.trim(), cat: d.cat, preco: num2(d.preco), dur: num2(d.dur), ativo: f.ativo.checked }; if (id) Object.assign(service(id), v); else DB.services.push({ id: nextId(), ...v }); save(); closeModal(); toast('Serviço salvo'); render(); };
ACT.prodNew = () => prodForm({ nome: '', cat: 'Finalizadores', custo: 0, preco: 0, estoque: 0, min: 3, ativo: true });
ACT.prodEdit = el => prodForm(product(+el.dataset.id));
function prodForm(p) {
  openModal({
    title: p.id ? 'Editar produto' : 'Novo produto', body: `<form id="f-prod" class="form-grid" onsubmit="return false">${fld('Nome', inp('nome', p.nome, 'text', 'required'), 'full')}${fld('Categoria', inp('cat', p.cat))}${fld('Estoque atual', inp('estoque', p.estoque, 'number', 'min="0"'))}${fld('Custo (R$)', inp('custo', p.custo, 'number', 'min="0" step="0.1"'))}${fld('Preço de venda (R$)', inp('preco', p.preco, 'number', 'min="0" step="0.5"'))}${fld('Estoque mínimo (alerta)', inp('min', p.min, 'number', 'min="0"'))}<label class="check" style="align-self:end;height:38px"><input type="checkbox" name="ativo" ${p.ativo ? 'checked' : ''}> Ativo para venda</label></form>`,
    foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="prodSave" data-id="${p.id || ''}">Salvar</button>`
  });
}
ACT.prodSave = el => { const f = $('#f-prod'), d = formData(f); if (!d.nome.trim()) return toast('Informe o nome', 'bad'); const id = +el.dataset.id; const v = { nome: d.nome.trim(), cat: d.cat, custo: num2(d.custo), preco: num2(d.preco), estoque: num2(d.estoque), min: num2(d.min), ativo: f.ativo.checked }; if (id) Object.assign(product(id), v); else DB.products.push({ id: nextId(), ...v }); save(); closeModal(); toast('Produto salvo'); render(); };
ACT.stockIn = el => { const p = product(+el.dataset.id); openModal({ title: 'Entrada de estoque · ' + esc(p.nome), body: `<form id="f-stock" class="form-grid" onsubmit="return false">${fld('Quantidade recebida', inp('qtd', 12, 'number', 'min="1"'))}${fld('Valor total da compra (R$)', inp('total', (p.custo * 12).toFixed(2), 'number', 'min="0" step="0.01"'))}<label class="check full"><input type="checkbox" name="lanca" checked> Lançar a compra como despesa no financeiro</label></form>`, foot: `<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="stockSave" data-id="${p.id}">Registrar entrada</button>` }); };
ACT.stockSave = el => { const f = $('#f-stock'), d = formData(f), p = product(+el.dataset.id), q = num2(d.qtd), tot = num2(d.total); if (q < 1) return toast('Informe a quantidade', 'bad'); p.estoque += q; if (tot && q) p.custo = tot / q; if (f.lanca.checked && tot) DB.expenses.push({ id: nextId(), date: TODAY, descricao: `Compra: ${p.nome} (${q} un.)`, categoria: 'Estoque de revenda', valor: tot, pago: true }); save(); closeModal(); toast('Estoque atualizado'); render(); };

/* ================= FINANCEIRO ================= */
const EXP_CATS = ['Aluguel', 'Contas', 'Serviços', 'Marketing', 'Material de consumo', 'Estoque de revenda', 'Equipamentos', 'Impostos', 'Outros'];
VIEWS.financeiro = () => {
  const m = UI.finMonth, s = monthStats(m), pm = monthStats(addMonths(m, -1));
  const pmBruta = s.parcial ? sum(pm.sales.filter(x => +x.date.slice(8) <= +TODAY.slice(8)), x => calcSale(x).total) : pm.bruta;
  const base = s.bruta + s.aluguel;
  let exps = s.exps.slice().sort((a, b) => a.date.localeCompare(b.date));
  const stat = e => e.pago ? ['Pago', 'ok'] : e.date < TODAY ? ['Em atraso', 'bad'] : ['A pagar', 'warn'];
  if (UI.finFilter === 'pendentes') exps = exps.filter(e => !e.pago);
  const cats = {}; s.exps.forEach(e => cats[e.categoria] = (cats[e.categoria] || 0) + e.valor);
  const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const last = Array.from({ length: 6 }, (_, i) => addMonths(m, i - 5)).map(x => ({ x, s: monthStats(x) }));
  return `<div class="page-h"><div><h1>Financeiro</h1><p>${s.parcial ? "Mês em andamento: despesas contabilizadas até hoje e aluguel de cadeira proporcional" : "Receitas, despesas e lucro do mês"}</p></div><div class="acts">${monthNav('finMonth', m)}<button class="btn btn-primary" data-act="expNew">${ic('plus', 16)} Nova despesa</button></div></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Receita bruta</small><b>${brl0(s.bruta)}</b><div class="kpi-line">${delta(s.bruta, pmBruta)}<span class="sub">${s.parcial ? "vs. mês anterior até hoje" : "vs. mês anterior"}</span></div></div>
    <div class="card kpi"><small>Despesas fixas e variáveis</small><b>${brl0(s.despesas)}</b><div class="sub">${s.exps.filter(e => !e.pago).length} pendente(s)</div></div>
    <div class="card kpi"><small>Comissões da equipe</small><b>${brl0(s.comiss)}</b><div class="sub">${base ? (s.comiss / base * 100).toFixed(0) : 0}% da receita</div></div>
    <div class="card kpi" style="border-color:var(--brass)"><small>Lucro líquido estimado</small><b style="color:${s.lucro >= 0 ? 'var(--ok)' : 'var(--bad)'}">${brl0(s.lucro)}</b><div class="sub">Margem de ${s.margem.toFixed(0)}%</div></div></div>
  <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Resultado do mês</h3></div><div class="card-b"><dl class="kv">
    <dt>Serviços</dt><dd>${brl(s.serv)}</dd><dt>Produtos</dt><dd>${brl(s.prod)}</dd>${s.aluguel ? `<dt>Aluguel de cadeiras recebido</dt><dd>${brl(s.aluguel)}</dd>` : ''}<dt><b>Receita total</b></dt><dd><b>${brl(base)}</b></dd>
    <dt>(−) Comissões da equipe</dt><dd>${brl(s.comiss)}</dd><dt>(−) Taxas de cartão</dt><dd>${brl(s.taxas)}</dd><dt>(−) Despesas</dt><dd>${brl(s.despesas)}</dd>
    <dt class="tot">Lucro líquido</dt><dd class="tot" style="color:${s.lucro >= 0 ? 'var(--ok)' : 'var(--bad)'}">${brl(s.lucro)}</dd></dl></div></div>
    <div class="card"><div class="card-h"><h3>Receita e lucro · últimos 6 meses</h3></div><div class="card-b">${bars(last.map(l => ({ v: Math.max(l.s.lucro, 0), l: MESES[+l.x.slice(5) - 1].slice(0, 3), hl: l.x === m, t: `${mLabel(l.x)} · lucro ${brl(l.s.lucro)} · receita ${brl(l.s.bruta)}` })), { h: 150, every: 1 })}
    <div class="muted" style="font-size:12.5px;margin-top:26px">Barras mostram o lucro líquido de cada mês. Passe o mouse para ver a receita.</div></div></div></div>
  <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Recebimentos por forma de pagamento</h3></div><div class="card-b">${Object.keys(PAG).map(k => hbar(PAG[k], s.porPag[k], s.bruta, `${brl0(s.porPag[k])} <span class="muted" style="font-weight:400">· ${s.bruta ? (s.porPag[k] / s.bruta * 100).toFixed(0) : 0}%</span>`)).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Despesas por categoria</h3></div><div class="card-b">${catList.length ? catList.map(([k, v]) => hbar(esc(k), v, catList[0][1], `${brl0(v)}`, 'var(--brass)')).join('') : empty('Sem despesas.')}</div></div></div>
  <div class="card mt"><div class="card-h"><h3>Contas e despesas</h3><div class="chips">${[['todas', 'Todas'], ['pendentes', 'Pendentes']].map(([k, l]) => `<button class="chip ${UI.finFilter === k ? 'on' : ''}" data-act="finFilter" data-k="${k}">${l}</button>`).join('')}</div></div>
  ${exps.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th class="num">Valor</th><th>Status</th><th></th></tr></thead><tbody>
  ${exps.map(e => { const st = stat(e); return `<tr><td>${fmtFull(e.date)}</td><td><b>${esc(e.descricao)}</b></td><td class="muted">${esc(e.categoria)}</td><td class="num">${brl(e.valor)}</td><td>${badge(st[0], st[1])}</td><td class="num nowrap">${e.pago ? '' : `<button class="btn btn-sm btn-brass" data-act="expPay" data-id="${e.id}">Pagar</button> `}<button class="btn btn-sm" data-act="expEdit" data-id="${e.id}">Editar</button></td></tr>`; }).join('')}</tbody>
  <tfoot><tr><td colspan="3">Total</td><td class="num">${brl(sum(exps, e => e.valor))}</td><td colspan="2"></td></tr></tfoot></table></div>` : empty('Nenhuma despesa neste filtro.')}</div>`;
};
ACT.finFilter = el => { UI.finFilter = el.dataset.k; render(); };
ACT.expPay = el => { M.expenses.get(+el.dataset.id).pago = true; save(); toast('Conta marcada como paga'); render(); };
ACT.expNew = () => expForm({ date: TODAY, categoria: 'Contas', pago: false });
ACT.expEdit = el => expForm(M.expenses.get(+el.dataset.id));
function expForm(e) {
  openModal({
    title: e.id ? 'Editar despesa' : 'Nova despesa', body: `<form id="f-exp" class="form-grid" onsubmit="return false">${fld('Descrição', inp('descricao', e.descricao, 'text', 'required'), 'full')}${fld('Categoria', sel('categoria', EXP_CATS.map(c => [c, c]), e.categoria))}${fld('Valor (R$)', inp('valor', e.valor, 'number', 'min="0" step="0.01" required'))}${fld('Vencimento', inp('date', e.date, 'date'))}
    <label class="check" style="align-self:end;height:38px"><input type="checkbox" name="pago" ${e.pago ? 'checked' : ''}> Já está paga</label>${e.id ? '' : '<label class="check full"><input type="checkbox" name="rep"> Repetir todo mês pelos próximos 12 meses</label>'}</form>`,
    foot: `${e.id ? `<button class="btn btn-danger spacer" data-act="expDel" data-id="${e.id}">Excluir</button>` : ''}<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="expSave" data-id="${e.id || ''}">Salvar</button>`
  });
}
ACT.expSave = el => {
  const f = $('#f-exp'), d = formData(f); if (!d.descricao.trim() || !num2(d.valor)) return toast('Preencha descrição e valor', 'bad'); const id = +el.dataset.id;
  const v = { descricao: d.descricao.trim(), categoria: d.categoria, valor: num2(d.valor), date: d.date, pago: f.pago.checked };
  if (id) Object.assign(M.expenses.get(id), v); else { DB.expenses.push({ id: nextId(), ...v }); if (f.rep?.checked) for (let i = 1; i <= 12; i++) { const dt = pd(d.date); dt.setMonth(dt.getMonth() + i); DB.expenses.push({ id: nextId(), ...v, date: iso(dt), pago: false }); } }
  save(); closeModal(); toast('Despesa salva'); render();
};
ACT.expDel = el => confirmBox('Excluir esta despesa?', () => { DB.expenses = DB.expenses.filter(x => x.id !== +el.dataset.id); save(); toast('Despesa excluída'); render(); }, 'Excluir', true);

/* ================= RELATÓRIOS ================= */
VIEWS.relatorios = () => {
  const r = UI.relRange, m = ym(TODAY);
  const [from, to, label] = r === 'mes' ? [m + '-01', TODAY, mLabel(m)] : r === 'ant' ? [addMonths(m, -1) + '-01', mEnd(addMonths(m, -1)), mLabel(addMonths(m, -1))] : [addDays(TODAY, -(+r - 1)), TODAY, `Últimos ${r} dias`];
  const sales = DB.sales.filter(s => s.date >= from && s.date <= to), appts = DB.appts.filter(a => a.date >= from && a.date <= to);
  const sv = {}, pr = {};
  sales.forEach(s => s.items.forEach(i => { const t = i.t === 's' ? sv : pr; (t[i.nome] = t[i.nome] || { q: 0, v: 0 }); t[i.nome].q += i.qtd; t[i.nome].v += i.qtd * i.preco; }));
  const top = o => Object.entries(o).sort((a, b) => b[1].v - a[1].v).slice(0, 6);
  const faltas = appts.filter(a => a.status === 'faltou').length, canc = appts.filter(a => a.status === 'cancelado').length, base = appts.filter(a => !['agendado', 'confirmado', 'andamento'].includes(a.status)).length;
  const firstSeen = c => (M.salesByClient.get(c) || []).reduce((mi, s) => s.date < mi ? s.date : mi, '9999');
  const cids = [...new Set(sales.map(s => s.clientId).filter(Boolean))];
  const novos = cids.filter(c => firstSeen(c) >= from).length;
  const total = sum(sales, s => calcSale(s).total);
  const hrs = []; for (let h = toMin(DB.cfg.abre) / 60; h < toMin(DB.cfg.fecha) / 60; h++) hrs.push(h);
  const dws = [1, 2, 3, 4, 5, 6]; const heat = {}; let hmax = 1;
  appts.filter(a => a.status === 'concluido').forEach(a => { const k = pd(a.date).getDay() + '_' + Math.floor(toMin(a.time) / 60); heat[k] = (heat[k] || 0) + 1; hmax = Math.max(hmax, heat[k]); });
  const sT = top(sv), pT = top(pr);
  return `<div class="page-h"><div><h1>Relatórios</h1><p>${label} · ${sales.length} vendas</p></div><div class="acts"><button class="btn" data-act="relExport">${ic('download', 16)} Exportar vendas (CSV)</button></div></div>
  <div class="chips" style="margin-bottom:16px">${[['mes', 'Este mês'], ['ant', 'Mês passado'], ['30', '30 dias'], ['90', '90 dias']].map(([k, l]) => `<button class="chip ${r === k ? 'on' : ''}" data-act="relRange" data-k="${k}">${l}</button>`).join('')}</div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Faturamento</small><b>${brl0(total)}</b></div><div class="card kpi"><small>Clientes atendidos</small><b>${cids.length}</b><div class="sub">${novos} novo(s) no período</div></div>
    <div class="card kpi"><small>Taxa de faltas</small><b>${base ? (faltas / base * 100).toFixed(1) : 0}%</b><div class="sub">${faltas} falta(s) · ${canc} cancelamento(s)</div></div><div class="card kpi"><small>Retorno de clientes</small><b>${cids.length ? ((cids.length - novos) / cids.length * 100).toFixed(0) : 0}%</b><div class="sub">já eram clientes antes</div></div></div>
  <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Serviços mais vendidos</h3></div><div class="card-b">${sT.length ? sT.map(([n, o]) => hbar(esc(n), o.v, sT[0][1].v, `${brl0(o.v)} <span class="muted" style="font-weight:400">· ${o.q}×</span>`)).join('') : empty('Sem dados')}</div></div>
    <div class="card"><div class="card-h"><h3>Produtos mais vendidos</h3></div><div class="card-b">${pT.length ? pT.map(([n, o]) => hbar(esc(n), o.v, pT[0][1].v, `${brl0(o.v)} <span class="muted" style="font-weight:400">· ${o.q} un.</span>`, 'var(--brass)')).join('') : empty('Sem dados')}</div></div></div>
  <div class="card mt"><div class="card-h"><h3>Horários de maior movimento</h3><span class="muted">Quanto mais escuro, mais atendimentos</span></div><div class="card-b" style="overflow-x:auto"><div class="heat" style="grid-template-columns:70px repeat(${hrs.length},minmax(38px,1fr));min-width:560px"><span></span>${hrs.map(h => `<span class="heat-h">${h}h</span>`).join('')}
    ${dws.map(d => `<span class="heat-r">${DIAS[d].slice(0, 3)}</span>${hrs.map(h => { const n = heat[d + '_' + h] || 0; return `<span class="heat-c" title="${n} atendimentos" style="opacity:${n ? .15 + .85 * n / hmax : .05}">${n || ''}</span>`; }).join('')}`).join('')}</div></div></div>
  <div class="card mt"><div class="card-h"><h3>Desempenho por barbeiro</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Barbeiro</th><th class="num">Atendimentos</th><th class="num">Faturamento</th><th class="num">Ticket médio</th><th class="num">Produtos vendidos</th></tr></thead><tbody>
  ${DB.barbers.map(b => { const bs = sales.filter(s => s.barberId === b.id), cs = bs.map(calcSale); return `<tr><td><span class="who-cell">${avatar(b, 26)}<b>${esc(b.nome)}</b></span></td><td class="num">${bs.length}</td><td class="num">${brl(sum(cs, c => c.total))}</td><td class="num">${brl(bs.length ? sum(cs, c => c.total) / bs.length : 0)}</td><td class="num">${brl(sum(cs, c => c.prod))}</td></tr>`; }).join('')}</tbody></table></div></div>`;
};
ACT.relRange = el => { UI.relRange = el.dataset.k; render(); };
ACT.relExport = () => {
  const m = ym(TODAY); const rows = DB.sales.filter(s => s.date >= addDays(TODAY, -90)).sort((a, b) => a.date.localeCompare(b.date));
  download('vendas.csv', ['Data;Hora;Cliente;Barbeiro;Itens;Pagamento;Desconto;Gorjeta;Total', ...rows.map(s => [s.date, s.time, client(s.clientId)?.nome || 'Avulso', barber(s.barberId).nome, s.items.map(i => i.qtd + 'x ' + i.nome).join(' + '), PAG[s.pag], s.desc, s.tip, calcSale(s).total.toFixed(2).replace('.', ',')].map(csvCell).join(';'))].join('\n'));
};

/* ================= CONFIGURAÇÕES ================= */
VIEWS.config = () => {
  const c = DB.cfg;
  return `<div class="page-h"><div><h1>Configurações</h1><p>Dados da barbearia, horários, taxas e mensagens</p></div></div>
  <form id="f-cfg" onsubmit="return false" class="grid g2" style="align-items:start">
  <div class="card"><div class="card-h"><h3>Dados da barbearia</h3></div><div class="card-b form-grid">${fld('Nome', inp('nome', c.nome), 'full')}${fld('Endereço', inp('endereco', c.endereco), 'full')}${fld('Telefone / WhatsApp', inp('tel', c.tel, 'tel'))}${fld('Meta de faturamento mensal (R$)', inp('metaMes', c.metaMes, 'number', 'min="0" step="500"'))}</div></div>
  <div class="card"><div class="card-h"><h3>Funcionamento</h3></div><div class="card-b form-grid">${fld('Abre às', inp('abre', c.abre, 'time'))}${fld('Fecha às', inp('fecha', c.fecha, 'time'))}
    <div class="full"><span class="muted" style="font-size:13px;font-weight:500">Dias de funcionamento</span><div class="chips" style="margin-top:6px">${DIAS.map((d, i) => `<label class="check"><input type="checkbox" name="dia" value="${i}" ${c.dias.includes(i) ? 'checked' : ''}> ${d.slice(0, 3)}</label>`).join('')}</div></div></div></div>
  <div class="card"><div class="card-h"><h3>Taxas da maquininha</h3></div><div class="card-b form-grid">${fld('Pix (%)', inp('taxaPix', c.taxaPix, 'number', 'min="0" step="0.1"'))}${fld('Débito (%)', inp('taxaDeb', c.taxaDeb, 'number', 'min="0" step="0.1"'))}${fld('Crédito (%)', inp('taxaCred', c.taxaCred, 'number', 'min="0" step="0.1"'))}<div class="full note">As taxas entram no cálculo do lucro líquido do financeiro.</div></div></div>
  <div class="card"><div class="card-h"><h3>Mensagens de WhatsApp</h3></div><div class="card-b form-grid">${fld('Confirmação de horário', `<textarea name="msgConfirma" rows="3">${esc(c.msgConfirma)}</textarea>`, 'full')}${fld('Aniversário', `<textarea name="msgAniv" rows="2">${esc(c.msgAniv)}</textarea>`, 'full')}${fld('Cliente sumido', `<textarea name="msgSumido" rows="2">${esc(c.msgSumido)}</textarea>`, 'full')}<div class="full note">Variáveis: {nome} {data} {hora} {servico} {barbeiro} {barbearia}</div></div></div>
  </form>
  <div class="card mt"><div class="card-h"><h3>Acessos e permissões</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Perfil</th><th>Pode ver</th><th>Não vê</th></tr></thead><tbody>
    <tr><td><b>Dono</b></td><td>Tudo: painel, caixa, financeiro, comissões de todos, equipe e configurações</td><td class="muted">—</td></tr>
    <tr><td><b>Recepção</b></td><td>Painel, agenda, caixa, clientes e catálogo</td><td class="muted">Financeiro, comissões, equipe, configurações</td></tr>
    <tr><td><b>Barbeiro</b></td><td>Própria agenda, clientes e o próprio extrato de comissão</td><td class="muted">Caixa, financeiro e dados dos colegas</td></tr></tbody></table></div></div>
  <div class="acts mt" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" data-act="cfgSave">Salvar configurações</button><button class="btn" data-act="backup">${ic('download', 16)} Baixar backup (JSON)</button><button class="btn btn-danger" data-act="resetDemo">Restaurar dados de exemplo</button></div>`;
};
ACT.cfgSave = () => {
  const f = $('#f-cfg'), d = formData(f), c = DB.cfg;
  if (toMin(d.fecha) <= toMin(d.abre)) return toast('O horário de fechamento deve ser depois da abertura', 'bad');
  Object.assign(c, { nome: d.nome.trim() || c.nome, endereco: d.endereco, tel: d.tel, metaMes: num2(d.metaMes), abre: d.abre, fecha: d.fecha, dias: $$('[name=dia]:checked', f).map(i => +i.value), taxaPix: num2(d.taxaPix), taxaDeb: num2(d.taxaDeb), taxaCred: num2(d.taxaCred), msgConfirma: d.msgConfirma, msgAniv: d.msgAniv, msgSumido: d.msgSumido });
  save(); toast('Configurações salvas'); render();
};
ACT.backup = () => download('backup-barbearia.json', JSON.stringify(DB, null, 1), 'application/json');
ACT.resetDemo = () => confirmBox('Apagar as alterações feitas e voltar aos dados de exemplo?', () => { resetDemo(); toast('Dados de exemplo restaurados'); render(); }, 'Restaurar', true);
