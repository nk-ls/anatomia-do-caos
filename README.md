# Anatomia do Caos — Covid-19 no Brasil em dados e fontes públicas

> **Status: em construção (rascunho privado).** Este repositório será tornado público após revisão.

Levantamento aberto e verificável sobre a Covid-19 no Brasil, comparado com o resto do mundo:
mortes por habitante, início e ritmo da vacinação, e as decisões do governo federal
(Pfizer, Butantan/CoronaVac, cloroquina) documentadas pela CPI da Covid do Senado.

Ponto de partida: o documentário *Anatomia do Caos* (dir. Dandara Ferreira, 2026), sobre os bastidores da CPI.

## Princípios

1. **Fonte primária primeiro** — Senado, Anvisa, Ministério da Saúde, STF, Diário Oficial, artigos revisados por pares.
2. **Cada afirmação com link e data.** O que não tem fonte verificável sai ou é marcado como lacuna.
3. **Fato ≠ alegação ≠ estimativa ≠ opinião.** Pedido de indiciamento não é condenação; estimativa vem com método e limitação; posição do autor fica em seção separada.
4. **Só figuras públicas e atos públicos documentados.**
5. **Reprodutível** — dados brutos, scripts e gráficos aqui; qualquer pessoa refaz os números.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `dados/` | Planilha `covid_paises.xlsx` (234 países e territórios) e dados brutos |
| `docs/` | Relatório, cronologia, fontes, listas e metodologia |
| `graficos/` | Gráficos gerados pelos scripts |
| `scripts/` | Código que baixa, processa e gera tudo |
| `arquivo/` | Cópias datadas das fontes coletadas (prova contra link quebrado) |

## Etapas

- [x] 1. Dados globais por país (planilha)
- [ ] 2. Roteiro do documentário (transcrição + minutagem)
- [ ] 3. Cronologia Brasil: vacinas, cloroquina, Butantan, Pfizer
- [ ] 4. Estudos de mortes evitáveis (com contra-argumentos)
- [ ] 5. CPI: pessoas com pedido de indiciamento e quem contribuiu no combate à pandemia
- [ ] 6. Relatório final + gráficos
- [ ] 7. Revisão independente de cada afirmação

## Licença

Texto e análises: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.pt_BR). Código: MIT.
Dados de terceiros seguem as licenças das fontes (ver `dados/` e `docs/fontes.md`).
