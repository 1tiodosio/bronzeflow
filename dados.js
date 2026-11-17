"use strict";

const CHAVE_CLIENTES = "bronzeflow.clientes";

const FORMAS_PAGAMENTO = [
  { codigo: "pix", nome: "Pix", passaPeloBanco: true },
  { codigo: "dinheiro", nome: "Dinheiro", passaPeloBanco: false },
  { codigo: "debito", nome: "Cartão de débito", passaPeloBanco: true },
  { codigo: "credito", nome: "Cartão de crédito", passaPeloBanco: true }
];

const VALOR_MAXIMO_CENTAVOS = 999999;

function lerClientes() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_CLIENTES));

    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

function salvarClientes(clientes) {
  try {
    localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
    return true;
  } catch (erro) {
    return false;
  }
}

function diaDaData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataDeHoje() {
  return diaDaData(new Date());
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function limparNome(texto) {
  return texto.trim().replace(/\s+/g, " ");
}

function registrarChegada(nome, valor, forma, pago) {
  const clientes = lerClientes();
  const agora = new Date();

  clientes.push({
    id: gerarId(),
    nome: nome,
    dia: diaDaData(agora),
    chegada: agora.toISOString(),
    valor: valor,
    forma: forma,
    pago: pago,
    conferido: false
  });

  return salvarClientes(clientes);
}

function clientesDoDia(dia) {
  return lerClientes().filter((cliente) => cliente.dia === dia);
}

function diasRegistrados() {
  const dias = [];

  lerClientes().forEach((cliente) => {
    if (!dias.includes(cliente.dia)) {
      dias.push(cliente.dia);
    }
  });

  return dias.sort().reverse();
}

function formatarHora(textoIso) {
  return new Date(textoIso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function criarData(dia) {
  const partes = dia.split("-");

  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

function primeiraMaiuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataLonga(dia) {
  const texto = criarData(dia).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return primeiraMaiuscula(texto);
}

function formatarDataCurta(dia) {
  const texto = criarData(dia).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return primeiraMaiuscula(texto);
}

function acharForma(codigo) {
  const forma = FORMAS_PAGAMENTO.find((item) => item.codigo === codigo);

  return forma === undefined ? null : forma;
}

function converterParaCentavos(texto) {
  const limpo = texto.replace("R$", "").replace(/\s/g, "").replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) {
    return null;
  }

  const centavos = Math.round(Number(limpo) * 100);

  if (centavos < 1 || centavos > VALOR_MAXIMO_CENTAVOS) {
    return null;
  }

  return centavos;
}

function formatarValor(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function temPagamento(cliente) {
  return typeof cliente.valor === "number";
}

function textoPagamento(cliente) {
  if (!temPagamento(cliente)) {
    return "Pagamento não informado";
  }

  const forma = acharForma(cliente.forma);
  const nomeDaForma = forma === null ? "forma não informada" : forma.nome;
  const situacao = cliente.pago ? "Pago" : "Pagar na saída";

  return `${situacao}: ${formatarValor(cliente.valor)} (${nomeDaForma})`;
}

function marcarComoPago(id) {
  const clientes = lerClientes();
  const cliente = clientes.find((item) => item.id === id);

  if (cliente === undefined || !temPagamento(cliente)) {
    return false;
  }

  cliente.pago = true;
  return salvarClientes(clientes);
}

function definirConferido(id, conferido) {
  const clientes = lerClientes();
  const cliente = clientes.find((item) => item.id === id);

  if (cliente === undefined || !temPagamento(cliente) || !cliente.pago) {
    return false;
  }

  cliente.conferido = conferido === true;
  return salvarClientes(clientes);
}

function resumoPagamentos(clientes) {
  const resumo = {
    pagas: 0,
    pendentes: 0,
    recebido: 0,
    aReceber: 0,
    porForma: {},
    paraConferir: 0,
    conferidos: 0
  };

  FORMAS_PAGAMENTO.forEach((forma) => {
    resumo.porForma[forma.codigo] = 0;
  });

  clientes.forEach((cliente) => {
    if (!temPagamento(cliente)) {
      return;
    }

    if (!cliente.pago) {
      resumo.pendentes += 1;
      resumo.aReceber += cliente.valor;
      return;
    }

    resumo.pagas += 1;
    resumo.recebido += cliente.valor;

    const forma = acharForma(cliente.forma);

    if (forma === null) {
      return;
    }

    resumo.porForma[forma.codigo] += cliente.valor;

    if (forma.passaPeloBanco) {
      resumo.paraConferir += 1;

      if (cliente.conferido === true) {
        resumo.conferidos += 1;
      }
    }
  });

  return resumo;
}

function preencherPagamento(cliente, elementoTexto, botaoPagamento) {
  elementoTexto.textContent = textoPagamento(cliente);

  if (temPagamento(cliente) && !cliente.pago) {
    elementoTexto.classList.add("item__pagamento--pendente");
    botaoPagamento.hidden = false;
  }
}

function aoMudarOsDados(atualizarTela) {
  window.addEventListener("storage", atualizarTela);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      atualizarTela();
    }
  });

  window.addEventListener("pageshow", function (evento) {
    if (evento.persisted) {
      atualizarTela();
    }
  });
}