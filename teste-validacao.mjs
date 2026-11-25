// Autoteste das regras de validação: node teste-validacao.mjs
import assert from 'node:assert/strict';
import { validarVeiculo, valorParaCentavos, centavosParaBR, dataBRparaISO, mascaraData } from './validacao.js';

const hoje = new Date(2026, 10, 24); // 24/11/2026
const ok = { modelo: 'Honda Civic', placa: 'abc-1d23', ano: '2021', km: '45.320', revisao: '12/03/2026', valor: '2.850,00', vencimento: '20/01/2027' };

const r = validarVeiculo(ok, hoje);
assert.deepEqual(r.erros, {});
assert.equal(r.dados.PLACA_VE, 'ABC1D23');
assert.equal(r.dados.KM_VE, 45320);
assert.equal(r.dados.VALOR_VE, 285000);
assert.equal(r.dados.REVISAO_VE, '2026-03-12');

const erroEm = (campo, valor) => Object.keys(validarVeiculo({ ...ok, [campo]: valor }, hoje).erros);
assert.deepEqual(erroEm('modelo', ' '), ['modelo']);
assert.deepEqual(erroEm('placa', 'AB12345'), ['placa']);
assert.deepEqual(erroEm('ano', '2030'), ['ano']);
assert.deepEqual(erroEm('km', '-5'), ['km']);
assert.deepEqual(erroEm('revisao', '31/02/2026'), ['revisao']);
assert.deepEqual(erroEm('revisao', '25/11/2026'), ['revisao']); // futuro
assert.deepEqual(erroEm('revisao', '01/01/2010'), ['revisao']); // antes do ano do carro
assert.deepEqual(erroEm('valor', '0,00'), ['valor']);
assert.deepEqual(erroEm('valor', '12,345'), ['valor']);
assert.deepEqual(erroEm('valor', 'abc'), ['valor']);
assert.deepEqual(erroEm('vencimento', '29/02/2027'), ['vencimento']); // 2027 não é bissexto
assert.deepEqual(erroEm('vencimento', '10/10/2040'), ['vencimento']);

assert.equal(valorParaCentavos('1234,5'), 123450);
assert.equal(valorParaCentavos('R$ 850'), 85000);
assert.equal(valorParaCentavos('1.23,00'), null);
assert.equal(centavosParaBR(123456789), '1.234.567,89');
assert.equal(dataBRparaISO('29/02/2028'), '2028-02-29');
assert.equal(mascaraData('12032026'), '12/03/2026');

console.log('Validação: todos os testes passaram.');
