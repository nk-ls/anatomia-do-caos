import { carregarCSV, esc, dataBR, escComLinks, quando, urlsFonte, carregarMortes, mortesAte } from "./csv.js";

const VIDEO = "https://www.youtube.com/watch?v=MG3XZYu0_No";
const CLASSE = { "a favor": "favor", contra: "contra", processual: "processual" };
const SELO = { "a favor": "🟢", contra: "🔴", processual: "⚪" };
const TITULOS_CURTOS = { "a favor": "a favor do combate à pandemia", contra: "contra o combate à pandemia", processual: "processual ou neutro" };

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
  const img = f && `<img class="${cls}" src="${esc(f.arquivo)}" alt="Foto oficial de ${esc(p.nome)}" title="${esc(f.credito)}" loading="lazy" width="${grande ? 96 : 44}" height="${grande ? 96 : 44}">`;
  // na ficha, a foto abre sozinha numa página (no cartão não: o cartão inteiro já é um botão)
  return f
    ? grande ? `<a class="ampliar-foto" href="imagem.html?foto=${encodeURIComponent(p.id)}" title="Abrir a foto em tamanho grande">${img}</a>` : img
    : `<span class="${cls} sem-foto" aria-hidden="true">${esc(iniciais(p.nome))}</span>`;
}

// Pedido de indiciamento da CPI e nenhum ato "contra" documentado não quer
// dizer ficha limpa: quer dizer que ainda não levantamos os atos dessa pessoa.
// Sem isto, o 🔴 0 no cartão se lê como absolvição.
const emLevantamento = (p) => Boolean(p.crimes_cpi) && contar(p.id, "contra") === 0;

function cartao(p) {
  return `<button class="cartao" type="button" data-id="${esc(p.id)}">
    <div class="cartao-topo">${avatar(p)}<div><h3>${esc(p.nome)}</h3><p>${esc(p.cargo_epoca)}</p></div></div>
    <div class="contagem">
      <span class="selo favor">🟢 ${contar(p.id, "a favor")}</span>
      <span class="selo contra">🔴 ${contar(p.id, "contra")}</span>
      ${p.crimes_cpi ? '<span class="etiqueta">pedido da CPI</span>' : ""}
      ${emLevantamento(p) ? '<span class="etiqueta lacuna" title="Este levantamento ainda não registrou atos desta pessoa. A ausência não é prova nem indício — é limite do trabalho.">sem atos levantados</span>' : ""}
      ${estado.uf?.get(p.id) && estado.uf.get(p.id).uf !== "Federal" ? `<span class="etiqueta uf">${esc(estado.uf.get(p.id).uf.includes(";") ? "Nordeste" : estado.uf.get(p.id).uf)}</span>` : ""}
    </div></button>`;
}

function listar() {
  const termo = $("busca").value.trim().toLowerCase();
  const grupo = $("grupo").value;
  const cpi = $("cpi").value;
  const uf = $("uf").value;
  const lista = estado.pessoas.filter((p) =>
    (!uf || (estado.uf.get(p.id)?.uf || "Federal").split(";").includes(uf)) &&
    (!termo || `${p.nome} ${p.cargo_epoca}`.toLowerCase().includes(termo)) &&
    (!grupo || p.grupo === grupo) &&
    (!cpi || (cpi === "sim") === Boolean(p.crimes_cpi)));
  $("total").textContent = `${lista.length} de ${estado.pessoas.length} fichas`;
  $("lista").innerHTML = lista.map(cartao).join("") || '<p class="nota">Nenhuma ficha encontrada.</p>';
}

// Quando o ato aconteceu, e em que altura da pandemia. Duas pílulas, não uma
// string colada: juntas passam de 330px e estouram a tela de um celular
// estreito; separadas, quebram a linha sozinhas.
const contexto = (d) => [quando(d), mortesAte(d)].filter(Boolean)
  .map((t) => `<span class="desde-marco">${esc(t)}</span>`).join(" ");

// Um ato pode ter mais de uma fonte. Cada uma ganha o seu link e a sua cópia.
function refsHTML(campo) {
  const urls = urlsFonte(campo);
  if (!urls.length) return "";
  const um = (u, rot) => {
    const copia = estado.copias.get(u);
    return `<a href="${linkSeguro(u)}" target="_blank" rel="noopener">${rot}</a>`
      + (copia ? ` · <a href="${linkSeguro(copia)}" target="_blank" rel="noopener">${urls.length > 1 ? "cópia" : "cópia arquivada"}</a>` : "");
  };
  return urls.length === 1 ? um(urls[0], "fonte") : urls.map((u, i) => um(u, `fonte ${i + 1}`)).join(" · ");
}

function ficha(p) {
  // Uma linha do tempo só, não três listas separadas. Agrupado por verde,
  // vermelho e branco, a sequência real sumia: um ato a favor dois dias depois
  // de um ato contra aparecia em seções distintas, e o leitor não via a
  // contradição. O selo de cada linha continua dizendo a classificação.
  const atos = (estado.atosPor.get(p.id) || []).slice().sort((a, b) => a.data.localeCompare(b.data));
  const conta = (av) => atos.filter((a) => a.avaliacao === av).length;
  const linhas = atos.map((a) => `<li class="${CLASSE[a.avaliacao]}">
      <span class="selo-ato" title="${esc(TITULOS_CURTOS[a.avaliacao])}">${SELO[a.avaliacao]}</span>
      <span class="data">${dataBR(a.data)}</span>${contexto(a.data) ? ` ${contexto(a.data)}` : ""} <span class="tipo">(${esc(a.tipo)})</span> ${esc(a.ato)}
      ${refsHTML(a.fonte)}
      ${a.no_documentario ? ` · <a href="${VIDEO}&t=${segundos(a.no_documentario)}s" target="_blank" rel="noopener">no documentário, ${esc(a.no_documentario)}</a>` : ""}
    </li>`).join("");
  const vazio = p.crimes_cpi
    ? '<p class="nota aviso-lacuna">Este levantamento <strong>ainda não registrou atos desta pessoa</strong>. A ausência aqui é limite deste trabalho — não é prova de que não existam, nem indício de que existam. O pedido da CPI, logo abaixo, é recomendação de investigação, não condenação.</p>'
    : '<p class="nota">Nenhum ato registrado ainda neste levantamento.</p>';
  const blocos = `<h3>O que fez, em ordem</h3>
    <p class="nota resumo-selos"><span class="selo favor">🟢 ${conta("a favor")} a favor</span>
      <span class="selo contra">🔴 ${conta("contra")} contra</span>
      <span class="selo processual">⚪ ${conta("processual")} processual</span></p>
    ${linhas ? `<ul class="atos linha-tempo">${linhas}</ul>` : vazio}`;
  const cpi = p.crimes_cpi
    ? `<p class="aviso">⚖️ Pedido de indiciamento não é condenação.</p><p><strong>Crimes apontados no relatório final (26/10/2021):</strong> ${esc(p.crimes_cpi)}</p>`
    : "<p>Sem pedido de indiciamento no relatório final.</p>";
  $("ficha").innerHTML = `<article class="ficha" aria-live="polite">
    <button class="voltar" type="button" id="fechar">← voltar à lista</button>
    <div class="ficha-topo">${avatar(p, true)}<h2>${esc(p.nome)}</h2></div>
    ${estado.uf?.get(p.id) && estado.uf.get(p.id).uf !== "Federal" ? `<p class="nota">📍 Estado: <a href="estados.html?uf=${esc(estado.uf.get(p.id).uf.split(";")[0])}">${esc(estado.uf.get(p.id).uf.replaceAll(";", ", "))}</a> · ${esc(estado.uf.get(p.id).vinculo)}</p>` : ""}
    ${estado.wikidata?.get(p.id) ? `<p class="nota">Também em: <a href="https://www.wikidata.org/wiki/${esc(estado.wikidata.get(p.id).qid)}" target="_blank" rel="noopener">Wikidata (${esc(estado.wikidata.get(p.id).qid)})</a>${estado.wikidata.get(p.id).wikipedia_pt ? ` · <a href="${linkSeguro(estado.wikidata.get(p.id).wikipedia_pt)}" target="_blank" rel="noopener">Wikipédia</a>` : ""}</p>` : ""}
    ${estado.fotos.get(p.id) ? `<p class="nota">${esc(estado.fotos.get(p.id).credito)} · <a href="${linkSeguro(estado.fotos.get(p.id).pagina)}" target="_blank" rel="noopener">origem</a></p>` : ""}
    <p><strong>Cargo à época:</strong> ${esc(p.cargo_epoca)}<br><span class="nota">${esc(p.grupo)}</span></p>
    ${blocos}
    <h3>Na CPI da Covid</h3>${cpi}
    <h3>O que aconteceu depois</h3><p>${esc(p.situacao_judicial || "Nenhum desdobramento localizado neste levantamento.")}</p>
    <h3>O que a pessoa diz</h3><p>${escComLinks(p.o_que_diz || "Nenhuma manifestação registrada. A defesa, com fonte, pode ser enviada por issue e será publicada.")}</p>
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
  const [, pessoas, atos, fontes, fotos, wikidata, ufs, estadosUF] = await Promise.all([carregarMortes(), carregarCSV("dados/pessoas.csv"), carregarCSV("dados/atos.csv"), carregarCSV("dados/fontes.csv"), carregarCSV("dados/fotos.csv"), carregarCSV("dados/wikidata.csv").catch(() => []), carregarCSV("dados/pessoas_uf.csv").catch(() => []), carregarCSV("dados/estados.csv").catch(() => [])]);
  estado.uf = new Map(ufs.map((u) => [u.id, u]));
  $("uf").insertAdjacentHTML("beforeend", estadosUF.map((e) => `<option value="${esc(e.uf)}">${esc(e.estado)} (${esc(e.uf)})</option>`).join(""));
  const ufInicial = new URLSearchParams(location.search).get("uf");
  if (ufInicial) $("uf").value = ufInicial;
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
  for (const id of ["busca", "grupo", "cpi", "uf"]) $(id).addEventListener("input", listar);
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
