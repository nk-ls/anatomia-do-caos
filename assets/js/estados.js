// Página Estados: mortes por UF (painel do Ministério da Saúde), pessoas ligadas a cada estado e votos dos senadores na CPI.
import { carregarCSV, esc, fmt } from "./csv.js";
import { VOTOS } from "./diagramas.js";

const $ = (id) => document.getElementById(id);
const [estados, pessoasUF, pessoas] = await Promise.all([
  carregarCSV("dados/estados.csv"), carregarCSV("dados/pessoas_uf.csv"), carregarCSV("dados/pessoas.csv"),
]);
estados.forEach((e) => {
  e.obitos = Number(e.obitos); e.populacao = Number(e.populacao_tcu_2019); e.taxa = Number(e.obitos_100k);
  for (const k of Object.keys(e)) if (k.startsWith("vac_")) e[k] = Number(e[k]);
});
const ordem = [...estados].sort((a, b) => b.taxa - a.taxa);
ordem.forEach((e, i) => { e.posicao = i + 1; });
const totalObitos = estados.reduce((s, e) => s + e.obitos, 0);
const totalPop = estados.reduce((s, e) => s + e.populacao, 0);
const taxaBrasil = (totalObitos / totalPop) * 1e5;
const fichas = Object.fromEntries(pessoas.map((p) => [p.id, p]));
const ufDoVoto = (v) => v.partido.split("-").pop();
// preposição correta: "do Rio de Janeiro", "da Bahia", "de São Paulo"
const ART = { do: "AC AM AP CE DF ES MA PA PI PR RJ RN RS TO", da: "BA PB" };
const de = (e) => `${ART.do.includes(e.uf) ? "do" : ART.da.includes(e.uf) ? "da" : "de"} ${e.estado}`;
const em = (e) => `${ART.do.includes(e.uf) ? "no" : ART.da.includes(e.uf) ? "na" : "em"} ${e.estado}`;

$("uf").innerHTML = estados.map((e) => `<option value="${esc(e.uf)}">${esc(e.estado)} (${esc(e.uf)})</option>`).join("");

// gráfico: uma série (mortes por 100 mil), estado escolhido em destaque
const maximo = ordem[0].taxa;
$("grafico-uf").innerHTML = ordem.map((e) => `
  <button type="button" class="barra-linha" data-uf="${esc(e.uf)}" title="${esc(e.estado)}: ${fmt(e.obitos)} mortes">
    <span class="barra-rotulo">${e.posicao}º ${esc(e.estado)}</span>
    <span class="barra-trilho"><span class="barra" style="width:${(e.taxa / maximo) * 100}%"></span></span>
    <span class="barra-valor">${fmt(e.taxa, 1)}</span></button>`).join("") +
  `<div class="linha-brasil">Média do Brasil: <strong>${fmt(taxaBrasil, 1)}</strong> mortes por 100 mil</div>`;
$("grafico-uf").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-uf]");
  if (b) { escolher(b.dataset.uf); $("painel-uf").scrollIntoView({ behavior: "smooth", block: "start" }); }
});
$("tabela-uf").innerHTML = `<table><thead><tr><th>#</th><th>Estado</th><th>Região</th><th>Mortes</th><th>Por 100 mil</th><th>População (TCU 2019)</th></tr></thead><tbody>${
  ordem.map((e) => `<tr><td>${e.posicao}</td><td><a href="?uf=${esc(e.uf)}">${esc(e.estado)}</a></td><td>${esc(e.regiao)}</td><td>${fmt(e.obitos)}</td><td>${fmt(e.taxa, 1)}</td><td>${fmt(e.populacao)}</td></tr>`).join("")}</tbody></table>`;

// vacinação: % com esquema completo na data escolhida
const NOME_CORTE = { "2021_06": "30/06/2021", "2021_12": "31/12/2021", "2022_09": "30/09/2022" };
const media = (campo) => estados.reduce((s, e) => s + (e[campo] * e.populacao) / 100, 0) / totalPop * 100;
function desenharVacina() {
  const corte = $("corte-vac").value, campo = `vac_completo_${corte}`;
  const ord = [...estados].sort((a, b) => b[campo] - a[campo]);
  const max = Math.max(100, ord[0][campo]);
  $("grafico-vac").innerHTML = ord.map((e, i) => `
    <button type="button" class="barra-linha${e.uf === $("uf").value ? " escolhido" : ""}" data-uf="${esc(e.uf)}">
      <span class="barra-rotulo">${i + 1}º ${esc(e.estado)}</span>
      <span class="barra-trilho"><span class="barra" style="width:${(e[campo] / max) * 100}%"></span></span>
      <span class="barra-valor">${fmt(e[campo], 1)}%</span></button>`).join("") +
    `<div class="linha-brasil">Brasil em ${NOME_CORTE[corte]}: <strong>${fmt(media(campo), 1)}%</strong> com esquema completo</div>`;
}
$("corte-vac").addEventListener("input", desenharVacina);
$("grafico-vac").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-uf]");
  if (b) { escolher(b.dataset.uf); $("painel-uf").scrollIntoView({ behavior: "smooth", block: "start" }); }
});

function escolher(uf) {
  const e = estados.find((x) => x.uf === uf) || estados.find((x) => x.uf === "SP");
  $("uf").value = e.uf;
  history.replaceState(null, "", `?uf=${e.uf}`);
  document.querySelectorAll("#grafico-uf [data-uf], #grafico-vac [data-uf]").forEach((b) => b.classList.toggle("escolhido", b.dataset.uf === e.uf));
  const dif = ((e.taxa - taxaBrasil) / taxaBrasil) * 100;
  const gente = pessoasUF.filter((p) => p.uf.split(";").includes(e.uf));
  const votos = VOTOS.filter((v) => ufDoVoto(v) === e.uf);
  $("painel-uf").innerHTML = `
    <div class="numeros">
      <div class="numero"><strong>${fmt(e.obitos)}</strong><span>mortes registradas ${esc(em(e))}</span></div>
      <div class="numero"><strong>${fmt(e.taxa, 1)}</strong><span>mortes por 100 mil habitantes (${e.posicao}º de 27)</span></div>
      <div class="numero"><strong>${dif >= 0 ? "+" : ""}${fmt(dif, 0)}%</strong><span>${dif >= 0 ? "acima" : "abaixo"} da média do Brasil (${fmt(taxaBrasil, 1)})</span></div>
    </div>
    <h2>Vacinação ${esc(em(e))}</h2>
    <div class="numeros">
      <div class="numero"><strong>${fmt(e.vac_completo_2021_06, 1)}%</strong><span>com esquema completo em 30/06/2021 (Brasil: ${fmt(media("vac_completo_2021_06"), 1)}%)</span></div>
      <div class="numero"><strong>${fmt(e.vac_completo_2021_12, 1)}%</strong><span>com esquema completo em 31/12/2021 (Brasil: ${fmt(media("vac_completo_2021_12"), 1)}%)</span></div>
      <div class="numero"><strong>${fmt(e.vac_completo_2022_09, 1)}%</strong><span>com esquema completo em 30/09/2022; ${fmt(e.vac_reforco_2022_09, 1)}% com reforço</span></div>
    </div>
    <h2>Senadores ${esc(de(e))} na CPI</h2>
    ${votos.length ? `<ul class="decisoes">${votos.map((v) => `<li><strong>${esc(v.nome)}</strong> (${esc(v.partido)}), ${esc(v.papel)}: votou <strong>${v.voto === "sim" ? "a favor" : "contra"}</strong> o relatório final em 26/10/2021.${v.ficha ? ` <a href="envolvidos.html?id=${esc(v.ficha)}">Ficha</a>` : ""}</li>`).join("")}</ul>`
      : `<p class="nota">Nenhum senador ${esc(de(e))} era titular da CPI. Os 11 titulares eram de ${[...new Set(VOTOS.map(ufDoVoto))].join(", ")}. <a href="investigacao.html#votos">Ver os votos</a></p>`}
    <h2>Quem ${esc(de(e))} aparece no levantamento</h2>
    ${gente.length ? `<ul class="decisoes">${gente.map((g) => `<li><a href="envolvidos.html?id=${esc(g.id)}"><strong>${esc(fichas[g.id]?.nome || g.id)}</strong></a> · ${esc(g.vinculo)}${fichas[g.id]?.crimes_cpi ? ' · <span class="etiqueta">pedido da CPI</span>' : ""}</li>`).join("")}</ul>
      <p><a href="envolvidos.html?uf=${esc(e.uf)}">Ver as fichas ${esc(de(e))} →</a></p>`
      : `<p class="nota">Nenhuma pessoa ou instituição do levantamento está ligada ${esc(e.uf === "BA" || e.uf === "PB" ? "à" : ART.do.includes(e.uf) ? "ao" : "a")} ${esc(e.estado)} por mandato ou cargo local. A maioria das fichas é de quem atuou no governo federal.</p>`}`;
}

$("uf").addEventListener("input", () => escolher($("uf").value));
desenharVacina();
escolher(new URLSearchParams(location.search).get("uf") || "AM");
