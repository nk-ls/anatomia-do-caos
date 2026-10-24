"""Liga cada pessoa de dados/pessoas.csv ao seu item no Wikidata (consulta SPARQL pública).

Critério conservador: rótulo ou nome alternativo em português igual ao nome da ficha,
ser humano (Q5) e cidadania brasileira (Q155). Só grava quando há UM candidato; com
mais de um, a linha fica marcada como "ambíguo" para conferência manual.
Saída: dados/wikidata.csv (id, qid, wikipedia_pt, imagem_commons, situacao).
"""
import csv, json, pathlib, time, urllib.error, urllib.parse, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
UA = "AnatomiaDoCaos/1.0 (https://github.com/nk-ls/anatomia-do-caos)"

def sparql(q, tentativas=4):
    dados = urllib.parse.urlencode({"query": q, "format": "json"}).encode()
    for t in range(tentativas):
        req = urllib.request.Request("https://query.wikidata.org/sparql", data=dados, headers={"User-Agent": UA, "Accept": "application/sparql-results+json"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)["results"]["bindings"]
        except urllib.error.HTTPError as e:
            if e.code != 429 or t == tentativas - 1:
                raise
            time.sleep(65)  # o serviço às vezes limita a 1 consulta por minuto

pessoas = list(csv.DictReader(open(RAIZ / "dados/pessoas.csv", encoding="utf-8")))
saida = []
for i in range(0, len(pessoas), 200):
    lote = pessoas[i:i + 200]
    valores = " ".join(json.dumps(p["nome"], ensure_ascii=False) + "@pt" for p in lote)
    q = f"""SELECT ?nome ?item ?art ?img WHERE {{
      VALUES ?nome {{ {valores} }}
      {{ ?item rdfs:label ?nome }} UNION {{ ?item skos:altLabel ?nome }}
      ?item wdt:P31 wd:Q5; wdt:P27 wd:Q155.
      OPTIONAL {{ ?art schema:about ?item; schema:isPartOf <https://pt.wikipedia.org/> }}
      OPTIONAL {{ ?item wdt:P18 ?img }}
    }}"""
    achados = {}
    for b in sparql(q):
        achados.setdefault(b["nome"]["value"], {})[b["item"]["value"].rsplit("/", 1)[1]] = (b.get("art", {}).get("value", ""), b.get("img", {}).get("value", ""))
    for p in lote:
        c = achados.get(p["nome"], {})
        if len(c) == 1:
            qid, (art, img) = next(iter(c.items()))
            saida.append({"id": p["id"], "qid": qid, "wikipedia_pt": art, "imagem_commons": img, "situacao": "encontrado"})
        else:
            saida.append({"id": p["id"], "qid": ";".join(sorted(c)), "wikipedia_pt": "", "imagem_commons": "", "situacao": "ambíguo" if c else "não encontrado"})
    time.sleep(1)

with open(RAIZ / "dados/wikidata.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id", "qid", "wikipedia_pt", "imagem_commons", "situacao"])
    w.writeheader(); w.writerows(saida)
from collections import Counter
print(Counter(s["situacao"] for s in saida))
