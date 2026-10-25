// Página Processos: o que aconteceu com as decisões abertas a partir da CPI.
//
// Três colunas, como o grafo da rede mostra ligações: à esquerda quando foi e
// em que altura da pandemia, ao centro a decisão, à direita quem responde nela.
// É grade HTML, e não SVG, de propósito — aqui o texto é longo, precisa quebrar
// linha, ser selecionável e ser lido por leitor de tela. A relação de grafo (a
// mesma pessoa reaparecendo em processos distintos) aparece ao escolher alguém:
// as linhas dela acendem e as outras apagam.
import { carregarCSV, esc, dataBR, quando, mortesAte, carregarMortes, fmt } from "./csv.js";

const $ = (id) => document.getElementById(id);

const ROTULO_ESTADO = {
  arquivado: "arquivado",
  "com sanção": "com sanção",
  "decidido no mérito": "decidido no mérito",
  "em curso": "em curso",
  encerrado: "encerrado",
  sigiloso: "sob sigilo",
  "sem estado": "sem situação registrada",
};

const [dados, mortes] = await Promise.all([
  fetch("dados/processos.json").then((r) => r.json()),
  carregarMortes(),
]);
const PROCESSOS = dados.processos;
const ESTADOS_UF = await carregarCSV("dados/estados.csv");
const SERIE = await carregarCSV("dados/mortes_brasil.csv");

const filtro = { orgao: "", estado: "", pessoa: "" };

// ---------------------------------------------------------------- o saldo
function saldo() {
  const porEstado = {};
  for (const p of PROCESSOS) porEstado[p.estado] = (porEstado[p.estado] || 0) + 1;
  const pets = PROCESSOS.filter((p) => p.numero.startsWith("Pet 10.0"));
  const cartoes = [
    { n: PROCESSOS.length, rot: "decisões registradas", det: "judiciais e de órgãos de controle" },
    { n: porEstado.arquivado || 0, rot: "arquivadas", det: `de ${PROCESSOS.length}` },
    { n: porEstado["com sanção"] || 0, rot: "com sanção", det: "multa ou inidoneidade, nenhuma penal" },
    { n: 0, rot: "condenações criminais", det: "até out/2026, nas fontes deste acervo" },
  ];
  $("saldo").innerHTML = cartoes.map((c) => `<div class="cartao-numero">
    <strong>${fmt(c.n)}</strong><span>${esc(c.rot)}</span><small>${esc(c.det)}</small></div>`).join("");
  $("saldo").removeAttribute("aria-busy");
  const pendentes = pets.filter((p) => p.estado === "em curso").length;
  $("saldo-nota").textContent =
    `Das dez petições abertas no STF a partir do relatório, ${pets.filter((p) => p.estado === "arquivado").length} `
    + `foram arquivadas, ${pendentes} seguem pendentes e ${pets.filter((p) => p.estado === "sigiloso").length} correm sob sigilo. `
    + "Pedido de indiciamento não é condenação, e nenhuma destas decisões é uma.";
}

// ------------------------------------------------------------- as dez Pet
function tabelaPets() {
  const pets = PROCESSOS.filter((p) => p.numero.startsWith("Pet 10.0"))
    .sort((a, b) => a.numero.localeCompare(b.numero, "pt-BR", { numeric: true }));
  $("pets").innerHTML = `<thead><tr><th>Petição</th><th>Quem responde</th><th>Desfecho</th><th>Situação em out/2026</th></tr></thead>
    <tbody>${pets.map((p) => `<tr>
      <td><button type="button" class="link-tabela" data-proc="${esc(chave(p))}">${esc(p.numero)}</button></td>
      <td>${p.envolvidos.map((e) => `<a href="envolvidos.html?id=${encodeURIComponent(e.id)}">${esc(e.nome)}</a>`).join(", ") || "—"}</td>
      <td><span class="selo-estado e-${esc(p.estado.replace(/\s/g, "-"))}">${esc(ROTULO_ESTADO[p.estado] || p.estado)}</span>${p.definitivo ? ' <span class="nota">· transitado em julgado</span>' : ""}</td>
      <td>${esc(p.situacao || "—")}</td></tr>`).join("")}</tbody>`;
}

const chave = (p) => `${p.data}|${p.orgao}|${p.numero}|${p.texto.slice(0, 40)}`;

// ------------------------------------------------- as três colunas, por data
function visivel(p) {
  if (filtro.orgao && p.orgao !== filtro.orgao) return false;
  if (filtro.estado && p.estado !== filtro.estado) return false;
  if (filtro.pessoa && !p.envolvidos.some((e) => e.id === filtro.pessoa)) return false;
  return true;
}

function linha(p) {
  const rotulos = [quando(p.data), mortesAte(p.data)].filter(Boolean)
    .map((t) => `<span class="desde-marco">${esc(t)}</span>`).join(" ");
  const quem = p.envolvidos.length
    ? p.envolvidos.map((e) => `<a class="chip-pessoa${filtro.pessoa === e.id ? " escolhido" : ""}"
        href="envolvidos.html?id=${encodeURIComponent(e.id)}">${esc(e.nome)}</a>`).join("")
    : '<span class="nota">—</span>';
  return `<li class="proc-linha e-${esc(p.estado.replace(/\s/g, "-"))}">
    <div class="proc-quando"><strong>${esc(dataBR(p.data))}</strong>${rotulos}</div>
    <div class="proc-centro">
      <button type="button" class="proc-abrir" data-proc="${esc(chave(p))}">
        <span class="proc-orgao">${esc(p.orgao || "—")}</span>
        ${p.numero ? `<span class="proc-numero">${esc(p.numero)}</span>` : ""}
        <span class="selo-estado e-${esc(p.estado.replace(/\s/g, "-"))}">${esc(ROTULO_ESTADO[p.estado] || p.estado)}</span>
        ${p.definitivo ? '<span class="selo-transito">transitado</span>' : ""}
      </button>
      <p class="proc-texto">${esc(p.rotulo ? `${p.rotulo}: ` : "")}${esc(recorte(p.texto, 180))}</p>
    </div>
    <div class="proc-quem">${quem}</div>
  </li>`;
}

const recorte = (t, n) => (t.length > n ? `${t.slice(0, n).replace(/\s\S*$/, "")}…` : t);

function desenhar() {
  const vis = PROCESSOS.filter(visivel);
  const caixa = document.querySelector(".rolagem-processos");
  caixa.innerHTML = vis.length
    ? `<ol class="proc-grade"><li class="proc-cabecalho" aria-hidden="true">
        <div>Quando</div><div>A decisão</div><div>Quem responde</div></li>${vis.map(linha).join("")}</ol>`
    : '<p class="nota">Nenhuma decisão com esses filtros.</p>';
  const totalPessoas = new Set(vis.flatMap((p) => p.envolvidos.map((e) => e.id))).size;
  $("contagem").textContent = `${vis.length} de ${PROCESSOS.length} decisões · ${totalPessoas} pessoas ou empresas`;
}

// ------------------------------------------------------------- o painel
function abrir(k) {
  const p = PROCESSOS.find((x) => chave(x) === k);
  if (!p) return;
  const painel = $("painel");
  painel.innerHTML = `<button type="button" class="fechar-painel" aria-label="Fechar">✕</button>
    <h3>${esc(p.orgao || "Decisão")}${p.numero ? ` · ${esc(p.numero)}` : ""}</h3>
    <p class="nota">${esc(dataBR(p.data))}${quando(p.data) ? ` · ${esc(quando(p.data))}` : ""}${mortesAte(p.data) ? ` · ${esc(mortesAte(p.data))}` : ""}</p>
    ${p.rotulo ? `<p><strong>${esc(p.rotulo)}</strong></p>` : ""}
    ${p.relator ? `<p class="nota">Relator(a): ${esc(p.relator)}</p>` : ""}
    <p>${esc(p.texto)}</p>
    ${p.situacao ? `<p><strong>Situação em out/2026:</strong> ${esc(p.situacao)}${p.definitivo ? " <em>(transitado em julgado)</em>" : ""}</p>` : '<p class="nota">Sem situação registrada neste levantamento.</p>'}
    <h4>Quem responde</h4>
    <p>${p.envolvidos.map((e) => `<a href="envolvidos.html?id=${encodeURIComponent(e.id)}">${esc(e.nome)}</a>`).join(" · ") || "—"}</p>
    ${p.fontes.length ? `<p class="nota">${p.fontes.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">fonte${p.fontes.length > 1 ? ` ${i + 1}` : ""}</a>`).join(" · ")}</p>` : ""}
    <p class="nota">⚖️ Decisão de órgão de controle é sanção administrativa, não penal. Pedido de indiciamento não é condenação.</p>`;
  painel.hidden = false;
  painel.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// -------------------------------------------------- a curva das mortes
function curva() {
  const L = 54, R = 16, T = 16, B = 34, W = 920, H = 360;
  const pts = SERIE.map((r) => ({ d: r.data, n: Number(r.mortes_acumuladas) }));
  const maxN = pts[pts.length - 1].n;
  const t0 = Date.parse(pts[0].d), t1 = Date.parse(pts[pts.length - 1].d);
  const x = (d) => L + ((Date.parse(d) - t0) / (t1 - t0)) * (W - L - R);
  const y = (n) => H - B - (n / maxN) * (H - T - B);

  // cobertura vacinal nacional, ponderada por população, do próprio acervo
  const pop = ESTADOS_UF.reduce((s, e) => s + Number(e.populacao_tcu_2019), 0);
  const cob = (col) => ESTADOS_UF.reduce((s, e) => s + Number(e.populacao_tcu_2019) * Number(e[col]) / 100, 0) / pop * 100;
  const vac = [
    { d: "2021-01-17", v: 0 }, { d: "2021-06-30", v: cob("vac_completo_2021_06") },
    { d: "2021-12-31", v: cob("vac_completo_2021_12") }, { d: "2022-09-30", v: cob("vac_completo_2022_09") },
  ];
  const yv = (v) => H - B - (v / 100) * (H - T - B);

  // o degrau em `alt` evita que os rótulos se empilhem: as três primeiras datas
  // ficam a menos de três meses uma da outra e, no mesmo y, viravam uma mancha
  const MARCOS = [
    { d: "2020-07-30", t: "Butantan oferece doses", alt: 0 },
    { d: "2020-10-21", t: "“não será comprada”", alt: 1 },
    { d: "2021-01-17", t: "1ª vacina no Brasil", alt: 2 },
    { d: "2021-10-26", t: "relatório da CPI", alt: 0 },
  ];
  const linha = (arr, fx, fy) => arr.map((p, i) => `${i ? "L" : "M"}${fx(p).toFixed(1)},${fy(p).toFixed(1)}`).join(" ");

  $("curva").setAttribute("viewBox", `0 0 ${W} ${H}`);
  $("curva").innerHTML = `
    <g class="eixo">
      ${[0, 0.25, 0.5, 0.75, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${y(maxN * f)}" y2="${y(maxN * f)}"></line>
        <text x="${L - 6}" y="${y(maxN * f) + 4}" text-anchor="end">${fmt(Math.round(maxN * f / 1000))}k</text>`).join("")}
      ${["2020", "2021", "2022", "2023"].map((a) => `<text x="${x(`${a}-01-01`)}" y="${H - B + 18}" text-anchor="middle">${a}</text>`).join("")}
    </g>
    <path class="area-mortes" d="${linha(pts, (p) => x(p.d), (p) => y(p.n))} L${x(pts[pts.length - 1].d).toFixed(1)},${H - B} L${L},${H - B} Z"></path>
    <path class="linha-mortes" d="${linha(pts, (p) => x(p.d), (p) => y(p.n))}"></path>
    <path class="linha-vacina" d="${linha(vac, (p) => x(p.d), (p) => yv(p.v))}"></path>
    ${vac.filter((p) => p.v > 0).map((p) => `<circle class="ponto-vacina" cx="${x(p.d).toFixed(1)}" cy="${yv(p.v).toFixed(1)}" r="4"></circle>
      <text class="rot-vacina" x="${x(p.d).toFixed(1)}" y="${(yv(p.v) - 10).toFixed(1)}" text-anchor="middle">${p.v.toFixed(0)}% vacinados</text>`).join("")}
    ${MARCOS.map((m) => {
      const yr = T + 11 + m.alt * 14;
      const fim = x(m.d) > W * 0.72;   // perto da borda, o rótulo vira para a esquerda
      return `<line class="marco" x1="${x(m.d).toFixed(1)}" x2="${x(m.d).toFixed(1)}" y1="${yr - 8}" y2="${H - B}"></line>
        <text class="rot-marco" x="${(x(m.d) + (fim ? -5 : 5)).toFixed(1)}" y="${yr}" text-anchor="${fim ? "end" : "start"}">${esc(m.t)}</text>`;
    }).join("")}`;

  const ate = (d) => (SERIE.filter((r) => r.data <= d).pop() || { mortes_acumuladas: 0 }).mortes_acumuladas;
  $("curva-legenda").innerHTML =
    `A área cinzenta é o total de mortes registradas pelo painel do Ministério da Saúde; a linha fina é a parcela da população com esquema vacinal completo. `
    + `A série vai de ${dataBR(SERIE[0].data)} a ${dataBR(SERIE[SERIE.length - 1].data)} e termina em <strong>${fmt(Number(ate("2023-03-18")))}</strong> mortes. `
    + `O painel seguiu registrando depois: ${fmt(716626)} na soma dos 27 estados em out/2026.`;

  const marcos = [
    ["Até a 1ª dose (17/01/2021)", ate("2021-01-17"), "nenhuma"],
    ["Da 1ª dose a jun/2021", ate("2021-06-30") - ate("2021-01-17"), `chega a ${cob("vac_completo_2021_06").toFixed(1)}%`],
    ["Jul a dez/2021", ate("2021-12-31") - ate("2021-06-30"), `vai a ${cob("vac_completo_2021_12").toFixed(1)}%`],
    ["2022 até o fim da série", ate("2023-03-18") - ate("2021-12-31"), `acima de ${cob("vac_completo_2021_12").toFixed(0)}%`],
  ];
  const total = Number(ate("2023-03-18"));
  $("periodos").innerHTML = `<thead><tr><th>Período</th><th>Mortes</th><th>% do total</th><th>Cobertura com esquema completo</th></tr></thead>
    <tbody>${marcos.map(([rot, n, c]) => `<tr><td>${esc(rot)}</td><td class="num">${fmt(Number(n))}</td>
      <td class="num">${(Number(n) / total * 100).toFixed(1)}%</td><td>${esc(c)}</td></tr>`).join("")}</tbody>`;
}

// ------------------------------------------------------------- filtros
function montarFiltros() {
  const opcoes = (sel, lista, rot = (v) => v) => {
    $(sel).insertAdjacentHTML("beforeend",
      lista.map(([v, n]) => `<option value="${esc(v)}">${esc(rot(v))} (${n})</option>`).join(""));
  };
  const conta = (f) => {
    const m = new Map();
    for (const p of PROCESSOS) for (const k of f(p)) m.set(k, (m.get(k) || 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  opcoes("f-orgao", conta((p) => (p.orgao ? [p.orgao] : [])));
  opcoes("f-estado", conta((p) => [p.estado]), (v) => ROTULO_ESTADO[v] || v);
  const nomes = new Map();
  for (const p of PROCESSOS) for (const e of p.envolvidos) nomes.set(e.id, e.nome);
  opcoes("f-pessoa", conta((p) => p.envolvidos.map((e) => e.id)), (v) => nomes.get(v) || v);

  for (const [id, campo] of [["f-orgao", "orgao"], ["f-estado", "estado"], ["f-pessoa", "pessoa"]]) {
    $(id).addEventListener("change", (e) => { filtro[campo] = e.target.value; desenhar(); });
  }
  $("limpar").addEventListener("click", () => {
    for (const id of ["f-orgao", "f-estado", "f-pessoa"]) $(id).value = "";
    filtro.orgao = filtro.estado = filtro.pessoa = "";
    desenhar();
  });
}

document.addEventListener("click", (e) => {
  const abre = e.target.closest("[data-proc]");
  if (abre) { abrir(abre.dataset.proc); return; }
  if (e.target.closest(".fechar-painel")) $("painel").hidden = true;
});

saldo();
tabelaPets();
montarFiltros();
desenhar();
curva();
