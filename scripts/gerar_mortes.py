"""Gera dados/mortes_brasil.csv: a série diária de mortes por Covid no Brasil.

Fonte: painel do Ministério da Saúde, compilado diariamente por covid19br/wcota
(https://github.com/wcota/covid19br). Usamos a coluna deathsMS, que é o número
do painel do MS — conferido, bate exatamente com ele até o fim da série.

Diária, não semanal. A primeira versão agregava por semana epidemiológica, para
alisar a queda de notificação de fim de semana — mas aí anotar um marco numa
data específica passava a ler o valor da semana ANTERIOR, e errava por até 5.530
mortes (no caso da instalação da CPI). A curva ganha o alisamento na hora de
desenhar, com a média móvel de 7 dias que já vai no arquivo; o número citado em
qualquer data é o do dia, exato.

CONFERIDO CONTRA A ÉPOCA: o mesmo arquivo, na versão de 19/01/2021 do repositório
(commit 8c3e74ab549d), traz para as 330 datas em comum exatamente os mesmos
valores de deathsMS de hoje. O painel do MS não foi revisado para trás. Já a
coluna deaths, dos boletins estaduais, mudou em 240 dessas 330 datas — por isso
usamos deathsMS, e não ela.

LIMITE DA SÉRIE, que precisa estar escrito onde o leitor vê: ela termina em
18/03/2023, com 699.310 mortes. O painel do MS seguiu registrando depois —
715.295 em 11/03/2025, que é o número que o site publica na página inicial. A
diferença, 15.985, está fora desta curva. Nenhuma série aberta chega lá.

Uso: python scripts/gerar_mortes.py <caminho do cases-brazil-states.csv>
"""
import csv
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTE = "https://github.com/wcota/covid19br"
PAINEL = "https://covid.saude.gov.br/"


def main():
    if len(sys.argv) < 2:
        sys.exit("uso: python scripts/gerar_mortes.py <cases-brazil-states.csv>")
    bruto = [r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8")) if r["state"] == "TOTAL"]
    if not bruto:
        sys.exit("não achei linhas com state=TOTAL no arquivo informado")

    linhas = []
    anterior = 0
    for r in sorted(bruto, key=lambda x: x["date"]):
        total = int(r["deathsMS"] or 0)
        linhas.append({"data": r["date"], "semana_epi": r["epi_week"], "mortes_acumuladas": total,
                       "mortes_no_dia": max(0, total - anterior), "media_movel_7d": 0})
        anterior = total
    # média móvel de 7 dias: é ela que alisa a serra das notificações de fim de semana
    for i, l in enumerate(linhas):
        janela = linhas[max(0, i - 6):i + 1]
        l["media_movel_7d"] = round(sum(x["mortes_no_dia"] for x in janela) / len(janela), 1)

    destino = RAIZ / "dados" / "mortes_brasil.csv"
    with destino.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["data", "semana_epi", "mortes_acumuladas",
                                          "mortes_no_dia", "media_movel_7d"],
                           lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)
    pico = max(linhas, key=lambda x: x["media_movel_7d"])
    print(f"{len(linhas)} dias, de {linhas[0]['data']} a {linhas[-1]['data']}")
    print(f"  acumulado ao fim da série: {linhas[-1]['mortes_acumuladas']:,}".replace(",", "."))
    print(f"  pior momento: {pico['data']}, média móvel de {pico['media_movel_7d']:,.1f} mortes por dia".replace(",", "."))
    print(f"  fonte: {FONTE} (coluna deathsMS, do painel {PAINEL})")


if __name__ == "__main__":
    main()
