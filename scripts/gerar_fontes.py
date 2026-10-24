"""Gera dados/fontes.csv: todas as fontes citadas no levantamento, uma vez cada.

Para cada URL: título, veículo, tipo, onde é usada (atos, fichas, documentos) e,
se existir, a cópia arquivada no repositório anatomia-do-caos-fontes (data,
SHA-256). Uso: python scripts/gerar_fontes.py [caminho do repositório de fontes]
"""
import csv
import html
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parent.parent
FONTES = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ.parent / "anatomia-do-caos-fontes"
REPO_FONTES = "https://github.com/nk-ls/anatomia-do-caos-fontes/blob/main"
URL_RE = re.compile(r"https?://[^\s<>\"'`|)\]]+")
PROPRIOS = ("github.com/nk-ls", "nk-ls.github.io", "transparenciadocaos.com", "raw.githubusercontent.com/nk-ls")

TIPOS = [
    ("documento oficial", ("gov.br", "leg.br", "jus.br", "tcu.", "cgu.", "mpf.mp.br", "in.gov.br", "anvisa", "butantan.gov", "fiocruz.br", "ebc.com.br")),
    ("dado", ("github.com/owid", "github.com/TheEconomist", "github.com/samayo", "ourworldindata")),
    ("estudo científico", ("ncbi.nlm.nih.gov", "doi.org", "scielo", "medrxiv", "ssrn", "bmj.com", "pnas", "thelancet", "repec.org", "e-publicacoes", "seer.ufrgs", "unicamp.br", "usp.br", "ufrj.br")),
    ("checagem", ("aosfatos", "lupa", "comprovaa", "bereia")),
    ("documentário", ("youtube.com",)),
]
VEICULOS = {"poder360": "Poder360", "agazeta": "A Gazeta", "congressoemfoco": "Congresso em Foco", "correiobraziliense": "Correio Braziliense",
            "opovo": "O Povo", "senado.leg.br": "Senado Federal", "metropoles": "Metrópoles", "agenciabrasil": "Agência Brasil",
            "diariodonordeste": "Diário do Nordeste", "cnnbrasil": "CNN Brasil", "em.com.br": "Estado de Minas", "aosfatos": "Aos Fatos",
            "apublica": "Agência Pública", "jovempan": "Jovem Pan", "bahianoticias": "Bahia Notícias", "conjur": "ConJur",
            "ncbi.nlm.nih.gov": "PubMed Central", "stf.jus.br": "STF", "gov.br/saude": "Ministério da Saúde", "istoe": "IstoÉ",
            "cartacapital": "CartaCapital", "brasildefato": "Brasil de Fato", "folha": "Folha de S.Paulo", "estadao": "Estadão",
            "g1.globo": "g1", "oglobo": "O Globo", "uol.com.br": "UOL", "exame": "Exame", "sbtnews": "SBT News", "youtube.com": "YouTube"}


def tipo(url):
    for t, chaves in TIPOS:
        if any(k in url for k in chaves):
            return t
    return "imprensa"


def veiculo(url):
    for k, v in VEICULOS.items():
        if k in url:
            return v
    return urlparse(url).netloc.removeprefix("www.")


def limpar(u):
    return u.rstrip(".,;:")


def titulo_arquivado(caminho):
    try:
        t = caminho.read_text(encoding="utf-8", errors="ignore")[:200000]
    except OSError:
        return ""
    m = re.search(r"<title[^>]*>(.*?)</title>", t, re.S | re.I)
    return " ".join(html.unescape(m.group(1)).split())[:200] if m else ""


def main():
    usos = defaultdict(set)
    nomes = {p["id"]: p["nome"] for p in csv.DictReader(open(RAIZ / "dados/pessoas.csv", encoding="utf-8"))}
    for a in csv.DictReader(open(RAIZ / "dados/atos.csv", encoding="utf-8")):
        for fonte in a["fonte"].split():  # um ato pode ter mais de uma fonte, separadas por espaço
            for pid in a["pessoas"].split(";"):
                usos[limpar(fonte)].add(f"ficha:{pid.strip()}")
    for p in csv.DictReader(open(RAIZ / "dados/pessoas.csv", encoding="utf-8")):
        for u in URL_RE.findall(p["fontes"] + " " + p["o_que_diz"]):
            usos[limpar(u)].add(f"ficha:{p['id']}")
    for f in sorted((RAIZ / "docs").glob("*.md")) + [RAIZ / "README.md"]:
        if f.name in ("fontes.md",):
            continue
        for u in URL_RE.findall(f.read_text(encoding="utf-8")):
            u = limpar(u)
            if not any(k in u for k in PROPRIOS):
                usos[u].add(f"doc:{f.relative_to(RAIZ)}")
    # páginas do site e dados que alimentam as páginas
    paginas = sorted(RAIZ.glob("*.html")) + [RAIZ / "assets/js/diagramas.js"] + [RAIZ / f"dados/{n}" for n in ("dinheiro.json", "empresas.json", "estados.csv", "pessoas_uf.csv")]
    for f in paginas:
        if not f.exists():
            continue
        texto = html.unescape(f.read_text(encoding="utf-8"))
        if f.suffix == ".csv":  # uma URL por célula; a vírgula separa colunas
            texto = "\n".join(c for linha in csv.reader(texto.splitlines()) for c in linha)
        for u in URL_RE.findall(texto):
            u = limpar(u)
            if not any(k in u for k in PROPRIOS) and not u.startswith(("https://cdn", "https://fonts.")):
                usos[u].add(f"doc:{f.relative_to(RAIZ)}")

    arquivo = {}
    man = FONTES / "arquivo" / "manifesto.csv"
    if man.exists():
        for r in csv.DictReader(open(man, encoding="utf-8")):
            if r["status"] == "200":
                # a cópia é o arquivo da pasta cuja impressão digital é a registrada no manifesto
                import hashlib
                pasta = FONTES / "arquivo" / r["id"]
                candidatos = [f for f in pasta.glob("*") if f.suffix in (".html", ".pdf")]
                bruto = next((f for f in candidatos if hashlib.sha256(f.read_bytes()).hexdigest() == r["sha256"]), None)
                if bruto is None:
                    continue
                arquivo[r["url"]] = dict(
                    copia=f"{REPO_FONTES}/arquivo/{r['id']}/{bruto.name}",
                    texto=f"{REPO_FONTES}/arquivo/{r['id']}/{bruto.stem}.txt",
                    data=r["coletado_em"][:10], sha=r["sha256"],
                    titulo=titulo_arquivado(bruto) if bruto.suffix == ".html" else "")

    # cópias guardadas nas pastas de documentos: cada linha de tabela dos README que tem
    # uma URL de origem e um arquivo da pasta liga a URL ao arquivo (com o SHA-256 do arquivo).
    import hashlib
    for readme in sorted((FONTES / "documentos").rglob("README.md")):
        pasta = readme.parent
        for linha in readme.read_text(encoding="utf-8").splitlines():
            urls = [limpar(u) for u in URL_RE.findall(linha) if "github.com/nk-ls" not in u]
            if len(urls) != 1 or urls[0] in arquivo:
                continue
            achados = re.findall(r"[\w./-]+\.(?:pdf|html?|txt|json|csv|jpe?g|png|xlsx?|zip)\b", re.sub(r"https?://\S+", " ", linha))
            alvos = [b / n for n in achados for b in (pasta, pasta.parent) if (b / n).is_file()]
            if alvos:
                alvo = alvos[0]
                rel = alvo.relative_to(FONTES).as_posix()
                arquivo[urls[0]] = dict(copia=f"{REPO_FONTES}/{rel}", texto="", data="2026-10-24",
                                        sha=hashlib.sha256(alvo.read_bytes()).hexdigest(), titulo="")

    linhas = []
    for u in sorted(usos):
        a = arquivo.get(u, {})
        if u.startswith(REPO_FONTES):  # a fonte já é um documento guardado no arquivo de fontes
            a = dict(copia=u, data="", sha="", titulo="")
        fichas = sorted(x.split(":", 1)[1] for x in usos[u] if x.startswith("ficha:"))
        docs = sorted(x.split(":", 1)[1] for x in usos[u] if x.startswith("doc:"))
        linhas.append(dict(url=u, titulo=a.get("titulo", ""), veiculo=veiculo(u), tipo=tipo(u),
                           usada_em_fichas=";".join(fichas), usada_em_documentos=";".join(docs),
                           copia_arquivada=a.get("copia", ""), texto_arquivado=a.get("texto", ""),
                           arquivada_em=a.get("data", ""), sha256=a.get("sha", "")))
    campos = list(linhas[0])
    with open(RAIZ / "dados/fontes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(linhas)
    arq = sum(1 for l in linhas if l["copia_arquivada"])
    print(f"{len(linhas)} fontes; {arq} com cópia arquivada; pessoas citadas: {len({p for l in linhas for p in l['usada_em_fichas'].split(';') if p in nomes})}")


if __name__ == "__main__":
    main()
