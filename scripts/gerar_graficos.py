"""Gera dados/covid_paises.csv e os gráficos de graficos/ a partir de dados/covid_paises.xlsx.

A planilha guarda fórmulas (densidade, mortes por 100 mil, ranks); aqui elas são
recalculadas em pandas para não depender de um programa de planilha.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
XLSX = RAIZ / "dados" / "covid_paises.xlsx"
SAIDA = RAIZ / "graficos"
REINO_UNIDO = pd.Timestamp("2020-12-08")

NOMES = {
    "Brazil": "Brasil", "United States": "Estados Unidos", "United Kingdom": "Reino Unido",
    "Mexico": "México", "Germany": "Alemanha", "Italy": "Itália", "India": "Índia",
    "Ecuador": "Equador", "Colombia": "Colômbia", "Uruguay": "Uruguai", "Russia": "Rússia",
    "Bulgaria": "Bulgária", "Bosnia and Herzegovina": "Bósnia", "Hungary": "Hungria",
    "North Macedonia": "Macedônia do Norte", "Peru": "Peru", "Chile": "Chile",
    "Argentina": "Argentina", "Portugal": "Portugal", "Paraguay": "Paraguai",
    "Bolivia": "Bolívia", "Venezuela": "Venezuela", "Canada": "Canadá", "Serbia": "Sérvia",
    "Czechia": "Tchéquia", "Croatia": "Croácia", "Slovakia": "Eslováquia", "Romania": "Romênia",
    "Georgia": "Geórgia", "Montenegro": "Montenegro", "Slovenia": "Eslovênia", "Greece": "Grécia",
    "Lithuania": "Lituânia", "Latvia": "Letônia", "Poland": "Polônia", "Moldova": "Moldávia",
    "Armenia": "Armênia", "Ukraine": "Ucrânia", "Belgium": "Bélgica", "France": "França",
    "Spain": "Espanha", "Tunisia": "Tunísia", "Trinidad and Tobago": "Trinidad e Tobago",
}

COLS = {
    "País": "pais", "ISO3": "iso3", "Continente": "continente", "Área (km²)": "area_km2",
    "População (2022)": "populacao", "Mortes confirmadas (ago/2024)": "mortes",
    "Excesso de mortes por 100 mil até 31/12/2021 (est.)": "excesso_100k_2021",
    "Excesso por 100 mil até 31/12/2022 (est.)": "excesso_100k_2022",
    "Excesso de mortes acumulado (est., jun/2024)": "excesso_acumulado",
    "Excesso por 100 mil acumulado (est.)": "excesso_100k_acumulado",
    "1ª dose (início da vacinação)": "inicio_vacinacao",
    "Esquema completo em 30/06/2021 (%)": "completo_2021_06_30",
    "Esquema completo em 31/12/2021 (%)": "completo_2021_12_31",
    "Data em que chegou a 50% completo": "data_50pct", "Data em que chegou a 70% completo": "data_70pct",
    "Idade mediana": "idade_mediana", "PIB per capita (US$ PPC)": "pib_pc_ppc",
}

AZUL, CINZA, VERDE = "#1f5fa8", "#b8bec6", "#1d7a46"


def carregar() -> pd.DataFrame:
    df = pd.read_excel(XLSX, sheet_name="Países")[list(COLS)].rename(columns=COLS)
    for c in ("inicio_vacinacao", "data_50pct", "data_70pct"):
        df[c] = pd.to_datetime(df[c], errors="coerce")
    df["densidade_hab_km2"] = df.populacao / df.area_km2
    df["mortes_100k"] = df.mortes / df.populacao * 1e5
    df["dias_apos_reino_unido"] = (df.inicio_vacinacao - REINO_UNIDO).dt.days
    grande = df.populacao >= 1_000_000
    df.loc[grande, "rank_mortes_100k"] = df.loc[grande, "mortes_100k"].rank(ascending=False, method="min")
    df.loc[grande, "rank_excesso_2021"] = df.loc[grande, "excesso_100k_2021"].rank(ascending=False, method="min")
    df["nome_pt"] = df.pais.map(NOMES).fillna(df.pais)
    return df


def barras_ranking(df, coluna, titulo, arquivo, rotulo_x, n=30):
    d = df[df.populacao >= 1_000_000].dropna(subset=[coluna]).nlargest(n, coluna)
    if "Brazil" not in d.pais.values:
        d = pd.concat([d, df[df.pais == "Brazil"]])
    d = d.sort_values(coluna)
    fig, ax = plt.subplots(figsize=(9, 10))
    cores = [AZUL if p == "Brazil" else CINZA for p in d.pais]
    ax.barh(d.nome_pt, d[coluna], color=cores)
    for y, v in enumerate(d[coluna]):
        ax.text(v + 5, y, f"{v:.0f}", va="center", fontsize=8)
    ax.set_title(titulo, loc="left", fontsize=12)
    ax.set_xlabel(rotulo_x)
    ax.spines[["top", "right"]].set_visible(False)
    fig.text(0.01, 0.005, "Fonte: Our World in Data; The Economist. Países com 1 milhão de habitantes ou mais.", fontsize=7)
    fig.tight_layout()
    fig.savefig(SAIDA / arquivo, dpi=150)
    plt.close(fig)


SELECAO = ["United Kingdom", "United States", "Chile", "Mexico", "Germany", "Italy", "Argentina",
           "Portugal", "India", "Brazil", "Ecuador", "Peru", "Colombia", "Uruguay", "Russia"]


def inicio_vacinacao(df):
    d = df[df.pais.isin(SELECAO)].sort_values("inicio_vacinacao", ascending=False)
    fig, ax = plt.subplots(figsize=(9, 6))
    cores = [AZUL if p == "Brazil" else CINZA for p in d.pais]
    ax.barh(d.nome_pt, d.dias_apos_reino_unido, color=cores)
    for y, (v, dt) in enumerate(zip(d.dias_apos_reino_unido, d.inicio_vacinacao)):
        ax.text(v + 1, y, f"{dt:%d/%m/%Y} ({v:+.0f} dias)", va="center", fontsize=8)
    ax.set_title("Início da vacinação: dias depois do Reino Unido (08/12/2020)", loc="left")
    ax.set_xlabel("dias")
    ax.set_xlim(right=d.dias_apos_reino_unido.max() + 30)
    ax.spines[["top", "right"]].set_visible(False)
    fig.text(0.01, 0.005, "Fonte: Our World in Data (vaccinations.csv) e datas oficiais conferidas.", fontsize=7)
    fig.tight_layout()
    fig.savefig(SAIDA / "03_inicio_vacinacao.png", dpi=150)
    plt.close(fig)


def cobertura(df):
    d = df[df.pais.isin(SELECAO)].sort_values("completo_2021_06_30")
    fig, ax = plt.subplots(figsize=(9, 6))
    y = range(len(d))
    ax.barh([i + 0.2 for i in y], d.completo_2021_06_30, height=0.4, color=[AZUL if p == "Brazil" else CINZA for p in d.pais], label="30/06/2021")
    ax.barh([i - 0.2 for i in y], d.completo_2021_12_31, height=0.4, color=[VERDE if p == "Brazil" else "#dfe3e8" for p in d.pais], label="31/12/2021")
    ax.set_yticks(list(y), d.nome_pt)
    ax.set_xlabel("% da população com esquema vacinal completo")
    ax.set_title("Cobertura vacinal: meio e fim de 2021", loc="left")
    ax.legend(loc="lower right")
    ax.spines[["top", "right"]].set_visible(False)
    fig.text(0.01, 0.005, "Fonte: Our World in Data.", fontsize=7)
    fig.tight_layout()
    fig.savefig(SAIDA / "04_cobertura_vacinal_2021.png", dpi=150)
    plt.close(fig)


def americas(df):
    d = df[df.continente.isin(["América do Sul", "América do Norte"]) & (df.populacao >= 1_000_000)].dropna(subset=["mortes_100k"]).sort_values("mortes_100k")
    fig, ax = plt.subplots(figsize=(9, 8))
    ax.barh(d.nome_pt, d.mortes_100k, color=[AZUL if p == "Brazil" else CINZA for p in d.pais])
    for yy, v in enumerate(d.mortes_100k):
        ax.text(v + 5, yy, f"{v:.0f}", va="center", fontsize=8)
    ax.set_title("Américas: mortes confirmadas por 100 mil habitantes (até ago/2024)", loc="left")
    ax.spines[["top", "right"]].set_visible(False)
    fig.text(0.01, 0.005, "Fonte: Our World in Data. Países com 1 milhão de habitantes ou mais.", fontsize=7)
    fig.tight_layout()
    fig.savefig(SAIDA / "05_americas_mortes_100k.png", dpi=150)
    plt.close(fig)


def main():
    SAIDA.mkdir(exist_ok=True)
    df = carregar()
    df.drop(columns="nome_pt").to_csv(RAIZ / "dados" / "covid_paises.csv", index=False, date_format="%Y-%m-%d")
    barras_ranking(df, "mortes_100k", "Mortes confirmadas por Covid por 100 mil habitantes (até ago/2024)", "01_mortes_100k_ranking.png", "mortes por 100 mil")
    barras_ranking(df, "excesso_100k_2021", "Excesso de mortes por 100 mil habitantes até 31/12/2021 (estimativa)", "02_excesso_100k_2021.png", "mortes em excesso por 100 mil")
    inicio_vacinacao(df)
    cobertura(df)
    americas(df)
    br = df[df.pais == "Brazil"].iloc[0]
    grandes = (df.populacao >= 1_000_000) & df.mortes_100k.notna()
    mundo = df.loc[df.iso3.str.startswith("OWID") == False, ["mortes", "populacao"]].dropna().sum()  # noqa: E712
    print(f"Brasil: {br.mortes:.0f} mortes, {br.mortes_100k:.1f}/100 mil, rank {br.rank_mortes_100k:.0f} de {grandes.sum()}")
    print(f"Brasil excesso 2021: {br.excesso_100k_2021}/100 mil, rank {br.rank_excesso_2021:.0f}; acumulado {br.excesso_acumulado:.0f}")
    print(f"Média ponderada (países da planilha): {mundo.mortes / mundo.populacao * 1e5:.1f}/100 mil")


if __name__ == "__main__":
    main()
