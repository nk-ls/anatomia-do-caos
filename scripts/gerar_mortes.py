"""Gera dados/mortes_brasil.csv: a série semanal de mortes por Covid no Brasil.

Fonte: painel do Ministério da Saúde, compilado diariamente por covid19br/wcota
(https://github.com/wcota/covid19br). Usamos a coluna deathsMS, que é o número
do painel do MS — conferido, bate exatamente com ele até o fim da série.

Por que semanal e não diária: o registro de óbito tem queda de notificação em
fim de semana e feriado, e a série diária vira serrote. A semana epidemiológica
é como o próprio MS publicava.

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

    # uma linha por semana: a última data de cada semana epidemiológica
    semanas = {}
    for r in bruto:
        semanas[r["epi_week"]] = r
    linhas = []
    anterior = 0
    for r in sorted(semanas.values(), key=lambda x: x["date"]):
        total = int(r["deathsMS"] or 0)
        linhas.append({"data": r["date"], "semana_epi": r["epi_week"],
                       "mortes_acumuladas": total, "mortes_na_semana": max(0, total - anterior)})
        anterior = total

    destino = RAIZ / "dados" / "mortes_brasil.csv"
    with destino.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["data", "semana_epi", "mortes_acumuladas", "mortes_na_semana"],
                           lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)
    pico = max(linhas, key=lambda x: x["mortes_na_semana"])
    print(f"{len(linhas)} semanas, de {linhas[0]['data']} a {linhas[-1]['data']}")
    print(f"  acumulado ao fim da série: {linhas[-1]['mortes_acumuladas']:,}".replace(",", "."))
    print(f"  pior semana: {pico['data']} com {pico['mortes_na_semana']:,} mortes".replace(",", "."))
    print(f"  fonte: {FONTE} (coluna deathsMS, do painel {PAINEL})")


if __name__ == "__main__":
    main()
