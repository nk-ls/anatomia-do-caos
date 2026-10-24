import { carregarCSV, esc, dataBR, fmt } from "./csv.js";

const $ = (id) => document.getElementById(id);
const ORDEM = ["documento oficial", "estudo científico", "dado", "checagem", "documentário", "imprensa"];
const estado = { fontes: [], nomes: {} };

function seguro(u) { return /^https?:\/\//.test(u) ? esc(u) : "#"; }

function usos(f) {
  const fichas = f.usada_em_fichas ? f.usada_em_fichas.split(";") : [];
  const docs = f.usada_em_documentos ? f.usada_em_documentos.split(";") : [];
  const lf = fichas.slice(0, 6).map((id) => `<a href="envolvidos.html?id=${encodeURIComponent(id)}">${esc(estado.nomes[id] || id)}</a>`);
  if (fichas.length > 6) lf.push(`+${fichas.length - 6}`);
  const ld = docs.map((d) => `<a href="https://github.com/nk-ls/anatomia-do-caos/blob/main/${esc(d)}">${esc(d.replace("docs/", ""))}</a>`);
  return [...lf, ...ld].join(", ");
}

function linha(f) {
  const titulo = f.titulo || f.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 90);
  const copia = f.copia_arquivada
    ? `<a href="${seguro(f.copia_arquivada)}">📄 ${dataBR(f.arquivada_em)}</a><br><a class="nota" href="${seguro(f.texto_arquivado)}">texto</a> <span class="nota" title="SHA-256: ${esc(f.sha256)}">· SHA ${esc(f.sha256.slice(0, 8))}</span>`
    : '<span class="nota">—</span>';
  return `<tr><td style="white-space:normal;min-width:260px"><a href="${seguro(f.url)}" target="_blank" rel="noopener">${esc(titulo)}</a><br><span class="nota">${esc(f.veiculo)}</span></td>
    <td>${esc(f.tipo)}</td><td>${copia}</td><td style="white-space:normal;min-width:200px">${usos(f)}</td></tr>`;
}

function filtrar() {
  const termo = $("busca").value.trim().toLowerCase();
  const tipo = $("tipo").value, arq = $("arq").value;
  const lista = estado.fontes.filter((f) =>
    (!tipo || f.tipo === tipo) &&
    (!arq || (arq === "sim") === Boolean(f.copia_arquivada)) &&
    (!termo || `${f.titulo} ${f.veiculo} ${f.url} ${f.usada_em_fichas.split(";").map((id) => estado.nomes[id] || "").join(" ")}`.toLowerCase().includes(termo)));
  $("total").textContent = `${lista.length} de ${estado.fontes.length} fontes`;
  $("tabela").tBodies[0].innerHTML = lista.map(linha).join("");
}

async function iniciar() {
  const [fontes, pessoas] = await Promise.all([carregarCSV("dados/fontes.csv"), carregarCSV("dados/pessoas.csv")]);
  estado.nomes = Object.fromEntries(pessoas.map((p) => [p.id, p.nome]));
  estado.fontes = fontes.sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo) || a.veiculo.localeCompare(b.veiculo));
  const por = (t) => fontes.filter((f) => f.tipo === t).length;
  $("resumo").innerHTML = [
    [fmt(fontes.length), "fontes no total"],
    [fmt(fontes.filter((f) => f.copia_arquivada).length), "com cópia arquivada"],
    [fmt(por("documento oficial")), "documentos oficiais"],
    [fmt(por("estudo científico")), "estudos científicos"],
  ].map(([n, r]) => `<div class="numero"><strong>${n}</strong><span>${r}</span></div>`).join("");
  $("tipo").insertAdjacentHTML("beforeend", ORDEM.filter(por).map((t) => `<option>${t}</option>`).join(""));
  for (const id of ["busca", "tipo", "arq"]) $(id).addEventListener("input", filtrar);
  filtrar();
}

iniciar().catch((e) => { $("total").innerHTML = `<span class="aviso">${esc(e.message)}</span>`; });
