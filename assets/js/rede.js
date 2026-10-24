// Rede de conexões pessoa ↔ tema, em SVG puro (sem bibliotecas).
// Dados: dados/rede.json (gerado por scripts/gerar_rede.py), dados/atos.csv e dados/pessoas.csv.
import { carregarCSV, esc, dataBR } from "./csv.js";

const NS = "http://www.w3.org/2000/svg";
export const COR_TEMA = { prevent: "#a855f7", contratos: "#ca8a04", manaus: "#0ea5e9", cloroquina: "#f97316", vacinas: "#22c55e",
  distanciamento: "#14b8a6", desinformacao: "#ef4444", gestao: "#94a3b8", justica: "#3b82f6", outros: "#6b7280" };
export const COR_LIGA = { favor: "#22c55e", contra: "#ef4444", ambos: "#eab308", processual: "#6b7280" };
export const COR_GRUPO = {
  "Presidência da República e família": "#f43f5e", "Ministério da Saúde": "#fb923c", "Outros ministérios e órgãos federais": "#fbbf24",
  "Parlamentares": "#a78bfa", "\"Gabinete paralelo\" e médicos": "#f472b6", "Empresários, comunicadores e influenciadores": "#c084fc",
  "Contratos de vacina e logística (Covaxin, Davati, VTCLog)": "#facc15", "Prevent Senior": "#e879f9", "Governo do Amazonas": "#38bdf8",
  "Empresas (pessoa jurídica)": "#fde047", "Médicos defensores do \"tratamento precoce\" que morreram de Covid": "#d1d5db",
  "Atuaram a favor da população": "#4ade80" };
const NOME_LIGA = { favor: "a favor", contra: "contra", ambos: "a favor e contra", processual: "só processual" };

const tipoLiga = (a) => (a.favor && a.contra ? "ambos" : a.contra ? "contra" : a.favor ? "favor" : "processual");
function el(nome, attrs = {}, pai) {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (pai) pai.appendChild(e);
  return e;
}

export async function montarRede(alvo, painel, opcoes = {}) {
  const [rede, atos, pessoas] = await Promise.all([
    fetch("dados/rede.json").then((r) => r.json()), carregarCSV("dados/atos.csv"), carregarCSV("dados/pessoas.csv")]);
  const fichas = Object.fromEntries(pessoas.map((p) => [p.id, p]));
  const nos = rede.nos.map((n) => ({ ...n, vx: 0, vy: 0 }));
  const porId = new Map(nos.map((n) => [n.id, n]));
  const arestas = rede.arestas.map((a) => ({ ...a, tipo: tipoLiga(a), de_: porId.get(a.de), para_: porId.get(a.para) }));
  for (const n of nos) { n.total = 0; n.grau = 0; }
  for (const a of arestas) { const t = a.favor + a.contra + a.processual; a.de_.total += t; a.para_.total += t; a.de_.grau++; a.para_.grau++; }

  const L = opcoes.largura || 1400, A = opcoes.altura || 900;
  const temas = nos.filter((n) => n.tipo === "tema");
  temas.forEach((n, i) => {
    const ang = (2 * Math.PI * i) / temas.length - Math.PI / 2;
    n.x = L / 2 + Math.cos(ang) * L * 0.36; n.y = A / 2 + Math.sin(ang) * A * 0.38; n.fixo = true;
  });
  nos.filter((n) => n.tipo !== "tema").forEach((n, i) => {
    const viz = arestas.filter((a) => a.de === n.id).map((a) => a.para_);
    const cx = viz.reduce((s, v) => s + v.x, 0) / (viz.length || 1), cy = viz.reduce((s, v) => s + v.y, 0) / (viz.length || 1);
    n.x = cx * 0.7 + L * 0.15 + Math.cos(i) * 20; n.y = cy * 0.7 + A * 0.15 + Math.sin(i) * 20;
  });

  const filtros = { temas: new Set(temas.map((t) => t.id)), ligas: new Set(Object.keys(COR_LIGA)), soCpi: false };
  const visivel = (a) => filtros.temas.has(a.para) && filtros.ligas.has(a.tipo) && (!filtros.soCpi || a.de_.cpi);

  alvo.innerHTML = "";
  const svg = el("svg", { viewBox: `0 0 ${L} ${A}`, class: "rede-svg", role: "img", "aria-label": "Rede de conexões entre pessoas e temas da pandemia" }, alvo);
  const defs = el("defs", {}, svg);
  const brilho = el("filter", { id: "brilho", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: "4", result: "b" }, brilho);
  const mg = el("feMerge", {}, brilho); el("feMergeNode", { in: "b" }, mg); el("feMergeNode", { in: "SourceGraphic" }, mg);
  const g = el("g", {}, svg), gl = el("g", {}, g), gn = el("g", {}, g);
  const dica = document.createElement("div"); dica.className = "rede-dica"; dica.hidden = true; alvo.appendChild(dica);

  for (const a of arestas) {
    a.el = el("line", { stroke: COR_LIGA[a.tipo], "stroke-width": 0.8 + Math.min(a.favor + a.contra + a.processual, 8) * 0.5, "stroke-opacity": 0.45, "stroke-linecap": "round" }, gl);
  }
  for (const n of nos) {
    const tema = n.tipo === "tema";
    n.r = tema ? 18 + Math.sqrt(n.total) * 2.4 : 4 + Math.sqrt(n.total) * 1.5;
    n.g = el("g", { class: "no", tabindex: 0, role: "button", "aria-label": n.nome }, gn);
    const cor = tema ? COR_TEMA[n.id.slice(5)] : COR_GRUPO[n.grupo] || "#93c5fd";
    el("circle", { r: n.r, fill: cor, stroke: tema ? "#0b0d10" : n.cpi ? "#ef4444" : "#0b0d10", "stroke-width": tema ? 3 : n.cpi ? 2 : 1, filter: tema ? "url(#brilho)" : "" }, n.g);
    n.rot = el("text", { y: tema ? n.r + 16 : -n.r - 5, "text-anchor": "middle", class: tema ? "rot-tema" : "rot-pessoa" }, n.g);
    n.rot.textContent = n.nome;
  }

  // zoom e arrasto do fundo
  let vb = { x: 0, y: 0, w: L, h: A };
  const aplicar = () => { svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); rotulos(); };
  const zoom = (f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => {
    const w = Math.min(Math.max(vb.w * f, 160), L * 1.6), h = (w * A) / L;
    vb = { x: cx - ((cx - vb.x) * w) / vb.w, y: cy - ((cy - vb.y) * h) / vb.h, w, h }; aplicar();
  };
  const ponto = (e) => { const p = svg.getBoundingClientRect(); return { x: vb.x + ((e.clientX - p.left) / p.width) * vb.w, y: vb.y + ((e.clientY - p.top) / p.height) * vb.h }; };
  svg.addEventListener("wheel", (e) => { e.preventDefault(); const p = ponto(e); zoom(e.deltaY > 0 ? 1.15 : 0.87, p.x, p.y); }, { passive: false });

  let arrasto = null, arrastou = false;
  svg.addEventListener("pointerdown", (e) => {
    const gno = e.target.closest(".no"); arrastou = false;
    const n = gno && nos.find((x) => x.g === gno);
    if (n) { arrasto = { no: n }; n.preso = true; } else arrasto = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!arrasto) return;
    arrastou = true;
    if (arrasto.no) { const p = ponto(e); arrasto.no.x = p.x; arrasto.no.y = p.y; aquecer(0.3); }
    else { const r = svg.getBoundingClientRect(); vb.x = arrasto.vx - ((e.clientX - arrasto.x) / r.width) * vb.w; vb.y = arrasto.vy - ((e.clientY - arrasto.y) / r.height) * vb.h; aplicar(); }
  });
  svg.addEventListener("pointerup", (e) => {
    const a = arrasto; arrasto = null;
    if (a?.no) { a.no.preso = false; if (!arrastou) selecionar(a.no); }
    else if (!arrastou && !e.target.closest(".no")) selecionar(null);
  });

  // simulação contínua
  let calor = 1, rodando = false;
  function aquecer(v) { calor = Math.max(calor, v); if (!rodando) { rodando = true; requestAnimationFrame(passo); } }
  function passo() {
    const ativos = nos.filter((n) => n.ativo !== false);
    for (const n of ativos) { n.vx *= 0.6; n.vy *= 0.6; }
    for (let i = 0; i < ativos.length; i++) for (let j = i + 1; j < ativos.length; j++) {
      const a = ativos[i], b = ativos[j]; let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy || 1;
      if (d2 > 90000) continue;
      const d = Math.sqrt(d2), min = a.r + b.r + 6, f = (900 / d2) + (d < min ? (min - d) * 0.5 : 0);
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
    for (const a of arestas) {
      if (a.de_.ativo === false || a.para_.ativo === false) continue;
      const p = a.de_, t = a.para_, dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1, f = (d - 60) * 0.012;
      p.vx += (dx / d) * f; p.vy += (dy / d) * f;
    }
    for (const n of ativos) {
      if (n.fixo || n.preso) continue;
      n.vx += (L / 2 - n.x) * 0.0015; n.vy += (A / 2 - n.y) * 0.0015;
      n.x = Math.min(L - 20, Math.max(20, n.x + n.vx * calor)); n.y = Math.min(A - 20, Math.max(20, n.y + n.vy * calor));
    }
    desenhar();
    calor *= 0.985;
    if (calor > 0.02) requestAnimationFrame(passo); else rodando = false;
  }
  function desenhar() {
    for (const n of nos) n.g.setAttribute("transform", `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`);
    for (const a of arestas) { a.el.setAttribute("x1", a.de_.x); a.el.setAttribute("y1", a.de_.y); a.el.setAttribute("x2", a.para_.x); a.el.setAttribute("y2", a.para_.y); }
  }
  function rotulos() {
    const escala = L / vb.w;
    for (const n of nos) if (n.tipo !== "tema") n.rot.style.display = n.destaque || escala > 1.8 || n.total >= (escala > 1.2 ? 4 : 8) ? "" : "none";
  }

  // filtros
  function aplicarFiltros() {
    for (const n of nos) n.ativo = n.tipo === "tema" ? filtros.temas.has(n.id) : false;
    for (const a of arestas) { const v = visivel(a); a.el.style.display = v ? "" : "none"; if (v) a.de_.ativo = true; }
    for (const n of nos) n.g.style.display = n.ativo ? "" : "none";
    selecionar(atual);
    aquecer(0.6);
  }

  // destaque e seleção
  let atual = null;
  function destacar(n) {
    const viz = new Set();
    for (const a of arestas) {
      const liga = n && (a.de === n.id || a.para === n.id) && visivel(a);
      a.el.setAttribute("stroke-opacity", !n ? 0.45 : liga ? 0.95 : 0.05);
      if (liga) { viz.add(a.de); viz.add(a.para); }
    }
    for (const x of nos) { x.destaque = n && viz.has(x.id); x.g.style.opacity = !n || viz.has(x.id) ? 1 : 0.12; }
    rotulos();
  }
  function selecionar(n) {
    atual = n; destacar(n);
    if (painel) {
      painel.innerHTML = n ? (opcoes.painelFlutuante ? '<button type="button" class="fechar" data-fechar aria-label="Fechar">×</button>' : "") + detalhe(n) : painelInicial();
      if (opcoes.painelFlutuante) painel.hidden = !n;
    }
    if (opcoes.aoSelecionar) opcoes.aoSelecionar(n);
  }
  for (const n of nos) {
    n.g.addEventListener("pointerenter", (e) => {
      if (arrasto) return;
      if (!atual) destacar(n);
      dica.hidden = false; dica.textContent = n.nome + (n.tipo === "tema" ? ` · ${n.grau} ligações` : "");
      const r = alvo.getBoundingClientRect(); dica.style.left = `${e.clientX - r.left + 12}px`; dica.style.top = `${e.clientY - r.top + 12}px`;
    });
    n.g.addEventListener("pointerleave", () => { dica.hidden = true; if (!atual) destacar(null); });
    n.g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selecionar(n); } });
  }

  function itemAto(i) {
    const a = atos[i];
    const cls = { "a favor": "favor", contra: "contra", processual: "processual" }[a.avaliacao];
    return `<li class="${cls}"><span class="data">${dataBR(a.data)}</span> <span class="tipo">(${esc(a.tipo)})</span> ${esc(a.ato)} <a href="${/^https?:/.test(a.fonte) ? esc(a.fonte) : "#"}" target="_blank" rel="noopener">fonte</a></li>`;
  }
  function detalhe(n) {
    if (n.tipo === "tema") {
      const lig = arestas.filter((a) => a.para === n.id && visivel(a)).sort((a, b) => b.contra + b.favor - (a.contra + a.favor));
      return `<h3><span class="ponto" style="background:${COR_TEMA[n.id.slice(5)]}"></span>${esc(n.nome)}</h3><p class="nota">${lig.length} pessoas ou instituições ligadas a este tema.</p>
        <ul class="lista-simples">${lig.map((a) => `<li><a href="#" data-sel="${esc(a.de)}">${esc(a.de_.nome)}</a> <span class="selo favor">🟢 ${a.favor}</span> <span class="selo contra">🔴 ${a.contra}</span></li>`).join("")}</ul>`;
    }
    const lig = arestas.filter((a) => a.de === n.id && visivel(a));
    const p = fichas[n.id] || {};
    return `<h3><span class="ponto" style="background:${COR_GRUPO[n.grupo] || "#93c5fd"}"></span>${esc(n.nome)}</h3><p class="nota">${esc(p.cargo_epoca || "")}<br>${esc(n.grupo || "")}</p>
      ${p.crimes_cpi ? '<p class="nota">⚖️ Teve pedido de indiciamento na CPI. Pedido não é condenação.</p>' : ""}
      ${lig.map((a) => `<h4>${esc(a.para_.nome)} <span class="selo ${a.tipo === "ambos" ? "" : a.tipo}">(${NOME_LIGA[a.tipo]})</span></h4><ul class="atos">${a.atos.map(itemAto).join("")}</ul>`).join("")}
      <p><a href="envolvidos.html?id=${encodeURIComponent(n.id)}">Ficha completa, defesa e situação judicial →</a></p>`;
  }
  function painelInicial() {
    return `<h3>Como usar</h3><ul class="lista-simples">
      <li>Os <strong>círculos grandes</strong> são temas; os pequenos, pessoas e instituições, coloridos pelo grupo.</li>
      <li>A <strong>cor da linha</strong> diz o que a pessoa fez no tema: <span class="selo favor">verde, a favor</span>; <span class="selo contra">vermelho, contra</span>; <span style="color:#ca8a04;font-weight:600">amarelo, os dois</span>; cinza, só fatos processuais. Linha mais grossa, mais atos.</li>
      <li>Borda vermelha: teve pedido de indiciamento na CPI (não é condenação).</li>
      <li>Passe o mouse para ver as conexões; <strong>clique</strong> para ver os atos com as fontes; arraste os pontos; use a roda ou os botões para aproximar.</li></ul>`;
  }
  if (painel) painel.addEventListener("click", (e) => {
    if (e.target.closest("[data-fechar]")) { selecionar(null); return; }
    const s = e.target.closest("[data-sel]"); if (!s) return;
    e.preventDefault(); selecionar(porId.get(s.dataset.sel));
  });

  const api = {
    total: nos.length, ligacoes: arestas.length, temas, nos,
    zoom: (f) => (f === 0 ? ((vb = { x: 0, y: 0, w: L, h: A }), aplicar()) : zoom(f)),
    alternarTema(id, on) { on ? filtros.temas.add(id) : filtros.temas.delete(id); aplicarFiltros(); },
    alternarLiga(t, on) { on ? filtros.ligas.add(t) : filtros.ligas.delete(t); aplicarFiltros(); },
    soCpi(on) { filtros.soCpi = on; aplicarFiltros(); },
    selecionarPorId(id) { const n = porId.get(id); if (n) selecionar(n); return Boolean(n); },
    buscar(t) { t = t.trim().toLowerCase(); const n = nos.find((x) => x.nome.toLowerCase() === t) || nos.find((x) => x.nome.toLowerCase().includes(t)); if (n) selecionar(n); return n; },
  };
  if (opcoes.controles !== false) {
    const c = document.createElement("div");
    c.className = "rede-controles";
    c.innerHTML = '<button type="button" data-z="0.8" aria-label="Aproximar">+</button><button type="button" data-z="1.25" aria-label="Afastar">−</button><button type="button" data-z="0" aria-label="Ver tudo">⤢</button>';
    c.addEventListener("click", (e) => { const z = e.target.dataset.z; if (z !== undefined) api.zoom(+z); });
    alvo.appendChild(c);
  }
  aplicarFiltros();
  if (painel && !opcoes.painelFlutuante) painel.innerHTML = painelInicial();
  api.ajuda = painelInicial;
  return api;
}
