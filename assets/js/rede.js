// Rede de conexões pessoa ↔ tema, em SVG puro (sem bibliotecas).
// Dados: dados/rede.json (gerado por scripts/gerar_rede.py) e dados/atos.csv.
import { carregarCSV, esc, dataBR } from "./csv.js";

const NS = "http://www.w3.org/2000/svg";
const COR_TEMA = { prevent: "#a855f7", contratos: "#ca8a04", manaus: "#0ea5e9", cloroquina: "#f97316", vacinas: "#22c55e",
  distanciamento: "#14b8a6", desinformacao: "#ef4444", gestao: "#64748b", justica: "#3b82f6", outros: "#9ca3af" };
const COR_LIGA = { favor: "#22c55e", contra: "#ef4444", ambos: "#eab308", processual: "#6b7280" };

function tipoLiga(a) {
  if (a.favor && a.contra) return "ambos";
  if (a.contra) return "contra";
  if (a.favor) return "favor";
  return "processual";
}

function el(nome, attrs = {}, pai) {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (pai) pai.appendChild(e);
  return e;
}

// Layout por forças: repulsão entre todos, molas nas ligações, gravidade ao centro.
function layout(nos, arestas, L, A) {
  const idx = new Map(nos.map((n, i) => [n.id, i]));
  const temas = nos.filter((n) => n.tipo === "tema");
  temas.forEach((n, i) => {
    const ang = (2 * Math.PI * i) / temas.length;
    n.x = L / 2 + Math.cos(ang) * L * 0.38; n.y = A / 2 + Math.sin(ang) * A * 0.4; n.fixo = true;
  });
  nos.forEach((n, i) => { if (n.tipo !== "tema") { n.x = L / 2 + Math.cos(i * 2.4) * 60 * Math.sqrt(i); n.y = A / 2 + Math.sin(i * 2.4) * 60 * Math.sqrt(i) * 0.6; } });
  const ligs = arestas.map((a) => [idx.get(a.de), idx.get(a.para)]);
  for (let it = 0; it < 450; it++) {
    const t = 1 - it / 450;
    for (const n of nos) { n.vx = 0; n.vy = 0; }
    for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) {
      const a = nos[i], b = nos[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 1;
      const peso = (a.tipo === "tema" ? 3 : 1) * (b.tipo === "tema" ? 3 : 1);
      const f = (1400 * peso) / d2, d = Math.sqrt(d2);
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
    for (const [i, j] of ligs) {
      const a = nos[i], b = nos[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const f = (d - 70) * 0.03;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f;
    }
    for (const n of nos) {
      if (n.fixo) continue;
      n.vx += (L / 2 - n.x) * 0.004; n.vy += (A / 2 - n.y) * 0.004;
      const passo = Math.min(Math.hypot(n.vx, n.vy), 30 * t + 2), m = Math.hypot(n.vx, n.vy) || 1;
      n.x = Math.min(L - 30, Math.max(30, n.x + (n.vx / m) * passo)); n.y = Math.min(A - 20, Math.max(20, n.y + (n.vy / m) * passo));
    }
  }
}

export async function montarRede(alvo, painel) {
  const [rede, atos, pessoas] = await Promise.all([
    fetch("dados/rede.json").then((r) => r.json()), carregarCSV("dados/atos.csv"), carregarCSV("dados/pessoas.csv")]);
  const fichas = Object.fromEntries(pessoas.map((p) => [p.id, p]));
  const nos = rede.nos.map((n) => ({ ...n })), arestas = rede.arestas;
  const porId = new Map(nos.map((n) => [n.id, n]));
  for (const n of nos) n.total = 0;
  for (const a of arestas) { const t = a.favor + a.contra + a.processual; porId.get(a.de).total += t; porId.get(a.para).total += t; }

  const L = 1200, A = 820;
  layout(nos, arestas, L, A);

  alvo.innerHTML = "";
  const svg = el("svg", { viewBox: `0 0 ${L} ${A}`, class: "rede-svg", role: "img", "aria-label": "Rede de conexões entre pessoas e temas da pandemia" }, alvo);
  const g = el("g", {}, svg);
  const gl = el("g", {}, g), gn = el("g", {}, g);
  const linhas = arestas.map((a) => {
    const de = porId.get(a.de), para = porId.get(a.para), tipo = tipoLiga(a);
    const ln = el("line", { x1: de.x, y1: de.y, x2: para.x, y2: para.y, stroke: COR_LIGA[tipo], "stroke-width": 1 + Math.min(a.favor + a.contra + a.processual, 6) * 0.6, "stroke-opacity": 0.55 }, gl);
    ln.dataset.tipo = tipo; ln.dataset.de = a.de; ln.dataset.para = a.para;
    return ln;
  });
  const circulos = new Map();
  for (const n of nos) {
    const tema = n.tipo === "tema";
    const r = tema ? 16 + Math.sqrt(n.total) * 2.2 : 4 + Math.sqrt(n.total) * 1.6;
    const grupo = el("g", { class: "no", tabindex: 0, role: "button", "aria-label": n.nome, transform: `translate(${n.x},${n.y})` }, gn);
    el("circle", { r, fill: tema ? COR_TEMA[n.id.slice(5)] : n.cpi ? "#e5e7eb" : "#93c5fd", stroke: tema ? "#0b0d10" : n.cpi ? "#ef4444" : "#1f5fa8", "stroke-width": tema ? 2 : 1.5 }, grupo);
    const rot = el("text", { y: tema ? 4 : -r - 4, "text-anchor": "middle", class: tema ? "rot-tema" : "rot-pessoa" }, grupo);
    rot.textContent = n.nome;
    if (!tema && n.total < 6) rot.classList.add("oculto");
    grupo.addEventListener("click", (e) => { e.stopPropagation(); selecionar(n); });
    grupo.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selecionar(n); } });
    circulos.set(n.id, grupo);
  }

  // zoom e arrasto
  let vb = { x: 0, y: 0, w: L, h: A };
  const aplicar = () => svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const zoom = (f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => {
    const w = Math.min(Math.max(vb.w * f, 200), L * 1.5), h = (w * A) / L;
    vb = { x: cx - ((cx - vb.x) * w) / vb.w, y: cy - ((cy - vb.y) * h) / vb.h, w, h }; aplicar();
  };
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = svg.getBoundingClientRect();
    zoom(e.deltaY > 0 ? 1.15 : 0.87, vb.x + ((e.clientX - p.left) / p.width) * vb.w, vb.y + ((e.clientY - p.top) / p.height) * vb.h);
  }, { passive: false });
  let arrasto = null;
  svg.addEventListener("pointerdown", (e) => { if (!e.target.closest(".no")) { arrasto = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener("pointermove", (e) => {
    if (!arrasto) return;
    const p = svg.getBoundingClientRect();
    vb.x = arrasto.vx - ((e.clientX - arrasto.x) / p.width) * vb.w; vb.y = arrasto.vy - ((e.clientY - arrasto.y) / p.height) * vb.h; aplicar();
  });
  svg.addEventListener("pointerup", () => { arrasto = null; });
  svg.addEventListener("click", () => selecionar(null));

  const controles = document.createElement("div");
  controles.className = "rede-controles";
  controles.innerHTML = `<button type="button" data-z="0.8" aria-label="Aproximar">+</button><button type="button" data-z="1.25" aria-label="Afastar">−</button><button type="button" data-z="0" aria-label="Ver tudo">⤢</button>`;
  controles.addEventListener("click", (e) => {
    const z = e.target.dataset.z; if (z === undefined) return;
    if (z === "0") { vb = { x: 0, y: 0, w: L, h: A }; aplicar(); } else zoom(+z);
  });
  alvo.appendChild(controles);

  function selecionar(n) {
    const vizinhos = new Set();
    for (const ln of linhas) {
      const liga = n && (ln.dataset.de === n.id || ln.dataset.para === n.id);
      ln.setAttribute("stroke-opacity", !n ? 0.55 : liga ? 0.95 : 0.06);
      if (liga) { vizinhos.add(ln.dataset.de); vizinhos.add(ln.dataset.para); }
    }
    for (const [id, gr] of circulos) gr.style.opacity = !n || vizinhos.has(id) ? 1 : 0.15;
    painel.innerHTML = n ? detalhe(n) : painelInicial();
  }

  function itemAto(i) {
    const a = atos[i];
    const cls = { "a favor": "favor", contra: "contra", processual: "processual" }[a.avaliacao];
    return `<li class="${cls}"><span class="data">${dataBR(a.data)}</span> <span class="tipo">(${esc(a.tipo)})</span> ${esc(a.ato)} <a href="${/^https?:/.test(a.fonte) ? esc(a.fonte) : "#"}" target="_blank" rel="noopener">fonte</a></li>`;
  }

  function detalhe(n) {
    if (n.tipo === "tema") {
      const lig = arestas.filter((a) => a.para === n.id).sort((a, b) => b.contra + b.favor - (a.contra + a.favor));
      return `<h3>${esc(n.nome)}</h3><p class="nota">${lig.length} pessoas ou instituições ligadas a este tema. Clique num nome no grafo para ver os atos.</p>
        <ul class="lista-simples">${lig.map((a) => `<li><a href="envolvidos.html?id=${encodeURIComponent(a.de)}">${esc(porId.get(a.de).nome)}</a> <span class="selo favor">🟢 ${a.favor}</span> <span class="selo contra">🔴 ${a.contra}</span></li>`).join("")}</ul>`;
    }
    const lig = arestas.filter((a) => a.de === n.id);
    const p = fichas[n.id] || {};
    return `<h3>${esc(n.nome)}</h3><p class="nota">${esc(p.cargo_epoca || "")}</p>
      ${p.crimes_cpi ? '<p class="nota">⚖️ Teve pedido de indiciamento na CPI. Pedido não é condenação.</p>' : ""}
      ${lig.map((a) => `<h4>${esc(porId.get(a.para).nome)}</h4><ul class="atos">${a.atos.map(itemAto).join("")}</ul>`).join("")}
      <p><a href="envolvidos.html?id=${encodeURIComponent(n.id)}">Ficha completa, defesa e situação judicial →</a></p>`;
  }

  function painelInicial() {
    return `<h3>Como usar</h3><ul class="lista-simples">
      <li>Os <strong>círculos grandes</strong> são temas; os pequenos são pessoas e instituições.</li>
      <li>A <strong>cor da linha</strong> diz o que a pessoa fez naquele tema: <span class="selo favor">verde, a favor</span>, <span class="selo contra">vermelho, contra</span>, <span style="color:#ca8a04;font-weight:600">amarelo, os dois</span>, cinza, só fatos processuais.</li>
      <li>Borda vermelha no círculo: teve pedido de indiciamento na CPI (não é condenação).</li>
      <li><strong>Clique</strong> num círculo para ver os atos com as fontes. Use a roda do mouse ou os botões para aproximar.</li></ul>`;
  }

  // busca
  const busca = document.getElementById("rede-busca");
  if (busca) {
    const lista = document.getElementById("rede-nomes");
    lista.innerHTML = nos.map((n) => `<option value="${esc(n.nome)}">`).join("");
    busca.addEventListener("change", () => { const n = nos.find((x) => x.nome.toLowerCase() === busca.value.trim().toLowerCase()); if (n) selecionar(n); });
  }
  painel.innerHTML = painelInicial();
  return { total: nos.length, ligacoes: arestas.length };
}
