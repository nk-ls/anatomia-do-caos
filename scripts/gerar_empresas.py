"""Cadastro e quadro de sócios e administradores (QSA) das empresas do caminho do dinheiro.

Fonte: dados abertos do CNPJ da Receita Federal, consultados pela Minha Receita
(minhareceita.org, que republica a base da Receita sem alterar), com a BrasilAPI como reserva.
Cada empresa só entra se um documento oficial a liga a um caso (coluna "por_que").

Privacidade: a Receita já publica o CPF dos sócios mascarado (***123456**); mesmo assim,
NÃO gravamos CPF nem faixa etária de pessoa física. Ficam nome, qualificação e data de entrada.
O QSA é o ATUAL (data da consulta), não o da época dos fatos: a data de entrada de cada sócio
diz desde quando ele está na empresa; quem saiu antes não aparece.

Saídas: dados/empresas.json (o que o site usa) e, em anatomia-do-caos-fontes,
documentos/receita_cnpj/<cnpj>.json (a resposta bruta, para conferência).
"""
import json, re, sys, time, urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ.parent / "anatomia-do-caos-fontes" / "documentos" / "receita_cnpj"
UA = {"User-Agent": "AnatomiaDoCaos/1.0 (https://github.com/nk-ls/anatomia-do-caos)"}
F = "https://github.com/nk-ls/anatomia-do-caos-fontes/blob/main/documentos/"
REL = F + "cpi_relatorio_final_aprovado_2021-10-26.pdf"
T1912 = F + "controle/TCU_Acordao_1912-2024_Plenario.pdf"
T1179 = F + "controle/TCU_Acordao_1179-2025_Plenario.pdf"
T651 = F + "controle/TCU_Acordao_651-2023_Plenario.pdf"
T2162 = F + "controle/TCU_Acordao_2162-2022_Plenario.pdf"

EMPRESAS = [
 # cnpj, caso, por que está aqui, documento
 ("03394819000179", "covaxin", "Precisa Medicamentos (hoje OVS Importadora): representante da Bharat no contrato da Covaxin. Declarada inidônea pelo TCU e pela CGU.", T1179),
 ("10375666000188", "global", "Global Gestão em Saúde: recebeu R$ 19,9 milhões adiantados em 2017 sem entregar os remédios; sócia majoritária da Precisa, segundo a CPI.", T1912),
 ("23706333000136", "covaxin", "FIB Bank: deu a carta de fiança da garantia do contrato da Covaxin sem ser instituição autorizada pelo Banco Central. Declarado inidôneo pelo TCU.", T1912),
 ("22627911000186", "covaxin", "MB Guassu: a CGU estendeu a ela a multa aplicada ao FIB Bank (abuso da personalidade jurídica), segundo o Acórdão TCU 1.912/2024.", T1912),
 ("11378090000175", "covaxin", "Pico do Juazeiro: a CGU estendeu a ela a multa aplicada ao FIB Bank (abuso da personalidade jurídica), segundo o Acórdão TCU 1.912/2024.", T1912),
 ("07376572000119", "covaxin", "Profit Bank: outra emissora de garantias sem validade em contratos públicos; inidônea por 3 anos junto com o FIB Bank (Acórdão TCU 1.912/2024).", T1912),
 ("24893687000108", "vtclog", "VTCLog: operadora logística do Ministério da Saúde (Contrato 59/2018), alvo do aditivo de R$ 18,98 milhões barrado pelo TCU.", T651),
 ("01017250000105", "vtclog", "Voetur Turismo: do mesmo grupo da VTCLog, segundo a CPI (a VTCLog se chamava Voetur Cargas e Encomendas).", REL),
 ("11342178000137", "barros", "RC4 Incorporações: apontada pela CPI como empresa de Ricardo Barros que faturou R$ 2,22 milhões de 2018 a 2020 com um funcionário e sem notas fiscais.", REL),
 ("80269079000190", "barros", "BB Corretora: apontada pela CPI como empresa de Ricardo Barros que faturou R$ 2,3 milhões em 2019 sem emitir nota fiscal.", REL),
 ("22528133000178", "cloroquina", "Sulminas: vendeu ao Exército o sal da cloroquina; declarada inidônea por 1 ano por uso indevido do regime de microempresa (Acórdão TCU 2.162/2022).", T2162),
]

# Sócio que tem ficha no site (nome como a Receita grava -> id da ficha).
FICHAS = {"FRANCISCO EMERSON MAXIMIANO": "francisco-maximiano", "RAIMUNDO NONATO BRASIL": "raimundo-nonato-brasil",
          "RICARDO JOSE MAGALHAES BARROS": "ricardo-barros"}
# Até esta data o sócio é mostrado pelo nome. Quem entrou depois dos fatos (2020–2021) é só contado
# na página, para não expor quem não tem relação com o caso; o nome continua na cópia da Receita.
CORTE = "2021-12-31"

NOMES = {'03394819000179': 'Precisa Medicamentos (hoje OVS Importadora)', '10375666000188': 'Global Gestão em Saúde', '23706333000136': 'FIB Bank', '22627911000186': 'MB Guassu', '11378090000175': 'Pico do Juazeiro', '07376572000119': 'Profit Bank', '24893687000108': 'VTCLog', '01017250000105': 'Voetur Turismo', '11342178000137': 'RC4 Incorporações', '80269079000190': 'BB Corretora', '22528133000178': 'Sulminas'}  # nome usado nos documentos oficiais

def obter(cnpj):
    for url in (f"https://minhareceita.org/{cnpj}", f"https://brasilapi.com.br/api/cnpj/v1/{cnpj}"):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r), url
        except Exception as e:
            print("falhou", url, e, file=sys.stderr)
    raise RuntimeError(cnpj)

def fmt_cnpj(c):
    return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}"

def main():
    FONTES.mkdir(parents=True, exist_ok=True)
    saida = []
    for cnpj, caso, porque, docu in EMPRESAS:
        d, url = obter(cnpj)
        (FONTES / f"{cnpj}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        socios = []
        for s in d.get("qsa") or []:
            doc_socio = s.get("cnpj_cpf_do_socio") or ""
            pj = s.get("identificador_de_socio") == 1  # 1 = pessoa jurídica, 2 = pessoa física
            depois = (s.get("data_entrada_sociedade") or "9999") > CORTE and not pj and s.get("nome_socio") not in FICHAS
            socios.append({"nome": None if depois else s.get("nome_socio"), "depois_dos_fatos": depois,
                           "ficha": FICHAS.get(s.get("nome_socio")), "qualificacao": s.get("qualificacao_socio"),
                           "entrada": s.get("data_entrada_sociedade"), "tipo": "empresa" if pj else "pessoa",
                           "cnpj": fmt_cnpj(doc_socio) if pj and len(doc_socio) == 14 else None,
                           "representante": (s.get("nome_representante_legal") or None) if (s.get("data_entrada_sociedade") or "9999") <= CORTE else None})
        saida.append({
            "cnpj": fmt_cnpj(cnpj), "nome": NOMES[cnpj], "caso": caso, "por_que": porque, "documento": docu,
            "razao_social": d.get("razao_social"), "nome_fantasia": d.get("nome_fantasia") or None,
            "abertura": d.get("data_inicio_atividade"), "situacao": d.get("descricao_situacao_cadastral"),
            "data_situacao": d.get("data_situacao_cadastral"), "capital_social": d.get("capital_social"),
            "natureza": d.get("natureza_juridica"), "atividade": d.get("cnae_fiscal_descricao"),
            "municipio": d.get("municipio"), "uf": d.get("uf"), "socios": socios,
            "fonte": url, "copia": F + f"receita_cnpj/{cnpj}.json",
        })
        time.sleep(1)
    out = {"consultado_em": date.today().isoformat(),
           "fonte": "Dados abertos do CNPJ, Receita Federal (via minhareceita.org / brasilapi.com.br)",
           "empresas": saida}
    (RAIZ / "dados/empresas.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for e in saida:
        print(e["cnpj"], e["razao_social"], e["abertura"], e["situacao"], "| sócios:", "; ".join(f'{s["nome"] or "(entrou depois)"} ({s["qualificacao"]}, {s["entrada"]})' for s in e["socios"]))

if __name__ == "__main__":
    main()
