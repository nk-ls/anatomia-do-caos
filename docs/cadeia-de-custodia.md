# Cadeia de custódia

Tudo o que aparece no site pode ser seguido, de trás para frente, até o documento de origem. Esta página explica cada elo e como conferir sozinho, sem precisar confiar no projeto.

## Os cinco elos

| Elo | O que acontece | Onde fica o registro |
|---|---|---|
| 1. **Coleta** | O documento ou a página é baixado da fonte original, no estado em que estava, com data e hora | `arquivo/manifesto.csv` (páginas da web) e o `README.md` de cada pasta de `documentos/` (documentos oficiais), no [arquivo de fontes](https://github.com/nk-ls/anatomia-do-caos-fontes) |
| 2. **Lacre** | Cada arquivo recebe uma impressão digital SHA-256. Se um único byte mudar, a impressão muda | `arquivo/manifesto.csv` (coluna `sha256`) e `SHA256SUMS` em cada pasta de `documentos/` |
| 3. **Guarda** | As cópias ficam num repositório público, com histórico de todas as alterações (Git). Nenhuma cópia é editada: correções viram cópias novas | Histórico de commits do [arquivo de fontes](https://github.com/nk-ls/anatomia-do-caos-fontes/commits/main) |
| 4. **Processamento** | Scripts públicos leem as cópias e geram os dados do site (CSV e JSON). Ninguém edita os dados à mão | `scripts/` deste repositório; os dados em `dados/` |
| 5. **Exibição** | As páginas do site só leem os arquivos de `dados/` e mostram, para cada informação, a fonte e o link da cópia arquivada | Páginas do site; [Referências](https://transparenciadocaos.com/referencias.html) lista todas as fontes |

## De onde vem cada dado do site

| Dado no site | Arquivo | Gerado por | Vem de |
|---|---|---|---|
| Países: mortes, população, vacinação | `dados/covid_paises.csv` | planilha `dados/covid_paises.xlsx` + `scripts/gerar_graficos.py` | OMS e Our World in Data (ver [metodologia](metodologia.md)) |
| Pessoas e atos | `dados/pessoas.csv`, `dados/atos.csv` | levantamento manual com fonte por ato, auditado ([revisão](revisao.md)) | fontes listadas em cada linha |
| Fichas | `pessoas/*.md` | `scripts/gerar_pessoas.py` | `pessoas.csv` + `atos.csv` + `fontes.csv` |
| Rede | `dados/rede.json` | `scripts/gerar_rede.py` | `atos.csv` (regras de tema no próprio script) |
| Lista de fontes | `dados/fontes.csv` | `scripts/gerar_fontes.py` | todas as URLs citadas no site, cruzadas com as cópias do arquivo de fontes |
| Caminho do dinheiro | `dados/dinheiro.json` | `scripts/gerar_dinheiro.py` | contratos, acórdãos do TCU, decisões da CGU e do STF, relatório da CPI (todos em `documentos/`) |
| Empresas e sócios | `dados/empresas.json` | `scripts/gerar_empresas.py` | dados abertos do CNPJ da Receita Federal (resposta bruta em `documentos/receita_cnpj/`) |
| Estados: mortes e vacinação | `dados/estados.csv` | `scripts/gerar_estados.py` | painel do Ministério da Saúde e SI-PNI (respostas brutas em `documentos/apis_oficiais/` e `documentos/vacinacao_uf/`) |
| Estado de cada pessoa | `dados/pessoas_uf.csv` | `scripts/gerar_estados.py` | APIs da Câmara e do Senado (respostas brutas em `documentos/apis_oficiais/`) e cargo da ficha |
| Fotos | `assets/fotos/`, `dados/fotos.csv` | `scripts/baixar_fotos.py` | fotos oficiais da Câmara e do Senado (crédito em cada foto) |
| Wikidata | `dados/wikidata.csv` | `scripts/buscar_wikidata.py` | consulta pública ao Wikidata |

## Como conferir sozinho

**1. A cópia é idêntica à que foi coletada?** Baixe o arquivo de fontes e confira as impressões digitais:

```bash
git clone https://github.com/nk-ls/anatomia-do-caos-fontes
cd anatomia-do-caos-fontes/documentos/controle   # ou qualquer outra pasta
sha256sum -c SHA256SUMS                          # todas as linhas devem dizer "OK"
```

Para as páginas da web, a impressão digital de cada cópia está na coluna `sha256` de `arquivo/manifesto.csv`.

**2. A cópia é igual ao original?** Abra a URL de origem (está no manifesto ou no README da pasta) e compare. Se a página mudou ou saiu do ar depois da coleta, a cópia datada é o registro do que estava publicado naquele dia.

**3. Os dados do site saem mesmo das cópias?** Rode os scripts e compare com os arquivos publicados:

```bash
git clone https://github.com/nk-ls/anatomia-do-caos
cd anatomia-do-caos
python3 scripts/gerar_dinheiro.py && python3 scripts/gerar_rede.py && python3 scripts/gerar_pessoas.py
git status    # nenhum arquivo de dados deve aparecer como modificado
```

**4. O que o site diz está no documento?** Cada valor da página Caminho do dinheiro tem o link do documento ao lado. Abra e procure o número: ele aparece escrito igual.

## O que não está coberto

- **Fontes que bloquearam a coleta automática** (sites que recusam robôs ou que saíram do ar) não têm cópia. Elas aparecem em [Referências](https://transparenciadocaos.com/referencias.html) sem o selo "cópia arquivada", e a tentativa fica registrada no manifesto, com o erro.
- **Documentos sigilosos** (por exemplo, os e-mails da Pfizer entregues à CPI) não estão no arquivo, porque não são públicos. O site diz isso onde eles são mencionados.
- **Dados agregados por terceiros** (vacinação por estado, somada pelo Observatório Covid-19 BR a partir do SI-PNI) são marcados como "conferidos pela fonte, não na íntegra".
- A coleta foi feita por um computador fora do Brasil; alguns portais do governo não respondem a ele. Esses itens estão listados para coleta manual.
