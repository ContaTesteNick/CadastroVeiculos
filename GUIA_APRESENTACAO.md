# Cadastro de Veículos — Guia de Apresentação

App mobile em **React Native + Expo (SDK 58)** com banco **SQLite** (`expo-sqlite`), feito sobre a base
`SQLITEMOBILE` do repositório de referência (mesma estrutura: `App.js` + `Banco/Config.tsx`).

---

## 1. Como rodar (antes da apresentação)

```powershell
cd "$HOME\Desktop\CadastroVeiculos"
npm install              # só na primeira vez
npx expo start --clear   # abre o QR code
```

- No celular: instale/atualize o **Expo Go** e leia o QR code (celular e PC na mesma rede Wi-Fi).
- Ou aperte `a` no terminal para abrir no emulador Android.
- Ou aperte `w` para abrir no navegador (o `metro.config.js` libera o `.wasm` do SQLite na web).
- Teste das regras de validação: `npm test`

> O app começa com a lista **vazia**. Os registros são cadastrados por você durante a apresentação
> (lista pronta na seção 4).

---

## 2. Estrutura do projeto

| Arquivo | O que faz |
|---|---|
| `Banco/Config.tsx` | Abre o banco `veiculos.db`, cria a tabela `VEICULO` e tem todas as funções SQL do CRUD |
| `App.js` | Telas: lista (com filtro e paginação) e formulário (novo / editar / excluir) |
| `validacao.js` | Regras de validação de todos os campos (placa, ano, km, datas, valor) |
| `teste-validacao.mjs` | Autoteste das regras (`npm test`) |

### Tabela `VEICULO`

| Coluna | Tipo | Observação |
|---|---|---|
| `ID_VE` | INTEGER PK AUTOINCREMENT | |
| `MODELO_VE` | VARCHAR(60) | |
| `PLACA_VE` | VARCHAR(7) **UNIQUE** | não deixa repetir placa |
| `ANO_VE` | INTEGER | |
| `KM_VE` | INTEGER | |
| `REVISAO_VE` | TEXT | data em `aaaa-mm-dd` (permite ordenar e comparar no SQL) |
| `VALOR_VE` | INTEGER | valor do IPVA **em centavos** (evita erro de arredondamento) |
| `VENCIMENTO_VE` | TEXT | vencimento do IPVA em `aaaa-mm-dd` |

---

## 3. Roteiro da apresentação (≈ 5 min)

> Dica: cadastre os 10 veículos da seção 4 **antes** de apresentar (dados persistem), e faça
> ao vivo só o 11º para mostrar o CREATE e a validação.

### 3.1 READ — listagem (tela inicial)
1. Mostre o topo: **"10 veículos cadastrados"** e o resumo *Revisão em dia* / *Revisão atrasada*.
2. Cada card mostra modelo, ano, km, placa, **valor do IPVA**, **vencimento** (fica vermelho como
   *Vencido* quando já passou) e o selo da revisão (em dia = feita nos últimos 12 meses).
3. Toque nos filtros **Todos / Em dia / Atrasada** (o filtro é feito no SQL com `WHERE`).

### 3.2 Paginação
1. São **4 registros por página** → 10 registros = **3 páginas**.
2. Toque em **Próxima ›** até a página 3 e volte com **‹ Anterior** (fica desabilitado na página 1).
3. Explique: a consulta usa `LIMIT 4 OFFSET (página-1)*4` — o app só carrega a página visível.

### 3.3 CREATE — cadastrar
1. Toque no botão **+**.
2. **Mostre a validação primeiro**: toque em *Salvar veículo* com tudo vazio → cada campo mostra o erro.
3. Teste erros de propósito:
   - Placa `AB12345` → *Placa inválida*
   - Ano `2035` → fora do intervalo
   - Revisão `31/02/2026` → data que não existe
   - Revisão no futuro → não permitido
   - Valor `12,345` ou `0` → inválido
   - Vencimento `29/02/2027` → 2027 não é bissexto
4. Preencha certo, por exemplo:
   `Peugeot 208 Allure` · `PGT3N21` · `2022` · `25000` · revisão `10/10/2026` · valor `1.450,90` · vencimento `15/02/2027`
5. Salve → volta para a lista com **11 veículos**.
6. Tente cadastrar a **mesma placa** de novo → *Já existe um veículo com esta placa* (constraint `UNIQUE`).

### 3.4 UPDATE — editar
1. Toque em um card com *Revisão atrasada* (ex.: *VW Gol 1.0*).
2. O formulário abre preenchido. Mude a **data da última revisão** para uma recente.
3. Salve → o selo muda para *Revisão em dia* e o resumo do topo atualiza.

### 3.5 DELETE — excluir
1. Toque em um card → **Excluir veículo** → confirme.
2. O registro some e o total diminui. Se a última página ficar vazia, o app volta uma página sozinho.

### 3.6 Persistência
1. Feche o app por completo (tire da lista de recentes) e abra de novo.
2. Os dados continuam lá: o SQLite grava em arquivo no aparelho (`veiculos.db`).

---

## 4. Dados para cadastrar (10 registros válidos)

| Modelo | Placa | Ano | Km | Última revisão | Valor IPVA | Vencimento |
|---|---|---|---|---|---|---|
| Honda Civic EXL | CVC1A20 | 2021 | 45320 | 12/03/2026 | 2.850,00 | 20/01/2027 |
| Fiat Strada Freedom | STR2B31 | 2022 | 38900 | 05/09/2025 | 1.980,50 | 15/02/2027 |
| Toyota Corolla XEi | CRL3C42 | 2020 | 72150 | 20/07/2026 | 3.120,40 | 25/01/2027 |
| VW Gol 1.0 | GOL4D53 | 2015 | 128400 | 18/01/2025 | 890,90 | 10/10/2026 |
| Chevrolet Onix LT | ONX5E64 | 2023 | 21780 | 02/05/2026 | 1.765,00 | 10/03/2027 |
| Hyundai HB20 Comfort | HBV6075 | 2019 | 86010 | 30/11/2024 | 1.210,75 | 05/11/2026 |
| Jeep Renegade Sport | RNG7F86 | 2021 | 54200 | 14/02/2026 | 2.680,00 | 30/01/2027 |
| Renault Kwid Zen | KWD8G97 | 2022 | 31450 | 22/06/2025 | 920,00 | 12/04/2027 |
| Ford Ranger XLS | RGR9H08 | 2018 | 142300 | 01/08/2026 | 4.100,25 | 28/02/2027 |
| Nissan Kicks SV | KCK0J19 | 2020 | 67900 | 09/03/2025 | 1.899,00 | 15/12/2026 |

Mistura de revisões em dia/atrasadas e de IPVA vencido/a vencer, para os filtros e selos aparecerem.

---

## 5. Validações implementadas (`validacao.js`)

| Campo | Regra |
|---|---|
| Modelo | obrigatório, 2 a 60 caracteres |
| Placa | Mercosul `ABC1D23` ou antiga `ABC1234`; aceita minúscula/hífen e salva em maiúscula; não pode repetir |
| Ano | 4 dígitos, de 1950 até o ano que vem |
| Quilometragem | só números (aceita `45.320`), até 2.000.000 |
| Última revisão | `dd/mm/aaaa` com data real, não pode ser futura nem anterior ao ano do veículo |
| Valor do IPVA | formato brasileiro (`1.234,56`, `850`, `R$ 99,90`), maior que zero, até R$ 1.000.000,00, no máximo 2 casas |
| Vencimento | `dd/mm/aaaa` com data real (checa 31/02, ano bissexto), entre 2000 e 5 anos à frente |

As barras das datas são colocadas automaticamente enquanto digita.

---

## 6. Requisitos da atividade × onde estão

| Requisito | Onde |
|---|---|
| CREATE | `insertVeiculo` (Config.tsx) + botão **+** |
| READ | `selectVeiculos` / `contarVeiculos` + tela de lista |
| UPDATE | `updateVeiculo` + toque no card |
| DELETE | `deleteVeiculo` + botão *Excluir veículo* com confirmação |
| Integração SQLite | `expo-sqlite` (`openDatabaseAsync`, `runAsync`, `getAllAsync`) |
| Formulário | tela Novo / Editar |
| 10+ registros | cadastrados pelo próprio app (seção 4) |
| Paginação | `LIMIT/OFFSET`, botões Anterior/Próxima, "Página X de Y" |
| Persistência | arquivo `veiculos.db` no aparelho |
