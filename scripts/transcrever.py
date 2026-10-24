"""Obtém o roteiro de um vídeo do YouTube.

Ordem de tentativa:
1. legendas publicadas (manuais ou automáticas) pela youtube-transcript-api;
2. legendas pelo yt-dlp;
3. áudio pelo yt-dlp + transcrição local com faster-whisper.

Saída em <saida>/<video_id>.{json,txt} com minutagem por trecho.
"""
import json
import subprocess
import sys
from pathlib import Path


def fmt(t: float) -> str:
    t = int(t)
    return f"{t // 3600:02d}:{t % 3600 // 60:02d}:{t % 60:02d}"


def salvar(saida: Path, vid: str, metodo: str, trechos: list[dict]) -> None:
    saida.mkdir(parents=True, exist_ok=True)
    (saida / f"{vid}.json").write_text(
        json.dumps({"video_id": vid, "metodo": metodo, "trechos": trechos}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    linhas = [f"# video {vid} | metodo: {metodo}"]
    linhas += [f"[{fmt(s['inicio'])}] {s['texto']}" for s in trechos]
    (saida / f"{vid}.txt").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"OK {vid}: {len(trechos)} trechos via {metodo}")


def via_api(vid: str) -> list[dict] | None:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        api = YouTubeTranscriptApi()
        lista = api.list(vid)
        for t in lista:
            print("legenda disponível:", t.language_code, "gerada" if t.is_generated else "manual")
        t = lista.find_transcript(["pt-BR", "pt", "pt-PT"])
        dados = t.fetch()
        return [{"inicio": s.start, "dur": s.duration, "texto": s.text} for s in dados]
    except Exception as e:  # noqa: BLE001
        print("api falhou:", repr(e)[:400])
        return None


def via_whisper(vid: str, tmp: Path) -> list[dict] | None:
    url = f"https://www.youtube.com/watch?v={vid}"
    tmp.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["yt-dlp", "-f", "bestaudio", "-x", "--audio-format", "mp3", "-o", str(tmp / f"{vid}.%(ext)s"), url],
        capture_output=True, text=True,
    )
    print(r.stdout[-1500:], r.stderr[-1500:])
    audio = next(tmp.glob(f"{vid}.*"), None)
    if not audio:
        return None
    from faster_whisper import WhisperModel

    modelo = WhisperModel("medium", device="cpu", compute_type="int8")
    segs, info = modelo.transcribe(str(audio), language="pt", vad_filter=True)
    print("duração do áudio (s):", info.duration)
    return [{"inicio": s.start, "dur": s.end - s.start, "texto": s.text.strip()} for s in segs]


def main() -> int:
    saida = Path(sys.argv[1])
    vids = sys.argv[2:]
    ok = False
    for vid in vids:
        trechos = via_api(vid)
        if trechos:
            salvar(saida, vid, "legenda-youtube", trechos)
            ok = True
            continue
        trechos = via_whisper(vid, Path("/tmp/audio"))
        if trechos:
            salvar(saida, vid, "whisper-medium", trechos)
            ok = True
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
