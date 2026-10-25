// Aba Caminho do dinheiro. Lê dados/dinheiro.json (gerado por scripts/gerar_dinheiro.py).
import { carregarCSV, esc, fmt, quandoBR } from "./csv.js";

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

const [dados, pessoas, receita] = await Promise.all([
  fetch("dados/dinheiro.json").then((r) => r.json()),
  carregarCSV("dados/pessoas.csv").catch(() => []),
  fetch("dados/empresas.json").then((r) => r.json()).catch(() => null),
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

// 3b. Preço por dose dos contratos de vacina (uma série, uma unidade)
const comp = [...dados.comparacao].sort((a, b) => b.preco_dose_reais - a.preco_dose_reais);
const maxDose = Math.max(...comp.map((c) => c.preco_dose_reais));
const brl = (v) => `R$ ${fmt(v, 2)}`;
document.getElementById("grafico-dose").innerHTML = comp.map((c) => `
  <a class="barra-linha" href="${esc(c.doc)}" title="${esc(c.calculo)}">
    <span class="barra-rotulo">${esc(c.vacina)} · ${esc(c.contrato)}</span>
    <span class="barra-trilho"><span class="barra" style="width:${(c.preco_dose_reais / maxDose) * 100}%;--c:${c.contrato === "CT 29/2021" ? "var(--alerta)" : "var(--destaque)"}"></span></span>
    <span class="barra-valor">${brl(c.preco_dose_reais)}${c.contrato === "CT 29/2021" ? " ⚠️" : ""}</span></a>`).join("");
document.getElementById("tabela-dose").innerHTML = `<table><thead><tr><th>Vacina</th><th>Contrato</th><th>Data</th><th>Doses</th><th>Valor</th><th>Por dose</th><th>Como calculado</th><th>Pago</th></tr></thead><tbody>${
  dados.comparacao.map((c) => `<tr><td>${esc(c.vacina)}</td><td><a href="${esc(c.doc)}">${esc(c.contrato)}</a></td><td>${esc(c.data)}</td><td>${fmt(c.doses)}</td><td>${reais(c.valor_reais)}</td><td>${brl(c.preco_dose_reais)}</td><td>${esc(c.calculo)}</td><td>${esc(c.pago)}</td></tr>`).join("")}</tbody></table>`;

// 4. Casos passo a passo
function desenharCasos() {
const esfera = document.getElementById("esfera").value;
document.getElementById("lista-casos").innerHTML = dados.casos.filter((c) => !esfera || c.esfera === esfera).map((c) => `
  <article class="achado caso-dinheiro" id="caso-${esc(c.id)}">
    <p class="esfera-caso">${c.esfera === "estadual" ? "Governo estadual ou consórcio" : "Governo federal"}</p>
    <h3>${esc(c.titulo)}</h3>
    <p class="resumo">${esc(c.resumo)}</p>
    ${c.etapas.length ? `<h4>O caminho do dinheiro</h4><ol class="trilha">${c.etapas.map((e) => `
      <li class="passo-dinheiro" style="--c:${sit(e.situacao).cor}">
        <div class="passo-topo"><span class="quando">${esc(e.data)}</span>${quandoBR(e.data) ? `<span class="desde-marco">${esc(quandoBR(e.data))}</span>` : ""}${selo(e.situacao)}<span class="tipo-info">${esc(e.tipo)}</span></div>
        <div class="passo-rota"><strong>${esc(e.de)}</strong> <span aria-hidden="true">→</span> <strong>${esc(e.para)}</strong></div>
        <p>${esc(e.o_que)}</p>
        <div class="passo-pe"><span class="passo-valor">${e.valor_reais ? reais(e.valor_reais) : esc(e.valor_texto || "")}</span><span class="nota">📄 ${docs(e.docs)}</span></div>
      </li>`).join("")}</ol>` : ""}
    <h4>O que os órgãos de controle e a Justiça decidiram</h4>
    <ul class="decisoes">${c.decisoes.map((d) => `<li><span class="orgao">${esc(d.orgao)}</span> <span class="quando">${esc(d.data)}</span>${quandoBR(d.data) ? ` <span class="desde-marco">${esc(quandoBR(d.data))}</span>` : ""} — ${esc(d.texto)}. <span class="nota">📄 ${docs(d.docs)}</span></li>`).join("")}</ul>
    ${c.pessoas.length ? `<p class="nota">Fichas: ${c.pessoas.map((id) => `<a href="envolvidos.html?id=${encodeURIComponent(id)}">${esc(nomes[id] || id)}</a>`).join(" · ")}</p>` : ""}
  </article>`).join("");
}
document.getElementById("esfera").addEventListener("input", desenharCasos);
desenharCasos();

// 5. Rede do dinheiro: posições fixas por caso (legível, sem linhas cruzando o miolo).
// Decisões de controle aparecem como selo ⚖️ no nó e no painel, não como linhas.
const COR_NO = { orgao: "var(--cat1)", empresa: "var(--cat3)", pessoa: "var(--cat4)" };
const NOME_TIPO = { orgao: "Governo (quem paga)", empresa: "Empresa", pessoa: "Pessoa" };
const TRACEJADA = new Set(["acusação", "denúncia"]);
// O rótulo destes é redundante com a legenda ("Cargo ou sociedade", seta cinza):
// fica escondido e só aparece sob o cursor ou com foco pelo teclado.
const ROTULO_SOB_DEMANDA = new Set(["cargo", "sócio", "intermediação", "vendedor"]);
const COR_LIGA = (t) => (TRACEJADA.has(t) ? "var(--alerta)" : ["cargo", "sócio", "intermediação", "vendedor"].includes(t) ? "var(--neutro)" : "var(--contra)");
document.getElementById("rede-dinheiro-legenda").innerHTML =
  Object.entries(NOME_TIPO).map(([k, n]) => `<span class="chip"><span class="ponto" style="background:${COR_NO[k]}"></span>${n}</span>`).join("") +
  `<span class="chip"><span class="traco" style="background:var(--contra)"></span>Dinheiro: contrato, pagamento, garantia</span>` +
  `<span class="chip"><span class="traco" style="background:var(--neutro)"></span>Cargo ou sociedade</span>` +
  `<span class="chip"><span class="traco tracejado"></span>Acusação ou denúncia</span>` +
  `<span class="chip"><span class="selo-legenda">3</span>decisões do TCU, CGU, STF ou pedidos da CPI (clique para ver)</span>` +
  `<span class="chip dica-rede">Passe o cursor sobre uma pessoa ou empresa para ver o que liga cada seta; clique para abrir os documentos.</span>`;

const R = dados.rede, W = R.largura, H = R.altura, NS = "http://www.w3.org/2000/svg";
const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const caixa = document.getElementById("rede-dinheiro-svg");
const svg = el("svg", { viewBox: `-20 -10 ${W + 40} ${H + 50}`, class: "rede-dinheiro", role: "img", "aria-label": "Rede de empresas, pessoas e o Ministério da Saúde ligados pelo dinheiro" }, caixa);
el("defs", {}, svg).innerHTML = `<marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>`;
const gl = el("g", {}, svg), gr = el("g", {}, svg), gn = el("g", {}, svg);
const porId = Object.fromEntries(R.nos.map((n) => [n.id, n]));
const grau = {}; R.ligacoes.forEach((l) => { grau[l.de] = (grau[l.de] || 0) + 1; grau[l.para] = (grau[l.para] || 0) + 1; });
R.nos.forEach((n) => { n.r = n.tipo === "orgao" ? 30 : 13 + Math.min(grau[n.id] || 0, 5) * 2; });

const ligs = R.ligacoes.map((l) => {
  const a = porId[l.de], b = porId[l.para];
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  const x1 = a.x + (dx / d) * (a.r + 3), y1 = a.y + (dy / d) * (a.r + 3), x2 = b.x - (dx / d) * (b.r + 6), y2 = b.y - (dy / d) * (b.r + 6);
  const g = el("g", { class: "liga", tabindex: 0 }, gl);
  const vis = el("line", { x1, y1, x2, y2, stroke: COR_LIGA(l.tipo), "stroke-width": 2.2, "marker-end": "url(#seta)", ...(TRACEJADA.has(l.tipo) ? { "stroke-dasharray": "6 5" } : {}) }, g);
  el("line", { x1, y1, x2, y2, stroke: "transparent", "stroke-width": 16 }, g);
  // rótulo no meio da linha, sempre na horizontal, com fundo para não brigar com as linhas
  const f = l.pos_rotulo ?? 0.5, mx = x1 + (x2 - x1) * f, my = y1 + (y2 - y1) * f;
  const sobDemanda = ROTULO_SOB_DEMANDA.has(l.tipo);
  const rg = el("g", { class: "rotulo-liga" + (sobDemanda ? " sob-demanda" : ""), transform: `translate(${mx},${my})` }, gr);
  if (sobDemanda) rg.style.opacity = 0;
  const t = el("text", { "text-anchor": "middle", dy: "0.35em" }, rg); t.textContent = l.curto;
  const item = { ...l, a, b, g, vis, rg, sobDemanda };
  g.addEventListener("click", () => mostrarLiga(item));
  g.addEventListener("keydown", (ev) => { if (ev.key === "Enter") mostrarLiga(item); });
  const revelar = (sim) => { if (sobDemanda) rg.style.opacity = sim ? 1 : 0; };
  g.addEventListener("pointerenter", () => revelar(true));
  g.addEventListener("pointerleave", () => revelar(false));
  g.addEventListener("focusin", () => revelar(true));
  g.addEventListener("focusout", () => revelar(false));
  return item;
});
// fundo dos rótulos depois de medir o texto
requestAnimationFrame(() => ligs.forEach((l) => {
  const t = l.rg.querySelector("text"), bb = t.getBBox();
  const r = el("rect", { x: bb.x - 4, y: bb.y - 2, width: bb.width + 8, height: bb.height + 4, rx: 4, class: "fundo-rotulo" }, l.rg);
  l.rg.insertBefore(r, t);
}));

R.nos.forEach((n) => {
  n.g = el("g", { class: "no-dinheiro", tabindex: 0, transform: `translate(${n.x},${n.y})` }, gn);
  el("circle", { r: Math.max(n.r, 22), fill: "transparent", class: "alvo-toque" }, n.g);
  el("circle", { r: n.r, fill: COR_NO[n.tipo], stroke: "var(--superficie)", "stroke-width": 3 }, n.g);
  const t = el("text", { y: n.r + 17, "text-anchor": "middle", class: "nome-no" }, n.g); t.textContent = n.nome;
  if (n.decisoes.length) {
    const bx = n.r * 0.75, by = -n.r * 0.75;
    el("circle", { cx: bx, cy: by, r: 10, class: "selo-no-fundo" }, n.g);
    const s = el("text", { x: bx, y: by + 4, "text-anchor": "middle", class: "selo-no" }, n.g); s.textContent = n.decisoes.length;
  }
  n.g.addEventListener("click", () => mostrarNo(n));
  n.g.addEventListener("keydown", (ev) => { if (ev.key === "Enter") mostrarNo(n); });
  n.g.addEventListener("pointerenter", () => destacar(n));
  n.g.addEventListener("pointerleave", () => destacar(null));
});
function destacar(n) {
  ligs.forEach((l) => {
    const on = !n || l.a === n || l.b === n;
    l.g.style.opacity = on ? 1 : 0.15;
    // rótulo sob demanda: invisível em repouso, visível quando o nó dele está apontado
    l.rg.style.opacity = l.sobDemanda ? (n && on ? 1 : 0) : (on ? 1 : 0.15);
  });
  R.nos.forEach((m) => { m.g.style.opacity = !n || m === n || ligs.some((l) => (l.a === n && l.b === m) || (l.b === n && l.a === m)) ? 1 : 0.3; });
}
const painel = document.getElementById("rede-dinheiro-painel");
const linkDoc = (u, t = "documento") => `<a href="${esc(u)}">${esc(t)}</a>`;
function mostrarNo(n) {
  destacar(n);
  const lig = ligs.filter((l) => l.a === n || l.b === n);
  painel.innerHTML = `<h3><span class="ponto" style="background:${COR_NO[n.tipo]}"></span>${esc(n.nome)}</h3>
    <h4>Ligações</h4><ul>${lig.map((l) => `<li><strong>${esc(l.a.nome)} → ${esc(l.b.nome)}</strong>: ${esc(l.rotulo)}. 📄 ${linkDoc(l.doc)}</li>`).join("")}</ul>
    ${n.decisoes.length ? `<h4>⚖️ Decisões e pedidos</h4><ul>${n.decisoes.map((d) => `<li><strong>${esc(d.orgao)}</strong>: ${esc(d.texto)}. 📄 ${linkDoc(d.doc.url, d.doc.nome)}</li>`).join("")}</ul>` : ""}
    ${nomes[n.id] ? `<p><a href="envolvidos.html?id=${encodeURIComponent(n.id)}">Ficha completa, com a defesa →</a></p>` : ""}`;
}
function mostrarLiga(l) {
  destacar(null);
  painel.innerHTML = `<h3>${esc(l.a.nome)} → ${esc(l.b.nome)}</h3><p>${esc(l.rotulo)}.</p><p>📄 ${linkDoc(l.doc, "Abrir o documento")}</p>`;
}
painel.innerHTML = `<p class="nota">Clique numa pessoa, empresa ou ligação para ver os detalhes e os documentos aqui.</p>`;

// versão em lista, para leitor de tela e celular
document.getElementById("rede-dinheiro-lista").innerHTML = `<ul>${ligs.map((l) => `<li><strong>${esc(l.a.nome)} → ${esc(l.b.nome)}</strong>: ${esc(l.rotulo)}. 📄 ${linkDoc(l.doc)}</li>`).join("")}</ul>`;

// 6. Empresas: cadastro e quadro societário (Receita Federal)
const NOME_CASO = { covaxin: "Covaxin", global: "Global", vtclog: "VTCLog", barros: "Empresas de Ricardo Barros", cloroquina: "Cloroquina" };
const dataBRiso = (d) => (d ? d.split("-").reverse().join("/") : "—");
const ALERTA_SIT = new Set(["NULA", "INAPTA", "BAIXADA", "SUSPENSA"]);
function desenharEmpresas() {
  if (!receita) return;
  const caso = document.getElementById("caso-empresa").value;
  document.getElementById("lista-empresas").innerHTML = receita.empresas.filter((e) => !caso || e.caso === caso).map((e) => {
    const nomeados = e.socios.filter((s) => s.nome);
    const depois = e.socios.length - nomeados.length;
    const anos = e.abertura ? new Date().getFullYear() - Number(e.abertura.slice(0, 4)) : null;
    return `<article class="empresa">
      <div class="empresa-topo"><h3>${esc(e.nome || e.razao_social)}</h3>
        <span class="selo-sit" style="--c:${ALERTA_SIT.has(e.situacao) ? "var(--contra)" : "var(--neutro)"}">${ALERTA_SIT.has(e.situacao) ? "⚠️" : "🏢"} CNPJ ${esc(e.situacao)}</span></div>
      <p class="nota">${esc(e.razao_social)}${e.nome_fantasia ? ` (nome fantasia: ${esc(e.nome_fantasia)})` : ""} · CNPJ ${esc(e.cnpj)} · ${esc(e.municipio)}/${esc(e.uf)}</p>
      <p>${esc(e.por_que)} <a href="${esc(e.documento)}">Documento</a></p>
      <dl class="empresa-dados">
        <div><dt>Aberta em</dt><dd>${dataBRiso(e.abertura)}${anos !== null ? ` (${anos} anos)` : ""}</dd></div>
        <div><dt>Capital social</dt><dd>${e.capital_social != null ? `R$ ${fmt(e.capital_social, 2)}` : "—"}</dd></div>
        <div><dt>Atividade principal</dt><dd>${esc(e.atividade || "—")}</dd></div>
        <div><dt>Natureza</dt><dd>${esc(e.natureza || "—")}</dd></div>
      </dl>
      <h4>Sócios e administradores</h4>
      <ul class="socios">${nomeados.map((s) => `<li><strong>${s.ficha ? `<a href="envolvidos.html?id=${esc(s.ficha)}">${esc(s.nome)}</a>` : esc(s.nome)}</strong>${s.tipo === "empresa" ? " (empresa)" : ""} · ${esc(s.qualificacao)} · desde ${dataBRiso(s.entrada)}${s.representante ? ` · representada por ${esc(s.representante)}` : ""}</li>`).join("")}
        ${depois ? `<li class="nota">${depois} ${depois > 1 ? "pessoas entraram" : "pessoa entrou"} depois de 2021 (sem relação com os fatos; nome na cópia da Receita)</li>` : ""}</ul>
      <p class="nota">📄 <a href="${esc(e.fonte)}">Consulta pública</a> · <a href="${esc(e.copia)}">cópia arquivada</a></p>
    </article>`;
  }).join("");
}
if (receita) {
  const sel = document.getElementById("caso-empresa");
  sel.insertAdjacentHTML("beforeend", [...new Set(receita.empresas.map((e) => e.caso))].map((c) => `<option value="${c}">${esc(NOME_CASO[c] || c)}</option>`).join(""));
  sel.addEventListener("input", desenharEmpresas);
  document.getElementById("fonte-empresas").innerHTML = `Fonte: ${esc(receita.fonte)}, consultados em ${dataBRiso(receita.consultado_em)}. Dados: <a href="dados/empresas.json">empresas.json</a>, gerados por <a href="https://github.com/nk-ls/anatomia-do-caos/blob/main/scripts/gerar_empresas.py">scripts/gerar_empresas.py</a>.`;
  desenharEmpresas();
}

// --- Navegação do grafo: arrastar, roda do mouse, pinça de dois dedos e botões ---
// Antes o grafo só rolava de lado num contêiner de 820px, sem nenhum zoom:
// no celular o texto ficava pequeno demais e não havia como aproximar.
(function navegacao() {
  const BASE = { x: -20, y: -10, w: W + 40, h: H + 50 };
  let vb = { ...BASE };
  const aplicar = () => svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const zoom = (f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => {
    const w = Math.min(Math.max(vb.w * f, BASE.w / 6), BASE.w * 1.4);
    const h = (w * BASE.h) / BASE.w;
    vb = { x: cx - ((cx - vb.x) * w) / vb.w, y: cy - ((cy - vb.y) * h) / vb.h, w, h };
    aplicar();
  };
  const ponto = (e) => {
    const r = svg.getBoundingClientRect();
    return { x: vb.x + ((e.clientX - r.left) / r.width) * vb.w, y: vb.y + ((e.clientY - r.top) / r.height) * vb.h };
  };

  svg.addEventListener("wheel", (e) => { e.preventDefault(); const p = ponto(e); zoom(e.deltaY > 0 ? 1.15 : 0.87, p.x, p.y); }, { passive: false });

  const dedos = new Map();
  let pinca = null, arrasto = null;
  const dist = () => { const [a, b] = [...dedos.values()]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); };
  const meio = () => {
    const [a, b] = [...dedos.values()], r = svg.getBoundingClientRect();
    return { x: vb.x + (((a.clientX + b.clientX) / 2 - r.left) / r.width) * vb.w,
             y: vb.y + (((a.clientY + b.clientY) / 2 - r.top) / r.height) * vb.h };
  };

  svg.addEventListener("pointerdown", (e) => {
    dedos.set(e.pointerId, e);
    if (dedos.size === 2) { arrasto = null; pinca = { d: dist(), c: meio() }; return; }
    if (dedos.size > 2) return;
    arrasto = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moveu: false };
  });
  svg.addEventListener("pointermove", (e) => {
    if (dedos.has(e.pointerId)) dedos.set(e.pointerId, e);
    if (pinca && dedos.size === 2) {
      const d = dist();
      if (d > 0 && pinca.d > 0) { zoom(pinca.d / d, pinca.c.x, pinca.c.y); pinca.d = d; }
      return;
    }
    if (!arrasto) return;
    // mesmo limiar da rede: o tremor do dedo não deve deslocar o grafo
    if (!arrasto.moveu && Math.hypot(e.clientX - arrasto.x, e.clientY - arrasto.y) < 10) return;
    arrasto.moveu = true;
    const r = svg.getBoundingClientRect();
    vb.x = arrasto.vx - ((e.clientX - arrasto.x) / r.width) * vb.w;
    vb.y = arrasto.vy - ((e.clientY - arrasto.y) / r.height) * vb.h;
    aplicar();
  });
  const soltar = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) pinca = null; arrasto = null; };
  svg.addEventListener("pointerup", soltar);
  svg.addEventListener("pointercancel", soltar);

  const ctr = document.createElement("div");
  ctr.className = "rede-controles";
  ctr.innerHTML = '<button type="button" data-z="0.8" aria-label="Aproximar">+</button>'
                + '<button type="button" data-z="1.25" aria-label="Afastar">−</button>'
                + '<button type="button" data-z="reset" aria-label="Enquadrar tudo">↺</button>'
                + '<button type="button" data-z="tela" aria-label="Ver em tela cheia" aria-pressed="false">⤢</button>';

  // Modo expandido por classe, e nao pela API de tela cheia do navegador:
  // no iPhone a API nativa nao vale para elementos que nao sejam video.
  const caixaPai = caixa.parentElement;
  const expandir = (sim) => {
    caixaPai.classList.toggle("expandido", sim);
    document.body.classList.toggle("sem-rolagem", sim);
    const bt = ctr.querySelector('[data-z="tela"]');
    bt.setAttribute("aria-pressed", String(sim));
    bt.textContent = sim ? "✕" : "⤢";
    bt.setAttribute("aria-label", sim ? "Sair da tela cheia" : "Ver em tela cheia");
    vb = { ...BASE }; aplicar();
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && caixaPai.classList.contains("expandido")) expandir(false);
  });

  ctr.addEventListener("click", (e) => {
    const z = e.target.dataset.z;
    if (z === "tela") expandir(!caixaPai.classList.contains("expandido"));
    else if (z === "reset") { vb = { ...BASE }; aplicar(); }
    else if (z) zoom(+z);
  });
  caixa.parentElement.insertBefore(ctr, caixa.nextSibling);
})();
