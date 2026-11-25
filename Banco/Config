import * as SQLite from 'expo-sqlite';

// Datas ficam em ISO (aaaa-mm-dd) e o valor em centavos (inteiro) para ordenar e somar sem erro de arredondamento.
export type Veiculo = {
    ID_VE: number;
    MODELO_VE: string;
    PLACA_VE: string;
    ANO_VE: number;
    KM_VE: number;
    REVISAO_VE: string;
    VALOR_VE: number;
    VENCIMENTO_VE: string;
};
export type DadosVeiculo = Omit<Veiculo, 'ID_VE'>;
export type Filtro = 'todos' | 'emdia' | 'atrasada';

export const POR_PAGINA = 4;

//----------------------------------------------------------------------------
// Abre (ou cria) o banco de dados
async function Banco() {
    const db = await SQLite.openDatabaseAsync('veiculos.db');
    console.log('Banco de dados aberto');
    return db;
}

//----------------------------------------------------------------------------
async function createTable(db: SQLite.SQLiteDatabase) {
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS VEICULO (
            ID_VE         INTEGER PRIMARY KEY AUTOINCREMENT,
            MODELO_VE     VARCHAR(60)  NOT NULL,
            PLACA_VE      VARCHAR(7)   NOT NULL UNIQUE,
            ANO_VE        INTEGER      NOT NULL,
            KM_VE         INTEGER      NOT NULL,
            REVISAO_VE    TEXT         NOT NULL,
            VALOR_VE      INTEGER      NOT NULL,
            VENCIMENTO_VE TEXT         NOT NULL
        );
    `);
    console.log('Tabela VEICULO criada');
}

//----------------------------------------------------------------------------
// Inserir novo veículo
async function insertVeiculo(db: SQLite.SQLiteDatabase, v: DadosVeiculo) {
    await db.runAsync(
        `INSERT INTO VEICULO (MODELO_VE, PLACA_VE, ANO_VE, KM_VE, REVISAO_VE, VALOR_VE, VENCIMENTO_VE)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        v.MODELO_VE, v.PLACA_VE, v.ANO_VE, v.KM_VE, v.REVISAO_VE, v.VALOR_VE, v.VENCIMENTO_VE
    );
    console.log('Veiculo inserido');
}

//----------------------------------------------------------------------------
// Revisão "em dia" = feita nos últimos 12 meses
const WHERE: Record<Filtro, string> = {
    todos: '',
    emdia: "WHERE REVISAO_VE >= date('now', 'localtime', '-1 year')",
    atrasada: "WHERE REVISAO_VE < date('now', 'localtime', '-1 year')",
};

// Listagem paginada
async function selectVeiculos(db: SQLite.SQLiteDatabase, filtro: Filtro, pagina: number) {
    return db.getAllAsync<Veiculo>(
        `SELECT * FROM VEICULO ${WHERE[filtro]} ORDER BY ID_VE DESC LIMIT ? OFFSET ?`,
        POR_PAGINA, (pagina - 1) * POR_PAGINA
    );
}

// Totais para o resumo e para calcular o número de páginas
async function contarVeiculos(db: SQLite.SQLiteDatabase) {
    const r = await db.getFirstAsync<{ total: number; emdia: number }>(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(REVISAO_VE >= date('now', 'localtime', '-1 year')), 0) AS emdia
         FROM VEICULO`
    );
    const total = r?.total ?? 0, emdia = r?.emdia ?? 0;
    return { todos: total, emdia, atrasada: total - emdia };
}

//----------------------------------------------------------------------------
// Veículo pelo ID
async function selectVeiculoById(db: SQLite.SQLiteDatabase, id: number) {
    return db.getFirstAsync<Veiculo>('SELECT * FROM VEICULO WHERE ID_VE = ?', id);
}

//----------------------------------------------------------------------------
// Alterar veículo
async function updateVeiculo(db: SQLite.SQLiteDatabase, id: number, v: DadosVeiculo) {
    await db.runAsync(
        `UPDATE VEICULO SET MODELO_VE = ?, PLACA_VE = ?, ANO_VE = ?, KM_VE = ?,
                REVISAO_VE = ?, VALOR_VE = ?, VENCIMENTO_VE = ?
         WHERE ID_VE = ?`,
        v.MODELO_VE, v.PLACA_VE, v.ANO_VE, v.KM_VE, v.REVISAO_VE, v.VALOR_VE, v.VENCIMENTO_VE, id
    );
    console.log('Veiculo atualizado');
}

//----------------------------------------------------------------------------
// Excluir veículo pelo ID
async function deleteVeiculo(db: SQLite.SQLiteDatabase, id: number) {
    await db.runAsync('DELETE FROM VEICULO WHERE ID_VE = ?', id);
    console.log('Veiculo excluido');
}

//----------------------------------------------------------------------------
// Remove os 12 exemplos que versões anteriores do app inseriam sozinhas.
// Só apaga quando placa E modelo batem exatamente, então veículos cadastrados pelo usuário não são afetados.
// shortcut: limpeza de transição, pode ser apagada depois que todos os aparelhos abrirem esta versão.
const EXEMPLOS_ANTIGOS = [
    ['RIO2A18', 'Honda Civic EXL'], ['QTP7B42', 'Fiat Strada Freedom'], ['BRA2E19', 'Toyota Corolla XEi'],
    ['HGT4C33', 'VW Gol 1.0'], ['KLM5D21', 'Chevrolet Onix LT'], ['PQR1234', 'Hyundai HB20 Comfort'],
    ['JPA3F55', 'Jeep Renegade Sport'], ['RNT8G07', 'Renault Kwid Zen'], ['FRD6H90', 'Ford Ranger XLS'],
    ['NSK2J46', 'Nissan Kicks SV'], ['TRO9K12', 'Fiat Toro Volcano'], ['HLX4M88', 'Toyota Hilux SRV'],
];

async function removerExemplos(db: SQLite.SQLiteDatabase) {
    for (const [placa, modelo] of EXEMPLOS_ANTIGOS) {
        await db.runAsync('DELETE FROM VEICULO WHERE PLACA_VE = ? AND MODELO_VE = ?', placa, modelo);
    }
}

//----------------------------------------------------------------------------
// drop tabela (útil para recomeçar a demonstração)
async function dropTable(db: SQLite.SQLiteDatabase) {
    await db.execAsync('DROP TABLE IF EXISTS VEICULO');
    console.log('Tabela VEICULO excluida');
}

export {
    Banco, createTable, insertVeiculo, selectVeiculos, contarVeiculos, selectVeiculoById,
    updateVeiculo, deleteVeiculo, removerExemplos, dropTable
};
