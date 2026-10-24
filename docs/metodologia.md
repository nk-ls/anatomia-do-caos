# Metodologia dos dados

Tudo aqui é refeito por `python scripts/gerar_graficos.py`, que lê `dados/covid_paises.xlsx`
e gera `dados/covid_paises.csv` e os gráficos em `graficos/`.

## Fontes da planilha

| Coluna | Fonte |
|---|---|
| Mortes confirmadas, população, continente, idade mediana, PIB per capita, cobertura vacinal | Our World in Data, base COVID-19 arquivada (atualização final 04/08/2024) — https://github.com/owid/covid-19-data |
| Início da vacinação | Our World in Data, `vaccinations.csv` (primeira data com doses registradas); 16 países conferidos com a data oficial da campanha |
| Excesso de mortes | The Economist, modelo global de excesso de mortes (estimativa central) — https://github.com/TheEconomist/covid-19-the-economist-global-excess-deaths-model |
| Área | samayo/country-json, complementado para 10 territórios pequenos |

## Cálculos

- **Mortes por 100 mil** = mortes confirmadas ÷ população × 100.000.
- **Ranks** consideram só países com 1 milhão de habitantes ou mais (157 com dado de mortes),
  para evitar distorção de microestados.
- **Dias após o Reino Unido**: o Reino Unido abriu em 08/12/2020 a primeira campanha nacional,
  fora de ensaio clínico, com vacina aprovada por agência reguladora ocidental; a Rússia registra
  doses desde 05/12/2020 (campanha em Moscou com a Sputnik V, antes do fim da fase 3), e a China
  já aplicava doses por uso emergencial. O Reino Unido é a régua, não o "primeiro do mundo".

## Limitações

- **Mortes confirmadas dependem de testagem e registro.** Países que testaram pouco aparecem
  melhor do que estão. Por isso a planilha traz também o **excesso de mortes** (mortes de todas
  as causas acima do esperado), que é uma estimativa de modelo, com intervalo de incerteza.
- População de referência: 2022 (OWID).
- Comparar países não isola o efeito de governo: idade da população, densidade, desigualdade,
  variantes e sistema de saúde também pesam. O README e docs/estudos.md tratam disso explicitamente.
