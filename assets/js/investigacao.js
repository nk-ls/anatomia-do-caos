import { esc } from "./csv.js";
import { montarRede } from "./rede.js";
import { SISTEMA, VOTOS, CAMINHO } from "./diagramas.js";

const $ = (id) => document.getElementById(id);
const link = (rotulo, url) => `<a href="${/^(https?:|[a-z])/.test(url) ? esc(url) : "#"}">${esc(rotulo)}</a>`;

function etapa({ titulo, quando = "", resumo = "", texto, fontes = [], tipo = "" }, aberta = false) {
  return `<div class="etapa"><details${aberta ? " open" : ""}><summary>${quando ? `<span class="quando">${esc(quando)}</span> · ` : ""}${esc(titulo)}${tipo ? ` <span class="etiqueta">${esc(tipo)}</span>` : ""}</summary>
    ${resumo ? `<p class="nota">${esc(resumo)}</p>` : ""}<p>${esc(texto)}</p>
    <p class="nota">Fontes: ${fontes.map(([r, u]) => link(r, u)).join(" · ")}</p></details></div>`;
}

function votos() {
  $("plenario").innerHTML = VOTOS.map((v, i) => `<button type="button" class="cadeira ${v.voto === "sim" ? "sim" : "nao"}" data-i="${i}">
    <span class="bola">${v.voto === "sim" ? "S" : "N"}</span>${esc(v.nome)}</button>`).join("");
  const sim = VOTOS.filter((v) => v.voto === "sim").length;
  $("voto-detalhe").innerHTML = `<strong>${sim} a ${VOTOS.length - sim}</strong>: relatório aprovado. Clique num nome para ver o voto e a fonte.`;
  $("plenario").addEventListener("click", (e) => {
    const b = e.target.closest(".cadeira"); if (!b) return;
    const v = VOTOS[+b.dataset.i];
    $("voto-detalhe").innerHTML = `<strong>${esc(v.nome)}</strong> (${esc(v.partido)}), ${esc(v.papel)}: votou <strong>${v.voto === "sim" ? "a favor do" : "contra o"}</strong> relatório.
      ${v.fala ? `<br>${esc(v.fala)}` : ""}${v.doc ? `<br>${link("Voto em separado (íntegra)", v.doc)}` : ""}${v.ficha ? ` · ${link("Ficha", "envolvidos.html?id=" + v.ficha)}` : ""}
      <br>Fontes: ${v.fontes.map((u, i) => link(["Poder360", "O Povo", "NSC Total"][i], u)).join(" · ")}`;
  });
}

async function iniciar() {
  votos();
  $("caminho").innerHTML = CAMINHO.map((c) => etapa({ titulo: c.titulo, quando: c.data, texto: c.texto, fontes: c.fontes, tipo: c.tipo }, c.votos)).join("");
  $("fluxo-sistema").innerHTML = SISTEMA.map((s) => etapa({ titulo: s.titulo, resumo: s.resumo, texto: s.texto, fontes: s.links })).join("");
  try { await montarRede($("rede-quadro"), $("rede-painel")); }
  catch (e) { $("rede-quadro").innerHTML = `<p class="aviso">${esc(e.message)}</p>`; }
}
iniciar();
