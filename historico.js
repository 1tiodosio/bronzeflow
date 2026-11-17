"use strict";

const textoDiaEscolhido = document.getElementById("dia-escolhido");
const campoDia = document.getElementById("campo-dia");

const contadorChegadas = document.getElementById("contador-chegadas");
const contadorPagas = document.getElementById("contador-pagas");
const contadorPendentes = document.getElementById("contador-pendentes");

const totalRecebido = document.getElementById("total-recebido");
const totalAReceber = document.getElementById("total-a-receber");
const totaisFormas = document.getElementById("totais-formas");
const totalConferidos = document.getElementById("total-conferidos");
const moldeLinhaTotal = document.getElementById("molde-linha-total");

const mensagemClientesVazia = document.getElementById("clientes-vazia");
const listaClientes = document.getElementById("lista-clientes");
const moldeItemCliente = document.getElementById("molde-item-cliente");

function montarEscolhaDoDia(diaPreferido) {
  const dias = diasRegistrados();
  const hoje = dataDeHoje();

  if (dias.length === 0) {
    textoDiaEscolhido.textContent = "Ainda não há atendimentos registrados.";
    return;
  }

  campoDia.innerHTML = "";

  dias.forEach((dia) => {
    const opcao = document.createElement("option");

    opcao.value = dia;
    opcao.textContent = formatarDataCurta(dia);

    if (dia === hoje) {
      opcao.textContent += " (hoje)";
    }

    campoDia.appendChild(opcao);
  });

  campoDia.disabled = false;
  campoDia.value = dias.includes(diaPreferido) ? diaPreferido : dias[0];

  desenharDia(campoDia.value);
}

function desenharDia(dia) {
  const clientes = clientesDoDia(dia);
  const resumo = resumoPagamentos(clientes);

  textoDiaEscolhido.textContent = formatarDataLonga(dia);

  contadorChegadas.textContent = clientes.length;
  contadorPagas.textContent = resumo.pagas;
  contadorPendentes.textContent = resumo.pendentes;

  desenharTotais(resumo);
  desenharClientes(clientes);
}

function desenharTotais(resumo) {
  totalRecebido.textContent = formatarValor(resumo.recebido);
  totalAReceber.textContent = formatarValor(resumo.aReceber);
  totalConferidos.textContent = `${resumo.conferidos} de ${resumo.paraConferir}`;

  totaisFormas.innerHTML = "";

  FORMAS_PAGAMENTO.forEach((forma) => {
    const copia = moldeLinhaTotal.content.cloneNode(true);

    copia.querySelector(".totais__rotulo").textContent = forma.nome;
    copia.querySelector(".totais__valor").textContent =
      formatarValor(resumo.porForma[forma.codigo]);

    totaisFormas.appendChild(copia);
  });
}

function desenharClientes(clientes) {
  listaClientes.innerHTML = "";
  mensagemClientesVazia.hidden = clientes.length > 0;

  clientes.forEach((cliente) => {
    const copia = moldeItemCliente.content.cloneNode(true);

    copia.querySelector(".item__nome").textContent = cliente.nome;
    copia.querySelector(".item__chegada").textContent =
      `Chegou às ${formatarHora(cliente.chegada)}`;

    ligarPagamento(cliente, copia);
    ligarConferencia(cliente, copia);

    listaClientes.appendChild(copia);
  });
}

function ligarPagamento(cliente, copia) {
  const elementoPagamento = copia.querySelector(".item__pagamento");
  const botaoPagamento = copia.querySelector(".item__botao-pagamento");

  preencherPagamento(cliente, elementoPagamento, botaoPagamento);

  botaoPagamento.addEventListener("click", function () {
    marcarComoPago(cliente.id);
    desenharDia(campoDia.value);
  });
}

function ligarConferencia(cliente, copia) {
  const forma = acharForma(cliente.forma);
  const podeConferir = temPagamento(cliente) && cliente.pago && forma !== null && forma.passaPeloBanco;

  if (!podeConferir) {
    return;
  }

  const rotuloConferido = copia.querySelector(".item__conferido");
  const caixaConferido = copia.querySelector(".item__caixa-conferido");

  rotuloConferido.hidden = false;
  caixaConferido.checked = cliente.conferido === true;

  caixaConferido.addEventListener("change", function () {
    definirConferido(cliente.id, caixaConferido.checked);
    desenharDia(campoDia.value);
  });
}

campoDia.addEventListener("change", function () {
  desenharDia(campoDia.value);
});

aoMudarOsDados(function () {
  montarEscolhaDoDia(campoDia.value);
});

montarEscolhaDoDia(null);