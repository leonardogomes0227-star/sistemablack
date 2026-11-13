'use strict';
/* ================= SERVIÇOS E PREÇOS ================= */
VIEWS.catalogo = () => {
  const m = ym(TODAY), mSales = DB.sales.filter(s => ym(s.date) === m);
  const qtd = id => sum(mSales, s => sum(s.items.filter(i => i.t === 's' && i.id === id), i => i.qtd));
  const list = DB.services.map(x => ({ x, q: qtd(x.id) }));
  const best = list.slice().sort((a, b) => b.q * b.x.preco - a.q * a.x.preco)[0];
  return `<div class="page-h"><div><h1>Serviços e preços</h1><p>A tabela de preços da barbearia. Mudar um preço aqui vale para os próximos atendimentos.</p></div><div class="acts"><button class="btn btn-primary" data-act="svcNew">${ic('plus', 16)} Novo serviço</button></div></div>
  <div class="grid g3 keep2"><div class="card kpi"><small>Serviços ativos</small><b>${DB.services.filter(s => s.ativo).length}</b><div class="sub">de ${DB.services.length} cadastrados</div></div>
    <div class="card kpi"><small>Preço médio</small><b>${brl0(sum(DB.services.filter(s => s.ativo), s => s.preco) / Math.max(1, DB.services.filter(s => s.ativo).length))}</b><div class="sub">entre os serviços ativos</div></div>
    <div class="card kpi"><small>Mais rentável do mês</small><b style="font-size:28px">${best ? esc(best.x.nome) : '—'}</b><div class="sub">${best ? brl0(best.q * best.x.preco) + ' em ' + best.q + ' vendas' : ''}</div></div></div>
  <div class="card mt"><div class="tbl-wrap"><table class="t"><thead><tr><th>Serviço</th><th>Categoria</th><th class="num">Duração</th><th class="num">Preço</th><th class="num">Vendas no mês</th><th class="num">Receita no mês</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(({ x: s, q }) => `<tr style="${s.ativo ? '' : 'opacity:.5'}"><td><b>${esc(s.nome)}</b></td><td class="muted">${esc(s.cat)}</td><td class="num">${s.dur} min</td><td class="num"><b>${brl(s.preco)}</b></td><td class="num">${q}</td><td class="num">${brl0(q * s.preco)}</td><td>${badge(s.ativo ? 'Ativo' : 'Inativo', s.ativo ? 'ok' : '')}</td><td class="num"><button class="btn btn-sm" data-act="svcEdit" data-id="${s.id}">Editar</button></td></tr>`).join('')}</tbody></table></div></div>`;
};

/* ================= ESTOQUE ================= */
VIEWS.estoque = () => {
  const m = ym(TODAY), mSales = DB.sales.filter(s => ym(s.date) === m), act = DB.products.filter(p => p.ativo);
  const qtd = id => sum(mSales, s => sum(s.items.filter(i => i.t === 'p' && i.id === id), i => i.qtd));
  const repor = act.filter(p => p.estoque <= p.min).map(p => { const q = Math.max(1, p.min * 2 - p.estoque); return { p, q, custo: q * p.custo }; });
  return `<div class="page-h"><div><h1>Estoque</h1><p>O que tem na prateleira, o que precisa comprar e quanto cada produto rende.</p></div><div class="acts"><button class="btn btn-primary" data-act="prodNew">${ic('plus', 16)} Novo produto</button></div></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Produtos ativos</small><b>${act.length}</b><div class="sub">${sum(act, p => p.estoque)} unidades no total</div></div>
    <div class="card kpi"><small>Dinheiro parado</small><b>${brl0(sum(act, p => p.estoque * p.custo))}</b><div class="sub">estoque a preço de custo</div></div>
    <div class="card kpi"><small>Se vender tudo</small><b>${brl0(sum(act, p => p.estoque * p.preco))}</b><div class="sub">lucro de ${brl0(sum(act, p => p.estoque * (p.preco - p.custo)))}</div></div>
    <div class="card kpi" style="${repor.length ? 'border-color:var(--warn)' : ''}"><small>Precisam de reposição</small><b>${repor.length}</b><div class="sub">no mínimo ou abaixo</div></div></div>
  ${repor.length ? `<div class="card mt"><div class="card-h"><h3>${ic('box', 15)} Lista de compras sugerida</h3><span class="muted">Repõe até o dobro do mínimo · custo estimado <b style="color:var(--ink)">${brl(sum(repor, r => r.custo))}</b></span></div>
    ${repor.map(r => `<div class="list-row"><span class="alert-i ${r.p.estoque === 0 ? 'bad' : 'warn'}">${ic('box', 18)}</span><div class="grow"><b>${esc(r.p.nome)}</b><small>Tem ${r.p.estoque} · mínimo ${r.p.min}</small></div><b>Comprar ${r.q}</b><span class="muted nowrap" style="min-width:80px;text-align:right">${brl(r.custo)}</span><button class="btn btn-sm" data-act="stockIn" data-id="${r.p.id}">+ Entrada</button></div>`).join('')}</div>` : ''}
  <div class="card mt"><div class="card-h"><h3>Todos os produtos</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Produto</th><th class="num">Custo</th><th class="num">Preço</th><th class="num">Margem</th><th class="num">Estoque</th><th class="num">Vendidos no mês</th><th>Situação</th><th></th></tr></thead><tbody>
    ${DB.products.map(p => { const low = p.estoque <= p.min; return `<tr style="${p.ativo ? '' : 'opacity:.5'}"><td class="cell-2"><b>${esc(p.nome)}</b><small>${esc(p.cat)}</small></td><td class="num">${brl(p.custo)}</td><td class="num"><b>${brl(p.preco)}</b></td><td class="num">${((p.preco - p.custo) / p.preco * 100).toFixed(0)}%</td><td class="num"><b>${p.estoque}</b> <span class="muted">/ mín. ${p.min}</span></td><td class="num">${qtd(p.id)}</td><td>${badge(p.estoque === 0 ? 'Sem estoque' : low ? 'Repor' : 'Ok', p.estoque === 0 ? 'bad' : low ? 'warn' : 'ok')}</td><td class="num nowrap"><button class="btn btn-sm" data-act="stockIn" data-id="${p.id}">+ Entrada</button> <button class="btn btn-sm" data-act="prodEdit" data-id="${p.id}">Editar</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
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

/* ================= LUCRO DO MÊS (resultado) ================= */
const EXP_CATS = ['Aluguel', 'Contas', 'Serviços', 'Marketing', 'Material de consumo', 'Estoque de revenda', 'Equipamentos', 'Impostos', 'Outros'];
const expStat = e => e.pago ? ['Pago', 'ok'] : e.date < TODAY ? ['Em atraso', 'bad'] : ['A pagar', 'warn'];
VIEWS.financeiro = () => {
  const m = UI.finMonth, s = monthStats(m), pm = monthStats(addMonths(m, -1));
  const pmBruta = s.parcial ? sum(pm.sales.filter(x => +x.date.slice(8) <= +TODAY.slice(8)), x => calcSale(x).total) : pm.bruta;
  const base = s.bruta + s.aluguel;
  const last = Array.from({ length: 6 }, (_, i) => addMonths(m, i - 5)).map(x => ({ x, s: monthStats(x) }));
  const fixos = sum(s.exps, e => e.valor), varPct = base ? (s.comiss + s.taxas) / base : 0, equil = varPct < 1 ? fixos / (1 - varPct) : 0;
  return `<div class="page-h"><div><h1>Lucro do mês</h1><p>${s.parcial ? "Mês em andamento: despesas contabilizadas até hoje e aluguel de cadeira proporcional" : "O que entrou, o que saiu e o que sobrou"}</p></div><div class="acts">${monthNav('finMonth', m)}<button class="btn" data-act="go" data-r="gastos">${ic('arrowOut', 16)} Ver gastos</button></div></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Receita bruta</small><b>${brl0(s.bruta)}</b><div class="kpi-line">${delta(s.bruta, pmBruta)}<span class="sub">${s.parcial ? "vs. mês anterior até hoje" : "vs. mês anterior"}</span></div></div>
    <div class="card kpi"><small>Despesas fixas e variáveis</small><b>${brl0(s.despesas)}</b><div class="sub">${s.exps.filter(e => !e.pago).length} pendente(s)</div></div>
    <div class="card kpi"><small>Comissões da equipe</small><b>${brl0(s.comiss)}</b><div class="sub">${base ? (s.comiss / base * 100).toFixed(0) : 0}% da receita</div></div>
    <div class="card kpi" style="border-color:var(--brass)"><small>Lucro líquido estimado</small><b style="color:${s.lucro >= 0 ? 'var(--ok)' : 'var(--bad)'}">${brl0(s.lucro)}</b><div class="sub">Margem de ${s.margem.toFixed(0)}%</div></div></div>
  <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>Resultado do mês</h3></div><div class="card-b"><dl class="kv">
    <dt>Serviços</dt><dd>${brl(s.serv)}</dd><dt>Produtos</dt><dd>${brl(s.prod)}</dd>${s.aluguel ? `<dt>Aluguel de cadeiras recebido</dt><dd>${brl(s.aluguel)}</dd>` : ''}<dt><b>Receita total</b></dt><dd><b>${brl(base)}</b></dd>
    <dt>(−) Comissões da equipe</dt><dd>${brl(s.comiss)}</dd><dt>(−) Taxas de cartão</dt><dd>${brl(s.taxas)}</dd><dt>(−) Despesas</dt><dd>${brl(s.despesas)}</dd>
    <dt class="tot">Lucro líquido</dt><dd class="tot" style="color:${s.lucro >= 0 ? 'var(--ok)' : 'var(--bad)'}">${brl(s.lucro)}</dd></dl></div></div>
    <div class="card"><div class="card-h"><h3>Lucro · últimos 6 meses</h3></div><div class="card-b">${bars(last.map(l => ({ v: Math.max(l.s.lucro, 0), l: MESES[+l.x.slice(5) - 1].slice(0, 3), hl: l.x === m, t: `${mLabel(l.x)} · lucro ${brl(l.s.lucro)} · receita ${brl(l.s.bruta)}` })), { h: 150, every: 1 })}
    <div class="muted" style="font-size:12.5px;margin-top:26px">Barras mostram o lucro líquido de cada mês. Passe o mouse para ver a receita.</div></div></div></div>
  <div class="grid g2 mt"><div class="card"><div class="card-h"><h3>${ic('target', 15)} Ponto de equilíbrio</h3><span class="muted">estimativa do mês</span></div><div class="card-b">
    <p class="muted-p">Para fechar o mês sem prejuízo, a barbearia precisa faturar cerca de <b style="color:var(--ink)">${brl0(equil)}</b>. Isso cobre ${brl0(fixos)} de despesas do mês e a parte que vai para comissões e taxas (${(varPct * 100).toFixed(0)}% de cada real).</p>
    <div style="margin-top:14px">${hbar('Já faturado no mês', base, Math.max(equil, base, 1), `${brl0(base)} <span class="muted" style="font-weight:400">· ${equil ? Math.min(999, base / equil * 100).toFixed(0) : 0}% do equilíbrio</span>`, base >= equil ? 'var(--ok)' : 'var(--brass)')}</div></div></div>
    <div class="card"><div class="card-h"><h3>Recebimentos por forma de pagamento</h3></div><div class="card-b">${Object.keys(PAG).map(k => hbar(PAG[k], s.porPag[k], s.bruta, `${brl0(s.porPag[k])} <span class="muted" style="font-weight:400">· ${s.bruta ? (s.porPag[k] / s.bruta * 100).toFixed(0) : 0}%</span>`)).join('')}</div></div></div>`;
};

/* ================= GASTOS E CONTAS (tudo que sai) ================= */
VIEWS.gastos = () => {
  const m = UI.gasMonth, s = monthStats(m), all = s.exps.slice().sort((a, b) => a.date.localeCompare(b.date));
  const pago = sum(all.filter(e => e.pago), e => e.valor), atr = DB.expenses.filter(e => !e.pago && e.date < TODAY), aPagar = all.filter(e => !e.pago && e.date >= TODAY);
  const cats = {}; all.forEach(e => cats[e.categoria] = (cats[e.categoria] || 0) + e.valor);
  const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const f = UI.gasFilter; let list = all;
  if (f === 'pagar') list = all.filter(e => !e.pago && e.date >= TODAY); else if (f === 'atraso') list = atr; else if (f === 'pagas') list = all.filter(e => e.pago);
  if (UI.gasCat) list = list.filter(e => e.categoria === UI.gasCat);
  const prox = DB.expenses.filter(e => !e.pago).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const total = sum(all, e => e.valor), saiu = s.despesas + s.comiss + s.taxas;
  const parts = [['Despesas', s.despesas, 'var(--brass)', null], ['Comissões', s.comiss, 'var(--ink)', 'comissoes'], ['Taxas de cartão', s.taxas, '#9a9aa2', null]];
  return `<div class="page-h"><div><h1>Gastos e contas</h1><p>Tudo que a barbearia paga: aluguel, contas, produtos, material. Marque como paga quando sair do caixa.</p></div><div class="acts">${monthNav('gasMonth', m)}<button class="btn btn-primary" data-act="expNew">${ic('plus', 16)} Nova despesa</button></div></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Despesas do mês</small><b>${brl0(total)}</b><div class="sub">${all.length} lançamento(s)</div></div>
    <div class="card kpi"><small>Já pago</small><b style="color:var(--ok)">${brl0(pago)}</b><div class="sub">${all.filter(e => e.pago).length} conta(s)</div></div>
    <div class="card kpi"><small>A pagar</small><b>${brl0(sum(aPagar, e => e.valor))}</b><div class="sub">${aPagar.length} conta(s) a vencer</div></div>
    <div class="card kpi" style="${atr.length ? 'border-color:var(--bad)' : ''}"><small>Em atraso</small><b style="color:${atr.length ? 'var(--bad)' : 'inherit'}">${brl0(sum(atr, e => e.valor))}</b><div class="sub">${atr.length ? atr.length + ' conta(s) vencida(s) em qualquer mês' : 'nenhuma conta vencida'}</div></div></div>
  <div class="card mt"><div class="card-h"><h3>Tudo que saiu em ${mLabel(m)}</h3><span class="muted">${brl0(saiu)} no total</span></div><div class="card-b">
    <div class="stack">${parts.map(p => `<span style="width:${saiu ? p[1] / saiu * 100 : 0}%;background:${p[2]}" title="${p[0]} ${brl0(p[1])}"></span>`).join('')}</div>
    <div class="stack-leg">${parts.map(p => `<div><i style="background:${p[2]}"></i><span>${p[0]}</span><b>${brl0(p[1])}</b>${p[3] ? `<button class="link-btn" data-act="go" data-r="${p[3]}">ver ${ic('right', 12)}</button>` : ''}</div>`).join('')}</div></div></div>
  <div class="grid g-split mt">
    <div class="card"><div class="card-h"><h3>${ic('clock', 15)} Próximas contas</h3><span class="muted">em aberto, mais antigas primeiro</span></div>
      ${prox.length ? prox.map(e => { const st = expStat(e); return `<div class="list-row"><span class="alert-i ${st[1] === 'bad' ? 'bad' : 'warn'}">${ic(st[1] === 'bad' ? 'alert' : 'clock', 18)}</span><div class="grow"><b>${esc(e.descricao)}</b><small>${st[1] === 'bad' ? 'Venceu em ' : 'Vence em '}${fmtFull(e.date)} · ${esc(e.categoria)}</small></div><b>${brl(e.valor)}</b><button class="btn btn-sm btn-brass" data-act="expPay" data-id="${e.id}">Pagar</button></div>`; }).join('') : empty('Nenhuma conta em aberto.')}</div>
    <div class="card"><div class="card-h"><h3>Gastos por categoria</h3></div><div class="card-b">${catList.length ? catList.map(([k, v]) => hbar(esc(k), v, catList[0][1], `${brl0(v)} <span class="muted" style="font-weight:400">· ${total ? (v / total * 100).toFixed(0) : 0}%</span>`, 'var(--brass)')).join('') : empty('Sem despesas.')}</div></div></div>
  <div class="card mt"><div class="card-h"><h3>Lançamentos de ${mLabel(m)}</h3><div class="toolbar" style="margin:0"><div class="chips">${[['todas', 'Todas'], ['pagar', 'A pagar'], ['atraso', 'Em atraso'], ['pagas', 'Pagas']].map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="gasFilter" data-k="${k}">${l}</button>`).join('')}</div>
    <select data-change="gasCat" style="width:auto" aria-label="Categoria"><option value="">Todas as categorias</option>${EXP_CATS.map(c => `<option ${UI.gasCat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
  ${list.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th class="num">Valor</th><th>Status</th><th></th></tr></thead><tbody>
  ${list.map(e => { const st = expStat(e); return `<tr><td>${fmtFull(e.date)}</td><td><b>${esc(e.descricao)}</b></td><td class="muted">${esc(e.categoria)}</td><td class="num">${brl(e.valor)}</td><td>${badge(st[0], st[1])}</td><td class="num nowrap">${e.pago ? '' : `<button class="btn btn-sm btn-brass" data-act="expPay" data-id="${e.id}">Pagar</button> `}<button class="btn btn-sm" data-act="expEdit" data-id="${e.id}">Editar</button></td></tr>`; }).join('')}</tbody>
  <tfoot><tr><td colspan="3">Total</td><td class="num">${brl(sum(list, e => e.valor))}</td><td colspan="2"></td></tr></tfoot></table></div>` : empty('Nenhuma despesa neste filtro.')}</div>`;
};
ACT.gasFilter = el => { UI.gasFilter = el.dataset.k; render(); };
CHG.gasCat = el => { UI.gasCat = el.value; render(); };
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
  const faltas = appts.filter(a => a.status === 'desistiu').length, base = appts.filter(a => ['concluido', 'desistiu'].includes(a.status)).length;
  const firstSeen = c => (M.salesByClient.get(c) || []).reduce((mi, s) => s.date < mi ? s.date : mi, '9999');
  const cids = [...new Set(sales.map(s => s.clientId).filter(Boolean))];
  const novos = cids.filter(c => firstSeen(c) >= from).length;
  const total = sum(sales, s => calcSale(s).total);
  const hrs = []; for (let h = toMin(DB.cfg.abre) / 60; h < toMin(DB.cfg.fecha) / 60; h++) hrs.push(h);
  const dws = [1, 2, 3, 4, 5, 6]; const heat = {}; let hmax = 1;
  sales.forEach(a => { const k = pd(a.date).getDay() + '_' + Math.floor(toMin(a.time) / 60); heat[k] = (heat[k] || 0) + 1; hmax = Math.max(hmax, heat[k]); });
  const sT = top(sv), pT = top(pr);
  return `<div class="page-h"><div><h1>Relatórios</h1><p>${label} · ${sales.length} vendas</p></div><div class="acts"><button class="btn" data-act="relExport">${ic('download', 16)} Exportar vendas (CSV)</button></div></div>
  <div class="chips" style="margin-bottom:16px">${[['mes', 'Este mês'], ['ant', 'Mês passado'], ['30', '30 dias'], ['90', '90 dias']].map(([k, l]) => `<button class="chip ${r === k ? 'on' : ''}" data-act="relRange" data-k="${k}">${l}</button>`).join('')}</div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Faturamento</small><b>${brl0(total)}</b></div><div class="card kpi"><small>Clientes atendidos</small><b>${cids.length}</b><div class="sub">${novos} novo(s) no período</div></div>
    <div class="card kpi"><small>Descontos concedidos</small><b>${brl0(sum(sales, s => s.desc || 0))}</b><div class="sub">${sales.filter(s => s.desc).length} venda(s) com desconto</div></div><div class="card kpi"><small>Retorno de clientes</small><b>${cids.length ? ((cids.length - novos) / cids.length * 100).toFixed(0) : 0}%</b><div class="sub">já eram clientes antes</div></div></div>
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
  <div class="card"><div class="card-h"><h3>Mensagens de WhatsApp</h3></div><div class="card-b form-grid">${fld('Aniversário', `<textarea name="msgAniv" rows="2">${esc(c.msgAniv)}</textarea>`, 'full')}${fld('Cliente sumido', `<textarea name="msgSumido" rows="2">${esc(c.msgSumido)}</textarea>`, 'full')}<div class="full note">Variáveis: {nome} {barbearia}</div></div></div>
  </form>
  <div class="card mt"><div class="card-h"><h3>Acessos e permissões</h3></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Perfil</th><th>Pode ver</th><th>Não vê</th></tr></thead><tbody>
    <tr><td><b>Dono</b></td><td>Tudo: painel, caixa, extrato, financeiro, comissões de todos, equipe e configurações</td><td class="muted">—</td></tr>
    <tr><td><b>Recepção</b></td><td>Caixa (lançar atendimentos e gaveta), clientes e catálogo</td><td class="muted">Painel, extrato, financeiro, comissões, equipe, configurações</td></tr>
    <tr><td><b>Barbeiro</b></td><td>Clientes e o próprio extrato de comissão</td><td class="muted">Caixa, financeiro e dados dos colegas</td></tr></tbody></table></div></div>
  <div class="acts mt" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" data-act="cfgSave">Salvar configurações</button><button class="btn" data-act="backup">${ic('download', 16)} Baixar backup (JSON)</button><button class="btn btn-danger" data-act="resetDemo">Restaurar dados de exemplo</button></div>`;
};
ACT.cfgSave = () => {
  const f = $('#f-cfg'), d = formData(f), c = DB.cfg;
  if (toMin(d.fecha) <= toMin(d.abre)) return toast('O horário de fechamento deve ser depois da abertura', 'bad');
  Object.assign(c, { nome: d.nome.trim() || c.nome, endereco: d.endereco, tel: d.tel, metaMes: num2(d.metaMes), abre: d.abre, fecha: d.fecha, dias: $$('[name=dia]:checked', f).map(i => +i.value), taxaPix: num2(d.taxaPix), taxaDeb: num2(d.taxaDeb), taxaCred: num2(d.taxaCred),  msgAniv: d.msgAniv, msgSumido: d.msgSumido });
  save(); toast('Configurações salvas'); render();
};
ACT.backup = () => download('backup-barbearia.json', JSON.stringify(DB, null, 1), 'application/json');
ACT.resetDemo = () => confirmBox('Apagar as alterações feitas e voltar aos dados de exemplo?', () => { resetDemo(); toast('Dados de exemplo restaurados'); render(); }, 'Restaurar', true);


/* ================= EXTRATO: tudo que entra e sai ================= */
function ledger(from, to, { barberId = null } = {}) {
  const items = [];
  for (const s of DB.sales) {
    if (s.date < from || s.date > to || (barberId && s.barberId !== barberId)) continue;
    const c = calcSale(s), cl = client(s.clientId);
    items.push({ k: 'in', date: s.date, time: s.time, desc: (cl ? cl.nome : 'Cliente avulso') + ' · ' + s.items.map(i => (i.qtd > 1 ? i.qtd + '× ' : '') + i.nome).join(', '), cat: s.items.every(i => i.t === 'p') ? 'Produtos' : 'Serviços', who: barber(s.barberId).nome, pag: PAG[s.pag], valor: c.total, sid: s.id });
  }
  if (!barberId) for (const e of DB.expenses) {
    if (e.date < from || e.date > to) continue;
    items.push({ k: 'out', date: e.date, time: '12:00', desc: e.descricao, cat: e.categoria, who: '—', pag: e.pago ? 'Pago' : e.date < TODAY ? 'Em atraso' : 'A pagar', valor: e.valor, pend: !e.pago, eid: e.id });
  }
  for (const v of DB.vales) {
    if (v.date < from || v.date > to || (barberId && v.barberId !== barberId)) continue;
    items.push({ k: 'out', date: v.date, time: '12:00', desc: `${v.desc || 'Vale'} · ${barber(v.barberId).nome}`, cat: 'Vales', who: barber(v.barberId).nome, pag: 'Pago', valor: v.valor });
  }
  for (const [key, p] of Object.entries(DB.payouts)) {
    const [bid, m] = key.split('_'); if (p.date < from || p.date > to || (barberId && +bid !== barberId)) continue;
    items.push({ k: 'out', date: p.date, time: '12:00', desc: `Pagamento de comissão · ${barber(+bid).nome} (${mLabel(m)})`, cat: 'Comissões', who: barber(+bid).nome, pag: 'Pago', valor: Math.max(0, p.valor) });
  }
  return items.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}
const exRange = () => { const m = ym(TODAY), p = UI.exPeriod; return p === 'hoje' ? [TODAY, TODAY, 'Hoje'] : p === '7' ? [addDays(TODAY, -6), TODAY, 'Últimos 7 dias'] : p === 'mes' ? [m + '-01', mEnd(m), mLabel(m)] : p === 'ant' ? [addMonths(m, -1) + '-01', mEnd(addMonths(m, -1)), mLabel(addMonths(m, -1))] : [addDays(TODAY, -89), TODAY, 'Últimos 90 dias']; };
VIEWS.extrato = () => {
  const [from, to, label] = exRange(), bid = UI.exBarber ? +UI.exBarber : null, tipo = UI.exTipo;
  const all = ledger(from, to, { barberId: bid });
  let run = 0; all.slice().reverse().forEach(i => { if (!i.pend) run += i.k === 'in' ? i.valor : -i.valor; i.saldo = run; });
  const ent = sum(all.filter(i => i.k === 'in'), i => i.valor), sai = sum(all.filter(i => i.k === 'out' && !i.pend), i => i.valor), pend = sum(all.filter(i => i.pend), i => i.valor);
  const list = all.filter(i => tipo === 'todas' || (tipo === 'entradas' ? i.k === 'in' : i.k === 'out')), shown = list.slice(0, 150);
  const porB = DB.barbers.map(b => ({ b, v: sum(ledger(from, to, { barberId: b.id }).filter(i => i.k === 'in'), i => i.valor), n: ledger(from, to, { barberId: b.id }).filter(i => i.k === 'in').length })).filter(x => x.v).sort((a, b) => b.v - a.v);
  return `<div class="page-h"><div><h1>Extrato</h1><p>Tudo que entrou e saiu da barbearia · ${label}</p></div><div class="acts"><button class="btn" data-act="exExport">${ic('download', 16)} Exportar CSV</button><button class="btn btn-primary" data-act="expNew">${ic('plus', 16)} Lançar despesa</button></div></div>
  <div class="toolbar"><div class="chips">${[['hoje', 'Hoje'], ['7', '7 dias'], ['mes', 'Este mês'], ['ant', 'Mês passado'], ['90', '90 dias']].map(([k, l]) => `<button class="chip ${UI.exPeriod === k ? 'on' : ''}" data-act="exPeriod" data-k="${k}">${l}</button>`).join('')}</div>
    <select data-change="exBarber" style="width:auto;margin-left:auto" aria-label="Filtrar por barbeiro"><option value="">Todos os barbeiros e despesas</option>${DB.barbers.map(b => `<option value="${b.id}" ${UI.exBarber == b.id ? 'selected' : ''}>${esc(b.nome)}</option>`).join('')}</select></div>
  <div class="grid g4 keep2"><div class="card kpi"><small>Entrou</small><b style="color:var(--ok)">${brl0(ent)}</b><div class="sub">${all.filter(i => i.k === 'in').length} lançamentos</div></div>
    <div class="card kpi"><small>Saiu</small><b style="color:var(--bad)">${brl0(sai)}</b><div class="sub">despesas, vales e comissões pagas</div></div>
    <div class="card kpi" style="border-color:var(--brass)"><small>Saldo do período</small><b>${brl0(ent - sai)}</b><div class="sub">entrou menos saiu</div></div>
    <div class="card kpi"><small>Contas a pagar</small><b>${brl0(pend)}</b><div class="sub">ainda não saíram do caixa</div></div></div>
  ${porB.length ? `<div class="card mt"><div class="card-h"><h3>Quanto cada barbeiro fez no período</h3></div><div class="card-b grid g2">${porB.map(x => hbar(`<span class="who-cell">${avatar(x.b, 22)} ${esc(x.b.nome)}</span>`, x.v, porB[0].v, `${brl0(x.v)} <span class="muted" style="font-weight:400">· ${x.n} atend.</span>`, x.b.cor)).join('')}</div></div>` : ''}
  <div class="chips mt" style="margin-bottom:12px">${[['todas', 'Tudo'], ['entradas', 'Só entradas'], ['saidas', 'Só saídas']].map(([k, l]) => `<button class="chip ${tipo === k ? 'on' : ''}" data-act="exTipo" data-k="${k}">${l}</button>`).join('')}</div>
  <div class="card">${list.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Barbeiro</th><th>Forma / situação</th><th class="num">Entrada</th><th class="num">Saída</th><th class="num">Saldo</th></tr></thead><tbody>
  ${shown.map(i => `<tr ${i.sid ? `data-act="sale" data-id="${i.sid}"` : i.eid ? `data-act="expEdit" data-id="${i.eid}"` : ''}><td class="nowrap">${fmtDate(i.date)}${i.sid ? ' <span class="muted">' + i.time + '</span>' : ''}</td><td>${esc(i.desc)}</td><td class="hm">${badge(i.cat)}</td><td class="muted hm">${esc(i.who === '—' ? '—' : i.who.split(' ')[0])}</td><td class="${i.pend ? '' : 'hm'}">${i.pend ? badge(i.pag, i.pag === 'Em atraso' ? 'bad' : 'warn') : `<span class="muted">${esc(i.pag)}</span>`}</td><td class="num" style="color:var(--ok)">${i.k === 'in' ? brl(i.valor) : ''}</td><td class="num" style="color:var(--bad)">${i.k === 'out' ? brl(i.valor) : ''}</td><td class="num hm">${i.pend ? '<span class="muted">—</span>' : brl(i.saldo)}</td></tr>`).join('')}</tbody></table></div>
  <div style="padding:12px 16px" class="muted">Mostrando ${shown.length} de ${list.length} lançamentos. Clique em uma linha para abrir.</div>` : empty('Nenhum lançamento neste filtro.')}</div>`;
};
ACT.exPeriod = el => { UI.exPeriod = el.dataset.k; render(); };
ACT.exTipo = el => { UI.exTipo = el.dataset.k; render(); };
CHG.exBarber = el => { UI.exBarber = el.value; render(); };
ACT.exExport = () => { const [f, t] = exRange(); download('extrato.csv', ['Data;Hora;Tipo;Descrição;Categoria;Barbeiro;Forma;Valor', ...ledger(f, t, { barberId: UI.exBarber ? +UI.exBarber : null }).map(i => [i.date, i.sid ? i.time : '', i.k === 'in' ? 'Entrada' : 'Saída', i.desc, i.cat, i.who, i.pag, (i.k === 'in' ? '' : '-') + i.valor.toFixed(2).replace('.', ',')].map(csvCell).join(';'))].join('\n')); };
