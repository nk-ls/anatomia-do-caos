# A curva das mortes: de onde vem e o que ela não cobre

A série de mortes por Covid-19 no Brasil usada neste levantamento está em
[`dados/mortes_brasil.csv`](../dados/mortes_brasil.csv): **1.118 dias**, de
25/02/2020 a 18/03/2023, com o acumulado, o número do dia e a média móvel de
7 dias.

## A fonte

O número vem do **painel do Ministério da Saúde**, compilado diariamente pelo
projeto [covid19br, de Wesley Cota](https://github.com/wcota/covid19br). Usamos
a coluna `deathsMS`, que é o número do painel — e **não** a coluna `deaths`, que
consolida os boletins das secretarias estaduais. A razão está na conferência
abaixo.

Esta é a mesma fonte que o site usa nas páginas do Brasil. A série da OMS/Our
World in Data, que aparece nas comparações entre países, dá um total diferente
(702.116) e fica restrita àquelas comparações, para que os números brasileiros
venham todos do mesmo lugar.

## A conferência contra a época

A pergunta que importa num país onde o governo **alterou a divulgação dos dados**
em junho de 2020 — episódio que levou os veículos de imprensa a montar um
consórcio para apurar direto com os estados — é simples: *o número de hoje é o
mesmo que se via naquele dia?*

Dá para responder, porque o repositório do covid19br é versionado. Baixamos o
arquivo como ele estava em **19/01/2021** ([commit `8c3e74ab549d`](https://raw.githubusercontent.com/wcota/covid19br/8c3e74ab549d/cases-brazil-states.csv)) e comparamos
com o de hoje, nas 330 datas em comum:

| Coluna | O que é | Datas em que o valor mudou depois |
|---|---|---:|
| `deathsMS` | painel do Ministério da Saúde | **0 de 330** |
| `deaths` | boletins das secretarias estaduais | **240 de 330** |

O painel do MS **não foi revisado para trás**: cada data vale hoje o mesmo que
valia na época. Os boletins estaduais foram revisados em 73% das datas, o que é
normal numa consolidação, mas significa que a curva mudaria de forma conforme o
ano em que fosse desenhada. Por isso a série publicada aqui é a do painel.

As duas versões do arquivo estão no
[arquivo de fontes](https://github.com/nk-ls/anatomia-do-caos-fontes), com data e
SHA-256. Qualquer pessoa pode refazer a comparação.

## O que a série não cobre

Ela termina em **18/03/2023, com 699.310 mortes**. O painel do Ministério da
Saúde continuou registrando depois: a soma dos 27 estados em
[`dados/estados.csv`](../dados/estados.csv), coletada em 24/10/2026, dá
**716.626**.

**A diferença é de 17.316 mortes, registradas depois do fim da série.** Nenhuma
série diária aberta chega até lá. Onde este site cita o total de mortes, o
número é o do painel (mais de 716 mil); onde desenha a curva, é o da série, que
para em março de 2023. Os dois números são do mesmo órgão, em datas diferentes.

## Por que diária, e não semanal

A primeira versão desta série agregava por semana epidemiológica, para alisar a
queda de notificação de fim de semana e feriado. O efeito colateral apareceu na
conferência: anotar um marco numa data específica passava a ler o valor da
semana anterior, e errava por até **5.530 mortes** — o caso da instalação da CPI.
A série passou a ser diária, e o alisamento virou a média móvel de 7 dias, que
vai no próprio arquivo. Assim todo número citado em qualquer data é o do dia.

## O número que precisa de contexto

Cerca de **70% das mortes são posteriores à primeira dose aplicada no Brasil**
(17/01/2021). Isolado, esse número sugere o contrário do que os dados mostram.
Cruzando com a cobertura vacinal registrada em
[`dados/estados.csv`](../dados/estados.csv):

| Período | Mortes | % do total | Cobertura com esquema completo |
|---|---:|---:|---|
| Até a 1ª dose (17/01/2021) | 209.847 | 30,0% | 0% |
| Da 1ª dose a jun/2021 | 308.219 | 44,1% | chega a **13,8%** |
| Jul a dez/2021 | 100.990 | 14,4% | vai a 72,8% |
| 2022 até o fim da série | 80.254 | 11,5% | acima de 70% |

**74% das mortes aconteceram antes de o país alcançar 14% da população com
esquema vacinal completo.** O pior momento da pandemia foi **12/04/2021**, com
média móvel de **3.124 mortes por dia** — quatro meses depois do início da
vacinação no mundo, e com 14 em cada 100 brasileiros imunizados.

Onde a curva das mortes for publicada neste site, a da cobertura vacinal vai
junto. A primeira sozinha diria uma coisa que os dados não dizem.
