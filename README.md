# Anatomia do Caos — a Covid-19 no Brasil em dados públicos

**Pelo povo, para o povo brasileiro.** Dados abertos, gráficos e fontes que qualquer pessoa pode conferir, baixar e reproduzir.

> 🚧 **Em construção.** Os dados e gráficos desta página já estão prontos. O relatório sobre as decisões do governo federal (Pfizer, Butantan, cloroquina, CPI) está sendo escrito e só entra depois de cada afirmação ser conferida na fonte.

**Baixe os dados:** [planilha Excel (234 países)](dados/covid_paises.xlsx) · [CSV](dados/covid_paises.csv) · [como os números foram calculados](docs/metodologia.md)

---

## O Brasil em números

| Indicador | Brasil | Fonte |
|---|---:|---|
| Mortes confirmadas por Covid (até ago/2024) | **702.116** | Our World in Data |
| Mortes confirmadas por 100 mil habitantes | **326** | Our World in Data |
| Posição mundial (157 países com 1 milhão+ de habitantes) | **19º pior** | cálculo próprio |
| Posição nas Américas | **3º pior** (depois de Peru e Estados Unidos) | cálculo próprio |
| Excesso de mortes estimado, acumulado até jun/2024 | **≈ 934 mil** | The Economist (estimativa) |
| Início da vacinação | **17/01/2021** — 40 dias depois do Reino Unido | Our World in Data |
| População com esquema completo em 30/06/2021 | **12,4%** | Our World in Data |
| População com esquema completo em 31/12/2021 | **66,6%** | Our World in Data |

**O que é "excesso de mortes"?** É quantas pessoas morreram (de qualquer causa) acima do que seria esperado sem a pandemia. Serve para corrigir mortes por Covid que não foram testadas nem registradas. No Brasil, o excesso estimado (≈ 934 mil) é maior que as mortes confirmadas (702 mil).

---

## 1. Mortes por 100 mil habitantes no mundo

Dividir as mortes pela população permite comparar países de tamanhos diferentes. O Brasil aparece em azul.

![Ranking mundial de mortes confirmadas por Covid por 100 mil habitantes](graficos/01_mortes_100k_ranking.png)

## 2. Excesso de mortes até o fim de 2021

Pelo excesso de mortes (estimativa), o Brasil fica em 33º de 157 países: pior que a maioria, mas atrás de Peru, México, Rússia e boa parte do Leste Europeu, onde muitas mortes não foram registradas como Covid.

![Ranking de excesso de mortes por 100 mil habitantes até 31/12/2021](graficos/02_excesso_100k_2021.png)

## 3. Américas

![Mortes confirmadas por 100 mil habitantes nas Américas](graficos/05_americas_mortes_100k.png)

## 4. Quando cada país começou a vacinar

O Brasil aplicou a primeira dose em 17/01/2021: 40 dias depois do Reino Unido, 34 depois dos Estados Unidos e 24 depois de Chile e México.

![Dias entre o início da vacinação no Reino Unido e em cada país](graficos/03_inicio_vacinacao.png)

## 5. Quanto da população estava vacinada

Em 30/06/2021, o Brasil tinha 12% da população com esquema completo, contra cerca de 49–55% em Estados Unidos, Reino Unido e Chile. Quando as vacinas chegaram em volume, o SUS vacinou rápido: no fim de 2021 o Brasil (67%) já tinha passado os Estados Unidos (63%). O atraso pesou justamente no primeiro semestre de 2021, os meses mais mortais da pandemia no país.

![Cobertura vacinal em 30/06/2021 e 31/12/2021](graficos/04_cobertura_vacinal_2021.png)

| País | 1ª dose | Dias após o Reino Unido | Esquema completo 30/06/2021 | Esquema completo 31/12/2021 | Chegou a 50% em |
|---|---|---:|---:|---:|---|
| Rússia | 05/12/2020 | -3 | 12,0% | 46,1% | 20/03/2022 |
| Reino Unido | 08/12/2020 | +0 | 49,0% | 70,3% | 05/07/2021 |
| Estados Unidos | 14/12/2020 | +6 | 49,3% | 63,4% | 09/07/2021 |
| Chile | 24/12/2020 | +16 | 55,0% | 84,4% | 22/06/2021 |
| México | 24/12/2020 | +16 | 15,3% | 57,1% | 20/11/2021 |
| Itália | 27/12/2020 | +19 | 32,1% | 75,7% | 26/07/2021 |
| Alemanha | 27/12/2020 | +19 | 37,6% | 71,0% | 26/07/2021 |
| Argentina | 29/12/2020 | +21 | 9,5% | 67,6% | 16/10/2021 |
| Portugal | 01/01/2021 | +24 | 32,5% | 83,2% | 23/07/2021 |
| Índia | 16/01/2021 | +39 | 4,1% | 42,6% | 31/01/2022 |
| **Brasil** | **17/01/2021** | **+40** | **12,4%** | **66,6%** | **21/10/2021** |
| Equador | 20/01/2021 | +43 | 8,1% | 70,5% | 08/09/2021 |
| Peru | 09/02/2021 | +63 | 9,6% | 64,9% | 15/11/2021 |
| Colômbia | 17/02/2021 | +71 | 13,3% | 54,6% | 10/12/2021 |
| Uruguai | 27/02/2021 | +81 | 49,2% | 78,4% | 01/07/2021 |

**Leitura honesta:** começar cedo não garantiu cobertura (Rússia e México começaram antes e vacinaram menos), e começar tarde não impediu cobertura alta (Uruguai). Comparar países também não isola o efeito de um governo: idade da população, desigualdade, variantes e sistema de saúde pesam. O relatório trata disso com as fontes.

---

## Como este trabalho é feito

1. **Fonte primária primeiro**: Senado (CPI da Covid), Anvisa, Ministério da Saúde, STF, Diário Oficial, artigos científicos revisados.
2. **Cada afirmação com link e data.** O que não tem fonte verificável sai ou fica marcado como lacuna.
3. **Fato ≠ alegação ≠ estimativa ≠ opinião.** Pedido de indiciamento não é condenação. Estimativa vem com método e limitação. Opinião do autor fica em seção própria.
4. **Só figuras públicas e atos públicos documentados.**
5. **Reprodutível**: `python scripts/gerar_graficos.py` refaz os gráficos e o CSV a partir da planilha.

Ponto de partida: o documentário *Anatomia do Caos* (dir. Dandara Ferreira, 2026), sobre os bastidores da CPI da Covid.

## Andamento

- [x] 1. Dados globais por país (planilha, CSV e gráficos)
- [ ] 2. Roteiro do documentário (resumo com minutagem)
- [ ] 3. Cronologia Brasil: Pfizer, Butantan/CoronaVac, cloroquina
- [ ] 4. Estudos de mortes evitáveis, com contra-argumentos
- [ ] 5. CPI: pedidos de indiciamento e quem atuou no combate à pandemia
- [ ] 6. Relatório final
- [ ] 7. Revisão independente de cada afirmação

## Estrutura

| Pasta | Conteúdo |
|---|---|
| [`dados/`](dados/) | Planilha e CSV com os 234 países e territórios |
| [`graficos/`](graficos/) | Gráficos (PNG) |
| [`docs/`](docs/) | Metodologia, e em breve relatório, cronologia e fontes |
| [`scripts/`](scripts/) | Código que gera tudo |

## Licença e uso

Pode copiar, compartilhar e republicar, citando a fonte. Texto, análises e gráficos: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt_BR). Código: MIT. Os dados de terceiros seguem as licenças das fontes: Our World in Data (CC BY 4.0) e The Economist (ver repositório do modelo).

Encontrou um erro? Abra uma *issue* com o link da fonte, e a correção entra com registro.
