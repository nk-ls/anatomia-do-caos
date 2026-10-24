import { carregarCSV, esc, dataBR, fmt } from "./csv.js";

const SELECAO = ["United Kingdom", "United States", "Chile", "Mexico", "Germany", "Italy", "Argentina", "Portugal",
  "India", "Brazil", "Ecuador", "Peru", "Colombia", "Uruguay", "Russia"];
const NOMES = { "United Kingdom": "Reino Unido", "United States": "Estados Unidos", Mexico: "México", Germany: "Alemanha",
  Italy: "Itália", India: "Índia", Brazil: "Brasil", Ecuador: "Equador", Colombia: "Colômbia", Uruguay: "Uruguai", Russia: "Rússia" };

function numero(valor, rotulo) {
  return `<div class="numero"><strong>${valor}</strong><span>${rotulo}</span></div>`;
}

async function iniciar() {
  const paises = await carregarCSV("dados/covid_paises.csv");
  const br = paises.find((p) => p.pais === "Brazil");
  const grandes = paises.filter((p) => +p.populacao >= 1e6 && p.mortes_100k !== "");
  const americas = grandes
    .filter((p) => p.continente === "América do Sul" || p.continente === "América do Norte")
    .sort((a, b) => b.mortes_100k - a.mortes_100k);
  const posAmericas = americas.findIndex((p) => p.pais === "Brazil") + 1;

  document.getElementById("numeros").innerHTML = [
    numero("716.626", "mortes registradas pelo Ministério da Saúde (até 30/08/2025)"),
    numero(fmt(br.mortes_100k), "mortes por 100 mil habitantes (série OMS)"),
    numero(`${fmt(br.rank_mortes_100k)}º`, `pior resultado entre ${grandes.length} países e territórios`),
    numero(`${posAmericas}º`, "pior das Américas"),
    numero(`≈ ${fmt(br.excesso_acumulado / 1000)} mil`, "excesso de mortes estimado (The Economist)"),
    numero(dataBR(br.inicio_vacinacao), `início da vacinação: ${br.dias_apos_reino_unido} dias depois do Reino Unido`),
    numero(`${fmt(br.completo_2021_06_30, 1)}%`, "com esquema completo em 30/06/2021"),
    numero(`${fmt(br.completo_2021_12_31, 1)}%`, "com esquema completo em 31/12/2021"),
  ].join("");

  const linhas = paises
    .filter((p) => SELECAO.includes(p.pais))
    .sort((a, b) => a.inicio_vacinacao.localeCompare(b.inicio_vacinacao))
    .map((p) => {
      const dias = +p.dias_apos_reino_unido;
      return `<tr class="${p.pais === "Brazil" ? "brasil" : ""}">
        <td>${esc(NOMES[p.pais] || p.pais)}</td><td>${dataBR(p.inicio_vacinacao)}</td>
        <td class="num">${dias > 0 ? "+" : ""}${dias}</td>
        <td class="num">${fmt(p.completo_2021_06_30, 1)}%</td><td class="num">${fmt(p.completo_2021_12_31, 1)}%</td>
        <td>${dataBR(p.data_50pct)}</td></tr>`;
    });
  document.getElementById("tabela-vacina").insertAdjacentHTML("afterbegin",
    `<thead><tr><th>País</th><th>1ª dose</th><th class="num">Dias após o Reino Unido</th>
     <th class="num">Esquema completo 30/06/2021</th><th class="num">Esquema completo 31/12/2021</th><th>Chegou a 50% em</th></tr></thead>
     <tbody>${linhas.join("")}</tbody>`);
}

iniciar().catch((e) => {
  document.getElementById("numeros").innerHTML = `<p class="aviso">${esc(e.message)}. Os dados estão em <a href="dados/covid_paises.csv">dados/covid_paises.csv</a>.</p>`;
});
