/* Botão de tema: alterna entre seguir o sistema, claro e escuro.
   A escolha fica salva só no navegador do leitor (localStorage), não vai para servidor nenhum.
   O tema já foi aplicado por um script no <head>; aqui só montamos o controle. */
(function () {
  "use strict";

  var CICLO = ["sistema", "claro", "escuro"];
  var ROTULO = { sistema: "Tema: sistema", claro: "Tema: claro", escuro: "Tema: escuro" };
  var TITULO = {
    sistema: "Seguindo a preferência do seu sistema. Clique para fixar o tema claro.",
    claro: "Tema claro fixado. Clique para fixar o tema escuro.",
    escuro: "Tema escuro fixado. Clique para voltar a seguir o sistema."
  };

  function lido() {
    try {
      var v = localStorage.getItem("tema");
      return CICLO.indexOf(v) >= 0 ? v : "sistema";
    } catch (e) {
      return "sistema";
    }
  }

  function aplicar(tema) {
    if (tema === "sistema") {
      document.documentElement.removeAttribute("data-tema");
    } else {
      document.documentElement.setAttribute("data-tema", tema);
    }
    try {
      if (tema === "sistema") localStorage.removeItem("tema");
      else localStorage.setItem("tema", tema);
    } catch (e) {
      /* navegador sem armazenamento: o tema vale só nesta página */
    }
  }

  function montar() {
    var destino = document.querySelector(".nav") || document.querySelector(".rede-topo");
    if (!destino || document.getElementById("botao-tema")) return;

    var atual = lido();
    var botao = document.createElement("button");
    botao.type = "button";
    botao.id = "botao-tema";
    botao.className = destino.classList.contains("rede-topo") ? "botao botao-tema" : "botao-tema";
    botao.textContent = ROTULO[atual];
    botao.title = TITULO[atual];

    botao.addEventListener("click", function () {
      var proximo = CICLO[(CICLO.indexOf(lido()) + 1) % CICLO.length];
      aplicar(proximo);
      botao.textContent = ROTULO[proximo];
      botao.title = TITULO[proximo];
    });

    destino.appendChild(botao);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
