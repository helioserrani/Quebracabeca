// Foto Encantada — quebra-cabeça de troca de peças.
// Toque em uma peça e depois em outra para trocá-las de lugar.

const $ = (id) => document.getElementById(id);

const estado = {
  foto: "assets/foto-exemplo.jpg",
  n: 6,
  ordem: [],        // ordem[posição] = número da peça
  selecionada: null,
  jogadas: 0,
  inicio: 0,
  cronometro: null,
};

// Recorta a foto escolhida no centro, em formato quadrado
function carregarFoto(arquivo) {
  const leitor = new FileReader();
  leitor.onload = () => {
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const tela = document.createElement("canvas");
      tela.width = tela.height = Math.min(lado, 900);
      tela.getContext("2d").drawImage(
        img,
        (img.width - lado) / 2, (img.height - lado) / 2, lado, lado,
        0, 0, tela.width, tela.height
      );
      escolherFoto(tela.toDataURL("image/jpeg", 0.9));
    };
    img.src = leitor.result;
  };
  leitor.readAsDataURL(arquivo);
}

function escolherFoto(url) {
  estado.foto = url;
  $("previa-foto").src = url;
  document.querySelectorAll(".miniatura").forEach((m) => m.classList.toggle("ativa", m.dataset.url === url));
}

// Abas "Temas" / "Minha foto"
document.querySelectorAll(".aba").forEach((aba) =>
  aba.addEventListener("click", () => {
    document.querySelectorAll(".aba").forEach((a) => {
      const ativa = a === aba;
      a.classList.toggle("ativa", ativa);
      a.setAttribute("aria-selected", ativa);
      $(a.dataset.aba).hidden = !ativa;
    });
  })
);

function mostrarTema(tema) {
  document.querySelectorAll(".tema").forEach((b) => b.classList.toggle("ativo", b.dataset.id === tema.id));
  const galeria = $("galeria-tema");
  if (!tema.imagens.length) {
    galeria.innerHTML = '<p class="aviso">Imagens deste tema em breve ✨</p>';
    return;
  }
  galeria.replaceChildren(
    ...tema.imagens.map((url) => {
      const mini = document.createElement("button");
      mini.className = "miniatura";
      mini.dataset.url = url;
      mini.style.backgroundImage = `url("${url}")`;
      mini.setAttribute("aria-label", `${tema.nome}: imagem`);
      mini.addEventListener("click", () => escolherFoto(url));
      return mini;
    })
  );
  escolherFoto(tema.imagens[0]);
}

$("lista-temas").replaceChildren(
  ...TEMAS.map((tema) => {
    const botao = document.createElement("button");
    botao.className = "tema";
    botao.dataset.id = tema.id;
    botao.textContent = `${tema.emoji} ${tema.nome}`;
    botao.addEventListener("click", () => mostrarTema(tema));
    return botao;
  })
);
mostrarTema(TEMAS.find((t) => t.imagens.length) || TEMAS[0]);

function embaralhar(lista) {
  do {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
  } while (lista.every((p, i) => p === i));
  return lista;
}

function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === id));
}

function iniciar() {
  const total = estado.n * estado.n;
  estado.ordem = embaralhar([...Array(total).keys()]);
  estado.selecionada = null;
  estado.jogadas = 0;
  estado.inicio = Date.now();
  clearInterval(estado.cronometro);
  estado.cronometro = setInterval(atualizarTempo, 1000);
  $("vitoria").hidden = true;
  atualizarTempo();
  desenhar();
  mostrarTela("tela-jogo");
}

function formatarTempo(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function atualizarTempo() {
  $("tempo").textContent = formatarTempo(Date.now() - estado.inicio);
}

function desenhar() {
  const { n, ordem, foto } = estado;
  const tabuleiro = $("tabuleiro");
  tabuleiro.style.setProperty("--n", n);
  tabuleiro.style.setProperty("--espaco", n > 6 ? "1px" : "2px");
  tabuleiro.style.setProperty("--foto", `url("${foto}")`);
  tabuleiro.replaceChildren(
    ...ordem.map((peca, pos) => {
      const botao = document.createElement("button");
      botao.className = "peca";
      if (peca === pos) botao.classList.add("certa");
      if (pos === estado.selecionada) botao.classList.add("selecionada");
      botao.style.backgroundImage = `url("${foto}")`;
      botao.style.backgroundSize = `${n * 100}% ${n * 100}%`;
      const x = n > 1 ? ((peca % n) / (n - 1)) * 100 : 0;
      const y = n > 1 ? (Math.floor(peca / n) / (n - 1)) * 100 : 0;
      botao.style.backgroundPosition = `${x}% ${y}%`;
      botao.setAttribute("aria-label", `Peça ${peca + 1}`);
      botao.addEventListener("click", () => tocarPeca(pos));
      return botao;
    })
  );
  $("jogadas").textContent = estado.jogadas;
}

function tocarPeca(pos) {
  if (estado.ordem[pos] === pos && estado.selecionada === null) return; // peça já no lugar
  if (estado.selecionada === null) {
    estado.selecionada = pos;
  } else if (estado.selecionada === pos) {
    estado.selecionada = null;
  } else {
    const a = estado.selecionada;
    [estado.ordem[a], estado.ordem[pos]] = [estado.ordem[pos], estado.ordem[a]];
    estado.selecionada = null;
    estado.jogadas++;
  }
  desenhar();
  if (estado.ordem.every((p, i) => p === i)) vencer();
}

function vencer() {
  clearInterval(estado.cronometro);
  const tempo = formatarTempo(Date.now() - estado.inicio);
  $("resumo-vitoria").textContent = `Você montou a foto em ${tempo} com ${estado.jogadas} jogadas.`;
  setTimeout(() => ($("vitoria").hidden = false), 400);
}

$("entrada-foto").addEventListener("change", (e) => {
  if (e.target.files[0]) carregarFoto(e.target.files[0]);
});

$("botao-jogar").addEventListener("click", () => {
  estado.n = Number(document.querySelector('input[name="tamanho"]:checked').value);
  iniciar();
});

$("botao-embaralhar").addEventListener("click", iniciar);
$("botao-de-novo").addEventListener("click", iniciar);
function voltarAoInicio() {
  clearInterval(estado.cronometro);
  $("vitoria").hidden = true;
  mostrarTela("tela-inicio");
}
$("botao-voltar").addEventListener("click", voltarAoInicio);
$("botao-trocar-foto").addEventListener("click", voltarAoInicio);

// Segurar o botão "Ver foto" mostra a imagem completa por cima do tabuleiro
const dica = $("botao-dica");
const mostrarFoto = (sim) => $("tabuleiro").classList.toggle("mostrando-foto", sim);
dica.addEventListener("pointerdown", () => mostrarFoto(true));
["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
  dica.addEventListener(ev, () => mostrarFoto(false))
);
