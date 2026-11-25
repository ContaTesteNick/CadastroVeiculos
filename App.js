import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StatusBar as RNStatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {
  Banco, createTable, removerExemplos, selectVeiculos, contarVeiculos,
  insertVeiculo, updateVeiculo, deleteVeiculo, POR_PAGINA,
} from './Banco/Config';
import { validarVeiculo, isoParaBR, mascaraData, centavosParaBR, formatarKm, hojeISO } from './validacao';

const C = {
  texto: '#0F172A', suave: '#475569', borda: '#E2E8F0', bordaCampo: '#CBD5E1',
  azul: '#1D4ED8', azulEscuro: '#1E3A8A', azulClaro: '#EFF6FF', azulBadge: '#DBEAFE',
  laranja: '#9A3412', laranjaClaro: '#FFF7ED', laranjaBadge: '#FFEDD5', erro: '#B91C1C',
};
const TOPO = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) + 8 : 54;

const umAnoAtras = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return hojeISO(d); };

export default function App() {
  const [db, setDb] = useState(null);
  const [tela, setTela] = useState({ nome: 'lista' }); // { nome: 'lista' | 'form', veiculo? }

  useEffect(() => {
    (async () => {
      try {
        const banco = await Banco();
        await createTable(banco);
        await removerExemplos(banco);
        setDb(banco);
      } catch (e) {
        Alert.alert('Erro', 'Não foi possível abrir o banco de dados.\n' + e.message);
      }
    })();
  }, []);

  if (!db) return <View style={[s.tela, s.centro]}><ActivityIndicator size="large" color={C.azul} /></View>;

  return (
    <View style={s.tela}>
      <StatusBar style="dark" />
      {tela.nome === 'lista'
        ? <Lista db={db} abrir={(veiculo) => setTela({ nome: 'form', veiculo })} />
        : <Formulario db={db} veiculo={tela.veiculo} voltar={() => setTela({ nome: 'lista' })} />}
    </View>
  );
}

//----------------------------------------------------------------------------
// READ: listagem com resumo, filtro e paginação
function Lista({ db, abrir }) {
  const [filtro, setFiltro] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState([]);
  const [totais, setTotais] = useState({ todos: 0, emdia: 0, atrasada: 0 });

  const totalPaginas = Math.max(1, Math.ceil(totais[filtro] / POR_PAGINA));

  const carregar = useCallback(async () => {
    const t = await contarVeiculos(db);
    const ultima = Math.max(1, Math.ceil(t[filtro] / POR_PAGINA));
    const p = Math.min(pagina, ultima); // se a última página esvaziou após excluir, volta uma
    setTotais(t);
    if (p !== pagina) return setPagina(p);
    setItens(await selectVeiculos(db, filtro, p));
  }, [db, filtro, pagina]);

  useEffect(() => { carregar(); }, [carregar]);

  const corte = umAnoAtras();
  const hoje = hojeISO();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: TOPO, paddingBottom: 12 }}>
        <Text style={s.h1}>Meus veículos</Text>
        <Text style={s.sub}>{totais.todos} {totais.todos === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}</Text>
      </View>

      <View style={s.linhaResumo}>
        <View style={[s.resumo, { backgroundColor: C.azulClaro }]}>
          <Text style={{ fontSize: 13, color: C.azulEscuro }}>Revisão em dia</Text>
          <Text style={[s.resumoNum, { color: C.azulEscuro }]}>{totais.emdia}</Text>
        </View>
        <View style={[s.resumo, { backgroundColor: C.laranjaClaro }]}>
          <Text style={{ fontSize: 13, color: C.laranja }}>Revisão atrasada</Text>
          <Text style={[s.resumoNum, { color: C.laranja }]}>{totais.atrasada}</Text>
        </View>
      </View>

      <View style={s.chips}>
        {[['todos', 'Todos'], ['emdia', 'Em dia'], ['atrasada', 'Atrasada']].map(([valor, rotulo]) => {
          const ativo = filtro === valor;
          return (
            <Pressable key={valor} accessibilityRole="button" accessibilityState={{ selected: ativo }}
              onPress={() => { setFiltro(valor); setPagina(1); }}
              style={[s.chip, ativo && { backgroundColor: C.azul, borderColor: C.azul }]}>
              <Text style={[s.chipTxt, ativo && { color: '#fff' }]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 90 }}>
        {itens.length === 0 && <Text style={[s.sub, { textAlign: 'center', marginTop: 40 }]}>Nenhum veículo aqui. Toque em + para cadastrar.</Text>}
        {itens.map((v) => {
          const emDia = v.REVISAO_VE >= corte;
          const vencido = v.VENCIMENTO_VE < hoje;
          return (
            <Pressable key={v.ID_VE} onPress={() => abrir(v)} accessibilityRole="button"
              accessibilityLabel={`Editar ${v.MODELO_VE}, placa ${v.PLACA_VE}`}
              style={({ pressed }) => [s.card, pressed && { backgroundColor: '#F8FAFC' }]}>
              <View style={s.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modelo} numberOfLines={1}>{v.MODELO_VE}</Text>
                  <Text style={s.cardSub}>{v.ANO_VE} · {formatarKm(v.KM_VE)} km</Text>
                </View>
                <View style={s.placa}>
                  <View style={{ height: 7, backgroundColor: C.azul }} />
                  <Text style={s.placaTxt}>{v.PLACA_VE}</Text>
                </View>
              </View>
              <View style={s.cardLinha}>
                <Text style={s.cardSub}>IPVA R$ {centavosParaBR(v.VALOR_VE)}</Text>
                <Text style={[s.cardSub, vencido && { color: C.erro, fontWeight: '600' }]}>
                  {vencido ? 'Vencido' : 'Vence'} {isoParaBR(v.VENCIMENTO_VE)}
                </Text>
              </View>
              <View style={s.cardLinha}>
                <Text style={s.cardSub}>Última revisão {isoParaBR(v.REVISAO_VE)}</Text>
                <Text style={[s.badge, emDia
                  ? { color: C.azulEscuro, backgroundColor: C.azulBadge }
                  : { color: C.laranja, backgroundColor: C.laranjaBadge }]}>
                  {emDia ? 'Revisão em dia' : 'Revisão atrasada'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.paginacao}>
        <Pressable disabled={pagina <= 1} onPress={() => setPagina(pagina - 1)} accessibilityRole="button"
          style={[s.btnPag, pagina <= 1 ? s.btnPagOff : s.btnPagOn]}>
          <Text style={[s.btnPagTxt, { color: pagina <= 1 ? C.suave : '#fff' }]}>‹ Anterior</Text>
        </Pressable>
        <Text style={{ fontSize: 14, color: C.texto }}>Página {pagina} de {totalPaginas}</Text>
        <Pressable disabled={pagina >= totalPaginas} onPress={() => setPagina(pagina + 1)} accessibilityRole="button"
          style={[s.btnPag, pagina >= totalPaginas ? s.btnPagOff : s.btnPagOn]}>
          <Text style={[s.btnPagTxt, { color: pagina >= totalPaginas ? C.suave : '#fff' }]}>Próxima ›</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => abrir(null)} accessibilityRole="button" accessibilityLabel="Novo veículo" style={s.fab}>
        <Text style={{ color: '#fff', fontSize: 30, lineHeight: 32 }}>+</Text>
      </Pressable>
    </View>
  );
}

//----------------------------------------------------------------------------
// CREATE / UPDATE / DELETE: o mesmo formulário serve para novo e editar
function Formulario({ db, veiculo, voltar }) {
  const editando = !!veiculo;
  const [f, setF] = useState(editando ? {
    modelo: veiculo.MODELO_VE, placa: veiculo.PLACA_VE, ano: String(veiculo.ANO_VE),
    km: formatarKm(veiculo.KM_VE), revisao: isoParaBR(veiculo.REVISAO_VE),
    valor: centavosParaBR(veiculo.VALOR_VE), vencimento: isoParaBR(veiculo.VENCIMENTO_VE),
  } : { modelo: '', placa: '', ano: '', km: '', revisao: '', valor: '', vencimento: '' });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const mudar = (campo, valor) => {
    setF((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  async function salvar() {
    const r = validarVeiculo(f);
    setErros(r.erros);
    if (!r.dados) return;
    setSalvando(true);
    try {
      if (editando) await updateVeiculo(db, veiculo.ID_VE, r.dados);
      else await insertVeiculo(db, r.dados);
      voltar();
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) setErros({ placa: 'Já existe um veículo com esta placa.' });
      else Alert.alert('Erro ao salvar', e.message);
      setSalvando(false);
    }
  }

  function excluir() {
    const msg = `Excluir ${veiculo.MODELO_VE} (${veiculo.PLACA_VE})? Esta ação não pode ser desfeita.`;
    const confirmar = async () => {
      try { await deleteVeiculo(db, veiculo.ID_VE); voltar(); }
      catch (e) { Alert.alert('Erro ao excluir', e.message); }
    };
    // No navegador o Alert.alert ignora os botões, então usa o confirm nativo
    if (Platform.OS === 'web') return window.confirm(msg) && confirmar();
    Alert.alert('Excluir veículo', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: confirmar },
    ]);
  }

  const campo = (nome, rotulo, { flex, mascara, ...props } = {}, dica) => (
    <View style={{ gap: 6, flex }}>
      <Text style={s.label} nativeID={`lbl-${nome}`}>{rotulo}</Text>
      <TextInput value={f[nome]} onChangeText={(t) => mudar(nome, mascara ? mascara(t) : t)}
        accessibilityLabelledBy={`lbl-${nome}`} accessibilityLabel={rotulo}
        placeholderTextColor="#94A3B8" style={[s.input, erros[nome] && { borderColor: C.erro }]} {...props} />
      {erros[nome]
        ? <Text style={s.erro}>{erros[nome]}</Text>
        : dica ? <Text style={s.dica}>{dica}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.cabecalho, { paddingTop: TOPO }]}>
        <Pressable onPress={voltar} accessibilityRole="button" accessibilityLabel="Voltar" style={s.voltar}>
          <Text style={{ fontSize: 28, color: C.texto, lineHeight: 30 }}>‹</Text>
        </Pressable>
        <Text style={[s.h1, { fontSize: 22 }]}>{editando ? 'Editar veículo' : 'Novo veículo'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }} keyboardShouldPersistTaps="handled">
        {campo('modelo', 'Modelo', { placeholder: 'Ex.: Honda Civic EXL', maxLength: 60 })}
        {campo('placa', 'Placa', { placeholder: 'ABC1D23', autoCapitalize: 'characters', maxLength: 8, autoCorrect: false },
          'Padrão Mercosul (ABC1D23) ou antigo (ABC1234)')}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {campo('ano', 'Ano', { placeholder: '2024', keyboardType: 'number-pad', maxLength: 4, flex: 1 })}
          {campo('km', 'Quilometragem', { placeholder: '0', keyboardType: 'number-pad', maxLength: 9, flex: 1 })}
        </View>
        {campo('revisao', 'Data da última revisão', { placeholder: 'dd/mm/aaaa', keyboardType: 'number-pad', mascara: mascaraData, maxLength: 10 })}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {campo('valor', 'Valor do IPVA (R$)', { placeholder: '1.234,56', keyboardType: 'decimal-pad', maxLength: 16, flex: 1 })}
          {campo('vencimento', 'Vencimento', { placeholder: 'dd/mm/aaaa', keyboardType: 'number-pad', mascara: mascaraData, maxLength: 10, flex: 1 })}
        </View>

        <View style={{ gap: 10, marginTop: 16 }}>
          <Pressable onPress={salvar} disabled={salvando} accessibilityRole="button"
            style={[s.btnPrim, salvando && { opacity: 0.6 }]}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Salvar veículo'}
            </Text>
          </Pressable>
          {editando && (
            <Pressable onPress={excluir} accessibilityRole="button" style={[s.btnSec, { borderColor: '#FCA5A5' }]}>
              <Text style={{ color: C.erro, fontSize: 16, fontWeight: '600' }}>Excluir veículo</Text>
            </Pressable>
          )}
          <Pressable onPress={voltar} accessibilityRole="button" style={s.btnSec}>
            <Text style={{ color: C.texto, fontSize: 16, fontWeight: '600' }}>Cancelar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#fff' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 26, fontWeight: '700', color: C.texto },
  sub: { fontSize: 14, color: C.suave, marginTop: 2 },
  linhaResumo: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  resumo: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  resumoNum: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: C.bordaCampo, justifyContent: 'center' },
  chipTxt: { fontSize: 14, fontWeight: '600', color: C.texto },
  card: {
    borderWidth: 1.5, borderColor: '#BFDBFE', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, gap: 10, backgroundColor: '#fff',
    elevation: 2, shadowColor: C.azul, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.borda, paddingTop: 10 },
  modelo: { fontSize: 16, fontWeight: '600', color: C.texto },
  cardSub: { fontSize: 13, color: C.suave },
  placa: { borderWidth: 1.5, borderColor: C.texto, borderRadius: 6, overflow: 'hidden', width: 86 },
  placaTxt: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', paddingTop: 2, paddingBottom: 3, color: C.texto },
  badge: { fontSize: 12, fontWeight: '600', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, overflow: 'hidden' },
  paginacao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.borda, paddingTop: 10, paddingBottom: 24, paddingHorizontal: 20 },
  btnPag: { height: 44, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  btnPagOn: { backgroundColor: C.azul },
  btnPagOff: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.borda },
  btnPagTxt: { fontSize: 14, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 100, width: 56, height: 56, borderRadius: 28, backgroundColor: C.azul, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.azul, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingBottom: 8 },
  voltar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: C.texto },
  input: { height: 46, borderWidth: 1, borderColor: C.bordaCampo, borderRadius: 10, paddingHorizontal: 14, fontSize: 16, color: C.texto, backgroundColor: '#fff' },
  dica: { fontSize: 12, color: C.suave },
  erro: { fontSize: 12, color: C.erro, fontWeight: '500' },
  btnPrim: { height: 52, borderRadius: 12, backgroundColor: C.azul, alignItems: 'center', justifyContent: 'center' },
  btnSec: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.bordaCampo, alignItems: 'center', justifyContent: 'center' },
});
