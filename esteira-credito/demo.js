/* Carrega processos FICTÍCIOS para demonstração em reuniões. Nenhum dado real. */
'use strict';
module.exports = function carregarDemo(db, ETAPAS, gestor) {
  const crypto = require('crypto');
  const sal = () => crypto.randomBytes(16).toString('hex');
  function usuario(nome, login, papel) {
    let u = db.usuarios.find((x) => x.usuario === login);
    if (!u) { const s = sal(); u = { id: 'u' + db.seq++, nome, usuario: login, papel, sal: s, hash: crypto.scryptSync('demo123', s, 32).toString('hex'), ativo: true }; db.usuarios.push(u); }
    return u;
  }
  const corretores = [usuario('Carla Mendes (demo)', 'carla', 'corretor'), usuario('Diego Rocha (demo)', 'diego', 'corretor')];
  const analista = usuario('Ana Paula (demo)', 'ana', 'analista');
  const dia = 864e5, now = Date.now();
  const base = (nome, cpf, renda, tipo, valor, imovel, modal) => ({ nome, cpf, telefone: '(67) 9 0000-0000', tipo_renda: tipo, renda_bruta: renda, fgts_3anos: tipo === 'CLT' ? 'Sim' : 'Não',
    valor_imovel: valor, imovel, modalidade: modal, banco_pretendido: 'Caixa', estado_civil: 'Solteiro(a)' });
  // CPFs abaixo são números de teste válidos no algoritmo, gerados para demonstração.
  const casos = [
    ['Patrícia Almeida', '529.982.247-25', 4200, 'CLT', 230000, 'Res. Jardim Seminário · Bl. 3 Ap. 204', 'MCMV Faixa 2', 'cpf', 0.3],
    ['Rogério Lima', '111.444.777-35', 3800, 'Autônomo', 215000, 'Res. Nova Lima · Casa 18', 'MCMV Faixa 2', 'credito', 3],
    ['Simone Ferreira', '935.411.347-80', 6100, 'CLT', 280000, 'Cond. Vila Nasser · Ap. 102', 'MCMV Faixa 3', 'ccv', 1],
    ['André Costa', '390.533.447-05', 2900, 'MEI', 198000, 'Res. Nova Lima · Casa 07', 'MCMV Faixa 1', 'documentos', 9],
    ['Kelly Rodrigues', '153.509.460-56', 9800, 'CLT', 395000, 'Torre Parque dos Poderes · 1503', 'MCMV Faixa 4', 'avaliacao', 4],
    ['Wagner Pires', '867.261.590-56', 4700, 'CLT', 236000, 'Res. Jardim Seminário · Bl. 1 Ap. 008', 'MCMV Faixa 2', 'conformidade', 2],
    ['Luana Martins', '248.438.034-80', 5300, 'Servidor público', 262000, 'Cond. Vila Nasser · Ap. 305', 'MCMV Faixa 3', 'cartorio', 12],
    ['Edson Vieira', '714.602.380-01', 4100, 'CLT', 228000, 'Res. Jardim Seminário · Bl. 2 Ap. 101', 'MCMV Faixa 2', 'prefeitura', 3]
  ];
  casos.forEach((c, i) => {
    const [nome, cpf, renda, tipo, valor, imovel, modal, etapa, diasNaEtapa] = c;
    const d = base(nome, cpf, renda, tipo, valor, imovel, modal);
    const idx = ETAPAS.findIndex((e) => e.k === etapa);
    const fin = Math.round(valor * 0.72), sub = modal.includes('Faixa 1') || modal.includes('Faixa 2') ? 25000 : 0, fg = tipo === 'CLT' ? 8000 : 0;
    if (idx > 1) Object.assign(d, { cpf_resultado: 'CPF bom' });
    if (idx > 2) Object.assign(d, { instituicao: 'Caixa', credito_resultado: 'Aprovado', valor_financiamento: fin, subsidio: sub, fgts_valor: fg, prazo_meses: 420, taxa_juros: '5,5', amortizacao: 'PRICE', parcela: Math.round(renda * 0.27) });
    if (idx > 3) Object.assign(d, { valor_compra: valor, sinal: 2000, entrada_propria: valor - fin - sub - fg - 2000, fgts_ccv: fg, subsidio_ccv: sub, financiamento_ccv: fin, desconto: 0, vendedor: 'Construtora Exemplo Ltda (demo)', ccv_assinado: true });
    if (idx > 6) Object.assign(d, { valor_avaliado: valor + 5000, laudo_recebido: true });
    const checks = {};
    ETAPAS.slice(0, idx).forEach((e) => (e.checklist || []).forEach((it) => { checks[it.k] = true; }));
    const cor = corretores[i % 2];
    const criado = new Date(now - (idx * 4 + diasNaEtapa) * dia).toISOString();
    db.processos.push({ id: 'p' + db.seq++, codigo: 'DEMO-' + String(i + 1).padStart(3, '0'), dados: d, checks, arquivos: [], comentarios: [],
      historico: [{ em: criado, por: cor.nome, texto: 'Processo criado (demonstração)', tipo: 'info' }],
      etapa, status: 'ativo', criadoEm: criado, desdeEtapa: new Date(now - diasNaEtapa * dia).toISOString(), corretorId: cor.id, corretorNome: cor.nome,
      responsavelNome: analista.nome, alerta: null });
  });
  db.eventos.push({ id: db.seq++, em: new Date().toISOString(), tipo: 'info', texto: 'Dados de demonstração carregados', para: [gestor.id] });
};
