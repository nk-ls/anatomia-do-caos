# Revisão independente (24/10/2026)

Antes da divulgação, dois revisores que não participaram da redação tentaram **encontrar erros** no levantamento, buscando confirmação em fontes diferentes das citadas.

## O que foi revisado

1. **Página inicial e documentos:** todos os números da página inicial (recalculados a partir da planilha), todas as citações entre aspas, datas de decisões judiciais e coerência entre arquivos.
2. **Fichas dos envolvidos:** uma amostra sorteada de **50 atos** entre os 259 registrados. Para cada ato, o revisor checou se aconteceu e se a data, a pessoa, a citação, o tipo e a classificação estão certos.

## Resultado

- **Nenhuma acusação falsa encontrada.** Todo ato "contra" da amostra teve confirmação independente. Esta revisão conferiu a **exatidão** dos fatos; o **equilíbrio** (atos omitidos, régua igual para todos) foi avaliado depois, na revisão de neutralidade registrada abaixo.
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

## Revisão de cadeia de custódia e neutralidade (24/10/2026)

Pedida pelo autor com a regra: tudo no site tem de poder ser auditado, ser verídico e não ter lado político. Método e roteiro de conferência em [cadeia de custódia](cadeia-de-custodia.md).

**Integridade e reprodutibilidade**
- Todas as impressões digitais conferem: as 454 cópias de páginas da web com SHA-256 no `arquivo/manifesto.csv` e todas as pastas de `documentos/` (`sha256sum -c`), sem nenhum arquivo sem hash.
- Nenhum link quebrado: 688 links do site para o arquivo de fontes, 490 links internos e 150 links dentro do arquivo de fontes.
- Os scripts foram rodados de novo e reproduzem os dados publicados (gráficos, fichas, rede, caminho do dinheiro, estados). A lista de fontes estava desatualizada e foi corrigida no gerador: agora lê também as páginas e os dados do site.
- Os 28 valores da página Caminho do dinheiro e os números da página inicial (716.626 óbitos, excesso de mortes, órfãos) foram procurados e encontrados, escritos iguais, nos documentos citados.
- Cópias arquivadas passaram de 199 para **493 das 550 fontes citadas (90%)**. Foram arquivadas também as respostas brutas das APIs oficiais (painel do Ministério da Saúde, Câmara, Senado), os dados de saúde da página inicial e os documentos dos casos estaduais.

**Neutralidade (revisão crítica independente, 37 achados; todos tratados)**
- O grupo "Atuaram a favor da população" julgava pessoas, contra a regra de classificar só atos. Os grupos passaram a ser por função (por exemplo, "Senadores da CPI", "Governos estaduais", "Instituições de saúde e SUS"), e as cores da rede, por esfera de atuação; verde e vermelho ficam só para os atos.
- Saíram das fichas os dados eleitorais de 2026 e os processos alheios à pandemia, que só apareciam para um dos lados.
- A opinião do autor na página inicial ganhou o rótulo "opinião, não é dado verificado"; o item de símbolos religiosos saiu da cronologia e foi para o posicionamento do autor.
- Mesma régua para atos parecidos: depoimentos, denúncias e condução da CPI passaram a "processual"; a viagem de João Doria a Miami virou ato próprio; o pedido de investigação contra Luis Miranda e seu arquivamento foram registrados.
- Os 11 senadores titulares da CPI têm ficha (antes, só os 4 que votaram "sim"), com o voto de cada um e o voto em separado; saiu a única citação de voto, que era de um voto "não".
- O Caminho do dinheiro passou a incluir seis casos estaduais e de consórcio, de partidos diferentes (Consórcio Nordeste, Rio de Janeiro, Pará, Amazonas, Santa Catarina, São Paulo), com o mesmo método.
- Redação: estimativas descritas como estimativas ("cerca de 6,4 milhões"; o efeito do atraso da vacina como faixa de estudos); acusações atribuídas a quem acusa; "mentiu" trocado pela classificação da checagem; rótulos políticos retirados; o coautor parte interessada de um estudo foi identificado.
- Fontes de linha editorial alinhada usadas como prova única foram trocadas por imprensa de referência (Correio Braziliense, A Gazeta/Agência Estado). A frase "A VACINA CHINESA DE JOÃO DORIA" foi confirmada na fonte arquivada; a frase "minha decisão é a de não adquirir", que só existe em tradução da Reuters, saiu.

**Coleta com navegador e uma correção de custódia (24/10/2026, noite).** As fontes que recusavam o coletor automático foram coletadas de novo com um navegador (Playwright), em passada normal e depois lenta (30 s entre endereços), sem contornar CAPTCHA, login ou bloqueio declarado (script público: `scripts/coletar_navegador.mjs` no arquivo de fontes). As cópias passaram a **540 de 550 fontes citadas (98%)**; seguem sem cópia 5 páginas que bloqueiam robôs, 3 repositórios de código e o vídeo do documentário. Na conferência, uma cópia do Estado de Minas não batia com a impressão digital registrada: uma coleta complementar feita à mão gravou por cima da cópia anterior, que não foi preservada. O manifesto registra isso na própria linha, e os dois coletores passaram a nunca sobrescrever arquivos (uma nova coleta no mesmo dia ganha a hora no nome). A cópia que existe confere com a sua impressão digital.
