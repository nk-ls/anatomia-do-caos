"""Gera os dados por estado (UF).

1. dados/estados.csv: mortes por Covid-19 por UF, do painel oficial do Ministério da Saúde
   (covid.saude.gov.br, API PortalEstado), com a população TCU 2019 que o próprio painel usa.
2. dados/pessoas_uf.csv: a qual estado cada ficha está ligada e por quê.
   Critério: estado do MANDATO (parlamentares, pela API da Câmara e do Senado) ou do CARGO
   estadual/municipal ou da instituição, conforme a ficha. Quem atuou só no governo federal
   fica como "Federal". Não usamos naturalidade nem endereço de ninguém.
"""
import csv, json, unicodedata, urllib.parse, urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "AnatomiaDoCaos/1.0 (https://github.com/nk-ls/anatomia-do-caos)"}
PAINEL = "https://qd28tcd6b5.execute-api.sa-east-1.amazonaws.com/prod/PortalEstado"

NOMES_UF = {"AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas", "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal",
    "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul", "MG": "Minas Gerais",
    "PA": "Pará", "PB": "Paraíba", "PR": "Paraná", "PE": "Pernambuco", "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina", "SP": "São Paulo", "SE": "Sergipe", "TO": "Tocantins"}
REGIAO = {**{u: "Norte" for u in "AC AP AM PA RO RR TO".split()}, **{u: "Nordeste" for u in "AL BA CE MA PB PE PI RN SE".split()},
    **{u: "Centro-Oeste" for u in "DF GO MT MS".split()}, **{u: "Sudeste" for u in "ES MG RJ SP".split()}, **{u: "Sul" for u in "PR RS SC".split()}}

DEPUTADOS = {"eduardo-bolsonaro": "Eduardo Bolsonaro", "bia-kicis": "Bia Kicis", "carla-zambelli": "Carla Zambelli", "carlos-jordy": "Carlos Jordy",
    "osmar-terra": "Osmar Terra", "ricardo-barros": "Ricardo Barros", "luis-miranda": "Luis Miranda", "eduardo-pazuello": "General Pazuello",
    "onyx-lorenzoni": "Onyx Lorenzoni"}
SENADORES = {"flavio-bolsonaro": 5894, "omar-aziz": 5525, "randolfe-rodrigues": 5012, "renan-calheiros": 70, "otto-alencar": 5523,
             "tasso-jereissati": 3396, "humberto-costa": 5008, "eduardo-braga": 4994, "marcos-rogerio": 5422, "jorginho-mello": 5350, "luis-carlos-heinze": 1186, "eduardo-girao": 5976}
NOTA_DEP = {"eduardo-pazuello": "Deputado federal a partir de 2023 (na pandemia, ministro da Saúde)",
            "onyx-lorenzoni": "Deputado federal até 2019 (na pandemia, ministro)"}
# Cargo estadual, municipal ou sede da instituição, como descrito na ficha (dados/pessoas.csv, cargo_epoca).
MANUAL = {
    "carlos-bolsonaro": ("RJ", "Vereador no Rio de Janeiro"),
    "wilson-lima": ("AM", "Governador do Amazonas"),
    "marcellus-campelo": ("AM", "Secretário de Saúde do Amazonas"),
    "joao-doria": ("SP", "Governador de São Paulo"),
    "instituto-butantan": ("SP", "Instituto público de São Paulo"),
    "dimas-covas": ("SP", "Diretor do Instituto Butantan (SP)"),
    "monica-calazans": ("SP", "Primeira vacinada, em São Paulo"),
    "guido-cespedes": ("MT", "Médico em Sinop (MT)"),
    "lecio-patrocinio": ("RJ", "Professor da UFRJ, campus Macaé (RJ)"),
    "pedro-hallal": ("RS", "Epidemiologista da UFPel (RS)"),
    "ester-sabino": ("SP", "Pesquisadora do IMT-USP (SP)"),
    "jaqueline-goes": ("SP", "Pesquisadora do IMT-USP (SP)"),
    "paolo-zanotto": ("SP", "Virologista da USP (SP)"),
    "consorcio-nordeste": ("AL;BA;CE;MA;PB;PE;PI;RN;SE", "Consórcio dos governadores do Nordeste"),
    **{pid: ("SP", "Prevent Senior, operadora de saúde de São Paulo (acordo com o MP-SP)") for pid in ["fernando-parrillo", "eduardo-parrillo", "pedro-benedito-batista",
        "daniella-aguiar", "paola-werneck", "carla-guerra", "rodrigo-esper", "fernando-oikawa", "daniel-baena", "joao-paulo-barros", "fernanda-igarashi"]},
}

COPIAS = RAIZ.parent / "anatomia-do-caos-fontes" / "documentos" / "apis_oficiais"

def obter(url, cab=None, copia=None):
    """Baixa um JSON oficial e, se pedido, guarda a resposta BRUTA (byte a byte) no arquivo de fontes."""
    with urllib.request.urlopen(urllib.request.Request(url, headers={**UA, **(cab or {})}), timeout=60) as r:
        bruto = r.read()
    if copia:
        COPIAS.mkdir(parents=True, exist_ok=True)
        (COPIAS / copia).write_bytes(bruto)
        with open(COPIAS / "ORIGEM.tsv", "a", encoding="utf-8") as f:
            f.write(f"{copia}\t{url}\t{date.today().isoformat()}\n")
    return json.loads(bruto)

def norm(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().strip()

def estados():
    d = obter(PAINEL, {"X-Parse-Application-Id": "unAFkcaNDeXajurGB7LChj8SgQYS2ptm"}, copia="ms_painel_PortalEstado.json")
    vac = vacinacao()
    linhas = []
    for x in sorted(d, key=lambda x: x["_id"]):
        pop = int(x["populacaoTCU2019"])
        linhas.append({"uf": x["_id"], "estado": NOMES_UF[x["_id"]], "regiao": REGIAO[x["_id"]], "populacao_tcu_2019": pop,
                       "obitos": x["obitosAcumulado"], "obitos_100k": round(x["obitosAcumulado"] / pop * 1e5, 1), "casos": x["casosAcumulado"],
                       "fonte": "https://covid.saude.gov.br/", "coletado_em": date.today().isoformat()})
        for rot, mes in CORTES_VAC.items():
            v = vac.get((x["_id"], mes), {})
            um = sum(v.get(k, 0) for k in ("D1cum", "D2cum", "Dcum", "Rcum"))
            comp = sum(v.get(k, 0) for k in ("D2cum", "Dcum", "Rcum"))
            linhas[-1][f"vac_1dose_{rot}"] = round(100 * um / pop, 1)
            linhas[-1][f"vac_completo_{rot}"] = round(100 * comp / pop, 1)
        linhas[-1]["vac_reforco_2022_09"] = round(100 * vac.get((x["_id"], "2022-10-01"), {}).get("Rcum", 0) / pop, 1)
        linhas[-1]["fonte_vacinacao"] = VACINAS
    assert len(linhas) == 27
    with open(RAIZ / "dados/estados.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=linhas[0].keys()); w.writeheader(); w.writerows(linhas)
    print("estados:", sum(l["obitos"] for l in linhas), "óbitos")

VACINAS = "https://raw.githubusercontent.com/covid19br/dados-vacinas/main/doses_cobertura_proporcao_mes.csv"
COPIA_VAC = RAIZ.parent / "anatomia-do-caos-fontes" / "documentos" / "vacinacao_uf"
# "month" no arquivo é o 1º dia do mês SEGUINTE à aplicação: 2021-07-01 = doses até 30/06/2021.
CORTES_VAC = {"2021_06": "2021-07-01", "2021_12": "2022-01-01", "2022_09": "2022-10-01"}

def vacinacao():
    """Pessoas vacinadas por UF, a partir dos microdados do SI-PNI (Ministério da Saúde) agregados
    pelo Observatório Covid-19 BR (github.com/covid19br/dados-vacinas). Categorias do arquivo:
    D1cum (só 1ª dose), D2cum (2 doses), Dcum (dose única), Rcum (com reforço) — cada pessoa em uma só.
    Ao menos 1 dose = soma das quatro; esquema completo = D2cum + Dcum + Rcum. Percentual sobre a
    população TCU 2019 (a mesma do painel de óbitos)."""
    with urllib.request.urlopen(urllib.request.Request(VACINAS, headers=UA), timeout=120) as r:
        bruto = r.read()
    COPIA_VAC.mkdir(parents=True, exist_ok=True)
    (COPIA_VAC / "doses_cobertura_proporcao_mes.csv").write_bytes(bruto)
    soma = {}
    for l in csv.DictReader(bruto.decode("utf-8").splitlines()):
        chave = (l["UF"], l["month"])
        soma.setdefault(chave, {}).setdefault(l["dose"], 0)
        soma[chave][l["dose"]] += int(float(l["n"]))
    return soma

def achar_uf(dado):
    """A UF do senador: na identificação ou, para mandatos encerrados, dentro do último mandato."""
    if isinstance(dado, dict):
        for k in ("UfParlamentar", "UfMandato"):
            if isinstance(dado.get(k), str) and len(dado[k]) == 2:
                return dado[k]
        for v in dado.values():
            r = achar_uf(v)
            if r:
                return r
    elif isinstance(dado, list):
        for v in reversed(dado):
            r = achar_uf(v)
            if r:
                return r
    return None

def pessoas():
    fichas = {r["id"]: r for r in csv.DictReader(open(RAIZ / "dados/pessoas.csv", encoding="utf-8"))}
    saida = {}
    for pid, nome in DEPUTADOS.items():
        for leg in (57, 56, 55):
            r = obter(f"https://dadosabertos.camara.leg.br/api/v2/deputados?nome={urllib.parse.quote(nome)}&idLegislatura={leg}",
                      copia=f"camara_{pid}_leg{leg}.json")["dados"]
            r = [d for d in r if norm(d["nome"]) == norm(nome)] or r[:1]
            if r:
                saida[pid] = (r[0]["siglaUf"], NOTA_DEP.get(pid, "Deputado(a) federal"), f"https://www.camara.leg.br/deputados/{r[0]['id']}")
                break
    for pid, cod in SENADORES.items():
        p = obter(f"https://legis.senado.leg.br/dadosabertos/senador/{cod}.json", {"Accept": "application/json"}, copia=f"senado_{pid}.json")
        uf = achar_uf(p)
        if not uf:  # mandato já encerrado: o estado está na lista de mandatos (o da CPI, out/2021)
            m = obter(f"https://legis.senado.leg.br/dadosabertos/senador/{cod}/mandatos.json", {"Accept": "application/json"}, copia=f"senado_{pid}_mandatos.json")
            mandatos = m["MandatoParlamentar"]["Parlamentar"]["Mandatos"]["Mandato"]
            for md in mandatos if isinstance(mandatos, list) else [mandatos]:
                ini = md["PrimeiraLegislaturaDoMandato"]["DataInicio"]
                fim = (md.get("SegundaLegislaturaDoMandato") or md["PrimeiraLegislaturaDoMandato"]).get("DataFim", "9999")
                if ini <= "2021-10-26" <= fim:
                    uf = md["UfParlamentar"]
                    break
        saida[pid] = (uf, "Senador(a)", f"https://www25.senado.leg.br/web/senadores/senador/-/perfil/{cod}")
    TAC = "https://github.com/nk-ls/anatomia-do-caos-fontes/blob/main/documentos/controle/copia_BrasildeFato_TAC_PreventSenior_2021-11-29.html"
    for pid, (uf, vinc) in MANUAL.items():
        saida[pid] = (uf, vinc, TAC if "Prevent" in vinc else "cargo na ficha (dados/pessoas.csv)")
    with open(RAIZ / "dados/pessoas_uf.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["id", "uf", "vinculo", "fonte"])
        for pid in fichas:
            uf, vinc, fonte = saida.get(pid, ("Federal", "Atuação no governo federal ou nacional", "cargo na ficha (dados/pessoas.csv)"))
            w.writerow([pid, uf, vinc, fonte])
    faltam = set(saida) - set(fichas)
    assert not faltam, faltam
    print("pessoas com UF:", len(saida), "de", len(fichas))

def fechar_copias():
    """SHA-256 de cada resposta guardada e um README com a origem."""
    import hashlib
    linhas = []
    for f in sorted(COPIAS.glob("*.json")):
        linhas.append(f"{hashlib.sha256(f.read_bytes()).hexdigest()}  {f.name}")
    (COPIAS / "SHA256SUMS").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    origem = {}
    for l in (COPIAS / "ORIGEM.tsv").read_text(encoding="utf-8").splitlines():
        a, u, d = l.split("\t")
        origem[a] = (u, d)
    tabela = "\n".join(f"| `{a}` | {u} | {d} |" for a, (u, d) in sorted(origem.items()))
    (COPIAS / "README.md").write_text(
        "# Respostas brutas de APIs oficiais\n\nGuardadas byte a byte por `scripts/gerar_estados.py` do repositório principal, no momento em que o script gerou `dados/estados.csv` e `dados/pessoas_uf.csv`. Painel do Ministério da Saúde (óbitos e população por estado), API de dados abertos da Câmara e do Senado (estado do mandato).\n\n"
        "| Arquivo | Origem | Coletado em |\n|---|---|---|\n" + tabela + "\n", encoding="utf-8")
    (COPIAS / "ORIGEM.tsv").unlink()

if __name__ == "__main__":
    estados(); pessoas(); fechar_copias()
