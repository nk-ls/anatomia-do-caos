"""Gera dados/dinheiro.json: o caminho do dinheiro nos casos de corrupção e desperdício.

Cada etapa traz valor, situação (onde o dinheiro parou), tipo de informação e documento.
Fonte de cada número: documento oficial arquivado em anatomia-do-caos-fontes.
"""
import json, pathlib

F = "https://github.com/nk-ls/anatomia-do-caos-fontes/blob/main/documentos/"
REL = F + "cpi_relatorio_final_aprovado_2021-10-26.pdf"
C = F + "controle/"
PD = F + "pfizer_desvios/"

def doc(nome, url):
    return {"nome": nome, "url": url}

CASOS = [
 {
  "id": "covaxin", "titulo": "Covaxin: R$ 1,6 bilhão contratado, nenhum real pago",
  "resumo": "O Ministério da Saúde contratou 20 milhões de doses da vacina indiana Covaxin por meio da Precisa Medicamentos, intermediária da fabricante Bharat Biotech. Servidores perceberam pedido de pagamento antecipado para uma empresa de Cingapura que não estava no contrato. O caso veio a público, o pagamento não saiu e o contrato foi rescindido.",
  "pessoas": ["francisco-maximiano", "emanuela-medrades", "precisa-medicamentos", "danilo-trento", "marcos-tolentino", "roberto-dias", "elcio-franco", "regina-celia-oliveira", "ricardo-barros", "luis-miranda", "jair-bolsonaro"],
  "etapas": [
   {"data": "25/02/2021", "de": "Ministério da Saúde", "para": "Bharat Biotech, representada pela Precisa", "o_que": "Contrato 29/2021: 20 milhões de doses a US$ 15 cada, total de US$ 300 milhões (R$ 1,614 bilhão no câmbio do contrato)", "curto": "Covaxin · contrato 29/2021 (nada pago)", "valor_reais": 1614000000, "situacao": "contratado", "tipo": "fato", "docs": [doc("TCU, Acórdão 1.179/2025", C + "TCU_Acordao_1179-2025_Plenario.pdf"), doc("Relatório da CPI, seção 6.8", REL)]},
   {"data": "2021", "de": "Precisa Medicamentos", "para": "Ministério da Saúde", "o_que": "Garantia de 5% do contrato (R$ 80,7 milhões) por carta de fiança do FIB Bank, que não é banco nem tem autorização do Banco Central", "curto": "Covaxin · garantia do FIB Bank", "valor_reais": 80700000, "situacao": "irregular", "tipo": "conclusão da CPI", "docs": [doc("Relatório da CPI, seção 6.8.3.2", REL), doc("TCU, Acórdão 2.439/2021", C + "TCU_Acordao_2439-2021_Plenario.pdf")]},
   {"data": "18 a 23/03/2021", "de": "Madison Biotech (Cingapura)", "para": "Ministério da Saúde", "o_que": "Invoice de US$ 45.929.867,02 com pagamento 100% antecipado, em nome de empresa estranha ao contrato", "valor_reais": None, "valor_texto": "US$ 45,9 milhões", "situacao": "barrado", "tipo": "fato", "docs": [doc("TCU, Acórdão 1.179/2025", C + "TCU_Acordao_1179-2025_Plenario.pdf"), doc("Depoimento de Luis Ricardo Miranda, no relatório da CPI, seção 6.8", REL)]},
   {"data": "20/03/2021", "de": "Deputado Luis Miranda e o irmão, servidor", "para": "Presidente da República", "o_que": "Relatam a pressão e a invoice irregular. Segundo eles, o presidente disse que acionaria a Polícia Federal, o que não aconteceu", "valor_reais": None, "situacao": "alegação", "tipo": "declaração", "docs": [doc("Relatório da CPI, seção 6.8", REL), doc("STF, Pet 10.065 (prevaricação)", C + "STF_Pet10065_despacho_2022-07-29.pdf")]},
   {"data": "até 2021", "de": "Bharat Biotech", "para": "Precisa Medicamentos", "o_que": "Comissão pela intermediação: US$ 1,50 por dose, com tentativa de subir para US$ 2,25 (cerca de R$ 240 milhões no contrato inteiro)", "valor_reais": None, "valor_texto": "≈ R$ 240 milhões, se concretizado", "situacao": "não pago", "tipo": "conclusão da CPI", "docs": [doc("Relatório da CPI, seção 6.8.1", REL)]},
   {"data": "27/08/2021", "de": "Ministério da Saúde", "para": "—", "o_que": "Contrato rescindido. Nenhum pagamento foi feito", "valor_reais": 0, "situacao": "barrado", "tipo": "decisão de órgão de controle", "docs": [doc("TCU, Acórdão 1.179/2025, item 4", C + "TCU_Acordao_1179-2025_Plenario.pdf")]}
  ],
  "decisoes": [
   {"data": "09/01/2024", "orgao": "CGU", "texto": "Decisão nº 22: multa de R$ 3.879.251,35 à Precisa (hoje OVS Importadora) e declaração de inidoneidade, por procuração forjada e documentos inidôneos", "docs": [doc("Transcrita no Acórdão TCU 1.179/2025", C + "TCU_Acordao_1179-2025_Plenario.pdf")]},
   {"data": "28/05/2025", "orgao": "TCU", "texto": "Acórdão 1.179/2025: OVS (ex-Precisa) inidônea por 4 anos; multas a Élcio Franco (R$ 70 mil), Roberto Dias (R$ 40 mil) e Regina Célia (R$ 30 mil)", "docs": [doc("Acórdão 1.179/2025", C + "TCU_Acordao_1179-2025_Plenario.pdf")]},
   {"data": "18/09/2024", "orgao": "TCU", "texto": "Acórdão 1.912/2024: Global Gestão em Saúde, OVS (ex-Precisa), FIB Bank e Profit Bank inidôneas por 3 anos", "docs": [doc("Acórdão 1.912/2024", C + "TCU_Acordao_1912-2024_Plenario.pdf")]},
   {"data": "15/06/2023 a 20/07/2026", "orgao": "STF", "texto": "Pet 10.063: arquivada para Ricardo Barros; o restante foi enviado à Justiça Federal do DF, sem andamento público localizado", "docs": [doc("Remessa ao TRF1", C + "STF_Pet10063_remessa_TRF1_2025-02-13.pdf"), doc("Baixa", C + "STF_Pet10063_baixa_2026-07-20.pdf")]},
   {"data": "12/09/2022", "orgao": "STF", "texto": "Pet 10.065 (prevaricação de Bolsonaro, Pazuello, Élcio Franco e Queiroga no caso Covaxin): diligência enviada à PF; pendente", "docs": [doc("Despacho", C + "STF_Pet10065_despacho_2022-07-29.pdf")]}
  ]
 },
 {
  "id": "vtclog", "titulo": "VTCLog: aditivo de quase R$ 19 milhões e saques em espécie",
  "resumo": "A VTCLog transporta e armazena vacinas e remédios do Ministério da Saúde pelo Contrato 59/2018. Em 2021, um segundo aditivo mudou a forma de medir o serviço. Os técnicos calcularam que a empresa tinha direito a cerca de R$ 1 milhão; o acordo de \"meio-termo\" do diretor de Logística permitia pagar quase R$ 19 milhões. O TCU suspendeu o aditivo e o ministério o anulou.",
  "pessoas": ["vtclog", "roberto-dias", "alex-lial-marinho", "andreia-lima", "raimundo-nonato-brasil", "carlos-alberto-sa", "teresa-reis-sa", "ricardo-barros"],
  "etapas": [
   {"data": "2018", "de": "Ministério da Saúde", "para": "VTCLog", "o_que": "Contrato 59/2018 de logística: R$ 485 milhões em 5 anos. Valor total atualizado segundo o TCU: R$ 1,01 bilhão", "curto": "VTCLog · contrato 59/2018 (total atualizado)", "valor_reais": 1014615488, "situacao": "contratado", "tipo": "fato", "docs": [doc("TCU, Acórdão 651/2023", C + "TCU_Acordao_651-2023_Plenario.pdf"), doc("Relatório da CPI, seção 6.10", REL)]},
   {"data": "19/02/2021", "de": "Ministério da Saúde", "para": "VTCLog", "o_que": "1º aditivo: + R$ 88,75 milhões (25% no item transporte), sem motivação adequada do saldo, segundo o TCU", "curto": "VTCLog · 1º aditivo", "valor_reais": 88750000, "situacao": "irregular", "tipo": "decisão de órgão de controle", "docs": [doc("TCU, Acórdão 651/2023", C + "TCU_Acordao_651-2023_Plenario.pdf")]},
   {"data": "20/05/2021", "de": "Ministério da Saúde (Roberto Dias)", "para": "VTCLog", "o_que": "2º aditivo, o \"meio-termo\": os técnicos calculavam R$ 1.044.367,03; o acordo permitia pagar R$ 18.983.096,10", "curto": "VTCLog · 2º aditivo, o \"meio-termo\"", "valor_reais": 18983096, "situacao": "barrado", "tipo": "decisão de órgão de controle", "docs": [doc("TCU, Acórdão 651/2023", C + "TCU_Acordao_651-2023_Plenario.pdf"), doc("Relatório da CPI, seção 6.10", REL)]},
   {"data": "2021", "de": "TCU", "para": "Ministério da Saúde", "o_que": "Cautelar (Acórdão 2.178/2021) suspende o 2º aditivo e proíbe o pagamento; em 30/09/2021 o ministério declara a nulidade", "valor_reais": 0, "situacao": "barrado", "tipo": "decisão de órgão de controle", "docs": [doc("TCU, Acórdão 651/2023, itens 29 a 31", C + "TCU_Acordao_651-2023_Plenario.pdf")]},
   {"data": "2018 a 2021", "de": "Contas da VTCLog", "para": "Saques em espécie", "o_que": "Um funcionário registrado como motoboy sacou mais de R$ 5 milhões em dinheiro vivo; o COAF viu \"artifício de burla para identificação do destino dos recursos\". A empresa diz que pagava boletos e fornecedores", "curto": "VTCLog · saques em espécie (COAF)", "valor_reais": 5000000, "situacao": "em apuração", "tipo": "conclusão da CPI", "docs": [doc("Relatório da CPI, seção 6.10 (RIF do COAF, DOC 2158, sigiloso)", REL)]}
  ],
  "decisoes": [
   {"data": "05/04/2023", "orgao": "TCU", "texto": "Acórdão 651/2023: multa de R$ 79.004,53 a Roberto Dias e inabilitação por 5 anos; as justificativas da VTCLog foram aceitas", "docs": [doc("Acórdão 651/2023", C + "TCU_Acordao_651-2023_Plenario.pdf")]},
   {"data": "11/09/2024", "orgao": "TCU", "texto": "Acórdão 1.861/2024: mantém a punição de Dias e anula a multa de Alex Lial Marinho. Transitado em julgado", "docs": [doc("Acórdão 1.861/2024", C + "TCU_Acordao_1861-2024_Plenario.pdf")]},
   {"data": "05/11/2025", "orgao": "TCU", "texto": "Acórdão 2.598/2025: balanço enviado ao Senado sobre Covaxin e VTCLog", "docs": [doc("Acórdão 2.598/2025", C + "TCU_Acordao_2598-2025_Plenario.pdf")]}
  ]
 },
 {
  "id": "davati", "titulo": "Davati: a acusação de propina de US$ 1 por dose",
  "resumo": "Um vendedor que se apresentava pela Davati ofereceu 400 milhões de doses da AstraZeneca ao Ministério da Saúde. Ele disse que o diretor de Logística pediu propina de US$ 1 por dose num jantar. Nenhuma dose foi comprada e nenhum pagamento foi feito. A acusação não foi provada em juízo.",
  "pessoas": ["luiz-dominguetti", "cristiano-carvalho", "rafael-alves", "roberto-dias", "marcelo-blanco", "jose-odilon", "amilton-gomes"],
  "etapas": [
   {"data": "fev/2021", "de": "Davati (Dominguetti e Cristiano Carvalho)", "para": "Ministério da Saúde", "o_que": "Oferta de 400 milhões de doses da AstraZeneca, de US$ 3,50 a US$ 15,50 por dose, por um mercado paralelo de intermediários", "valor_reais": None, "valor_texto": "nada contratado", "situacao": "não pago", "tipo": "fato", "docs": [doc("Relatório da CPI, seção 6.8.2", REL)]},
   {"data": "25/02/2021", "de": "Roberto Dias (segundo Dominguetti)", "para": "Davati", "o_que": "Pedido de propina de US$ 1 por dose num jantar em Brasília. Dias nega", "valor_reais": None, "valor_texto": "US$ 1/dose (alegado)", "situacao": "alegação", "tipo": "alegação", "docs": [doc("Folha, via IstoÉ Dinheiro (29/06/2021)", PD + "b1/istoe_propina_1dolar.html"), doc("Relatório da CPI, seção 6.8.2", REL)]}
  ],
  "decisoes": [
   {"data": "26/10/2021", "orgao": "CPI", "texto": "Pedido de indiciamento de Roberto Dias (corrupção passiva) e de Dominguetti, Cristiano Carvalho e Rafael Alves (corrupção ativa). Pedido de indiciamento não é condenação; desfecho do inquérito não localizado", "docs": [doc("Relatório final aprovado", REL)]}
  ]
 },
 {
  "id": "global", "titulo": "Global Gestão em Saúde: o antecedente da Precisa",
  "resumo": "Em 2017, quando Ricardo Barros era ministro da Saúde, o ministério pagou adiantado à Global por remédios de doenças raras que nunca foram entregues. A Global era sócia majoritária da Precisa, a intermediária da Covaxin. Esse histórico era conhecido no ministério e não impediu o contrato de 2021.",
  "pessoas": ["ricardo-barros", "francisco-maximiano", "precisa-medicamentos"],
  "etapas": [
   {"data": "2017", "de": "Ministério da Saúde", "para": "Global Gestão em Saúde", "o_que": "Pagamento antecipado de R$ 19.906.197,80 (ordens bancárias 2017OB801843 a 801845) por medicamentos nunca entregues; o MPF registrou pressão de superiores para antecipar", "curto": "Global · pago adiantado, sem entrega (2017)", "valor_reais": 19906197, "situacao": "pago e não entregue", "tipo": "decisão de órgão de controle", "docs": [doc("TCU, Acórdão 1.912/2024", C + "TCU_Acordao_1912-2024_Plenario.pdf"), doc("Relatório da CPI, seção 6.8.3.1", REL)]},
   {"data": "2021", "de": "Global Gestão em Saúde", "para": "Precisa Medicamentos", "o_que": "Sócia majoritária da Precisa, a intermediária da Covaxin", "valor_reais": None, "situacao": "vínculo", "tipo": "fato", "docs": [doc("Relatório da CPI, seção 6.8", REL)]}
  ],
  "decisoes": [
   {"data": "12/01/2024", "orgao": "CGU", "texto": "Multa de R$ 21.697.740,49 à Global, pela Lei Anticorrupção", "docs": [doc("Transcrita no Acórdão TCU 1.912/2024", C + "TCU_Acordao_1912-2024_Plenario.pdf")]},
   {"data": "18/09/2024", "orgao": "TCU", "texto": "Acórdão 1.912/2024: Global inidônea por 3 anos. O débito dos pagamentos antecipados é cobrado em tomada de contas especial própria (TC 000.057/2022-3)", "docs": [doc("Acórdão 1.912/2024", C + "TCU_Acordao_1912-2024_Plenario.pdf")]},
   {"data": "10/06/2022", "orgao": "PGR", "texto": "Pediu o arquivamento do pedido de indiciamento de Ricardo Barros por advocacia administrativa (Pet 10.058)", "docs": [doc("Manifestação da PGR (cópia do Migalhas)", PD + "b1/pgr_ricardo_barros_2022-06_copia_migalhas.pdf")]}
  ]
 },
 {
  "id": "vencidas", "titulo": "Doses vencidas: desperdício, não desvio",
  "resumo": "Não é corrupção, mas é dinheiro público perdido. Vacinas compradas venceram nos estoques de estados, municípios e do próprio ministério. Os números variam porque cada levantamento mede um estoque e uma data diferente.",
  "pessoas": [],
  "etapas": [
   {"data": "posição de 17/02/2023", "de": "Estoques de estados e municípios", "para": "Descarte", "o_que": "Cerca de 28,2 milhões de doses vencidas, ≈ R$ 1,2 bilhão (primeira estimativa do TCU: 54,3 milhões e mais de R$ 2 bilhões, revista com planilhas novas do ministério)", "curto": "Doses vencidas em estados e municípios", "valor_reais": 1233000000, "situacao": "perdido", "tipo": "decisão de órgão de controle", "docs": [doc("TCU, Acórdão 2.123/2023 (texto)", PD + "b2/TCU_Acordao_2123-2023-Plenario.txt")]},
   {"data": "até mar/2023", "de": "Estoque federal", "para": "Descarte", "o_que": "38,9 milhões de doses vencidas, segundo dados do Ministério da Saúde obtidos pela Lei de Acesso à Informação", "valor_reais": None, "valor_texto": "38,9 milhões de doses", "situacao": "perdido", "tipo": "fato", "docs": [doc("Folha, via CartaCapital (14/03/2023)", PD + "b2/carta_333079.html")]}
  ],
  "decisoes": [
   {"data": "01/03/2023", "orgao": "TCU", "texto": "Acórdão 313/2023: perdas de insumos e vacinas viram tomada de contas especial, com citação da ex-secretária da Secovid Rosana Leite de Melo", "docs": [doc("Acórdão 313/2023 (texto)", PD + "b2/TCU_Acordao_313-2023-Plenario.txt")]}
  ]
 },
 {
  "id": "cloroquina", "titulo": "Cloroquina do Exército: investigada e julgada improcedente",
  "resumo": "O Laboratório Químico Farmacêutico do Exército ampliou a produção de cloroquina em 2020. O TCU examinou a produção e a compra e não viu irregularidade; uma fornecedora do sal foi punida por outro motivo. Fica aqui porque o leitor precisa ver também o que foi investigado e não deu em nada.",
  "pessoas": [],
  "etapas": [],
  "decisoes": [
   {"data": "12/11/2025", "orgao": "TCU", "texto": "Acórdão 2.629/2025: representação sobre a cloroquina do LQFEx e da Fiocruz julgada improcedente", "docs": [doc("Acórdão 2.629/2025", C + "TCU_Acordao_2629-2025_Plenario.pdf")]},
   {"data": "05/10/2022", "orgao": "TCU", "texto": "Acórdão 2.162/2022: a Sulminas, fornecedora do sal, usou indevidamente o regime de microempresa; inidônea por 1 ano", "docs": [doc("Acórdão 2.162/2022", C + "TCU_Acordao_2162-2022_Plenario.pdf")]}
  ]
 }
]

# Rede do dinheiro: entidades e ligações, cada uma com documento.
NOS = [
 ("ms", "Ministério da Saúde", "orgao"), ("tcu", "TCU", "controle"), ("cgu", "CGU", "controle"), ("stf", "STF / Justiça", "controle"), ("cpi", "CPI da Pandemia", "controle"),
 ("bharat", "Bharat Biotech", "empresa"), ("precisa", "Precisa (OVS)", "empresa"), ("madison", "Madison Biotech", "empresa"), ("fib", "FIB Bank", "empresa"), ("global", "Global Gestão em Saúde", "empresa"), ("vtclog", "VTCLog", "empresa"), ("davati", "Davati", "empresa"),
 ("francisco-maximiano", "Francisco Maximiano", "pessoa"), ("marcos-tolentino", "Marcos Tolentino", "pessoa"), ("roberto-dias", "Roberto Dias", "pessoa"), ("elcio-franco", "Élcio Franco", "pessoa"), ("ricardo-barros", "Ricardo Barros", "pessoa"), ("luis-miranda", "Luis Miranda", "pessoa"), ("luiz-dominguetti", "Luiz Dominguetti", "pessoa"), ("jair-bolsonaro", "Jair Bolsonaro", "pessoa"),
]
LIGACOES = [
 ("ms", "bharat", "contrato", "Contrato 29/2021, R$ 1,6 bi (rescindido, nada pago)", C + "TCU_Acordao_1179-2025_Plenario.pdf"),
 ("precisa", "bharat", "intermediação", "Representante da Bharat no contrato", C + "TCU_Acordao_1179-2025_Plenario.pdf"),
 ("madison", "ms", "cobrança", "Invoice de US$ 45,9 mi com pagamento antecipado (barrada)", C + "TCU_Acordao_1179-2025_Plenario.pdf"),
 ("fib", "precisa", "garantia", "Carta de fiança de R$ 80,7 mi", REL),
 ("marcos-tolentino", "fib", "sócio", "Apontado pela CPI como dono do FIB Bank", REL),
 ("francisco-maximiano", "precisa", "sócio", "Sócio da Precisa", REL),
 ("global", "precisa", "sócio", "Sócia majoritária da Precisa", REL),
 ("francisco-maximiano", "global", "sócio", "Dono da Global", REL),
 ("ms", "global", "pagamento", "R$ 19,9 mi adiantados em 2017, sem entrega", C + "TCU_Acordao_1912-2024_Plenario.pdf"),
 ("ricardo-barros", "ms", "cargo", "Ministro da Saúde em 2016–2018", REL),
 ("ms", "vtclog", "contrato", "Contrato 59/2018, R$ 1,01 bi atualizado", C + "TCU_Acordao_651-2023_Plenario.pdf"),
 ("roberto-dias", "vtclog", "pagamento", "Aditivo de R$ 18,98 mi (barrado)", C + "TCU_Acordao_651-2023_Plenario.pdf"),
 ("roberto-dias", "ms", "cargo", "Diretor de Logística", REL),
 ("elcio-franco", "ms", "cargo", "Secretário-executivo", REL),
 ("davati", "ms", "oferta", "400 mi de doses oferecidas, nada comprado", REL),
 ("luiz-dominguetti", "davati", "vendedor", "Vendedor da Davati", REL),
 ("luiz-dominguetti", "roberto-dias", "acusação", "Acusa Dias de pedir US$ 1/dose (alegação)", PD + "b1/istoe_propina_1dolar.html"),
 ("luis-miranda", "jair-bolsonaro", "denúncia", "Relata a invoice irregular em 20/03/2021", REL),
 ("tcu", "precisa", "sanção", "Inidônea por 4 anos (1.179/2025)", C + "TCU_Acordao_1179-2025_Plenario.pdf"),
 ("tcu", "fib", "sanção", "Inidôneo por 3 anos (1.912/2024)", C + "TCU_Acordao_1912-2024_Plenario.pdf"),
 ("tcu", "global", "sanção", "Inidônea por 3 anos (1.912/2024)", C + "TCU_Acordao_1912-2024_Plenario.pdf"),
 ("tcu", "roberto-dias", "sanção", "Multas e inabilitação por 5 anos (651/2023)", C + "TCU_Acordao_651-2023_Plenario.pdf"),
 ("tcu", "elcio-franco", "sanção", "Multa de R$ 70 mil (1.179/2025)", C + "TCU_Acordao_1179-2025_Plenario.pdf"),
 ("cgu", "precisa", "sanção", "Multa de R$ 3,88 mi e inidoneidade (2024)", C + "TCU_Acordao_1179-2025_Plenario.pdf"),
 ("cgu", "global", "sanção", "Multa de R$ 21,7 mi (2024)", C + "TCU_Acordao_1912-2024_Plenario.pdf"),
 ("stf", "ricardo-barros", "arquivamento", "Pet 10.063 arquivada para Barros", C + "STF_Pet10063_baixa_2026-07-20.pdf"),
 ("stf", "jair-bolsonaro", "investigação", "Pet 10.065 (prevaricação), pendente", C + "STF_Pet10065_despacho_2022-07-29.pdf"),
 ("cpi", "roberto-dias", "investigação", "Pedido de indiciamento", REL),
 ("cpi", "francisco-maximiano", "investigação", "Pedido de indiciamento", REL),
 ("cpi", "ricardo-barros", "investigação", "Pedido de indiciamento", REL),
]

saida = {
 "atualizado": "2026-10-24",
 "casos": CASOS,
 "rede": {"nos": [{"id": i, "nome": n, "tipo": t} for i, n, t in NOS],
          "ligacoes": [{"de": a, "para": b, "tipo": t, "rotulo": r, "doc": d} for a, b, t, r, d in LIGACOES]},
}
ids = {n["id"] for n in saida["rede"]["nos"]}
for l in saida["rede"]["ligacoes"]:
    assert l["de"] in ids and l["para"] in ids, l
p = pathlib.Path(__file__).resolve().parent.parent / "dados" / "dinheiro.json"
p.write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("ok", p, len(CASOS), "casos")
