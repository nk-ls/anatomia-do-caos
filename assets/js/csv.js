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

// Distância de um ato até a 1ª dose aplicada no Brasil (17/01/2021). É o marco
// que separa agir quando ainda não havia vacina de agir depois que a fila já
// andava. Calculado da própria data do ato, nunca digitado. Só aparece onde
// significa algo: entre 2020 e 2022, com data de dia ou de mês — em data só de
// ano o rótulo não diria nada que a data já não diga.
const MARCO = Date.UTC(2021, 0, 17);
const DIA = 86400000;

export function quando(d) {
  const p = String(d || "").trim().split("-").map(Number);
  if (p.length < 2 || p.some(Number.isNaN)) return "";
  const exato = p.length === 3;
  const dt = Date.UTC(p[0], p[1] - 1, exato ? p[2] : 15);
  if (dt < Date.UTC(2020, 0, 1) || dt > Date.UTC(2022, 11, 31)) return "";
  const dias = Math.round((dt - MARCO) / DIA);
  if (exato) {
    if (dias === 0) return "no dia da 1ª vacina";
    return `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} ${dias > 0 ? "depois" : "antes"} da 1ª vacina`;
  }
  const meses = Math.round(dias / 30.44);
  if (meses === 0) return "no mês da 1ª vacina";
  return `cerca de ${Math.abs(meses)} ${Math.abs(meses) === 1 ? "mês" : "meses"} ${meses > 0 ? "depois" : "antes"} da 1ª vacina`;
}

const MESES_PT = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

// O rastro do dinheiro guarda a data em texto livre: "25/02/2021", "fev/2021",
// "18 a 23/03/2021", "até 11/05/2020", "2018 a 2021". Aqui ela é normalizada
// para ISO e cai no mesmo quando() de todo o resto — uma régua só no site.
// Em intervalo vale a última data citada; em data só de ano, nada.
export function quandoBR(texto) {
  const t = String(texto || "").trim();
  let m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?!.*\d{1,2}\/\d{1,2}\/\d{4})/);
  if (m) return quando(`${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`);
  m = t.match(/(\d{1,2})\/(\d{4})(?!.*\d{1,2}\/\d{4})/);
  if (m) return quando(`${m[2]}-${String(m[1]).padStart(2, "0")}`);
  m = t.match(/([a-z]{3})[a-z]*\/(\d{4})/i);
  if (m && MESES_PT[m[1].toLowerCase()]) return quando(`${m[2]}-${String(MESES_PT[m[1].toLowerCase()]).padStart(2, "0")}`);
  return "";
}

// Mortes por Covid registradas no país até a data de um ato. É o relógio da
// pandemia, não uma conta de responsabilidade: o número é o total nacional
// daquele dia e não se atribui ao ato ao lado. Só em data de dia — aproximar
// num mês inteiro daria um número que não existiu.
const MORTES = new Map();

export async function carregarMortes(caminho = "dados/mortes_brasil.csv") {
  if (MORTES.size) return MORTES;
  try {
    for (const r of await carregarCSV(caminho)) MORTES.set(r.data, Number(r.mortes_acumuladas));
  } catch { /* sem a série, o rótulo simplesmente não aparece */ }
  return MORTES;
}

export function mortesAte(d) {
  const k = String(d || "").trim();
  if (k.length !== 10 || !MORTES.has(k)) return "";
  const n = MORTES.get(k);
  return n === 0 ? "nenhuma morte registrada ainda" : `${n.toLocaleString("pt-BR")} mortes até aqui`;
}

// Um ato pode ter mais de uma fonte, separadas por espaço. Antes iam todas
// dentro de um href só, e o link morria.
export const urlsFonte = (txt) => String(txt || "").split(/\s+/).filter((u) => /^https?:\/\//.test(u));

export const fmt = (n, casas = 0) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
