// Gera assets/marca/compartilhar.png (1200x630), a imagem de compartilhamento do site (Open Graph).
// Uso: NODE_PATH=$(npm root -g) node scripts/gerar_compartilhar.js
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const raiz = path.join(__dirname, "..");
const lupa = fs.readFileSync(path.join(raiz, "assets/marca/lupa.svg"), "utf8").replace(/#000/g, "#b5502f");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; width: 1200px; height: 630px; background: #faf9f5; color: #141413;
         font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; display: flex; }
  .c { padding: 80px 90px; display: flex; flex-direction: column; justify-content: space-between; width: 100%; box-sizing: border-box; }
  .marca { display: flex; align-items: center; gap: 28px; }
  .marca svg { width: 110px; height: 110px; }
  h1 { font-size: 92px; font-weight: 500; margin: 0; letter-spacing: -1px; }
  p { font-family: system-ui, sans-serif; font-size: 34px; color: #5e5d59; margin: 0; line-height: 1.35; max-width: 980px; }
  .rodape { font-family: system-ui, sans-serif; font-size: 26px; color: #b5502f; border-top: 3px solid #e6e3d8; padding-top: 22px; }
</style></head><body><div class="c">
  <div class="marca">${lupa}<h1>Transparência do Caos</h1></div>
  <p>Covid-19 no Brasil: dados, documentos e o caminho do dinheiro. Cada fato com fonte e cópia conferível.</p>
  <div class="rodape">transparenciadocaos.com</div>
</div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.screenshot({ path: path.join(raiz, "assets/marca/compartilhar.png") });
  await b.close();
})();
