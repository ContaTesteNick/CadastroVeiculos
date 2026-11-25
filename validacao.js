// Regras de validação do formulário de veículo (funções puras, testadas em teste-validacao.mjs).

const pad = (n) => String(n).padStart(2, '0');
export const hojeISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// "dd/mm/aaaa" -> "aaaa-mm-dd", ou null se a data não existir no calendário (ex.: 31/02, 29/02 fora de bissexto)
export function dataBRparaISO(txt) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(txt).trim());
  if (!m) return null;
  const [, d, mes, a] = m.map(Number);
  const dt = new Date(a, mes - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== d) return null;
  return `${a}-${pad(mes)}-${pad(d)}`;
}

export const isoParaBR = (iso) => iso.split('-').reverse().join('/');

// Digita só números e as barras aparecem sozinhas: 12032026 -> 12/03/2026
export function mascaraData(txt) {
  const n = txt.replace(/\D/g, '').slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/');
}

// Valor no formato brasileiro: "1.234,56", "1234,5" ou "850" -> centavos (inteiro); null se inválido
export function valorParaCentavos(txt) {
  const s = String(txt).trim().replace(/^R\$\s*/, '');
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(s)) return null;
  const [inteiro, dec = ''] = s.replace(/\./g, '').split(',');
  return Number(inteiro) * 100 + Number(dec.padEnd(2, '0'));
}

export function centavosParaBR(c) {
  const inteiro = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${inteiro},${pad(c % 100)}`;
}

export const formatarKm = (km) => String(km).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Recebe os textos do formulário; devolve { erros } (por campo) e, se tudo certo, { dados } prontos para o banco.
export function validarVeiculo(f, hoje = new Date()) {
  const erros = {};
  const anoAtual = hoje.getFullYear();
  const hj = hojeISO(hoje);

  const modelo = f.modelo.trim().replace(/\s+/g, ' ');
  if (modelo.length < 2) erros.modelo = 'Informe o modelo (mínimo 2 caracteres).';
  else if (modelo.length > 60) erros.modelo = 'Modelo muito longo (máximo 60 caracteres).';

  const placa = f.placa.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa)) erros.placa = 'Placa inválida. Use ABC1D23 (Mercosul) ou ABC1234.';

  const ano = Number(f.ano);
  if (!/^\d{4}$/.test(f.ano.trim()) || ano < 1950 || ano > anoAtual + 1)
    erros.ano = `Ano deve estar entre 1950 e ${anoAtual + 1}.`;

  const kmTxt = f.km.trim().replace(/\./g, '');
  const km = Number(kmTxt);
  if (!/^\d+$/.test(kmTxt)) erros.km = 'Quilometragem deve conter só números.';
  else if (km > 2000000) erros.km = 'Quilometragem acima de 2.000.000 km.';

  const revisao = dataBRparaISO(f.revisao);
  if (!revisao) erros.revisao = 'Data inválida. Use dd/mm/aaaa.';
  else if (revisao > hj) erros.revisao = 'A última revisão não pode estar no futuro.';
  else if (!erros.ano && Number(revisao.slice(0, 4)) < ano - 1)
    erros.revisao = 'Revisão anterior ao ano do veículo.';

  const valor = valorParaCentavos(f.valor);
  if (valor === null) erros.valor = 'Valor inválido. Ex.: 1.234,56';
  else if (valor <= 0) erros.valor = 'O valor deve ser maior que zero.';
  else if (valor > 100000000) erros.valor = 'Valor acima de R$ 1.000.000,00.';

  const vencimento = dataBRparaISO(f.vencimento);
  if (!vencimento) erros.vencimento = 'Data inválida. Use dd/mm/aaaa.';
  else if (vencimento.slice(0, 4) < '2000' || Number(vencimento.slice(0, 4)) > anoAtual + 5)
    erros.vencimento = `Vencimento deve estar entre 2000 e ${anoAtual + 5}.`;

  if (Object.keys(erros).length) return { erros };
  return {
    erros,
    dados: {
      MODELO_VE: modelo, PLACA_VE: placa, ANO_VE: ano, KM_VE: km,
      REVISAO_VE: revisao, VALOR_VE: valor, VENCIMENTO_VE: vencimento,
    },
  };
}
