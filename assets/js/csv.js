// Leitor de CSV simples (RFC 4180: aspas, vírgulas e quebras de linha dentro de campos).
export function lerCSV(texto) {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.length > 1 || linha[0] !== "") linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  const [cab, ...resto] = linhas;
  return resto.map((l) => Object.fromEntries(cab.map((k, j) => [k, l[j] ?? ""])));
}

export async function carregarCSV(caminho) {
  const resp = await fetch(caminho);
  if (!resp.ok) throw new Error(`Não foi possível carregar ${caminho}`);
  return lerCSV(await resp.text());
}

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Texto que pode trazer link em markdown: [rótulo](https://…).
// Escapa primeiro e converte depois — nessa ordem, HTML vindo do dado não é executado,
// e só http/https viram link (nunca javascript:).
export const escComLinks = (s) =>
  esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

export function dataBR(d) {
  if (!d) return "";
  const p = d.split("-");
  return p.length > 1 ? p.reverse().join("/") : d;
}

export const fmt = (n, casas = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
