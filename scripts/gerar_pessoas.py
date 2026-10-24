"""Gera pessoas/README.md (índice) e uma página por pessoa a partir de
dados/pessoas.csv e dados/atos.csv.

Para acrescentar um ato, a favor ou contra, basta incluir uma linha em
dados/atos.csv com fonte e rodar este script. Não edite pessoas/*.md à mão.
"""
import csv
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "pessoas"
VIDEO = "https://www.youtube.com/watch?v=MG3XZYu0_No"

ORDEM_GRUPOS = [
    "Presidência da República e família", "Ministério da Saúde", "Outros ministérios e órgãos federais",
    "Parlamentares", "\"Gabinete paralelo\" e médicos", "Empresários, comunicadores e influenciadores",
    "Contratos de vacina e logística (Covaxin, Davati, VTCLog)", "Prevent Senior", "Governo do Amazonas",
    "Empresas (pessoa jurídica)", "Médicos defensores do \"tratamento precoce\" que morreram de Covid", "Atuaram a favor da população",
]
SELO = {"a favor": "🟢", "contra": "🔴", "processual": "⚪"}
AVISO_CPI = ("> ⚖️ **Pedido de indiciamento não é condenação.** É uma recomendação da CPI aos órgãos de "
             "investigação. Toda pessoa tem direito à presunção de inocência.")


def ler(nome):
    with (RAIZ / "dados" / nome).open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def data_br(d):
    partes = d.split("-")
    return "/".join(reversed(partes)) if len(partes) > 1 else d


def link_filme(t):
    if not t:
        return ""
    h, m, s = (t.split(":") + ["0", "0"])[:3]
    seg = int(h) * 3600 + int(m) * 60 + int(s)
    return f" · [no documentário, {t}]({VIDEO}&t={seg}s)"


def fontes(txt):
    return "\n".join(f"- {u}" for u in txt.split() if u.startswith("http"))


def pagina(p, atos):
    lin = [f"# {p['nome']}", "", f"**Cargo à época:** {p['cargo_epoca']}  ", f"**Grupo:** {p['grupo']}", ""]
    lin += ["> 🔎 Conferido pela busca. Cada ato tem a sua fonte. [Como verificamos](../docs/verificacao.md). "
            "Encontrou um erro ou um ato que falta, a favor ou contra? Abra uma *issue* com a fonte.", ""]
    for titulo, chave in [("🟢 O que fez a favor do combate à pandemia", "a favor"),
                          ("🔴 O que fez contra o combate à pandemia", "contra"),
                          ("⚪ Fatos processuais e neutros", "processual")]:
        lista = [a for a in atos if a["avaliacao"] == chave]
        lin += [f"## {titulo}", ""]
        if not lista:
            lin += ["Nenhum ato registrado ainda neste levantamento.", ""]
            continue
        for a in sorted(lista, key=lambda x: x["data"]):
            lin.append(f"- **{data_br(a['data'])}** ({a['tipo']}) {a['ato']} [fonte]({a['fonte']}){link_filme(a['no_documentario'])}")
        lin.append("")
    lin += ["## Na CPI da Covid", ""]
    if p["crimes_cpi"]:
        lin += [AVISO_CPI, "", f"**Crimes apontados no relatório final (26/10/2021):** {p['crimes_cpi']}", ""]
    else:
        lin += ["Sem pedido de indiciamento no relatório final.", ""]
    lin += ["## O que aconteceu depois", "", p["situacao_judicial"] or "Nenhum desdobramento localizado neste levantamento.", ""]
    lin += ["## O que a pessoa diz", "",
            p["o_que_diz"] or "Nenhuma manifestação registrada neste levantamento. A defesa ou resposta, com fonte, pode ser enviada por *issue* e será publicada.", ""]
    if p["fontes"]:
        lin += ["## Fontes da ficha", "", fontes(p["fontes"]), ""]
    lin += ["---", "[← Todos os envolvidos](README.md)"]
    return "\n".join(lin) + "\n"


def main():
    pessoas = ler("pessoas.csv")
    atos_por = defaultdict(list)
    for a in ler("atos.csv"):
        for pid in a["pessoas"].split(";"):
            atos_por[pid.strip()].append(a)
    ids = {p["id"] for p in pessoas}
    orfaos = set(atos_por) - ids
    assert not orfaos, f"atos com pessoa inexistente: {orfaos}"
    SAIDA.mkdir(exist_ok=True)
    for p in pessoas:
        (SAIDA / f"{p['id']}.md").write_text(pagina(p, atos_por[p["id"]]), encoding="utf-8")
    n_cpi = sum(1 for p in pessoas if p["crimes_cpi"])
    idx = ["# Todos os envolvidos", "",
           "Cada pessoa ou instituição tem uma página com **o que fez a favor e contra o combate à pandemia**, "
           "o que a CPI pediu, o que aconteceu depois e o que ela diz em sua defesa.", "",
           "**Como os atos são classificados.** O critério vale igual para todos e classifica o **ato**, não a pessoa:",
           "- 🟢 **a favor**: ato que, segundo a evidência disponível na época ou seu efeito documentado, ajudou a proteger vidas (comprar ou produzir vacina, defender medidas sanitárias, divulgar dados, investigar);",
           "- 🔴 **contra**: ato contrário à evidência disponível na época ou que dificultou a resposta à pandemia (recusar ou atrasar vacina, promover remédio sem eficácia, desinformar, irregularidade em contrato);",
           "- ⚪ **processual**: decisões, pedidos e fatos neutros.", "",
           f"Hoje: **{len(pessoas)} fichas**, das quais **{n_cpi}** com pedido de indiciamento da CPI (78 pessoas e 2 empresas). "
           "Muitas fichas ainda só têm a imputação da CPI: os atos de cada pessoa estão sendo levantados.", "",
           AVISO_CPI, "",
           "Os dados ficam em [`dados/pessoas.csv`](../dados/pessoas.csv) e [`dados/atos.csv`](../dados/atos.csv). As páginas são geradas por [`scripts/gerar_pessoas.py`](../scripts/gerar_pessoas.py).", ""]
    for g in ORDEM_GRUPOS:
        grupo = [p for p in pessoas if p["grupo"] == g]
        if not grupo:
            continue
        idx += [f"## {g}", "", "| Nome | Cargo à época | 🟢 | 🔴 | Pedido da CPI |", "|---|---|---:|---:|---|"]
        for p in grupo:
            at = atos_por[p["id"]]
            fav = sum(a["avaliacao"] == "a favor" for a in at)
            con = sum(a["avaliacao"] == "contra" for a in at)
            cpi = "sim" if p["crimes_cpi"] else "—"
            idx.append(f"| [{p['nome']}]({p['id']}.md) | {p['cargo_epoca']} | {fav} | {con} | {cpi} |")
        idx.append("")
    (SAIDA / "README.md").write_text("\n".join(idx), encoding="utf-8")
    print(f"{len(pessoas)} páginas geradas")


if __name__ == "__main__":
    main()
