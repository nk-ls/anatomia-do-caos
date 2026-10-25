"""Gera dados/rede.json: a rede de conexões entre pessoas e temas.

Cada ato de dados/atos.csv é ligado a UM tema pela primeira regra de palavras-chave
que casar (lista TEMAS abaixo, em ordem). As regras são públicas para que qualquer
pessoa possa conferir ou propor ajuste. A ligação pessoa–tema guarda quantos atos
foram a favor, contra ou processuais, e quais são.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

TEMAS = [
    ("prevent", "Prevent Senior", ["prevent"]),
    ("contratos", "Covaxin e contratos", ["covaxin", "precisa", "davati", "propina", "dominguetti", "vtclog", "offshore", "invoice", "fib bank", "senah", "motoboy", "global gestão"]),
    ("manaus", "Manaus e oxigênio", ["manaus", "oxigênio", "oxigenio", "amazonas", "white martins"]),
    ("cloroquina", "Cloroquina e \"tratamento precoce\"", ["cloroquin", "ivermectin", "tratamento precoce", "kit covid", "kit-covid", "bula", "tratecov", "proxalutamida", "azitromicina"]),
    ("vacinas", "Vacinas", ["vacin", "pfizer", "coronavac", "butantan", "astrazeneca", "fiocruz", "imuniz", "covax", "sputnik", "dose", "janssen"]),
    ("distanciamento", "Distanciamento e máscara", ["isolamento", "distanciamento", "máscara", "mascara", "lockdown", "aglomer", "quarentena", "toque de recolher", "fique em casa"]),
    ("desinformacao", "Discurso e desinformação", ["gripezinha", "e daí", "maricas", "jacaré", "aids", "fake", "desinform", "live", "tuíte", "tweet", "twitter", "redes sociais", "publicou", "post", "vídeo", "imunidade de rebanho", "mimimi", "não temas"]),
    ("gestao", "Gestão da crise e dados", ["comitê de crise", "comite de crise", "nota técnica", "nota informativa", "nota foi substituída", "secom", "campanha", "auxílio", "hospital", "decretou", "comércio", "número de mortes", "números de mortes", "caixões", "dados", "genoma", "secretarias", "número 2", "respiradores", "conselho nacional de saúde", "estudo", "jejum", "um manda e o outro obedece"]),
    ("justica", "CPI e Justiça", ["cpi", "stf", "stj", "adi ", "investigados", "pgr", "inquérito", "denúncia", "arquiv", "indici", "polícia federal", "réu", "condenad", "tcu", "cgu", "ministério público"]),
]
OUTROS = ("outros", "Outros atos")  # o que nenhuma regra alcança


def tema_de(ato):
    t = ato.lower()
    for tid, _, chaves in TEMAS:
        if any(k in t for k in chaves):
            return tid
    return OUTROS[0]


def main():
    pessoas = {p["id"]: p for p in csv.DictReader(open(RAIZ / "dados/pessoas.csv", encoding="utf-8"))}
    atos = list(csv.DictReader(open(RAIZ / "dados/atos.csv", encoding="utf-8")))
    ligas = defaultdict(lambda: {"a favor": 0, "contra": 0, "processual": 0, "atos": []})
    for i, a in enumerate(atos):
        tid = tema_de(a["ato"])
        for pid in a["pessoas"].split(";"):
            pid = pid.strip()
            if pid in pessoas:
                l = ligas[(pid, tid)]
                l[a["avaliacao"]] += 1
                l["atos"].append(i)
    usados = {tid for (_, tid) in ligas}
    nos = [{"id": "tema:" + tid, "tipo": "tema", "nome": nome} for tid, nome, _ in TEMAS + [(*OUTROS, [])] if tid in usados]
    ativos = {pid for (pid, _) in ligas}
    for pid in sorted(ativos):
        p = pessoas[pid]
        nos.append({"id": pid, "tipo": "pessoa", "nome": p["nome"], "grupo": p["grupo"], "cpi": bool(p["crimes_cpi"])})
    # em ordem de data: o painel do grafo mostra a sequência, não a ordem do CSV
    for l in ligas.values():
        l["atos"].sort(key=lambda i: atos[i]["data"])
    arestas = [{"de": pid, "para": "tema:" + tid, "favor": l["a favor"], "contra": l["contra"], "processual": l["processual"], "atos": l["atos"]}
               for (pid, tid), l in sorted(ligas.items())]
    regras = [{"id": tid, "nome": nome, "palavras": chaves} for tid, nome, chaves in TEMAS]
    json.dump({"nos": nos, "arestas": arestas, "regras": regras}, open(RAIZ / "dados/rede.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    from collections import Counter
    print(len(nos), "nós;", len(arestas), "ligações;", Counter(tema_de(a["ato"]) for a in atos))


if __name__ == "__main__":
    main()
