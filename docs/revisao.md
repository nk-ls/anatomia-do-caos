# Revisão independente (24/10/2026)

Antes da divulgação, dois revisores que não participaram da redação tentaram **encontrar erros** no levantamento, buscando confirmação em fontes diferentes das citadas.

## O que foi revisado

1. **Página inicial e documentos:** todos os números da página inicial (recalculados a partir da planilha), todas as citações entre aspas, datas de decisões judiciais e coerência entre arquivos.
2. **Fichas dos envolvidos:** uma amostra sorteada de **50 atos** entre os 259 registrados. Para cada ato, o revisor checou se aconteceu e se a data, a pessoa, a citação, o tipo e a classificação estão certos.

## Resultado

- **Nenhuma acusação falsa encontrada.** Todo ato "contra" da amostra teve confirmação independente.
- **Amostra de atos:** 41 de 50 corretos e 9 com erro de data, de contexto ou de atribuição. **Os 9 foram corrigidos.**
- **Números dos países:** todos conferem com a planilha (Brasil 326 por 100 mil, 19º; 3º nas Américas; 33º no excesso de mortes).

## O que foi corrigido

| Onde | Antes | Depois |
|---|---|---|
| Página inicial | 702.116 mortes na dedicatória (série OMS/Our World in Data) | Mais de 715 mil, a contagem do Ministério da Saúde (715.295 em 11/03/2025); a série OMS ficou só nas comparações entre países |
| Página inicial | "230 mil morreram sem entrar na contagem", dito como fato | Apresentado como estimativa de excesso de mortes, que também inclui mortes indiretas |
| Página inicial | "até hoje não há condenação" | "ninguém foi condenado **pelos fatos apontados pela CPI**" (Jair Bolsonaro foi condenado pelo STF em 2025 em outro processo, o da trama golpista, e isso está na ficha dele) |
| Página inicial | "nove parentes por morte" sem dizer a origem | Multiplicador calculado nos EUA, usado como aproximação; faixa corrigida para 6,4 a 8,4 milhões |
| Planilha, tabela e gráfico | Início da vacinação: Portugal 01/01/2021, Uruguai 27/02/2021, Equador 20/01/2021 | Portugal 27/12/2020, Uruguai 01/03/2021, Equador 21/01/2021 (datas oficiais de início) |
| Fala de 04/03/2021 | "Vamos ficar chorando até quando?" (erro da legenda automática) | "Vão ficar chorando até quando?", como registrado pela imprensa |
| Ficha de Otto Alencar | Atribuía a ele a crítica ao estudo da Henry Ford | Quem a fez foi o senador Alessandro Vieira; a ficha de Otto ficou só com o confronto sobre infectologia |
| Ficha de Wilson Lima | Denúncia recebida em 2022 | Recebida pelo STJ em 20/09/2021 |
| Ficha do SUS | Vacinação nacional em 17/01/2021 com CoronaVac e AstraZeneca | Campanha nacional em 18/01/2021 com a CoronaVac; AstraZeneca a partir de 22/01 |
| Ficha de Queiroga | Fala de 20/09/2021 a favor da vacinação de adolescentes, sem contexto | Acrescentado que ele próprio havia suspendido essa vacinação dias antes |
| Outras fichas | Datas e fontes imprecisas (Anvisa/Sputnik, busca na Precisa, auxílio emergencial, "hipérbole") | Datas e fontes corrigidas |
| Documentário | "a seis meses das eleições" marcado como confirmado | O pedido da PGR foi no fim de jul/2022, pouco mais de dois meses antes da eleição |

## Auditoria completa (24/10/2026)

Depois da revisão por amostra, uma auditoria conferiu os documentos, a página inicial e as 107 linhas de `dados/pessoas.csv` contra o [relatório final aprovado da CPI](https://github.com/nk-ls/anatomia-do-caos-fontes/blob/main/documentos/cpi_relatorio_final_aprovado_2021-10-26.pdf) (páginas impressas), o contrato Pfizer nº 52/2021, a Nota Informativa MS 9/2020 e as cópias arquivadas das fontes. Principais correções:

| Onde | Antes | Depois |
|---|---|---|
| Ficha de Daniella de Aguiar | Pedido por perigo para a vida ou saúde de outrem (art. 132) | Pedido por tentativa de homicídio (art. 121, c/c arts. 13, § 2º, b, e 14), item 57 do resumo, p. 1120 (fundamentação na p. 1035) |
| Fichas de Bolsonaro, filhos e deputados investigados | "Nenhuma denúncia ou condenação até out/2026" | "…por fatos apontados pela CPI…, até onde as fontes mostram", com os fatos judiciais alheios à CPI registrados à parte (Bolsonaro, Zambelli, Eduardo Bolsonaro) |
| docs/cpi.md | Onyx só com o art. 286; crimes de Wilson Lima e Campêlo como lacuna; VTCLog com improbidade só para Andreia Lima | Crimes conforme o resumo dos indiciamentos (itens 4, 51 a 54, 69 e 70) |
| Wagner Rosário | Desfecho em aberto | Arquivamento por Lewandowski (Pet 10.062), em 01/08/2022, a pedido da PGR |
| Covaxin | "Pagamento antecipado de R$ 221,4 milhões" | Invoice de cerca de US$ 45 milhões pedindo pagamento antecipado; o pagamento não foi feito |
| docs/estudos.md | 120 mil como "medidas + vacinação"; 127 mil "não confirmado"; 95,5 mil e 145 mil como números do relatório | 120 mil só para medidas não farmacológicas (p. 1021); 127 mil para vacinas (Amaku et al., p. 1015-1016); 95,5 mil e 145 mil não constam do relatório |
| Contrato Pfizer | Assinado em 19/03/2021 | Assinatura eletrônica do MS em 18/03/2021, 20:59; 19/03 é a data de impressão no SEI |
| Datas | Suspensão da CoronaVac em 10/11/2020; Sputnik negada em mai/2021; Toffoli em mar/2023 | 09/11/2020; 26/04/2021; 28/02/2023 (sem atribuir a Pazuello, Queiroga e Braga Netto o que a fonte não diz) |
| Nota Informativa 9/2020 | Citação não literal | Texto do termo de consentimento, conforme o PDF |
| Selo do README | "todos os erros encontrados corrigidos" | Revisão por amostra e auditoria completa, com correções registradas aqui |

A lista completa, com antes, depois e página de cada correção, acompanha o histórico de alterações do repositório.

## O que continua em aberto

- A data exata de corte do modelo de excesso de mortes do The Economist e o andamento do inquérito da PF autorizado em 2025 (sob sigilo).
- 25 das 182 fontes não puderam ser arquivadas automaticamente (sites que bloqueiam robôs ou links quebrados); a lista está no [manifesto do arquivo de fontes](https://github.com/nk-ls/anatomia-do-caos-fontes/blob/main/arquivo/manifesto.csv).
- 13 fichas ainda só têm o pedido da CPI, sem atos documentados.

Uma revisão por amostra não garante a ausência de erros. Encontrou um? Abra uma *issue* com a fonte, e a correção entra com registro.
