import { carregarCSV, esc, dataBR } from "./csv.js";

const VIDEO = "https://www.youtube.com/watch?v=MG3XZYu0_No";
const CLASSE = { "a favor": "favor", contra: "contra", processual: "processual" };
const TITULOS = [
  ["a favor", "🟢 O que fez a favor do combate à pandemia"],
  ["contra", "🔴 O que fez contra o combate à pandemia"],
  ["processual", "⚪ Fatos processuais e neutros"],
];

const estado = { pessoas: [], atosPor: new Map(), copias: new Map(), fotos: new Map() };
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

function iniciais(nome) {
  return nome.replace(/["“”]/g, "").split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatar(p, grande = false) {
  const f = estado.fotos.get(p.id);
  const cls = grande ? "avatar grande" : "avatar";
  return f
    ? `<img class="${cls}" src="${esc(f.arquivo)}" alt="Foto oficial de ${esc(p.nome)}" title="${esc(f.credito)}" loading="lazy" width="${grande ? 96 : 44}" height="${grande ? 96 : 44}">`
    : `<span class="${cls} sem-foto" aria-hidden="true">${esc(iniciais(p.nome))}</span>`;
}

function cartao(p) {
  return `<button class="cartao" type="button" data-id="${esc(p.id)}">
    <div class="cartao-topo">${avatar(p)}<div><h3>${esc(p.nome)}</h3><p>${esc(p.cargo_epoca)}</p></div></div>
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
      <a href="${linkSeguro(a.fonte)}" target="_blank" rel="noopener">fonte</a>${estado.copias.get(a.fonte) ? ` · <a href="${linkSeguro(estado.copias.get(a.fonte))}" target="_blank" rel="noopener">cópia arquivada</a>` : ""}
      ${a.no_documentario ? ` · <a href="${VIDEO}&t=${segundos(a.no_documentario)}s" target="_blank" rel="noopener">no documentário, ${esc(a.no_documentario)}</a>` : ""}
    </li>`).join("");
    return `<h3>${titulo}</h3>${itens ? `<ul class="atos">${itens}</ul>` : '<p class="nota">Nenhum ato registrado ainda neste levantamento.</p>'}`;
  }).join("");
  const cpi = p.crimes_cpi
    ? `<p class="aviso">⚖️ Pedido de indiciamento não é condenação.</p><p><strong>Crimes apontados no relatório final (26/10/2021):</strong> ${esc(p.crimes_cpi)}</p>`
    : "<p>Sem pedido de indiciamento no relatório final.</p>";
  $("ficha").innerHTML = `<article class="ficha" aria-live="polite">
    <button class="voltar" type="button" id="fechar">← voltar à lista</button>
    <div class="ficha-topo">${avatar(p, true)}<h2>${esc(p.nome)}</h2></div>
    ${estado.wikidata?.get(p.id) ? `<p class="nota">Também em: <a href="https://www.wikidata.org/wiki/${esc(estado.wikidata.get(p.id).qid)}" target="_blank" rel="noopener">Wikidata (${esc(estado.wikidata.get(p.id).qid)})</a>${estado.wikidata.get(p.id).wikipedia_pt ? ` · <a href="${linkSeguro(estado.wikidata.get(p.id).wikipedia_pt)}" target="_blank" rel="noopener">Wikipédia</a>` : ""}</p>` : ""}
    ${estado.fotos.get(p.id) ? `<p class="nota">${esc(estado.fotos.get(p.id).credito)} · <a href="${linkSeguro(estado.fotos.get(p.id).pagina)}" target="_blank" rel="noopener">origem</a></p>` : ""}
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
  const [pessoas, atos, fontes, fotos, wikidata] = await Promise.all([carregarCSV("dados/pessoas.csv"), carregarCSV("dados/atos.csv"), carregarCSV("dados/fontes.csv"), carregarCSV("dados/fotos.csv"), carregarCSV("dados/wikidata.csv").catch(() => [])]);
  for (const f of fotos) estado.fotos.set(f.id, f);
  estado.wikidata = new Map(wikidata.filter((w) => /^Q\d+$/.test(w.qid)).map((w) => [w.id, w]));
  for (const f of fontes) if (f.copia_arquivada) estado.copias.set(f.url, f.copia_arquivada);
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
