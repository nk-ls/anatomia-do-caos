"""Baixa fotos OFICIAIS de agentes públicos (parlamentares) e registra a origem.

Só entram pessoas que exerceram mandato federal entre 2019 e 2027, com a foto
oficial publicada pela própria Câmara ou pelo próprio Senado. Pessoas sem cargo
público não recebem foto (direito de imagem, art. 20 do Código Civil, e LGPD).
Saída: assets/fotos/<id>.jpg (160x160) e dados/fotos.csv (origem e crédito).
"""
import csv
import io
import json
import unicodedata
import urllib.request
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "AnatomiaDoCaos/1.0 (https://github.com/nk-ls/anatomia-do-caos)"}

DEPUTADOS = {  # id da ficha -> nome parlamentar na Câmara
    "eduardo-bolsonaro": "Eduardo Bolsonaro", "bia-kicis": "Bia Kicis", "carla-zambelli": "Carla Zambelli",
    "carlos-jordy": "Carlos Jordy", "osmar-terra": "Osmar Terra", "ricardo-barros": "Ricardo Barros",
    "luis-miranda": "Luis Miranda", "eduardo-pazuello": "General Pazuello", "onyx-lorenzoni": "Onyx Lorenzoni",
}
SENADORES = {"flavio-bolsonaro": "Flávio Bolsonaro", "omar-aziz": "Omar Aziz", "randolfe-rodrigues": "Randolfe Rodrigues",
             "renan-calheiros": "Renan Calheiros", "otto-alencar": "Otto Alencar"}


def norm(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().strip()


def obter(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def salvar(pid, dados):
    im = Image.open(io.BytesIO(dados)).convert("RGB")
    w, h = im.size
    lado = min(w, h)
    im = im.crop(((w - lado) // 2, 0, (w - lado) // 2 + lado, lado)).resize((160, 160), Image.LANCZOS)
    im.save(RAIZ / "assets/fotos" / f"{pid}.jpg", quality=85)


def main():
    linhas = []
    for pid, nome in DEPUTADOS.items():
        achado = None
        for leg in (57, 56):
            r = json.loads(obter(f"https://dadosabertos.camara.leg.br/api/v2/deputados?nome={urllib.parse.quote(nome)}&idLegislatura={leg}"))
            dados = [d for d in r["dados"] if norm(d["nome"]) == norm(nome)] or r["dados"][:1]
            if dados:
                achado = dados[0]
                break
        if not achado:
            print("não achado na Câmara:", nome)
            continue
        salvar(pid, obter(achado["urlFoto"]))
        linhas.append(dict(id=pid, arquivo=f"assets/fotos/{pid}.jpg", fonte=achado["urlFoto"],
                           pagina=f"https://www.camara.leg.br/deputados/{achado['id']}",
                           credito="Foto oficial: Câmara dos Deputados", licenca="Dado aberto da Câmara dos Deputados, uso com crédito"))
    sen = {}
    for leg in (57, 56):
        r = json.loads(obter(f"https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/{leg}.json"))
        for p in r["ListaParlamentarLegislatura"]["Parlamentares"]["Parlamentar"]:
            ident = p["IdentificacaoParlamentar"]
            sen.setdefault(norm(ident["NomeParlamentar"]), ident["CodigoParlamentar"])
    for pid, nome in SENADORES.items():
        cod = sen.get(norm(nome))
        if not cod:
            print("não achado no Senado:", nome)
            continue
        url = f"https://legis.senado.leg.br/senadores/fotos-oficiais/{cod}"
        salvar(pid, obter(url))
        linhas.append(dict(id=pid, arquivo=f"assets/fotos/{pid}.jpg", fonte=url,
                           pagina=f"https://www25.senado.leg.br/web/senadores/senador/-/perfil/{cod}",
                           credito="Foto oficial: Senado Federal", licenca="Foto oficial do Senado Federal, uso com crédito"))
    with open(RAIZ / "dados/fotos.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0]))
        w.writeheader()
        w.writerows(linhas)
    print(len(linhas), "fotos oficiais")


if __name__ == "__main__":
    import urllib.parse  # noqa: F401
    main()
