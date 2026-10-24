import { carregarCSV, esc, dataBR } from "./csv.js";

const VIDEO = "https://www.youtube.com/watch?v=MG3XZYu0_No";
const CLASSE = { "a favor": "favor", contra: "contra", processual: "processual" };
const TITULOS = [
  ["a favor", "🟢 O que fez a favor do combate à pandemia"],
  ["contra", "🔴 O que fez contra o combate à pandemia"],
  ["processual", "⚪ Fatos processuais e neutros"],
];

const estado = { pessoas: [], atosPor: new Map() };
const $ = (id) => document.getElementById(id);

function segundos(t) {
  const [h = 0, m = 0, s = 0] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function linkSeguro(url) {
  return /^https?:\/\//.test(url) ? esc(url) : "#";
}

function contar(id, av) {
  return (estado.atosPor.get(id) || []).filter((a) => a.avaliacao === av).length;
}

function cartao(p) {
  return `<button class="cartao" type="button" data-id="${esc(p.id)}">
    <h3>${esc(p.nome)}</h3><p>${esc(p.cargo_epoca)}</p>
    <div class="contagem">
      <span class="selo favor">🟢 ${contar(p.id, "a favor")}</span>
      <span class="selo contra">🔴 ${contar(p.id, "contra")}</span>
      ${p.crimes_cpi ? '<span class="etiqueta">pedido da CPI</span>' : ""}
    </div></button>`;
}

function listar() {
  const termo = $("busca").value.trim().toLowerCase();
  const grupo = $("grupo").value;
  const cpi = $("cpi").value;
  const lista = estado.pessoas.filter((p) =>
    (!termo || `${p.nome} ${p.cargo_epoca}`.toLowerCase().includes(termo)) &&
    (!grupo || p.grupo === grupo) &&
    (!cpi || (cpi === "sim") === Boolean(p.crimes_cpi)));
  $("total").textContent = `${lista.length} de ${estado.pessoas.length} fichas`;
  $("lista").innerHTML = lista.map(cartao).join("") || '<p class="nota">Nenhuma ficha encontrada.</p>';
}

function ficha(p) {
  const atos = (estado.atosPor.get(p.id) || []).slice().sort((a, b) => a.data.localeCompare(b.data));
  const blocos = TITULOS.map(([av, titulo]) => {
    const itens = atos.filter((a) => a.avaliacao === av).map((a) => `<li class="${CLASSE[av]}">
      <span class="data">${dataBR(a.data)}</span> <span class="tipo">(${esc(a.tipo)})</span> ${esc(a.ato)}
      <a href="${linkSeguro(a.fonte)}" target="_blank" rel="noopener">fonte</a>
      ${a.no_documentario ? ` · <a href="${VIDEO}&t=${segundos(a.no_documentario)}s" target="_blank" rel="noopener">no documentário, ${esc(a.no_documentario)}</a>` : ""}
    </li>`).join("");
    return `<h3>${titulo}</h3>${itens ? `<ul class="atos">${itens}</ul>` : '<p class="nota">Nenhum ato registrado ainda neste levantamento.</p>'}`;
  }).join("");
  const cpi = p.crimes_cpi
    ? `<p class="aviso">⚖️ Pedido de indiciamento não é condenação.</p><p><strong>Crimes apontados no relatório final (26/10/2021):</strong> ${esc(p.crimes_cpi)}</p>`
    : "<p>Sem pedido de indiciamento no relatório final.</p>";
  $("ficha").innerHTML = `<article class="ficha" aria-live="polite">
    <button class="voltar" type="button" id="fechar">← voltar à lista</button>
    <h2>${esc(p.nome)}</h2>
    <p><strong>Cargo à época:</strong> ${esc(p.cargo_epoca)}<br><span class="nota">${esc(p.grupo)}</span></p>
    ${blocos}
    <h3>Na CPI da Covid</h3>${cpi}
    <h3>O que aconteceu depois</h3><p>${esc(p.situacao_judicial || "Nenhum desdobramento localizado neste levantamento.")}</p>
    <h3>O que a pessoa diz</h3><p>${esc(p.o_que_diz || "Nenhuma manifestação registrada. A defesa, com fonte, pode ser enviada por issue e será publicada.")}</p>
    <p class="nota"><a href="https://github.com/nk-ls/anatomia-do-caos/blob/main/pessoas/${esc(p.id)}.md">Ficha no GitHub</a></p>
  </article>`;
  $("lista").hidden = true;
  $("fechar").addEventListener("click", () => { history.pushState(null, "", "envolvidos.html"); mostrar(); });
  $("ficha").scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrar() {
  const id = new URLSearchParams(location.search).get("id");
  const p = estado.pessoas.find((x) => x.id === id);
  if (p) ficha(p);
  else { $("ficha").innerHTML = ""; $("lista").hidden = false; listar(); }
}

async function iniciar() {
  const [pessoas, atos] = await Promise.all([carregarCSV("dados/pessoas.csv"), carregarCSV("dados/atos.csv")]);
  estado.pessoas = pessoas;
  for (const a of atos) {
    for (const id of a.pessoas.split(";").map((s) => s.trim())) {
      if (!estado.atosPor.has(id)) estado.atosPor.set(id, []);
      estado.atosPor.get(id).push(a);
    }
  }
  const grupos = [...new Set(pessoas.map((p) => p.grupo))];
  $("grupo").insertAdjacentHTML("beforeend", grupos.map((g) => `<option>${esc(g)}</option>`).join(""));
  for (const id of ["busca", "grupo", "cpi"]) $(id).addEventListener("input", listar);
  $("lista").addEventListener("click", (e) => {
    const b = e.target.closest(".cartao");
    if (!b) return;
    history.pushState(null, "", `envolvidos.html?id=${encodeURIComponent(b.dataset.id)}`);
    mostrar();
  });
  window.addEventListener("popstate", mostrar);
  mostrar();
}

iniciar().catch((e) => { $("lista").innerHTML = `<p class="aviso">${esc(e.message)}</p>`; });
