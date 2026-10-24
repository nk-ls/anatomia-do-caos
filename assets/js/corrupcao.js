// Aba Corrupção: o caminho do dinheiro. Lê dados/dinheiro.json (gerado por scripts/gerar_dinheiro.py).
import { carregarCSV, esc, fmt } from "./csv.js";

// Situação do dinheiro: cor de estado + ícone + rótulo (nunca só cor).
const SITUACAO = {
  "contratado": { icone: "📄", rotulo: "Contratado", cor: "var(--destaque)", txt: "O valor foi assinado em contrato. Não quer dizer que foi pago." },
  "barrado": { icone: "🛑", rotulo: "Barrado", cor: "var(--favor)", txt: "O pagamento foi impedido ou o contrato foi desfeito antes de o dinheiro sair." },
  "não pago": { icone: "⭕", rotulo: "Não pago", cor: "var(--favor)", txt: "Nada saiu dos cofres públicos." },
  "pago e não entregue": { icone: "💸", rotulo: "Pago e não entregue", cor: "var(--contra)", txt: "O dinheiro saiu e o produto não chegou." },
  "perdido": { icone: "🗑️", rotulo: "Perdido", cor: "var(--contra)", txt: "Dinheiro público desperdiçado, sem ser desvio (ex.: vacina vencida)." },
  "irregular": { icone: "⚠️", rotulo: "Irregular", cor: "var(--alerta)", txt: "Um órgão de controle ou a CPI apontou irregularidade." },
  "em apuração": { icone: "🔍", rotulo: "Em apuração", cor: "var(--neutro)", txt: "Há indício, sem conclusão oficial." },
  "alegação": { icone: "💬", rotulo: "Alegação", cor: "var(--neutro)", txt: "Afirmação de alguém, sem prova oficial." },
  "vínculo": { icone: "🔗", rotulo: "Vínculo", cor: "var(--neutro)", txt: "Ligação societária ou de cargo." },
};
const sit = (s) => SITUACAO[s] || SITUACAO["vínculo"];
const selo = (s) => `<span class="selo-sit" style="--c:${sit(s).cor}">${sit(s).icone} ${esc(sit(s).rotulo)}</span>`;
const docs = (lista) => (lista || []).map((d) => `<a href="${esc(d.url)}">${esc(d.nome)}</a>`).join(" · ");

function reais(v) {
  if (v >= 1e9) return `R$ ${fmt(v / 1e9, 2)} bi`;
  if (v >= 1e6) return `R$ ${fmt(v / 1e6, v >= 1e8 ? 0 : 1)} mi`;
  return `R$ ${fmt(v)}`;
}

const [dados, pessoas] = await Promise.all([
  fetch("dados/dinheiro.json").then((r) => r.json()),
  carregarCSV("dados/pessoas.csv").catch(() => []),
]);
const nomes = Object.fromEntries(pessoas.map((p) => [p.id, p.nome]));

// 1. Legenda das situações
document.getElementById("legenda-situacao").innerHTML = Object.entries(SITUACAO)
  .map(([k, s]) => `<div class="situacao">${selo(k)}<span class="nota">${esc(s.txt)}</span></div>`).join("");

// 2. Números de destaque
const casos = Object.fromEntries(dados.casos.map((c) => [c.id, c]));
const etapa = (caso, pred) => casos[caso].etapas.find(pred);
const destaques = [
  { v: etapa("covaxin", (e) => e.situacao === "contratado").valor_reais, t: "contratados na Covaxin. Pagos: R$ 0. O contrato foi rescindido.", s: "barrado" },
  { v: etapa("vtclog", (e) => e.valor_reais > 18e6 && e.valor_reais < 2e7).valor_reais, t: "que o aditivo da VTCLog permitia pagar, quando os técnicos calculavam R$ 1 milhão. Barrado pelo TCU.", s: "barrado" },
  { v: etapa("global", (e) => e.situacao === "pago e não entregue").valor_reais, t: "pagos adiantado à Global em 2017 por remédios que nunca chegaram.", s: "pago e não entregue" },
  { v: etapa("vencidas", (e) => e.valor_reais).valor_reais, t: "em vacinas vencidas nos estoques de estados e municípios, segundo o TCU.", s: "perdido" },
];
document.getElementById("numeros-dinheiro").innerHTML = destaques
  .map((d) => `<div class="numero"><strong>${reais(d.v)}</strong>${selo(d.s)}<span>${esc(d.t)}</span></div>`).join("");

// 3. Gráfico de barras horizontais (um eixo, em reais)
const barras = dados.casos.flatMap((c) => c.etapas.filter((e) => e.valor_reais > 0).map((e) => ({ caso: c, e })))
  .sort((a, b) => b.e.valor_reais - a.e.valor_reais);
const maximo = Math.max(...barras.map((b) => b.e.valor_reais));
const g = document.getElementById("grafico-valores");
g.innerHTML = barras.map(({ caso, e }) => {
  const pct = Math.max((e.valor_reais / maximo) * 100, 0.6);
  const rot = e.curto || caso.titulo.split(":")[0];
  return `<a class="barra-linha" href="#caso-${esc(caso.id)}" data-dica="${esc(e.o_que)} — ${esc(sit(e.situacao).rotulo)}">
    <span class="barra-rotulo">${esc(rot)}</span>
    <span class="barra-trilho"><span class="barra" style="width:${pct}%;--c:${sit(e.situacao).cor}"></span></span>
    <span class="barra-valor">${reais(e.valor_reais)} ${sit(e.situacao).icone}</span></a>`;
}).join("");
const dica = document.createElement("div");
dica.className = "rede-dica"; dica.hidden = true; g.style.position = "relative"; g.appendChild(dica);
g.addEventListener("pointermove", (ev) => {
  const l = ev.target.closest(".barra-linha");
  if (!l) { dica.hidden = true; return; }
  const r = g.getBoundingClientRect();
  dica.textContent = l.dataset.dica; dica.hidden = false;
  dica.style.left = Math.min(ev.clientX - r.left + 12, r.width - 260) + "px";
  dica.style.top = ev.clientY - r.top + 14 + "px";
});
g.addEventListener("pointerleave", () => { dica.hidden = true; });
document.getElementById("tabela-valores").innerHTML = `<table><thead><tr><th>Caso</th><th>O quê</th><th>Valor</th><th>Situação</th><th>Documento</th></tr></thead><tbody>${
  barras.map(({ caso, e }) => `<tr><td>${esc(caso.titulo.split(":")[0])}</td><td>${esc(e.o_que)}</td><td>${reais(e.valor_reais)}</td><td>${selo(e.situacao)}</td><td>${docs(e.docs)}</td></tr>`).join("")}</tbody></table>`;

// 4. Casos passo a passo
document.getElementById("lista-casos").innerHTML = dados.casos.map((c) => `
  <article class="achado caso-dinheiro" id="caso-${esc(c.id)}">
    <h3>${esc(c.titulo)}</h3>
    <p class="resumo">${esc(c.resumo)}</p>
    ${c.etapas.length ? `<h4>O caminho do dinheiro</h4><ol class="trilha">${c.etapas.map((e) => `
      <li class="passo-dinheiro" style="--c:${sit(e.situacao).cor}">
        <div class="passo-topo"><span class="quando">${esc(e.data)}</span>${selo(e.situacao)}<span class="tipo-info">${esc(e.tipo)}</span></div>
        <div class="passo-rota"><strong>${esc(e.de)}</strong> <span aria-hidden="true">→</span> <strong>${esc(e.para)}</strong></div>
        <p>${esc(e.o_que)}</p>
        <div class="passo-pe"><span class="passo-valor">${e.valor_reais ? reais(e.valor_reais) : esc(e.valor_texto || "")}</span><span class="nota">📄 ${docs(e.docs)}</span></div>
      </li>`).join("")}</ol>` : ""}
    <h4>O que os órgãos de controle e a Justiça decidiram</h4>
    <ul class="decisoes">${c.decisoes.map((d) => `<li><span class="orgao">${esc(d.orgao)}</span> <span class="quando">${esc(d.data)}</span> — ${esc(d.texto)}. <span class="nota">📄 ${docs(d.docs)}</span></li>`).join("")}</ul>
    ${c.pessoas.length ? `<p class="nota">Fichas: ${c.pessoas.map((id) => `<a href="envolvidos.html?id=${encodeURIComponent(id)}">${esc(nomes[id] || id)}</a>`).join(" · ")}</p>` : ""}
  </article>`).join("");

// 5. Rede do dinheiro (SVG, simulação de forças simples, sem dependências)
const COR_NO = { orgao: "var(--cat1)", controle: "var(--cat2)", empresa: "var(--cat3)", pessoa: "var(--cat4)" };
const NOME_TIPO = { orgao: "Governo (quem paga)", controle: "Controle e Justiça", empresa: "Empresa", pessoa: "Pessoa" };
const COR_LIGA = { sanção: "var(--favor)", arquivamento: "var(--neutro)", investigação: "var(--neutro)", acusação: "var(--alerta)", denúncia: "var(--alerta)" };
document.getElementById("rede-dinheiro-legenda").innerHTML =
  Object.entries(NOME_TIPO).map(([k, n]) => `<span class="chip"><span class="ponto" style="background:${COR_NO[k]}"></span>${n}</span>`).join("") +
  `<span class="chip"><span class="traco" style="background:var(--contra)"></span>Dinheiro, contrato, sociedade</span><span class="chip"><span class="traco" style="background:var(--favor)"></span>Sanção</span><span class="chip"><span class="traco tracejado"></span>Investigação ou acusação</span>`;

const W = 900, H = 560;
const NS = "http://www.w3.org/2000/svg";
const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const caixa = document.getElementById("rede-dinheiro-svg");
const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "rede-dinheiro", role: "img", "aria-label": "Rede de empresas, pessoas e órgãos ligados pelo dinheiro" }, caixa);
const gl = el("g", {}, svg), gn = el("g", {}, svg);
const dicaR = document.createElement("div"); dicaR.className = "rede-dica"; dicaR.hidden = true; caixa.appendChild(dicaR);

const ANCORA = { orgao: [0.5, 0.5], controle: [0.5, 0.1], empresa: [0.3, 0.62], pessoa: [0.72, 0.72] };
const nos = dados.rede.nos.map((n, i) => ({ ...n, x: W * ANCORA[n.tipo][0] + Math.cos(i * 2.4) * 120, y: H * ANCORA[n.tipo][1] + Math.sin(i * 2.4) * 90, vx: 0, vy: 0 }));
const porId = Object.fromEntries(nos.map((n) => [n.id, n]));
const ligs = dados.rede.ligacoes.map((l) => ({ ...l, a: porId[l.de], b: porId[l.para] }));
const grau = {}; ligs.forEach((l) => { grau[l.de] = (grau[l.de] || 0) + 1; grau[l.para] = (grau[l.para] || 0) + 1; });

const mostrar = (ev, texto) => {
  const r = caixa.getBoundingClientRect();
  dicaR.textContent = texto; dicaR.hidden = false;
  dicaR.style.left = Math.min(ev.clientX - r.left + 12, r.width - 240) + "px";
  dicaR.style.top = ev.clientY - r.top + 12 + "px";
};
ligs.forEach((l) => {
  const cor = COR_LIGA[l.tipo] || "var(--contra)";
  const tracejada = ["investigação", "acusação", "denúncia", "arquivamento"].includes(l.tipo);
  l.vis = el("line", { stroke: cor, "stroke-width": 2, "stroke-opacity": 0.6, "stroke-linecap": "round", ...(tracejada ? { "stroke-dasharray": "5 5" } : {}) }, gl);
  l.alvo = el("line", { stroke: "transparent", "stroke-width": 14, class: "alvo-liga" }, gl);
  l.alvo.addEventListener("pointermove", (ev) => mostrar(ev, `${l.a.nome} → ${l.b.nome}: ${l.rotulo}`));
  l.alvo.addEventListener("pointerleave", () => { dicaR.hidden = true; });
  l.alvo.addEventListener("click", () => window.open(l.doc, "_blank", "noopener"));
});
nos.forEach((n) => {
  n.r = 7 + Math.min(grau[n.id] || 0, 10) * 1.3;
  n.g = el("g", { class: "no-dinheiro", tabindex: 0 }, gn);
  el("circle", { r: n.r, fill: COR_NO[n.tipo], stroke: "var(--superficie)", "stroke-width": 2 }, n.g);
  const t = el("text", { y: n.r + 14, "text-anchor": "middle" }, n.g); t.textContent = n.nome;
  n.g.addEventListener("pointermove", (ev) => {
    if (arrasto) return;
    const lig = ligs.filter((l) => l.a === n || l.b === n);
    ligs.forEach((l) => l.vis.setAttribute("stroke-opacity", lig.includes(l) ? 0.95 : 0.12));
    mostrar(ev, `${n.nome} · ${NOME_TIPO[n.tipo]} · ${lig.length} ligações`);
  });
  n.g.addEventListener("pointerleave", () => { ligs.forEach((l) => l.vis.setAttribute("stroke-opacity", 0.6)); dicaR.hidden = true; });
  n.g.addEventListener("dblclick", () => { if (nomes[n.id]) location.href = `envolvidos.html?id=${encodeURIComponent(n.id)}`; });
  n.g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && nomes[n.id]) location.href = `envolvidos.html?id=${encodeURIComponent(n.id)}`; });
});

let arrasto = null, calor = 1;
const ponto = (ev) => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
svg.addEventListener("pointerdown", (ev) => {
  const alvo = nos.find((n) => n.g.contains(ev.target));
  if (!alvo) return;
  arrasto = alvo; svg.setPointerCapture(ev.pointerId); calor = Math.max(calor, 0.5);
});
svg.addEventListener("pointermove", (ev) => { if (!arrasto) return; const p = ponto(ev); arrasto.x = p.x; arrasto.y = p.y; arrasto.vx = arrasto.vy = 0; calor = Math.max(calor, 0.3); });
svg.addEventListener("pointerup", () => { arrasto = null; });

function passo() {
  for (const a of nos) {
    for (const b of nos) {
      if (a === b) continue;
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 1;
      const f = 2600 / d2; a.vx += (dx / Math.sqrt(d2)) * f; a.vy += (dy / Math.sqrt(d2)) * f;
    }
    a.vx += (W * ANCORA[a.tipo][0] - a.x) * 0.004; a.vy += (H * ANCORA[a.tipo][1] - a.y) * 0.004;
  }
  for (const l of ligs) {
    const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1, f = (d - 130) * 0.012;
    l.a.vx += (dx / d) * f; l.a.vy += (dy / d) * f; l.b.vx -= (dx / d) * f; l.b.vy -= (dy / d) * f;
  }
  for (const n of nos) {
    if (n === arrasto) continue;
    n.x = Math.min(W - 60, Math.max(60, n.x + n.vx * calor)); n.y = Math.min(H - 30, Math.max(20, n.y + n.vy * calor));
    n.vx *= 0.6; n.vy *= 0.6;
  }
}
function desenhar() {
  for (const l of ligs) for (const e of [l.vis, l.alvo]) { e.setAttribute("x1", l.a.x); e.setAttribute("y1", l.a.y); e.setAttribute("x2", l.b.x); e.setAttribute("y2", l.b.y); }
  for (const n of nos) n.g.setAttribute("transform", `translate(${n.x},${n.y})`);
}
for (let i = 0; i < 300; i++) passo();
desenhar();
calor = 0.2;
(function laco() { if (calor > 0.01) { passo(); desenhar(); calor *= 0.985; } requestAnimationFrame(laco); })();
