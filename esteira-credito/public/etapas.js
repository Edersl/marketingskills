/* Definição da esteira de crédito imobiliário.
   Usado pelo servidor (validação) e pelo navegador (telas).
   Para mudar etapas, prazos ou checklists, edite só este arquivo. */
(function (root) {
  const BANCOS = ['Caixa', 'Banco do Brasil', 'Itaú', 'Bradesco', 'Santander', 'Cooperativa / outro'];

  const ETAPAS = [
    {
      k: 'cadastro', nome: 'Cadastro do cliente', resp: 'corretor', sla: 1,
      ajuda: 'O corretor preenche os dados do cliente e envia para análise. Quanto mais completo, mais rápido o crédito.',
      campos: [
        { k: 'nome', label: 'Nome completo do cliente', tipo: 'text', obrig: true },
        { k: 'cpf', label: 'CPF', tipo: 'cpf', obrig: true },
        { k: 'nascimento', label: 'Data de nascimento', tipo: 'date' },
        { k: 'estado_civil', label: 'Estado civil', tipo: 'select', opcoes: ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)'] },
        { k: 'telefone', label: 'WhatsApp', tipo: 'text', obrig: true },
        { k: 'email', label: 'E-mail', tipo: 'text' },
        { k: 'tipo_renda', label: 'Tipo de renda', tipo: 'select', opcoes: ['CLT', 'Autônomo', 'MEI', 'Servidor público', 'Aposentado / pensionista', 'Informal'], obrig: true },
        { k: 'renda_bruta', label: 'Renda bruta familiar (R$)', tipo: 'money', obrig: true },
        { k: 'fgts_3anos', label: 'Tem 3 anos de FGTS (somando empregos)?', tipo: 'select', opcoes: ['Sim', 'Não', 'Não sabe'] },
        { k: 'dependentes', label: 'Dependentes', tipo: 'number' },
        { k: 'segundo_proponente', label: 'Segundo proponente (cônjuge / composição de renda)', tipo: 'text' },
        { k: 'cpf_2', label: 'CPF do segundo proponente', tipo: 'cpf' },
        { k: 'modalidade', label: 'Modalidade pretendida', tipo: 'select', opcoes: ['MCMV Faixa 1', 'MCMV Faixa 2', 'MCMV Faixa 3', 'MCMV Faixa 4', 'SBPE', 'Pró-Cotista', 'Outra'] },
        { k: 'banco_pretendido', label: 'Instituição pretendida', tipo: 'select', opcoes: BANCOS },
        { k: 'imovel', label: 'Imóvel / empreendimento e unidade', tipo: 'text', obrig: true },
        { k: 'valor_imovel', label: 'Valor do imóvel (R$)', tipo: 'money', obrig: true },
        { k: 'obs_corretor', label: 'Observações do corretor', tipo: 'textarea' }
      ]
    },
    {
      k: 'cpf', nome: 'Consulta de CPF', resp: 'analista', sla: 1,
      ajuda: 'Consulte todos os proponentes antes de gastar tempo com o banco: Receita Federal (situação cadastral), o birô que a imobiliária assina (SPC, Serasa ou Boa Vista), protestos e o Registrato do Banco Central, que o próprio cliente emite. CPF com restrição volta para o corretor orientar a regularização.',
      checklist: [
        { k: 'receita', label: 'Receita Federal: situação cadastral regular' },
        { k: 'biros', label: 'SPC / Serasa / Boa Vista: sem restrição' },
        { k: 'protestos', label: 'Protestos em cartório: nada consta' },
        { k: 'scr', label: 'SCR / Registrato (Bacen): endividamento compatível' },
        { k: 'cadmut', label: 'Sem financiamento habitacional ativo (CADMUT)' },
        { k: 'proprietario', label: 'MCMV: não é proprietário de imóvel residencial' },
        { k: 'segundo', label: 'Segundo proponente também consultado (se houver)', opcional: true }
      ],
      campos: [
        { k: 'cpf_resultado', label: 'Resultado da consulta', tipo: 'select', opcoes: ['CPF bom', 'Pendência: precisa regularizar', 'Reprovado'], obrig: true },
        { k: 'restricoes', label: 'Restrições encontradas / orientação ao cliente', tipo: 'textarea' }
      ],
      gate: (d) => d.cpf_resultado === 'CPF bom' ? null : 'Só avança com o resultado "CPF bom". Com pendência, devolva ao corretor; reprovado, encerre o processo.'
    },
    {
      k: 'credito', nome: 'Análise de crédito no banco', resp: 'analista', sla: 5,
      ajuda: 'Registre exatamente o que o banco aprovou. Esses números alimentam o contrato de compra e venda e o espelho da proposta.',
      campos: [
        { k: 'instituicao', label: 'Instituição financeira', tipo: 'select', opcoes: BANCOS, obrig: true },
        { k: 'data_envio_credito', label: 'Data de envio da análise', tipo: 'date' },
        { k: 'protocolo_credito', label: 'Protocolo / nº da avaliação de risco', tipo: 'text' },
        { k: 'credito_resultado', label: 'Resultado', tipo: 'select', opcoes: ['Aguardando', 'Aprovado', 'Aprovado com condicionante', 'Reprovado'], obrig: true },
        { k: 'valor_financiamento', label: 'Valor de financiamento aprovado (R$)', tipo: 'money' },
        { k: 'subsidio', label: 'Subsídio aprovado (R$)', tipo: 'money' },
        { k: 'fgts_valor', label: 'FGTS a utilizar (R$)', tipo: 'money' },
        { k: 'prazo_meses', label: 'Prazo (meses)', tipo: 'number' },
        { k: 'taxa_juros', label: 'Taxa de juros (% a.a.)', tipo: 'text' },
        { k: 'amortizacao', label: 'Sistema de amortização', tipo: 'select', opcoes: ['SAC', 'PRICE'] },
        { k: 'parcela', label: 'Primeira parcela (R$)', tipo: 'money' },
        { k: 'validade_credito', label: 'Validade da aprovação', tipo: 'date' },
        { k: 'condicionantes', label: 'Condicionantes do banco', tipo: 'textarea' }
      ],
      gate: (d) => /^Aprovado/.test(d.credito_resultado || '') ? (d.valor_financiamento ? null : 'Informe o valor de financiamento aprovado.') : 'Só avança com crédito aprovado.'
    },
    {
      k: 'ccv', nome: 'Contrato de compra e venda', resp: 'analista', sla: 3,
      ajuda: 'A composição precisa fechar exatamente no valor de compra. O sistema confere a soma antes de deixar avançar.',
      campos: [
        { k: 'valor_compra', label: 'Valor de compra e venda (R$)', tipo: 'money', obrig: true },
        { k: 'sinal', label: 'Sinal / ato (R$)', tipo: 'money' },
        { k: 'entrada_propria', label: 'Entrada com recursos próprios (R$)', tipo: 'money' },
        { k: 'parcelamento_entrada', label: 'Parcelamento da entrada (ex.: 12x de R$ 300 com a construtora)', tipo: 'text' },
        { k: 'fgts_ccv', label: 'FGTS (R$)', tipo: 'money' },
        { k: 'subsidio_ccv', label: 'Subsídio (R$)', tipo: 'money' },
        { k: 'financiamento_ccv', label: 'Financiamento (R$)', tipo: 'money' },
        { k: 'desconto', label: 'Desconto / bônus da construtora (R$)', tipo: 'money' },
        { k: 'vendedor', label: 'Vendedor (nome ou razão social)', tipo: 'text', obrig: true },
        { k: 'vendedor_doc', label: 'CPF / CNPJ do vendedor', tipo: 'text' },
        { k: 'data_ccv', label: 'Data de assinatura do CCV', tipo: 'date' },
        { k: 'ccv_assinado', label: 'CCV assinado por comprador e vendedor', tipo: 'check', obrig: true }
      ],
      gate: (d) => {
        const n = (x) => Number(x) || 0;
        const soma = n(d.sinal) + n(d.entrada_propria) + n(d.fgts_ccv) + n(d.subsidio_ccv) + n(d.financiamento_ccv) + n(d.desconto);
        if (Math.abs(soma - n(d.valor_compra)) > 1) return 'A composição (sinal + entrada + FGTS + subsídio + financiamento + desconto) soma ' + soma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + ' e precisa ser igual ao valor de compra.';
        if (n(d.financiamento_ccv) > n(d.valor_financiamento) + 1) return 'O financiamento no CCV é maior que o aprovado pelo banco.';
        if (n(d.subsidio_ccv) > n(d.subsidio) + 1) return 'O subsídio no CCV é maior que o aprovado pelo banco.';
        return null;
      }
    },
    {
      k: 'documentos', nome: 'Documentação e pasta', resp: 'analista', sla: 7,
      ajuda: 'Anexe cada documento no item correspondente. Matrícula e certidões têm validade curta: confira as datas antes de enviar.',
      checklist: [
        { k: 'rg', label: 'Proponente: RG ou CNH', doc: true },
        { k: 'cpf_doc', label: 'Proponente: CPF', doc: true },
        { k: 'certidao_civil', label: 'Certidão de nascimento ou casamento (com averbações)', doc: true },
        { k: 'residencia', label: 'Comprovante de residência atualizado', doc: true },
        { k: 'renda', label: 'Comprovante de renda (holerites, extratos, DECORE ou IR)', doc: true },
        { k: 'ctps', label: 'Carteira de trabalho (CLT)', doc: true, opcional: true },
        { k: 'fgts_extrato', label: 'Extrato do FGTS (se for usar)', doc: true, opcional: true },
        { k: 'ir', label: 'Declaração de Imposto de Renda (se declara)', doc: true, opcional: true },
        { k: 'formularios', label: 'Formulários da instituição assinados', doc: true },
        { k: 'matricula', label: 'Imóvel: matrícula atualizada (até 30 dias)', doc: true },
        { k: 'certidoes_vendedor', label: 'Certidões do vendedor (PF ou PJ)', doc: true },
        { k: 'iptu', label: 'IPTU / certidão negativa de débitos municipais', doc: true },
        { k: 'habitese', label: 'Habite-se ou documento da unidade (imóvel novo)', doc: true, opcional: true }
      ]
    },
    {
      k: 'proposta', nome: 'Envio da pasta ao banco', resp: 'analista', sla: 2,
      campos: [
        { k: 'data_envio_pasta', label: 'Data de envio', tipo: 'date', obrig: true },
        { k: 'protocolo_pasta', label: 'Protocolo', tipo: 'text' },
        { k: 'pendencias_pasta', label: 'Pendências apontadas pelo banco', tipo: 'textarea' }
      ]
    },
    {
      k: 'avaliacao', nome: 'Avaliação de engenharia', resp: 'analista', sla: 10,
      ajuda: 'Se o laudo vier abaixo do valor de compra, o financiamento pode ser limitado pelo valor avaliado e a entrada do cliente aumenta. Avise o corretor na hora.',
      campos: [
        { k: 'data_solicitacao_aval', label: 'Data da solicitação', tipo: 'date', obrig: true },
        { k: 'taxa_aval_paga', label: 'Taxa de avaliação paga', tipo: 'check' },
        { k: 'data_vistoria', label: 'Data da vistoria do engenheiro', tipo: 'date' },
        { k: 'valor_avaliado', label: 'Valor de avaliação do laudo (R$)', tipo: 'money', obrig: true },
        { k: 'laudo_recebido', label: 'Laudo recebido', tipo: 'check', obrig: true },
        { k: 'obs_laudo', label: 'Observações do laudo', tipo: 'textarea' }
      ]
    },
    {
      k: 'espelho', nome: 'Espelho da proposta', resp: 'analista', sla: 2,
      ajuda: 'Confira o espelho do banco contra o CCV e o laudo antes de mandar para a conformidade. Divergência aqui vira exigência depois.',
      painel: 'espelho',
      campos: [
        { k: 'espelho_gerado', label: 'Espelho gerado no sistema do banco, vinculado ao imóvel', tipo: 'check', obrig: true },
        { k: 'valores_conferem', label: 'Valores conferem com CCV, crédito e laudo', tipo: 'check', obrig: true },
        { k: 'cliente_ciente', label: 'Cliente ciente dos valores e da parcela', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'conformidade', nome: 'Conformidade', resp: 'analista', sla: 7,
      campos: [
        { k: 'data_envio_conf', label: 'Data de envio para conformidade', tipo: 'date', obrig: true },
        { k: 'pendencias_conf', label: 'Pendências da conformidade', tipo: 'textarea' },
        { k: 'conformidade_ok', label: 'Conformidade aprovada', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'contrato', nome: 'Contrato do banco e assinatura', resp: 'analista', sla: 7,
      campos: [
        { k: 'contrato_emitido', label: 'Contrato emitido pelo banco', tipo: 'check', obrig: true },
        { k: 'data_assinatura', label: 'Data da assinatura', tipo: 'date', obrig: true },
        { k: 'local_assinatura', label: 'Agência / local', tipo: 'text' },
        { k: 'assinado_todos', label: 'Assinado por todas as partes', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'itbi', nome: 'ITBI', resp: 'analista', sla: 5,
      campos: [
        { k: 'guia_itbi', label: 'Guia de ITBI emitida', tipo: 'check', obrig: true },
        { k: 'valor_itbi', label: 'Valor do ITBI (R$)', tipo: 'money' },
        { k: 'data_pag_itbi', label: 'Data de pagamento', tipo: 'date' },
        { k: 'itbi_pago', label: 'ITBI pago e comprovante anexado', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'cartorio', nome: 'Registro em cartório', resp: 'analista', sla: 30,
      ajuda: 'Acompanhe as exigências do cartório de perto: cada exigência reinicia o prazo de análise.',
      campos: [
        { k: 'cartorio_nome', label: 'Cartório de registro de imóveis', tipo: 'text', obrig: true },
        { k: 'data_entrada_cart', label: 'Data de entrada', tipo: 'date', obrig: true },
        { k: 'protocolo_cart', label: 'Protocolo / prenotação', tipo: 'text' },
        { k: 'exigencias_cart', label: 'Exigências do cartório', tipo: 'textarea' },
        { k: 'matricula_reg', label: 'Matrícula com o registro (nº / R.)', tipo: 'text' },
        { k: 'registrado', label: 'Contrato registrado', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'liberacao', nome: 'Retorno ao banco e liberação', resp: 'analista', sla: 7,
      ajuda: 'O contrato registrado volta ao banco para liberar o dinheiro ao vendedor. Sem esta etapa o vendedor não recebe.',
      campos: [
        { k: 'data_entrega_banco', label: 'Data de entrega do contrato registrado ao banco', tipo: 'date', obrig: true },
        { k: 'data_liberacao', label: 'Data da liberação dos recursos', tipo: 'date' },
        { k: 'recurso_liberado', label: 'Recurso liberado ao vendedor', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'prefeitura', nome: 'Averbação na prefeitura', resp: 'analista', sla: 15,
      campos: [
        { k: 'protocolo_pref', label: 'Protocolo na prefeitura', tipo: 'text' },
        { k: 'data_pedido_pref', label: 'Data do pedido', tipo: 'date', obrig: true },
        { k: 'averbado', label: 'Averbação / transferência do IPTU concluída', tipo: 'check', obrig: true }
      ]
    },
    {
      k: 'concluido', nome: 'Concluído', resp: 'analista', sla: 0,
      campos: [
        { k: 'data_chaves', label: 'Data da entrega das chaves', tipo: 'date' },
        { k: 'obs_final', label: 'Observações finais', tipo: 'textarea' }
      ]
    }
  ];

  function cpfValido(v) {
    const c = String(v || '').replace(/\D/g, '');
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    let s = 0; for (let i = 0; i < 9; i++) s += +c[i] * (10 - i);
    let d = (s * 10) % 11 % 10; if (d !== +c[9]) return false;
    s = 0; for (let i = 0; i < 10; i++) s += +c[i] * (11 - i);
    d = (s * 10) % 11 % 10; return d === +c[10];
  }

  /* Retorna a lista de motivos que impedem avançar da etapa atual (vazia = pode avançar). */
  function bloqueios(etapa, dados, checks) {
    const out = [];
    (etapa.campos || []).forEach((c) => {
      if (!c.obrig) return;
      const v = dados[c.k];
      if (c.tipo === 'check' ? !v : (v === undefined || v === null || v === '')) out.push('Preencha: ' + c.label);
      if (c.tipo === 'cpf' && v && !cpfValido(v)) out.push('CPF inválido: ' + c.label);
    });
    (etapa.checklist || []).forEach((it) => { if (!it.opcional && !(checks && checks[it.k])) out.push('Falta: ' + it.label); });
    if (!out.length && etapa.gate) { const g = etapa.gate(dados); if (g) out.push(g); }
    return out;
  }

  const api = { ETAPAS, BANCOS, cpfValido, bloqueios };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ESTEIRA = api;
})(this);
