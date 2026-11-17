"use strict";

const textoDataHoje = document.getElementById("data-hoje");

const contadorChegadas = document.getElementById("contador-chegadas");
const contadorPagas = document.getElementById("contador-pagas");
const contadorPendentes = document.getElementById("contador-pendentes");

const formularioChegada = document.getElementById("form-chegada");
const campoNome = document.getElementById("campo-nome");
const campoValor = document.getElementById("campo-valor");
const campoForma = document.getElementById("campo-forma");
const campoPagarSaida = document.getElementById("campo-pagar-saida");
const erroNome = document.getElementById("erro-nome");
const erroValor = document.getElementById("erro-valor");
const erroForma = document.getElementById("erro-forma");

const mensagemChegadasVazia = document.getElementById("chegadas-vazia");
const listaChegadas = document.getElementById("lista-chegadas");
const moldeItemChegada = document.getElementById("molde-item-chegada");

function montarFormasDePagamento() {
  FORMAS_PAGAMENTO.forEach((forma) => {
    const opcao = document.createElement("option");

    opcao.value = forma.codigo;
    opcao.textContent = forma.nome;

    campoForma.appendChild(opcao);
  });
}

function mostrarErro(campo, elementoErro, mensagem) {
  elementoErro.textContent = mensagem;

  if (mensagem === "") {
    campo.removeAttribute("aria-invalid");
  } else {
    campo.setAttribute("aria-invalid", "true");
  }
}

function limparErros() {
  mostrarErro(campoNome, erroNome, "");
  mostrarErro(campoValor, erroValor, "");
  mostrarErro(campoForma, erroForma, "");
}

function validarFormulario() {
  limparErros();

  const nome = limparNome(campoNome.value);
  const valor = converterParaCentavos(campoValor.value);
  const forma = acharForma(campoForma.value);

  let primeiroCampoComErro = null;

  if (nome === "") {
    mostrarErro(campoNome, erroNome, "Digite o nome da cliente.");
    primeiroCampoComErro = campoNome;
  }

  if (valor === null) {
    mostrarErro(campoValor, erroValor, "Digite um valor válido, como 35,50.");

    if (primeiroCampoComErro === null) {
      primeiroCampoComErro = campoValor;
    }
  }

  if (forma === null) {
    mostrarErro(campoForma, erroForma, "Escolha a forma de pagamento.");

    if (primeiroCampoComErro === null) {
      primeiroCampoComErro = campoForma;
    }
  }

  if (primeiroCampoComErro !== null) {
    primeiroCampoComErro.focus();
    return null;
  }

  return { nome: nome, valor: valor, forma: forma.codigo };
}

formularioChegada.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const dados = validarFormulario();

  if (dados === null) {
    return;
  }

  const pago = !campoPagarSaida.checked;

  const guardou = registrarChegada(dados.nome, dados.valor, dados.forma, pago);

  if (!guardou) {
    mostrarErro(
      campoNome,
      erroNome,
      "Não foi possível salvar neste navegador. Verifique se o armazenamento não está bloqueado."
    );
    return;
  }

  formularioChegada.reset();
  limparErros();
  campoNome.focus();

  desenharTudo();
});

function desenharTudo() {
  const hoje = dataDeHoje();
  const clientes = clientesDoDia(hoje);

  textoDataHoje.textContent = formatarDataLonga(hoje);

  desenharResumo(clientes);
  desenharChegadas(clientes);
}

function desenharResumo(clientes) {
  const resumo = resumoPagamentos(clientes);

  contadorChegadas.textContent = clientes.length;
  contadorPagas.textContent = resumo.pagas;
  contadorPendentes.textContent = resumo.pendentes;
}

function desenharChegadas(clientes) {
  listaChegadas.innerHTML = "";
  mensagemChegadasVazia.hidden = clientes.length > 0;

  clientes.slice().reverse().forEach((cliente) => {
    const copia = moldeItemChegada.content.cloneNode(true);

    copia.querySelector(".item__nome").textContent = cliente.nome;
    copia.querySelector(".item__chegada").textContent =
      `Chegou às ${formatarHora(cliente.chegada)}`;

    ligarPagamento(cliente, copia);

    listaChegadas.appendChild(copia);
  });
}

function ligarPagamento(cliente, copia) {
  const elementoPagamento = copia.querySelector(".item__pagamento");
  const botaoPagamento = copia.querySelector(".item__botao-pagamento");

  preencherPagamento(cliente, elementoPagamento, botaoPagamento);

  botaoPagamento.addEventListener("click", function () {
    marcarComoPago(cliente.id);
    desenharTudo();
  });
}

aoMudarOsDados(desenharTudo);
window.setInterval(desenharTudo, 60000);

montarFormasDePagamento();
desenharTudo();