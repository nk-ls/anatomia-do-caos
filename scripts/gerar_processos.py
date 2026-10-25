"""Gera dados/processos.json: um registro por decisão judicial ou de órgão de controle.

Nada aqui é digitado: tudo sai de dados/atos.csv, dos atos cujo tipo é "decisão
judicial" ou "decisão de órgão de controle". Corrigir um ato acerta o processo
junto — o site nunca pode dizer duas coisas diferentes sobre a mesma decisão.

A maioria desses atos segue um formato regular, criado na redação do acervo:

    ÓRGÃO · <o que é> <NÚMERO> (relator X): <texto>. Situação em <mês>: <situação>.

Dele saem órgão, número, relator, texto e situação. Os atos antigos, escritos em
texto corrido, entram assim mesmo — com órgão deduzido quando dá e o resto em
branco. Em branco é honesto; preenchido no chute não seria.
"""
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TIPOS = ("decisão judicial", "decisão de órgão de controle")

# Órgão citado sem o prefixo "ÓRGÃO ·", deduzido do texto.
PISTAS = [
    ("STF", r"\bSTF\b|Supremo Tribunal Federal|"
            # ministro nomeado sem a sigla: as decisões antigas do acervo são assim
            r"Minist[ra][ao]?\s+(Rosa Weber|Cármen Lúcia|Dias Toffoli|Luís Roberto Barroso|"
            r"Ricardo Lewandowski|Nunes Marques|Flávio Dino|Luiz Fux|Edson Fachin|Alexandre de Moraes)"),
    ("STJ", r"\bSTJ\b|Superior Tribunal de Justiça"),
    ("TCU", r"\bTCU\b|Tribunal de Contas da União"),
    ("CGU", r"\bCGU\b|Controladoria-Geral"),
    ("MPF", r"\bMPF\b|Ministério Público Federal"),
    ("PF", r"\bPF\b|Polícia Federal"),
    ("Petrobras", r"Petrobras"),
]

# "Trânsito em julgado" não é desfecho, é o fim do prazo de recurso: um
# arquivamento e uma punição podem os dois transitar. Por isso é campo à parte,
# e o estado guarda só o QUE foi decidido.
DEFINITIVO = r"trânsito em julgado|transitado em julgado|transitou em julgado"

# A primeira que casar vence, então o mais específico vem antes.
ESTADOS = [
    ("sigiloso", r"sigilos|sob sigilo"),
    ("arquivado", r"\barquivad|arquivou|extingue o feito|improcedente|rejeitada"),
    ("com sanção", r"inid[ôo]ne|multa de R\$|declarad[ao] inid|inabilitad|multas? a "),
    ("decidido no mérito", r"\bsuspende\b|\bobriga\b|\bdetermina\b|liminar referendada|procedente"),
    ("em curso", r"\bréu\b|\bem curso\b|em investigação|em instrução|pendente|conclusos|em aberto|"
                 r"não foi localizad|não localizad|sem decisão|sem sentença|sem julgamento"),
    ("encerrado", r"atendid|encerrad|juntad|cumprid|acordo firmado|referendada|baixado"),
]


def ler(nome):
    with (RAIZ / "dados" / nome).open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def corte_fora_de_parenteses(texto):
    """Onde termina o rótulo e começa o texto da decisão.

    Dois cuidados. O rótulo traz parênteses com dois-pontos dentro — "Acórdão
    (CoronaVac 2023: perda de doses) 1.006/2026" — e cortar ali picaria o número
    ao meio. E há rótulos com dois níveis: "Decisão de Dias Toffoli: extingue o
    feito Pet 10.059/DF (...): <texto>" — ali o corte certo é o último, senão o
    número do processo fica fora. Então: o último ': ' fora de parênteses, antes
    de "Situação em" e dentro do tamanho de um rótulo.
    """
    fim = texto.find("Situação em")
    limite = min(180, fim if fim > 0 else len(texto))
    nivel, cortes = 0, []
    for i, c in enumerate(texto[:limite]):
        if c == "(":
            nivel += 1
        elif c == ")":
            nivel = max(0, nivel - 1)
        elif c == ":" and nivel == 0 and texto[i + 1:i + 2] == " ":
            cortes.append(i)
    return cortes[-1] if cortes else -1


def numero(cabeca):
    """O número do processo. Primeiro o que tem nome próprio (Pet 10.060/DF),
    que pode vir no meio do rótulo; depois o número solto no fim."""
    m = re.search(r"\b(?:Pet|ADI|ADPF|Inq|APn|RE|ARE)\s*[\d][\d.]*(?:/[A-Z]{2})?", cabeca)
    if m:
        return m.group(0).strip(), cabeca[:m.start()].strip().rstrip(",").strip()
    m = re.search(r"((?:Acórdãos?|Ac\.|NT|TC)?\s*[\d][\d./\-]*(?:/[A-Z]{2})?"
                  r"(?:,\s*[\d][\d./\-]*)*(?:\s+e\s+[\d][\d./\-]*)?"
                  r"(?:,\s*TC\s*[\d./\-]+)?)\s*$", cabeca)
    if m and any(c.isdigit() for c in m.group(1)):
        return m.group(1).strip(), cabeca[:m.start()].strip().rstrip(",").strip()
    return "", cabeca


def partir(texto):
    """Separa o ato no formato regular. Devolve o que achar; o resto fica vazio."""
    d = {"orgao": "", "rotulo": "", "numero": "", "relator": "", "texto": texto, "situacao": ""}

    m = re.match(r"^([A-ZÇÃÕ][A-ZÇÃÕa-z\-]*(?:\s?-\s?[A-Z]{2})?(?:\s\([^)]+\))?)\s+·\s+(.*)$", texto, re.S)
    if m:
        d["orgao"], resto = m.group(1).strip(), m.group(2)
    else:
        resto = texto
        for sigla, rx in PISTAS:
            if re.search(rx, texto):
                d["orgao"] = sigla
                break

    m = re.search(r"\(relator[a]?\s+([^)]+)\)", resto)
    if m:
        d["relator"] = m.group(1).strip()
        resto = resto.replace(m.group(0), "").replace("  ", " ")

    corte = corte_fora_de_parenteses(resto)
    if corte > 0:
        cabeca, d["texto"] = resto[:corte].strip().rstrip(","), resto[corte + 1:].strip()
        d["numero"], d["rotulo"] = numero(cabeca)

    m = re.search(r"Situação em ([^:]{3,20}):\s*(.*)$", d["texto"], re.S)
    if m:
        d["situacao"] = m.group(2).strip()
        d["texto"] = d["texto"][:m.start()].strip()
    return d


def estado(situacao, texto):
    """O desfecho vem da situação; só se ela nada disser é que o texto vale."""
    for fonte in (situacao, texto):
        for nome, rx in ESTADOS:
            if re.search(rx, fonte, re.I):
                return nome
    return "sem estado"


def main():
    pessoas = {p["id"]: p["nome"] for p in ler("pessoas.csv")}
    saida = []
    for a in ler("atos.csv"):
        if a["tipo"] not in TIPOS:
            continue
        d = partir(a["ato"])
        envolvidos = [pid.strip() for pid in a["pessoas"].split(";") if pid.strip()]
        faltam = [p for p in envolvidos if p not in pessoas]
        assert not faltam, f"processo com pessoa inexistente: {faltam}"
        saida.append({
            **d,
            "data": a["data"],
            "judicial": a["tipo"] == "decisão judicial",
            "estado": estado(d["situacao"], d["texto"]),
            # lido só da situação: o texto costuma citar o trânsito de OUTRO processo
            "definitivo": bool(re.search(DEFINITIVO, d["situacao"], re.I)),
            "envolvidos": [{"id": p, "nome": pessoas[p]} for p in envolvidos],
            "fontes": [u for u in a["fonte"].split() if u.startswith("http")],
        })
    saida.sort(key=lambda x: (x["data"], x["orgao"]))

    por_estado = defaultdict(int)
    for p in saida:
        por_estado[p["estado"]] += 1
    (RAIZ / "dados" / "processos.json").write_text(
        json.dumps({"processos": saida}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(saida)} processos; com número: {sum(1 for p in saida if p['numero'])}; "
          f"com situação: {sum(1 for p in saida if p['situacao'])}; "
          f"com trânsito em julgado: {sum(1 for p in saida if p['definitivo'])}")
    print("  " + " · ".join(f"{k}: {v}" for k, v in sorted(por_estado.items(), key=lambda x: -x[1])))


if __name__ == "__main__":
    main()
