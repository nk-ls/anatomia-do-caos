import { esc, carregarCSV } from "./csv.js";
import { montarRede } from "./rede.js";
import { SISTEMA, VOTOS, CAMINHO } from "./diagramas.js";

const $ = (id) => document.getElementById(id);
const link = (rotulo, url) => `<a href="${/^(https?:|[a-z])/.test(url) ? esc(url) : "#"}">${esc(rotulo)}</a>`;

function etapa({ titulo, quando = "", resumo = "", texto, fontes = [], tipo = "" }, aberta = false) {
  return `<div class="etapa"><details${aberta ? " open" : ""}><summary>${quando ? `<span class="quando">${esc(quando)}</span> · ` : ""}${esc(titulo)}${tipo ? ` <span class="etiqueta">${esc(tipo)}</span>` : ""}</summary>
    ${resumo ? `<p class="nota">${esc(resumo)}</p>` : ""}<p>${esc(texto)}</p>
    <p class="nota">Fontes: ${fontes.map(([r, u]) => link(r, u)).join(" · ")}</p></details></div>`;
}

const ufDoVoto = (v) => v.partido.split("-").pop();
function votos() {
  $("plenario").innerHTML = VOTOS.map((v, i) => `<button type="button" class="cadeira ${v.voto === "sim" ? "sim" : "nao"}" data-i="${i}" data-uf="${esc(ufDoVoto(v))}">
    <span class="bola">${v.voto === "sim" ? "S" : "N"}</span>${esc(v.nome)} <span class="uf-cadeira">${esc(ufDoVoto(v))}</span></button>`).join("");
  const sim = VOTOS.filter((v) => v.voto === "sim").length;
  const resumo = `<strong>${sim} a ${VOTOS.length - sim}</strong>: relatório aprovado. Clique num nome para ver o voto e a fonte.`;
  $("voto-detalhe").innerHTML = resumo;
  carregarCSV("dados/estados.csv").then((estados) => {
    $("voto-uf").insertAdjacentHTML("beforeend", estados.map((e) => {
      const n = VOTOS.filter((v) => ufDoVoto(v) === e.uf).length;
      return `<option value="${esc(e.uf)}">${esc(e.estado)} (${n ? `${n} ${n > 1 ? "titulares" : "titular"}` : "nenhum titular"})</option>`;
    }).join(""));
    $("voto-uf").addEventListener("input", () => {
      const uf = $("voto-uf").value, e = estados.find((x) => x.uf === uf);
      const sel = VOTOS.filter((v) => ufDoVoto(v) === uf);
      document.querySelectorAll("#plenario .cadeira").forEach((b) => b.classList.toggle("apagada", Boolean(uf) && b.dataset.uf !== uf));
      $("voto-detalhe").innerHTML = !uf ? resumo : sel.length
        ? `${esc(e.estado)}: ${sel.map((v) => `<strong>${esc(v.nome)}</strong> votou ${v.voto === "sim" ? "a favor" : "contra"}`).join("; ")}. <a href="estados.html?uf=${esc(uf)}">Ver o estado →</a>`
        : `Nenhum senador de ${esc(e.estado)} era titular da CPI; os 11 titulares eram de ${[...new Set(VOTOS.map(ufDoVoto))].join(", ")}. <a href="estados.html?uf=${esc(uf)}">Ver o estado →</a>`;
    });
  }).catch(() => { $("voto-uf").closest("p").hidden = true; });
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
  try { const rede = await montarRede($("rede-quadro"), $("rede-painel")); document.querySelector("#rede-busca")?.addEventListener("change", (e) => rede.buscar(e.target.value)); document.getElementById("rede-nomes").innerHTML = rede.nos.map((n) => `<option value="${esc(n.nome)}">`).join("");
    $("rede-uf").insertAdjacentHTML("beforeend", rede.estados.map((e) => `<option value="${esc(e.uf)}"${e.pessoas ? "" : " disabled"}>${esc(e.nome)} (${e.pessoas})</option>`).join(""));
    $("rede-uf").addEventListener("input", (e) => rede.porEstado(e.target.value)); }
  catch (e) { $("rede-quadro").innerHTML = `<p class="aviso">${esc(e.message)}</p>`; }
}
iniciar();
