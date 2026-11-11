'use strict';
/* Dados de EXEMPLO gerados no navegador (sem banco de dados). */
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function seedData() {
  const R = rng(2024);
  const rint = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = a => a[Math.floor(R() * a.length)];
  const wpick = pairs => { let r = R() * sum(pairs, p => p[1]); for (const [v, w] of pairs) { if ((r -= w) < 0) return v; } return pairs[0][0]; };
  const D = {
    seq: 0, seedDay: TODAY,
    cfg: {
      nome: 'Barbearia Modelo', endereco: 'Rua Exemplo, 123 · Centro', tel: '(11) 99999-0000', abre: '09:00', fecha: '20:00',
      dias: [1, 2, 3, 4, 5, 6], taxaPix: 0, taxaDeb: 1.6, taxaCred: 3.9, metaMes: 45000,
      msgConfirma: 'Olá {nome}! Seu horário na {barbearia} está agendado para {data} às {hora} ({servico}) com {barbeiro}. Responda SIM para confirmar.',
      msgLembrete: 'Oi {nome}, passando para lembrar do seu horário hoje às {hora} na {barbearia}. Até já!',
      msgAniv: 'Parabéns, {nome}! A equipe da {barbearia} deseja um ótimo dia. Passe aqui essa semana e ganhe 15% de desconto no seu corte.',
      msgSumido: 'Fala {nome}, faz um tempo que não te vemos por aqui. Bora marcar um horário? Responda essa mensagem que a gente encaixa.'
    },
    barbers: [], services: [], products: [], clients: [], appts: [], sales: [], expenses: [], vales: [], payouts: {}
  };
  const id = () => ++D.seq;

  [['Rafael Souza', '#2f6f6a', 50, 10, 0, 14000, '(11) 98111-2201'], ['Diego Martins', '#8a5a2b', 45, 10, 0, 12000, '(11) 98111-2202'],
  ['Thiago Alves', '#4b5d8a', 40, 10, 0, 9000, '(11) 98111-2203'], ['Bruno Costa', '#8a3f4e', 100, 0, 900, 10000, '(11) 98111-2204']]
    .forEach(([nome, cor, cs, cp, al, meta, tel]) => D.barbers.push({ id: id(), nome, cor, comServ: cs, comProd: cp, aluguel: al, meta, tel, ativo: true }));

  [['Corte Tradicional', 'Cabelo', 60, 40], ['Corte Degradê', 'Cabelo', 70, 45], ['Barba', 'Barba', 45, 30], ['Corte + Barba', 'Combo', 105, 75],
  ['Sobrancelha', 'Acabamento', 20, 15], ['Pigmentação', 'Química', 60, 30], ['Hidratação Capilar', 'Tratamento', 50, 30],
  ['Platinado / Luzes', 'Química', 220, 120], ['Corte Infantil', 'Cabelo', 50, 30]]
    .forEach(([nome, cat, preco, dur]) => D.services.push({ id: id(), nome, cat, preco, dur, ativo: true }));
  const S = D.services;

  [['Pomada Modeladora 120g', 'Finalizadores', 24, 49, 18, 6], ['Cera Matte 100g', 'Finalizadores', 22, 45, 12, 5], ['Óleo para Barba 30ml', 'Barba', 19, 42, 3, 5],
  ['Balm Pós-Barba', 'Barba', 17, 38, 9, 4], ['Shampoo Anticaspa 250ml', 'Cuidados', 21, 44, 2, 4], ['Cerveja Long Neck', 'Bar', 6.5, 14, 36, 12],
  ['Refrigerante Lata', 'Bar', 2.8, 6, 40, 15], ['Água Mineral', 'Bar', 1.2, 4, 48, 20]]
    .forEach(([nome, cat, custo, preco, estoque, min]) => D.products.push({ id: id(), nome, cat, custo, preco, estoque, min, ativo: true }));
  const P = D.products;

  const FN = ['Lucas', 'Mateus', 'Gabriel', 'Pedro', 'Felipe', 'Gustavo', 'Rodrigo', 'André', 'Carlos', 'Vinícius', 'Leandro', 'Marcelo', 'Henrique', 'Eduardo', 'João', 'Fernando', 'Renato', 'Caio', 'Igor', 'Samuel', 'Otávio', 'Murilo', 'Daniel', 'Alexandre', 'Rogério', 'Wesley', 'Paulo', 'Ricardo', 'Fábio', 'Leonardo'];
  const LN = ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Lima', 'Ferreira', 'Rocha', 'Ribeiro', 'Carvalho', 'Nascimento', 'Barbosa', 'Moreira', 'Araújo', 'Cardoso', 'Teixeira', 'Nunes', 'Dias', 'Castro', 'Mendes', 'Freitas'];
  const OBS = ['', '', '', '', 'Prefere máquina nº 1 nas laterais', 'Alérgico a produtos com perfume forte', 'Gosta de conversar sobre futebol', 'Sempre aceita uma cerveja', 'Corte social, tesoura no topo', 'Pezinho na navalha', 'Chega sempre 10 min antes', 'Prefere atendimento sem conversa'];
  const NCLI = 340;
  for (let i = 0; i < NCLI; i++) {
    const churn = R() < 0.14;
    D.clients.push({
      id: id(), nome: `${FN[i % 30]} ${LN[(i * 7 + Math.floor(i / 30)) % 20]}`, tel: `(11) 9${rint(1000, 9999)}-${rint(1000, 9999)}`,
      nasc: `${rint(1974, 2004)}-${pad(rint(1, 12))}-${pad(rint(1, 28))}`, criado: addDays(TODAY, -rint(0, 400)), obs: pick(OBS),
      _fav: pick(D.barbers).id, _pref: wpick([[S[0].id, 24], [S[1].id, 26], [S[2].id, 10], [S[3].id, 28], [S[5].id, 4], [S[6].id, 3], [S[7].id, 2], [S[8].id, 3]]),
      _freq: rint(10, 28), _churn: churn ? addDays(TODAY, -rint(50, 100)) : null
    });
  }
  // aniversariantes nos próximos dias (para o painel mostrar)
  for (let k = 0; k < 6; k++) { const c = D.clients[k * 17 + 3]; c.nasc = `${rint(1980, 2000)}-${iso(pd(addDays(TODAY, k)))?.slice(5)}`; }

  // simulação de 120 dias de histórico + agenda futura
  const busy = {}; const isBusy = (b, d, st, en) => (busy[b + d] || []).some(([s, e]) => s < en && e > st);
  const mark = (b, d, st, en) => (busy[b + d] = busy[b + d] || []).push([st, en]);
  const open = toMin(D.cfg.abre), close = toMin(D.cfg.fecha);
  const lunch = bi => bi % 2 ? [12 * 60, 13 * 60] : [13 * 60, 14 * 60];
  const visits = [];
  for (const c of D.clients) {
    let d = addDays(TODAY, -120 + rint(0, c._freq));
    while (d <= addDays(TODAY, 10)) {
      if (c._churn && d > c._churn) break;
      let day = d; if (pd(day).getDay() === 0) day = addDays(day, 1);
      const prob = day <= TODAY ? 1 : day === addDays(TODAY, 1) ? .85 : day <= addDays(TODAY, 3) ? .6 : .35;
      if (R() < prob) visits.push({ c, day });
      d = addDays(d, c._freq + rint(-4, 4));
    }
  }
  visits.sort((a, b) => a.day.localeCompare(b.day));
  for (const { c, day } of visits) {
    const svc = [c._pref]; if (R() < .12 && c._pref !== S[4].id && c._pref !== S[3].id) svc.push(S[4].id);
    const dur = sum(svc, sid => S.find(s => s.id === sid).dur);
    const bi0 = R() < .7 ? D.barbers.findIndex(b => b.id === c._fav) : rint(0, 3);
    let placed = null;
    for (let t = 0; t < 30 && !placed; t++) {
      const bi = t < 12 ? bi0 : rint(0, 3); const b = D.barbers[bi];
      const st = open + 15 * rint(0, Math.floor((close - open - dur) / 15)); const en = st + dur;
      const [ls, le] = lunch(bi);
      if (st < le && en > ls) continue;
      if (isBusy(b.id, day, st, en)) continue;
      placed = { b, st, en };
    }
    if (!placed) continue;
    mark(placed.b.id, day, placed.st, placed.en);
    let status;
    if (day < TODAY) status = wpick([['concluido', 93], ['faltou', 4], ['cancelado', 3]]);
    else if (day === TODAY) status = placed.en <= NOW_MIN ? 'concluido' : placed.st <= NOW_MIN ? 'andamento' : (R() < .6 ? 'confirmado' : 'agendado');
    else status = R() < .55 ? 'confirmado' : 'agendado';
    const a = { id: id(), clientId: c.id, barberId: placed.b.id, svc, date: day, time: toTime(placed.st), dur, status, obs: '', saleId: null };
    D.appts.push(a);
    if (status === 'concluido') {
      const items = svc.map(sid => { const s = S.find(x => x.id === sid); return { t: 's', id: s.id, nome: s.nome, qtd: 1, preco: s.preco }; });
      if (R() < .2) { const p = pick(P.slice(0, 5)); items.push({ t: 'p', id: p.id, nome: p.nome, qtd: 1, preco: p.preco }); }
      if (R() < .15) { const p = pick(P.slice(5)); items.push({ t: 'p', id: p.id, nome: p.nome, qtd: 1, preco: p.preco }); }
      const sub = sum(items, i => i.qtd * i.preco);
      const sale = { id: id(), date: day, time: a.time, clientId: c.id, barberId: a.barberId, items, desc: R() < .05 ? Math.round(sub * .1) : 0, tip: wpick([[0, 62], [5, 14], [10, 20], [20, 4]]), pag: wpick([['pix', 42], ['credito', 24], ['debito', 20], ['dinheiro', 14]]), apptId: a.id };
      a.saleId = sale.id; D.sales.push(sale);
    }
  }

  // despesas dos últimos 4 meses
  const m0 = ym(TODAY);
  for (let k = -3; k <= 0; k++) {
    const m = addMonths(m0, k);
    [['Aluguel do imóvel', 'Aluguel', 5, 4200], ['Energia elétrica', 'Contas', 10, rint(380, 520)], ['Água e esgoto', 'Contas', 12, rint(120, 160)], ['Internet e telefone', 'Contas', 15, 130],
    ['Contador', 'Serviços', 20, 450], ['Anúncios no Instagram', 'Marketing', 8, 400], ['Lâminas, toalhas e descartáveis', 'Material de consumo', 18, rint(560, 740)],
    ['Limpeza', 'Serviços', 22, 300], ['Compra de produtos para revenda', 'Estoque de revenda', 14, rint(780, 1020)]]
      .forEach(([descricao, categoria, dia, valor]) => {
        const date = `${m}-${pad(dia)}`;
        D.expenses.push({ id: id(), date, descricao, categoria, valor, pago: date <= TODAY && !(k === -1 && dia === 18) });
      });
  }
  // adiantamentos (vales)
  for (const k of [-1, 0]) {
    const m = addMonths(m0, k);
    if (k === 0 && +TODAY.slice(8) < 12) continue;
    D.vales.push({ id: id(), barberId: D.barbers[0].id, date: `${m}-12`, valor: 300, desc: 'Adiantamento' });
    if (k === -1) D.vales.push({ id: id(), barberId: D.barbers[2].id, date: `${m}-08`, valor: 200, desc: 'Vale transporte' });
  }
  // comissões de meses anteriores já pagas (mês passado fica em aberto)
  DB = D; reindex();
  for (const k of [-3, -2]) for (const b of D.barbers) { const m = addMonths(m0, k); const st = stmt(b.id, m); D.payouts[b.id + '_' + m] = { date: `${addMonths(m, 1)}-05`, valor: st.net }; }
  for (const c of D.clients) { delete c._fav; delete c._pref; delete c._freq; delete c._churn; }
  return D;
}
