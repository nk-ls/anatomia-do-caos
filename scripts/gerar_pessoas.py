"""Gera pessoas/README.md (índice) e uma página por pessoa a partir de
dados/pessoas.csv e dados/atos.csv.

Para acrescentar um ato, a favor ou contra, basta incluir uma linha em
dados/atos.csv com fonte e rodar este script. Não edite pessoas/*.md à mão.
"""
import csv
from collections import defaultdict
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "pessoas"
VIDEO = "https://www.youtube.com/watch?v=MG3XZYu0_No"

ORDEM_GRUPOS = [
    "Presidência da República e família", "Ministério da Saúde", "Outros ministérios e órgãos federais",
    "Parlamentares", "Senadores da CPI", "Governos estaduais", "Judiciário",
    "Instituições de saúde e SUS", "Cientistas, imprensa e sociedade civil",
    "Médicos e conselheiros citados pela CPI (cloroquina e \"gabinete paralelo\")", "Médicos que defenderam o \"tratamento precoce\"",
    "Empresários, comunicadores e influenciadores", "Contratos de vacina e logística (Covaxin, Davati, VTCLog)", "Prevent Senior",
    "Empresas (pessoa jurídica)",
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


MARCO = date(2021, 1, 17)          # primeira dose aplicada no Brasil
JANELA = (date(2020, 1, 1), date(2022, 12, 31))


def quando(d):
    """Distância até a 1ª vacina (17/01/2021), a partir da própria data do ato.

    Calculado, nunca digitado: se a data for corrigida, o intervalo acompanha.
    Só aparece onde significa algo — dentro da pandemia e com data de dia ou
    mês. Em data só de ano o rótulo não diria nada que a data já não diga.
    """
    partes = d.strip().split("-")
    try:
        if len(partes) == 3:
            dt, exato = date(*map(int, partes)), True
        elif len(partes) == 2:
            dt, exato = date(int(partes[0]), int(partes[1]), 15), False
        else:
            return ""
    except ValueError:
        return ""
    if not JANELA[0] <= dt <= JANELA[1]:
        return ""
    dias = (dt - MARCO).days
    if exato:
        if dias == 0:
            return "no dia da 1ª vacina"
        return f"{abs(dias)} {'dia' if abs(dias) == 1 else 'dias'} {'depois' if dias > 0 else 'antes'} da 1ª vacina"
    meses = round(dias / 30.44)
    if meses == 0:
        return "no mês da 1ª vacina"
    return f"cerca de {abs(meses)} {'mês' if abs(meses) == 1 else 'meses'} {'depois' if meses > 0 else 'antes'} da 1ª vacina"


def link_filme(t):
    if not t:
        return ""
    h, m, s = (t.split(":") + ["0", "0"])[:3]
    seg = int(h) * 3600 + int(m) * 60 + int(s)
    return f" · [no documentário, {t}]({VIDEO}&t={seg}s)"


def fontes(txt):
    return "\n".join(f"- {u}" for u in txt.split() if u.startswith("http"))


def refs(txt):
    """Links da fonte de um ato. O campo aceita mais de uma URL, separada por
    espaço: antes elas iam todas dentro de um href só e o link morria."""
    urls = [u for u in txt.split() if u.startswith("http")]
    if not urls:
        return ""
    if len(urls) == 1:
        u = urls[0]
        return f" [fonte]({u})" + (f" · [cópia arquivada]({COPIAS[u]})" if u in COPIAS else "")
    partes = [f"[fonte {i}]({u})" + (f" · [cópia]({COPIAS[u]})" if u in COPIAS else "")
              for i, u in enumerate(urls, 1)]
    return " " + " · ".join(partes)


def copias():
    caminho = RAIZ / "dados" / "fontes.csv"
    if not caminho.exists():
        return {}
    return {r["url"]: r["copia_arquivada"] for r in ler("fontes.csv") if r["copia_arquivada"]}


COPIAS = {}
FOTOS = {}


def pagina(p, atos):
    lin = [f"# {p['nome']}", ""]
    if p["id"] in FOTOS:
        ft = FOTOS[p["id"]]
        lin += [f'<img src="../{ft["arquivo"]}" alt="Foto oficial de {p["nome"]}" width="120" height="120">', "", f"<sub>{ft['credito']} · [origem]({ft['pagina']})</sub>", ""]
    lin += [f"**Cargo à época:** {p['cargo_epoca']}  ", f"**Grupo:** {p['grupo']}", ""]
    lin += ["> 🔎 Conferido pela busca; cópias datadas das fontes no [arquivo de fontes](https://github.com/nk-ls/anatomia-do-caos-fontes). Cada ato tem a sua fonte. [Como verificamos](../docs/verificacao.md). "
            "Encontrou um erro ou um ato que falta, a favor ou contra? Abra uma *issue* com a fonte.", ""]
    for titulo, chave in [("🟢 O que fez a favor do combate à pandemia", "a favor"),
                          ("🔴 O que fez contra o combate à pandemia", "contra"),
                          ("⚪ Fatos processuais e neutros", "processual")]:
        lista = [a for a in atos if a["avaliacao"] == chave]
        lin += [f"## {titulo}", ""]
        if not lista:
            if chave == "contra" and p["crimes_cpi"]:
                lin += ["A CPI pediu o indiciamento desta pessoa, mas os atos dela **ainda não foram "
                        "levantados**. Nenhum ato contra registrado aqui é lacuna deste trabalho, não "
                        "ficha limpa.", ""]
            else:
                lin += ["Nenhum ato registrado ainda neste levantamento.", ""]
            continue
        for a in sorted(lista, key=lambda x: x["data"]):
            rot = quando(a["data"])
            lin.append(f"- **{data_br(a['data'])}**{f' · *{rot}*' if rot else ''} "
                       f"({a['tipo']}) {a['ato']}{refs(a['fonte'])}{link_filme(a['no_documentario'])}")
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
    COPIAS.update(copias())
    if (RAIZ / "dados" / "fotos.csv").exists():
        FOTOS.update({r["id"]: r for r in ler("fotos.csv")})
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
           "**Quando o ato aconteceu.** Ao lado de cada data está a distância até a **1ª dose "
           "aplicada no Brasil, em 17/01/2021** — o marco que separa agir quando ainda não havia "
           "vacina de agir depois que a fila já andava. O intervalo é calculado a partir da própria "
           "data do ato, não digitado à mão, e só aparece onde significa algo: em atos entre 2020 e "
           "2022, com data de dia ou de mês.", "",
           "**Uma assimetria que o leitor precisa saber.** Os 17 atos do tipo *checagem* são todos "
           "vermelhos, e isso é da natureza do gênero: agência de checagem publica quando algo é "
           "falso, não quando é verdadeiro. Quem foi muito checado acumula vermelhos por um critério "
           "que não se aplicou igualmente a todos. Leia o selo como registro do que foi documentado, "
           "nunca como placar.", "",
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
