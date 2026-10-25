// Rede de conexões pessoa ↔ tema, em SVG puro (sem bibliotecas).
// Dados: dados/rede.json (gerado por scripts/gerar_rede.py), dados/atos.csv e dados/pessoas.csv.
import { carregarCSV, esc, dataBR, quando, urlsFonte } from "./csv.js";

const NS = "http://www.w3.org/2000/svg";
export const COR_TEMA = { prevent: "#a855f7", contratos: "#ca8a04", manaus: "#0ea5e9", cloroquina: "#f97316", vacinas: "#16a34a",
  distanciamento: "#14b8a6", desinformacao: "#ef4444", gestao: "#94a3b8", justica: "#3b82f6", outros: "#6b7280" };
export const COR_LIGA = { favor: "#16a34a", contra: "#dc2626", ambos: "#a16207", processual: "#6b7280" };
// Cor por esfera de atuação, sem juízo: verde e vermelho ficam só para os atos (ligações).
export const COR_ESFERA = { "Governo federal": "#3b82f6", "Congresso": "#a855f7", "Governos estaduais": "#b45309",
  "Judiciário": "#64748b", "Saúde, ciência e imprensa": "#0d9488", "Setor privado": "#db2777", "Médicos": "#ea580c" };
export const ESFERA = {
  "Presidência da República e família": "Governo federal", "Ministério da Saúde": "Governo federal", "Outros ministérios e órgãos federais": "Governo federal",
  "Parlamentares": "Congresso", "Senadores da CPI": "Congresso", "Governos estaduais": "Governos estaduais", "Judiciário": "Judiciário",
  "Instituições de saúde e SUS": "Saúde, ciência e imprensa", "Cientistas, imprensa e sociedade civil": "Saúde, ciência e imprensa",
  "Empresários, comunicadores e influenciadores": "Setor privado", "Contratos de vacina e logística (Covaxin, Davati, VTCLog)": "Setor privado",
  "Prevent Senior": "Setor privado", "Empresas (pessoa jurídica)": "Setor privado",
  "Médicos e conselheiros citados pela CPI (cloroquina e \"gabinete paralelo\")": "Médicos", "Médicos que defenderam o \"tratamento precoce\"": "Médicos" };
export const COR_GRUPO = Object.fromEntries(Object.entries(ESFERA).map(([g, e]) => [g, COR_ESFERA[e]]));
const NOME_LIGA = { favor: "a favor", contra: "contra", ambos: "a favor e contra", processual: "só processual" };

const tipoLiga = (a) => (a.favor && a.contra ? "ambos" : a.contra ? "contra" : a.favor ? "favor" : "processual");
function el(nome, attrs = {}, pai) {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (pai) pai.appendChild(e);
  return e;
}

export async function montarRede(alvo, painel, opcoes = {}) {
  const [rede, atos, pessoas, fotos, ufs, estadosUF] = await Promise.all([
    fetch("dados/rede.json").then((r) => r.json()), carregarCSV("dados/atos.csv"), carregarCSV("dados/pessoas.csv"), carregarCSV("dados/fotos.csv").catch(() => []),
    carregarCSV("dados/pessoas_uf.csv").catch(() => []), carregarCSV("dados/estados.csv").catch(() => [])]);
  const ufDe = new Map(ufs.map((u) => [u.id, u]));
  const ufsDe = (id) => (ufDe.get(id)?.uf || "Federal").split(";");
  const fotoDe = new Map(fotos.map((f) => [f.id, f]));
  const fichas = Object.fromEntries(pessoas.map((p) => [p.id, p]));
  const nos = rede.nos.map((n) => ({ ...n, vx: 0, vy: 0 }));
  const porId = new Map(nos.map((n) => [n.id, n]));
  const arestas = rede.arestas.map((a) => ({ ...a, tipo: tipoLiga(a), de_: porId.get(a.de), para_: porId.get(a.para) }));
  for (const n of nos) { n.total = 0; n.grau = 0; }
  for (const a of arestas) { const t = a.favor + a.contra + a.processual; a.de_.total += t; a.para_.total += t; a.de_.grau++; a.para_.grau++; }

  const L = opcoes.largura || 1400, A = opcoes.altura || 900;
  const temas = nos.filter((n) => n.tipo === "tema");
  const atores = nos.filter((n) => n.tipo !== "tema");
  const soma = (a) => a.favor + a.contra + a.processual;
  for (const n of nos) n.r = n.tipo === "tema" ? 18 + Math.sqrt(n.total) * 2.4 : Math.max(4 + Math.sqrt(n.total) * 1.5, fotoDe.has(n.id) ? 9 : 0);

  // Arranjo em grupos: cada pessoa fica junto do tema em que mais atuou (o "tema principal").
  // Os temas formam um anel; cada tema ocupa no anel um espaço proporcional ao tamanho do seu grupo.
  const membros = new Map(temas.map((t) => [t.id, []]));
  for (const n of atores) {
    const suas = arestas.filter((a) => a.de === n.id).sort((a, b) => soma(b) - soma(a) || b.contra - a.contra);
    n.principal = suas[0]?.para || temas[temas.length - 1].id;
    membros.get(n.principal).push(n);
  }
  const ESP = 14; // espaçamento entre pessoas dentro do grupo
  const raioGrupo = (t) => t.r + 12 + ESP * Math.sqrt(membros.get(t.id).length + 1) * 1.2;
  const totalArco = temas.reduce((s, t) => s + 2 * raioGrupo(t) + 40, 0);
  const R = totalArco / (2 * Math.PI), estica = Math.min(Math.max(Math.sqrt(L / A), 0.6), 1.3);
  let arco = 0;
  for (const t of temas) {
    const meio = arco + raioGrupo(t) + 20; arco += 2 * raioGrupo(t) + 40;
    t.ang = (meio / totalArco) * 2 * Math.PI - Math.PI / 2;
    t.x = Math.cos(t.ang) * R * estica; t.y = Math.sin(t.ang) * R / estica; t.fixo = true;
    // espiral de girassol: quem tem mais atos fica mais perto do tema
    membros.get(t.id).sort((a, b) => b.total - a.total).forEach((n, k) => {
      const rr = t.r + 10 + ESP * Math.sqrt(k + 0.6) * 1.2, ang = k * 2.39996 + t.ang;
      n.x = n.ax = t.x + Math.cos(ang) * rr; n.y = n.ay = t.y + Math.sin(ang) * rr;
    });
  }
  // Afasta pontos sobrepostos (uma vez, antes de desenhar), sem tirar ninguém do seu grupo.
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) {
      const a = nos[i], b = nos[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r + 4;
      if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
      const d = Math.hypot(dx, dy) || 0.01; if (d >= min) continue;
      const m = (min - d) / d / (a.fixo || b.fixo ? 1 : 2);
      if (!a.fixo) { a.x -= dx * m; a.y -= dy * m; }
      if (!b.fixo) { b.x += dx * m; b.y += dy * m; }
    }
    for (const n of atores) { n.x += (n.ax - n.x) * 0.02; n.y += (n.ay - n.y) * 0.02; }
  }
  // Nome de cada tema por fora do seu grupo, longe das pessoas.
  for (const t of temas) {
    t.ext = Math.max(t.r, ...membros.get(t.id).map((m) => Math.hypot(m.x - t.x, m.y - t.y) + m.r)) + 14;
    const c = Math.cos(t.ang), s = Math.sin(t.ang), larg = t.nome.length * 7.6;
    t.ancora = c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
    t.rx = c * t.ext; t.ry = s * t.ext + (s > 0.3 ? 12 : s < -0.3 ? -2 : 5);
    const ex = t.x + t.rx - (t.ancora === "end" ? larg : t.ancora === "middle" ? larg / 2 : 0);
    t.caixa = [ex, t.y + t.ry - 14, ex + larg, t.y + t.ry + 4];
  }
  // Quadro inicial: tudo o que foi desenhado, com os nomes dos temas, na proporção da tela.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nos) { x0 = Math.min(x0, n.x - n.r); x1 = Math.max(x1, n.x + n.r); y0 = Math.min(y0, n.y - n.r - 16); y1 = Math.max(y1, n.y + n.r); }
  for (const t of temas) { x0 = Math.min(x0, t.caixa[0]); y0 = Math.min(y0, t.caixa[1]); x1 = Math.max(x1, t.caixa[2]); y1 = Math.max(y1, t.caixa[3]); }
  x0 -= 20; x1 += 20; y0 -= 20; y1 += 20;
  let bw = x1 - x0, bh = y1 - y0;
  if (bw / bh < L / A) { const w = (bh * L) / A; x0 -= (w - bw) / 2; bw = w; } else { const h = (bw * A) / L; y0 -= (h - bh) / 2; bh = h; }
  const BASE = { x: x0, y: y0, w: bw, h: bh };

  const filtros = { temas: new Set(temas.map((t) => t.id)), ligas: new Set(Object.keys(COR_LIGA)), soCpi: false, uf: "", todas: false };
  const visivel = (a) => filtros.temas.has(a.para) && filtros.ligas.has(a.tipo) && (!filtros.soCpi || a.de_.cpi) && (!filtros.uf || ufsDe(a.de).includes(filtros.uf));

  alvo.innerHTML = "";
  const svg = el("svg", { viewBox: `${BASE.x} ${BASE.y} ${BASE.w} ${BASE.h}`, class: "rede-svg", role: "img", "aria-label": "Rede de conexões entre pessoas e temas da pandemia" }, alvo);
  const defs = el("defs", {}, svg);
  const brilho = el("filter", { id: "brilho", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: "4", result: "b" }, brilho);
  const mg = el("feMerge", {}, brilho); el("feMergeNode", { in: "b" }, mg); el("feMergeNode", { in: "SourceGraphic" }, mg);
  const g = el("g", {}, svg), gl = el("g", {}, g), gn = el("g", {}, g);
  const dica = document.createElement("div"); dica.className = "rede-dica"; dica.hidden = true; alvo.appendChild(dica);

  for (const a of arestas) {
    a.el = el("line", { stroke: COR_LIGA[a.tipo], "stroke-width": 0.8 + Math.min(soma(a), 8) * 0.35, "stroke-opacity": 0.5, "stroke-linecap": "round" }, gl);
  }
  for (const n of nos) {
    const tema = n.tipo === "tema";
    n.g = el("g", { class: "no", tabindex: 0, role: "button", "aria-label": n.nome }, gn);
    // Área de toque invisível: no dedo, um círculo de 13px de raio é alvo
    // pequeno demais. Fica atrás de tudo e não muda nada no visual.
    el("circle", { r: Math.max(n.r, 20), fill: "transparent", class: "alvo-toque" }, n.g);
    const cor = tema ? COR_TEMA[n.id.slice(5)] : COR_GRUPO[n.grupo] || "#93c5fd";
    const foto = !tema && fotoDe.get(n.id);
    if (foto) {
      const pid = "foto-" + n.id;
      const pat = el("pattern", { id: pid, width: 1, height: 1, patternContentUnits: "objectBoundingBox" }, defs);
      el("image", { href: foto.arquivo, width: 1, height: 1, preserveAspectRatio: "xMidYMid slice" }, pat);
      el("circle", { r: n.r, fill: `url(#${pid})`, ...(n.cpi ? { class: "borda-cpi" } : { stroke: cor }), "stroke-width": 2 }, n.g);
    } else {
      // O contorno segue o tema: a cor do fundo (some) ou o vermelho da CPI.
      // Antes era fixo em #0b0d10, feito para o fundo escuro — virava um anel
      // escuro quando o site passou a abrir claro.
      el("circle", { r: n.r, fill: cor, class: !tema && n.cpi ? "borda-cpi" : "borda-fundo", "stroke-width": tema ? 3 : n.cpi ? 2 : 1, filter: tema ? "url(#brilho)" : "" }, n.g);
    }
    if (tema) {
      n.rot = el("text", { x: n.rx, y: n.ry, "text-anchor": n.ancora, class: "rot-tema" }, n.g);
    } else n.rot = el("text", { y: -n.r - 5, "text-anchor": "middle", class: "rot-pessoa" }, n.g);
    n.rot.textContent = n.nome;
  }

  // zoom e arrasto do fundo
  let vb = { ...BASE };
  const aplicar = () => { svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); rotulos(); };
  const zoom = (f, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2) => {
    const w = Math.min(Math.max(vb.w * f, BASE.w / 8), BASE.w * 1.6), h = (w * BASE.h) / BASE.w;
    vb = { x: cx - ((cx - vb.x) * w) / vb.w, y: cy - ((cy - vb.y) * h) / vb.h, w, h }; aplicar();
  };
  const ponto = (e) => { const p = svg.getBoundingClientRect(); return { x: vb.x + ((e.clientX - p.left) / p.width) * vb.w, y: vb.y + ((e.clientY - p.top) / p.height) * vb.h }; };
  svg.addEventListener("wheel", (e) => { e.preventDefault(); const p = ponto(e); zoom(e.deltaY > 0 ? 1.15 : 0.87, p.x, p.y); }, { passive: false });

  let arrasto = null, arrastou = false, partida = null;
  const LIMIAR = 10;  // pixels

  // Dedos encostados na tela. Com dois, vira pinça de zoom — no celular não há
  // roda de mouse, e o .rede-quadro usa touch-action:none, que desliga o zoom
  // nativo do navegador. Sem isto o grafo fica preso num único nível.
  const dedos = new Map();
  let pinca = null;
  const distancia = () => {
    const [a, b] = [...dedos.values()];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const meio = () => {
    const [a, b] = [...dedos.values()];
    const r = svg.getBoundingClientRect();
    return {
      x: vb.x + (((a.clientX + b.clientX) / 2 - r.left) / r.width) * vb.w,
      y: vb.y + (((a.clientY + b.clientY) / 2 - r.top) / r.height) * vb.h,
    };
  };

  svg.addEventListener("pointerdown", (e) => {
    dedos.set(e.pointerId, e);
    if (dedos.size === 2) {               // começou a pinça: cancela o arraste em curso
      if (arrasto?.no) arrasto.no.preso = false;
      arrasto = null; arrastou = true;
      pinca = { d: distancia(), c: meio() };
      return;
    }
    if (dedos.size > 2) return;
    const gno = e.target.closest(".no"); arrastou = false;
    const n = gno && nos.find((x) => x.g === gno);
    // guarda onde o dedo encostou: só vira arraste depois de passar o limiar
    partida = { x: e.clientX, y: e.clientY };
    if (n) { arrasto = { no: n }; n.preso = true; } else arrasto = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (dedos.has(e.pointerId)) dedos.set(e.pointerId, e);
    if (pinca && dedos.size === 2) {
      const d = distancia();
      if (d > 0 && pinca.d > 0) { zoom(pinca.d / d, pinca.c.x, pinca.c.y); pinca.d = d; }
      return;
    }
    if (!arrasto) return;
    // No dedo o toque sempre treme alguns pixels. Sem este limiar, qualquer
    // toque virava arraste e a seleção do nó nunca acontecia no celular.
    if (!arrastou && partida && Math.hypot(e.clientX - partida.x, e.clientY - partida.y) < LIMIAR) return;
    arrastou = true;
    if (arrasto.no) { const p = ponto(e); arrasto.no.x = p.x; arrasto.no.y = p.y; desenhar(); }
    else { const r = svg.getBoundingClientRect(); vb.x = arrasto.vx - ((e.clientX - arrasto.x) / r.width) * vb.w; vb.y = arrasto.vy - ((e.clientY - arrasto.y) / r.height) * vb.h; aplicar(); }
  });
  // O painel fica dentro do .rede-quadro, que tem touch-action:none. Sem isto,
  // o dedo que rola o texto era lido pelo grafo como arraste, e ao soltar o
  // grafo entendia "toque no vazio" e fechava o painel.
  if (painel) {
    for (const ev of ["pointerdown", "pointermove", "pointerup", "wheel", "touchstart", "touchmove"]) {
      painel.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    }
  }
  const filtrosEl = document.getElementById("filtros");
  if (filtrosEl) {
    for (const ev of ["pointerdown", "pointermove", "pointerup", "wheel", "touchstart", "touchmove"]) {
      filtrosEl.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    }
  }

  const soltar = (e) => {
    dedos.delete(e.pointerId);
    if (dedos.size < 2) pinca = null;
    const a = arrasto; arrasto = null;
    if (a?.no) { a.no.preso = false; if (!arrastou) selecionar(a.no); }
    else if (!arrastou && !e.target.closest(".no")) selecionar(null);
  };
  svg.addEventListener("pointerup", soltar);
  svg.addEventListener("pointercancel", soltar);

  function desenhar() {
    for (const n of nos) n.g.setAttribute("transform", `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`);
    for (const a of arestas) { a.el.setAttribute("x1", a.de_.x); a.el.setAttribute("y1", a.de_.y); a.el.setAttribute("x2", a.para_.x); a.el.setAttribute("y2", a.para_.y); }
  }
  function rotulos() {
    // Nomes só dos mais atuantes; os outros aparecem ao aproximar, ao passar o
    // mouse ou num filtro.
    // Em tela estreita os limiares sobem bastante: a 390px, mostrar todos os
    // nomes a partir de 2,4x empilhava mais de cem rótulos uns sobre os outros.
    // No toque não há hover, então quem quiser o nome toca no nó e lê no painel.
    const escala = BASE.w / vb.w;
    const estreito = window.matchMedia("(max-width: 700px)").matches;
    const porEscala = estreito ? 6 : 2.4;
    const porAtos = escala > 1.5 ? (estreito ? 16 : 6) : (estreito ? 24 : 12);
    for (const n of nos) if (n.tipo !== "tema") n.rot.style.display = n.destaque || (filtros.uf && n.ativo) || escala > porEscala || n.total >= porAtos ? "" : "none";
  }

  // filtros
  function aplicarFiltros() {
    for (const n of nos) n.ativo = n.tipo === "tema" ? filtros.temas.has(n.id) : false;
    // a ligação principal de cada pessoa é a de mais atos entre as que passam no filtro
    const melhor = new Map();
    for (const a of arestas) {
      a.principal = false;
      if (!visivel(a)) continue;
      a.de_.ativo = true;
      // a do tema onde a pessoa está desenhada vence sempre que passa no filtro (linha curta)
      const m = melhor.get(a.de);
      if (!m || (m.para !== a.de_.principal && (a.para === a.de_.principal || soma(a) > soma(m)))) melhor.set(a.de, a);
    }
    for (const a of melhor.values()) a.principal = true;
    for (const n of nos) n.g.style.display = n.ativo ? "" : "none";
    selecionar(atual);
  }

  // destaque e seleção
  let atual = null;
  function destacar(n) {
    const viz = new Set();
    for (const a of arestas) {
      const v = visivel(a), liga = n && v && (a.de === n.id || a.para === n.id);
      // fora do destaque, só a ligação principal de cada pessoa (ou todas, se pedido)
      a.el.style.display = v && (liga || a.principal || filtros.todas) ? "" : "none";
      a.el.setAttribute("stroke-opacity", !n ? (a.principal ? 0.55 : 0.3) : liga ? 0.95 : 0.05);
      if (liga) { viz.add(a.de); viz.add(a.para); }
    }
    for (const x of nos) { x.destaque = n && viz.has(x.id); x.g.style.opacity = !n || viz.has(x.id) ? 1 : 0.12; }
    rotulos();
  }
  function selecionar(n) {
    atual = n; destacar(n);
    // No celular o painel cobre os 70% de baixo. Sem isto, o leitor abria a
    // ficha e perdia de vista o nó de quem ela fala.
    if (n && opcoes.painelFlutuante && window.matchMedia("(max-width: 700px)").matches) {
      vb.x = n.x - vb.w / 2;
      vb.y = n.y - vb.h * 0.14;
      aplicar();
    }
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
    const urls = urlsFonte(a.fonte);
    const refs = urls.length
      ? urls.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">${urls.length > 1 ? `fonte ${i + 1}` : "fonte"}</a>`).join(" · ")
      : "";
    const rot = quando(a.data);
    return `<li class="${cls}"><span class="data">${dataBR(a.data)}</span>${rot ? ` <span class="desde-marco">${esc(rot)}</span>` : ""} <span class="tipo">(${esc(a.tipo)})</span> ${esc(a.ato)} ${refs}</li>`;
  }
  function detalhe(n) {
    if (n.tipo === "tema") {
      const lig = arestas.filter((a) => a.para === n.id && visivel(a)).sort((a, b) => b.contra + b.favor - (a.contra + a.favor));
      return `<h3><span class="ponto" style="background:${COR_TEMA[n.id.slice(5)]}"></span>${esc(n.nome)}</h3><p class="nota">${lig.length} pessoas ou instituições ligadas a este tema.</p>
        <ul class="lista-simples">${lig.map((a) => `<li><a href="#" data-sel="${esc(a.de)}">${esc(a.de_.nome)}</a> <span class="selo favor">🟢 ${a.favor}</span> <span class="selo contra">🔴 ${a.contra}</span></li>`).join("")}</ul>`;
    }
    const lig = arestas.filter((a) => a.de === n.id && visivel(a));
    const p = fichas[n.id] || {};
    const ft = fotoDe.get(n.id);
    return `${ft ? `<a class="ampliar-foto" href="imagem.html?foto=${encodeURIComponent(n.id)}" title="Abrir a foto em tamanho grande"><img class="avatar grande" src="${esc(ft.arquivo)}" alt="Foto oficial de ${esc(n.nome)}" width="72" height="72"></a><p class="nota">${esc(ft.credito)}</p>` : ""}<h3><span class="ponto" style="background:${COR_GRUPO[n.grupo] || "#93c5fd"}"></span>${esc(n.nome)}</h3><p class="nota">${esc(p.cargo_epoca || "")}<br>${esc(n.grupo || "")}</p>
      ${ufDe.get(n.id) && ufDe.get(n.id).uf !== "Federal" ? `<p class="nota">📍 <a href="estados.html?uf=${esc(ufsDe(n.id)[0])}">${esc(ufsDe(n.id).join(", "))}</a> · ${esc(ufDe.get(n.id).vinculo)}</p>` : ""}
      ${p.crimes_cpi ? '<p class="nota">⚖️ Teve pedido de indiciamento na CPI. Pedido não é condenação.</p>' : ""}
      ${lig.map((a) => `<h4>${esc(a.para_.nome)} <span class="selo ${a.tipo === "ambos" ? "" : a.tipo}">(${NOME_LIGA[a.tipo]})</span></h4><ul class="atos">${a.atos.map(itemAto).join("")}</ul>`).join("")}
      <p><a href="envolvidos.html?id=${encodeURIComponent(n.id)}">Ficha completa, defesa e situação judicial →</a></p>`;
  }
  function painelInicial() {
    return `<h3>Como usar</h3><ul class="lista-simples">
      <li>Os <strong>círculos grandes</strong> são temas; os pequenos, pessoas e instituições, coloridos pela esfera de atuação.</li>
      <li>Cada pessoa fica <strong>junto do tema em que mais atuou</strong>, e só essa ligação aparece. Passe o mouse ou clique num ponto para ver todas as ligações dele.</li>
      <li>A <strong>cor da linha</strong> diz o que a pessoa fez no tema: <span class="selo favor">verde, a favor</span>; <span class="selo contra">vermelho, contra</span>; <span style="color:#ca8a04;font-weight:600">amarelo, os dois</span>; cinza, só fatos processuais. Linha mais grossa, mais atos.</li>
      <li>Borda vermelha: teve pedido de indiciamento na CPI (não é condenação).</li>
      <li>Passe o mouse para ver as conexões; <strong>clique</strong> para ver os atos com as fontes; use a roda ou os botões para aproximar.</li></ul>`;
  }
  if (painel) painel.addEventListener("click", (e) => {
    if (e.target.closest("[data-fechar]")) { selecionar(null); return; }
    const s = e.target.closest("[data-sel]"); if (!s) return;
    e.preventDefault(); selecionar(porId.get(s.dataset.sel));
  });

  const api = {
    total: nos.length, ligacoes: arestas.length, temas, nos,
    zoom: (f) => (f === 0 ? ((vb = { ...BASE }), aplicar()) : zoom(f)),
    alternarTema(id, on) { on ? filtros.temas.add(id) : filtros.temas.delete(id); aplicarFiltros(); },
    alternarLiga(t, on) { on ? filtros.ligas.add(t) : filtros.ligas.delete(t); aplicarFiltros(); },
    soCpi(on) { filtros.soCpi = on; aplicarFiltros(); },
    todasLigacoes(on) { filtros.todas = on; destacar(atual); },
    // filtro por estado: "" = todos; "Federal" = atuação federal; "SP", "RJ"... Devolve quantas pessoas ficaram.
    porEstado(uf) { filtros.uf = uf || ""; aplicarFiltros(); return nos.filter((n) => n.tipo !== "tema" && n.ativo).length; },
    estados: estadosUF.map((e) => ({ uf: e.uf, nome: e.estado, pessoas: ufs.filter((u) => u.uf.split(";").includes(e.uf) && porId.has(u.id)).length })),
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
  desenhar();
  aplicarFiltros();
  if (painel && !opcoes.painelFlutuante) painel.innerHTML = painelInicial();
  api.ajuda = painelInicial;
  return api;
}
