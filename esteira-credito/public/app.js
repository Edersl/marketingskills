/* Esteira de Crédito — interface do navegador (sem bibliotecas). */
(function () {
  'use strict';
  const { ETAPAS, bloqueios, cpfValido } = window.ESTEIRA;
  const S = { me: null, config: {}, processos: [], view: 'quadro', pid: null, proc: null, vendo: null, ultimoEvento: 0, naoLidos: [], filtro: '', filtroStatus: 'ativos', usuarios: [] };
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (v) => (v === '' || v == null || isNaN(Number(v))) ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataBR = (iso) => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('pt-BR') : '—';
  const dataHora = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  const DIA = 864e5;
  const papelNome = { corretor: 'Corretor', analista: 'Analista de crédito', gestor: 'Gestor' };
  const ehEquipe = () => S.me && S.me.papel !== 'corretor';

  async function api(metodo, url, corpo) {
    const r = await fetch(url, { method: metodo, headers: corpo ? { 'Content-Type': 'application/json' } : {}, body: corpo ? JSON.stringify(corpo) : undefined, credentials: 'same-origin' });
    let j = {}; try { j = await r.json(); } catch (e) { /* sem corpo */ }
    if (!r.ok) { const err = new Error(j.erro || 'Não foi possível concluir. Tente de novo.'); err.dados = j; err.status = r.status; throw err; }
    return j;
  }
  function toast(html) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 6000); }
  function parseMoney(s) { if (s === '' || s == null) return ''; const n = Number(String(s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isNaN(n) ? '' : n; }
  function maskCPF(v) { const d = String(v || '').replace(/\D/g, '').slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }
  function prazo(p) {
    const dias = Math.floor((Date.now() - new Date(p.desdeEtapa).getTime()) / DIA);
    if (p.status === 'concluido') return { dias, cls: 'ok', txt: 'concluído' };
    if (p.status === 'encerrado') return { dias, cls: '', txt: 'encerrado' };
    if (p.status === 'pendencia') return { dias, cls: 'atencao', txt: 'pendência · ' + dias + 'd' };
    if (!p.sla) return { dias, cls: 'ok', txt: dias + 'd' };
    const cls = dias > p.sla ? 'atrasado' : dias >= Math.max(1, Math.ceil(p.sla * 0.8)) ? 'atencao' : 'ok';
    return { dias, cls, txt: dias + ' de ' + p.sla + ' dias' };
  }

  /* ---------------- entrada ---------------- */
  async function iniciar() {
    try {
      const e = await api('GET', '/api/estado');
      S.config = e.config || {};
      if (!e.configurado) return telaSetup();
      if (!e.usuario) return telaLogin();
      S.me = e.usuario; await carregar(); render(); vigiar();
    } catch (err) { $('#app').innerHTML = '<p class="carregando">Não consegui falar com o servidor. Confira se o programa está aberto no PC principal.</p>'; }
  }
  function telaSetup() {
    $('#app').innerHTML = `<div class="entrada"><form class="caixa" id="fSetup"><h1>Configurar a esteira</h1><p class="sub">Primeiro acesso. Crie o usuário do gestor; depois ele cadastra corretores e analistas.</p>
      <div class="form"><label>Nome da imobiliária<input id="s_imob" required></label><label>Cidade<input id="s_cid"></label>
      <label>Seu nome<input id="s_nome" required></label><label>Usuário de acesso<input id="s_user" required autocomplete="username"></label>
      <label>Senha (mínimo 6)<input id="s_senha" type="password" required minlength="6" autocomplete="new-password"></label></div>
      <p class="erro" id="sErro"></p><div class="acoes"><button class="btn prim" type="submit">Criar e entrar</button></div></form></div>`;
    $('#fSetup').onsubmit = async (ev) => {
      ev.preventDefault();
      try { const r = await api('POST', '/api/setup', { imobiliaria: $('#s_imob').value, cidade: $('#s_cid').value, nome: $('#s_nome').value, usuario: $('#s_user').value, senha: $('#s_senha').value });
        S.me = r.usuario; S.config = { imobiliaria: $('#s_imob').value, cidade: $('#s_cid').value }; await carregar(); render(); vigiar(); }
      catch (e) { $('#sErro').textContent = e.message; }
    };
  }
  function telaLogin() {
    $('#app').innerHTML = `<div class="entrada"><form class="caixa" id="fLogin"><h1>${esc(S.config.imobiliaria || 'Esteira de Crédito')}</h1><p class="sub">Esteira de crédito imobiliário. Entre com o seu usuário.</p>
      <div class="form"><label>Usuário<input id="l_user" required autocomplete="username"></label><label>Senha<input id="l_senha" type="password" required autocomplete="current-password"></label></div>
      <p class="erro" id="lErro"></p><div class="acoes"><button class="btn prim" type="submit">Entrar</button></div></form></div>`;
    $('#l_user').focus();
    $('#fLogin').onsubmit = async (ev) => {
      ev.preventDefault();
      try { const r = await api('POST', '/api/login', { usuario: $('#l_user').value, senha: $('#l_senha').value }); S.me = r.usuario; await carregar(); render(); vigiar(); }
      catch (e) { $('#lErro').textContent = e.message; }
    };
  }

  async function carregar() { S.processos = await api('GET', '/api/processos'); }
  async function abrirProcesso(id) { S.pid = id; S.proc = await api('GET', '/api/processos/' + id); S.vendo = S.proc.etapa; S.view = 'processo'; render(); window.scrollTo(0, 0); }

  /* ---------------- moldura ---------------- */
  function render() {
    const itens = [['quadro', 'Quadro da esteira'], ['lista', 'Todos os processos'], ['painel', 'Painel do gestor']];
    if (S.me.papel === 'gestor') itens.push(['equipe', 'Equipe e configuração']);
    $('#app').innerHTML = `<div class="shell">
      <header class="topo"><div class="marca"><b>${esc(S.config.imobiliaria || 'Esteira de Crédito')}</b><span>Esteira de crédito imobiliário${S.config.cidade ? ' · ' + esc(S.config.cidade) : ''}</span></div>
        <button class="sino" id="bSino" type="button" title="Avisos">Avisos${S.naoLidos.length ? '<i>' + S.naoLidos.length + '</i>' : ''}</button>
        <span class="eu">${esc(S.me.nome)} · ${papelNome[S.me.papel]}</span><button class="sino" id="bSair" type="button">Sair</button></header>
      <nav class="menu"><button class="novo" data-v="novo" type="button">+ Novo cliente</button>${itens.map(([v, t]) => `<button type="button" data-v="${v}" class="${S.view === v ? 'ativo' : ''}">${t}</button>`).join('')}
        <div class="sep"></div><button type="button" data-v="senha">Trocar minha senha</button></nav>
      <main class="area" id="area"></main></div>`;
    document.querySelectorAll('.menu [data-v]').forEach((b) => b.onclick = () => { S.view = b.dataset.v; render(); });
    $('#bSair').onclick = async () => { await api('POST', '/api/logout'); location.reload(); };
    $('#bSino').onclick = mostrarAvisos;
    ({ quadro: vQuadro, lista: vLista, painel: vPainel, equipe: vEquipe, novo: vNovo, processo: vProcesso, senha: vSenha }[S.view] || vQuadro)();
  }
  function mostrarAvisos() {
    const l = S.naoLidos.slice().reverse();
    modal(`<h2 style="margin-top:0">Avisos</h2>${l.length ? '<ul class="historico">' + l.map((e) => `<li>${esc(e.texto)}<small>${dataHora(e.em)}${e.pid ? ` · <a href="#" data-pid="${e.pid}">abrir</a>` : ''}</small></li>`).join('') + '</ul>' : '<p class="sub">Nenhum aviso novo.</p>'}
      <div class="acoes"><button class="btn" data-fechar type="button">Fechar</button></div>`, (j) => {
      j.querySelectorAll('[data-pid]').forEach((a) => a.onclick = (ev) => { ev.preventDefault(); fecharModal(); abrirProcesso(a.dataset.pid); });
    });
    S.naoLidos = []; const i = $('#bSino i'); if (i) i.remove();
  }
  function modal(html, depois) {
    $('#modal').innerHTML = `<div class="fundo"><div class="janela" role="dialog" aria-modal="true">${html}</div></div>`;
    const j = $('#modal .janela'); j.querySelectorAll('[data-fechar]').forEach((b) => b.onclick = fecharModal);
    $('#modal .fundo').onclick = (ev) => { if (ev.target.classList.contains('fundo')) fecharModal(); };
    if (depois) depois(j);
  }
  function fecharModal() { $('#modal').innerHTML = ''; }

  /* ---------------- quadro ---------------- */
  function filtrados() {
    const q = S.filtro.trim().toLowerCase();
    return S.processos.filter((p) => {
      if (S.filtroStatus === 'ativos' && !(p.status === 'ativo' || p.status === 'pendencia')) return false;
      if (S.filtroStatus === 'encerrados' && !(p.status === 'encerrado' || p.status === 'concluido')) return false;
      return !q || [p.nome, p.cpf, p.imovel, p.codigo, p.corretor].join(' ').toLowerCase().includes(q);
    });
  }
  function barraFiltros() {
    return `<div class="filtros"><input id="fBusca" type="search" placeholder="Buscar nome, CPF, imóvel, código" value="${esc(S.filtro)}">
      <select id="fStatus"><option value="ativos">Em andamento</option><option value="encerrados">Concluídos e encerrados</option><option value="todos">Todos</option></select></div>`;
  }
  function ligarFiltros(rerender) {
    $('#fStatus').value = S.filtroStatus;
    $('#fBusca').oninput = (e) => { S.filtro = e.target.value; rerender(true); };
    $('#fStatus').onchange = (e) => { S.filtroStatus = e.target.value; rerender(); };
  }
  function vQuadro(soConteudo) {
    const ps = filtrados();
    const cols = ETAPAS.slice(1).map((e) => {
      const it = ps.filter((p) => p.etapa === e.k);
      return `<section class="coluna"><h2>${esc(e.nome)}<b>${it.length}</b></h2>${it.map(cartao).join('') || '<span class="opc" style="padding:6px">Vazio</span>'}</section>`;
    }).join('');
    if (soConteudo === true) { $('#quadroArea').innerHTML = `<div class="quadro">${cols}</div>`; ligarCartoes(); return; }
    $('#area').innerHTML = `<div class="cabeca"><div><h1>Quadro da esteira</h1><p class="sub">Cada coluna é uma etapa do financiamento. A faixa lateral do cartão mostra o prazo: laranja perto de vencer, vermelho atrasado.</p></div>${barraFiltros()}</div><div id="quadroArea"><div class="quadro">${cols}</div></div>`;
    ligarFiltros(vQuadro); ligarCartoes();
  }
  function cartao(p) {
    const z = prazo(p);
    return `<button class="cartao ${z.cls === 'atencao' || z.cls === 'atrasado' ? z.cls : ''}" data-id="${p.id}" type="button">
      <span class="nome">${esc(p.nome)}</span><span class="info">${esc(p.imovel || '')}</span>
      <span class="info">${esc(p.instituicao || '—')} · ${brl(p.valor)}</span>
      <span><span class="pilula ${z.cls}">${esc(z.txt)}</span>${p.alerta ? ' <span class="pilula bad" title="' + esc(p.alerta) + '">alerta</span>' : ''}</span>
      <span class="info">Corretor: ${esc(p.corretor || '—')}</span></button>`;
  }
  function ligarCartoes() { document.querySelectorAll('.cartao').forEach((b) => b.onclick = () => abrirProcesso(b.dataset.id)); }

  /* ---------------- lista ---------------- */
  function vLista(soConteudo) {
    const ps = filtrados().sort((a, b) => prazo(b).dias - prazo(a).dias);
    const corpo = `<div class="tabela"><table><thead><tr><th>Código</th><th>Cliente</th><th>CPF</th><th>Etapa</th><th>Prazo</th><th>Banco</th><th class="num">Valor</th><th>Corretor</th></tr></thead><tbody>
      ${ps.map((p) => { const z = prazo(p); return `<tr class="clicavel" data-id="${p.id}"><td>${esc(p.codigo)}</td><td><b>${esc(p.nome)}</b></td><td>${esc(p.cpf)}</td><td>${esc(p.etapaNome)}</td><td><span class="pilula ${z.cls}">${esc(z.txt)}</span></td><td>${esc(p.instituicao || '—')}</td><td class="num">${brl(p.valor)}</td><td>${esc(p.corretor)}</td></tr>`; }).join('') || '<tr><td colspan="8">Nenhum processo encontrado.</td></tr>'}
      </tbody></table></div>`;
    if (soConteudo === true) { $('#listaArea').innerHTML = corpo; } else {
      $('#area').innerHTML = `<div class="cabeca"><div><h1>Todos os processos</h1><p class="sub">Ordenados pelo tempo parado na etapa atual.</p></div>${barraFiltros()}</div><div id="listaArea">${corpo}</div>`;
      ligarFiltros(vLista);
    }
    document.querySelectorAll('tr[data-id]').forEach((r) => r.onclick = () => abrirProcesso(r.dataset.id));
  }

  /* ---------------- formulário genérico ---------------- */
  function campoHTML(c, v, ro) {
    const id = 'c_' + c.k, cls = c.obrig ? 'obrig' : '', dis = ro ? ' disabled' : '';
    if (c.tipo === 'check') return `<label class="chk largo"><input type="checkbox" id="${id}" data-k="${c.k}" data-t="check" ${v ? 'checked' : ''}${dis}> <span class="${cls}">${esc(c.label)}</span></label>`;
    let inp;
    if (c.tipo === 'select') inp = `<select id="${id}" data-k="${c.k}" data-t="select"${dis}><option value="">Selecione</option>${c.opcoes.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else if (c.tipo === 'textarea') inp = `<textarea id="${id}" data-k="${c.k}" data-t="text"${dis}>${esc(v)}</textarea>`;
    else if (c.tipo === 'money') inp = `<input id="${id}" data-k="${c.k}" data-t="money" inputmode="decimal" value="${v === '' || v == null ? '' : esc(Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}"${dis}>`;
    else if (c.tipo === 'number') inp = `<input id="${id}" data-k="${c.k}" data-t="number" type="number" min="0" value="${esc(v)}"${dis}>`;
    else if (c.tipo === 'date') inp = `<input id="${id}" data-k="${c.k}" data-t="text" type="date" value="${esc(v)}"${dis}>`;
    else if (c.tipo === 'cpf') inp = `<input id="${id}" data-k="${c.k}" data-t="cpf" inputmode="numeric" value="${esc(v)}" placeholder="000.000.000-00"${dis}>`;
    else inp = `<input id="${id}" data-k="${c.k}" data-t="text" value="${esc(v)}"${dis}>`;
    const largo = c.tipo === 'textarea' || /imovel|nome$|segundo_proponente|parcelamento|cartorio_nome|vendedor$/.test(c.k) ? 'largo' : '';
    return `<label class="${largo}"><span class="${cls}">${esc(c.label)}</span>${inp}</label>`;
  }
  function lerCampos(raiz) {
    const out = {};
    raiz.querySelectorAll('[data-k]').forEach((el) => {
      const t = el.dataset.t;
      out[el.dataset.k] = t === 'check' ? el.checked : t === 'money' ? parseMoney(el.value) : t === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value.trim();
    });
    return out;
  }
  function ligarMascaras(raiz) {
    raiz.querySelectorAll('[data-t="cpf"]').forEach((el) => el.addEventListener('input', () => { el.value = maskCPF(el.value); el.style.borderColor = el.value.length === 14 && !cpfValido(el.value) ? 'var(--bad)' : ''; }));
    raiz.querySelectorAll('[data-t="money"]').forEach((el) => el.addEventListener('blur', () => { const n = parseMoney(el.value); if (n !== '') el.value = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }));
  }

  /* ---------------- novo cliente ---------------- */
  function vNovo() {
    const e = ETAPAS[0];
    $('#area').innerHTML = `<h1>Novo cliente para análise</h1><p class="sub">${esc(e.ajuda)} Ao enviar, a equipe de crédito recebe o aviso na hora em todos os PCs.</p>
      <form class="bloco" id="fNovo"><div class="form">${e.campos.map((c) => campoHTML(c, '')).join('')}</div>
      <div id="nErro"></div><div class="acoes"><button class="btn prim" type="submit">Enviar para análise de CPF</button></div></form>`;
    ligarMascaras($('#fNovo'));
    $('#fNovo').onsubmit = async (ev) => {
      ev.preventDefault();
      const dados = lerCampos($('#fNovo'));
      const falta = bloqueios(e, dados, {});
      if (falta.length) { $('#nErro').innerHTML = `<div class="bloqueios">Antes de enviar:<ul>${falta.map((f) => '<li>' + esc(f) + '</li>').join('')}</ul></div>`; return; }
      try { const r = await api('POST', '/api/processos', { dados }); toast('<b>Enviado.</b> ' + esc(dados.nome) + ' está na análise de CPF.'); await carregar(); abrirProcesso(r.id); }
      catch (err) { $('#nErro').innerHTML = `<div class="bloqueios">${esc(err.message)}</div>`; }
    };
  }

  /* ---------------- processo ---------------- */
  function vProcesso() {
    const p = S.proc; if (!p) { S.view = 'quadro'; return render(); }
    const iAtual = ETAPAS.findIndex((e) => e.k === p.etapa);
    const iVendo = ETAPAS.findIndex((e) => e.k === S.vendo);
    const e = ETAPAS[iVendo];
    const z = prazo(Object.assign({}, p, { sla: ETAPAS[iAtual].sla }));
    const ehAtual = iVendo === iAtual;
    const podeEditar = ehEquipe() ? p.status !== 'encerrado' : (e.k === 'cadastro' && (iAtual <= 1 || p.status === 'pendencia'));
    const d = p.dados;
    const statusTxt = { ativo: 'Em andamento', pendencia: 'Pendência com o corretor', encerrado: 'Encerrado', concluido: 'Concluído' }[p.status];
    $('#area').innerHTML = `
      <div class="cabeca"><div><span class="opc">${esc(p.codigo)} · ${statusTxt}</span><h1>${esc(d.nome)}</h1></div>
        <div class="filtros"><button class="btn" id="bVoltar" type="button">Voltar ao quadro</button>${iAtual >= 3 ? '<button class="btn" id="bResumo" type="button">Imprimir quadro-resumo</button>' : ''}<button class="btn" id="bPasta" type="button">Imprimir checklist da pasta</button></div></div>
      ${p.alerta ? `<div class="alerta">${esc(p.alerta)}</div>` : ''}
      <div class="resumo"><div><span>CPF</span><b>${esc(d.cpf)}</b></div><div><span>Imóvel</span><b title="${esc(d.imovel)}">${esc(d.imovel)}</b></div>
        <div><span>Valor</span><b>${brl(d.valor_compra || d.valor_imovel)}</b></div><div><span>Etapa atual · prazo</span><b><span class="pilula ${z.cls}">${esc(ETAPAS[iAtual].nome)} · ${esc(z.txt)}</span></b></div></div>
      <div class="proc">
        <ol class="trilha">${ETAPAS.map((x, i) => `<li data-k="${x.k}" class="${i < iAtual ? 'feito' : i === iAtual ? 'atual' : ''} ${x.k === S.vendo ? 'vendo' : ''}"><span class="bola">${i < iAtual ? '✓' : i + 1}</span><span class="t">${esc(x.nome)}</span></li>`).join('')}</ol>
        <div>
          <section class="bloco" id="etapaBox"><h2>${esc(e.nome)}${ehAtual ? ' · etapa atual' : iVendo < iAtual ? ' · concluída' : ' · ainda não iniciada'}</h2>
            ${e.ajuda ? `<p class="ajuda">${esc(e.ajuda)}</p>` : ''}
            ${e.painel === 'espelho' ? painelEspelho(d) : ''}
            ${(e.campos || []).length ? `<div class="form">${e.campos.map((c) => campoHTML(c, d[c.k], !podeEditar)).join('')}</div>` : ''}
            ${(e.checklist || []).length ? checklistHTML(e, p, podeEditar) : ''}
            <div id="bloqs"></div>
            <div class="acoes">${podeEditar ? '<button class="btn" id="bSalvar" type="button">Salvar</button>' : ''}
              ${ehEquipe() && ehAtual && p.status === 'ativo' && iAtual < ETAPAS.length - 1 ? `<button class="btn prim" id="bAvancar" type="button">Salvar e concluir etapa</button>` : ''}
              ${ehEquipe() && p.status === 'ativo' && iAtual < ETAPAS.length - 1 ? '<button class="btn" id="bDevolver" type="button">Devolver ao corretor</button><button class="btn perigo" id="bEncerrar" type="button">Encerrar processo</button>' : ''}
              ${p.status === 'pendencia' ? '<button class="btn ouro" id="bRetomar" type="button">Pendência resolvida</button>' : ''}</div>
          </section>
          <section class="bloco"><h2>Comentários da equipe</h2><div class="coment">${p.comentarios.map((c) => `<div class="msg">${esc(c.texto)}<small>${esc(c.por)} · ${dataHora(c.em)}</small></div>`).join('') || '<span class="opc">Nenhum comentário ainda.</span>'}
            <textarea id="tCom" placeholder="Escreva para o corretor ou para a equipe"></textarea><div><button class="btn" id="bCom" type="button">Comentar</button></div></div></section>
          <section class="bloco"><h2>Histórico</h2><ul class="historico">${p.historico.slice().reverse().map((h) => `<li>${esc(h.texto)}<small>${esc(h.por)} · ${dataHora(h.em)}</small></li>`).join('')}</ul></section>
        </div></div>`;
    document.querySelectorAll('.trilha li').forEach((li) => li.onclick = () => { S.vendo = li.dataset.k; vProcesso(); });
    $('#bVoltar').onclick = async () => { S.view = 'quadro'; await carregar(); render(); };
    if ($('#bResumo')) $('#bResumo').onclick = () => imprimirResumo(p);
    $('#bPasta').onclick = () => imprimirPasta(p);
    ligarMascaras($('#etapaBox'));
    S.sujo = false;
    const marcar = (ev) => { if (!ev.target.classList.contains('up')) S.sujo = true; };
    $('#etapaBox').addEventListener('input', marcar); $('#etapaBox').addEventListener('change', marcar);
    document.querySelectorAll('.up').forEach((inp) => inp.onchange = () => enviarArquivo(inp));
    const salvar = async (silencioso) => {
      const dados = lerCampos($('#etapaBox .form') || document.createElement('div'));
      const checks = {}; document.querySelectorAll('#etapaBox [data-chk]').forEach((c) => { checks[c.dataset.chk] = c.checked; });
      const r = await api('PATCH', '/api/processos/' + p.id, { dados, checks });
      Object.assign(p.dados, dados); Object.assign(p.checks, checks);
      if (!silencioso) toast('<b>Salvo.</b>');
      return r;
    };
    if ($('#bSalvar')) $('#bSalvar').onclick = async () => { try { await salvar(); await abrirProcesso(p.id); } catch (err) { toast(esc(err.message)); } };
    if ($('#bAvancar')) $('#bAvancar').onclick = async () => {
      try { await salvar(true); await api('POST', '/api/processos/' + p.id + '/avancar'); toast('<b>Etapa concluída.</b> ' + esc(d.nome) + ' seguiu para a próxima etapa.'); await carregar(); await abrirProcesso(p.id); }
      catch (err) { const b = (err.dados && err.dados.bloqueios) || [err.message]; $('#bloqs').innerHTML = `<div class="bloqueios">Ainda não dá para concluir esta etapa:<ul>${b.map((x) => '<li>' + esc(x) + '</li>').join('')}</ul></div>`; }
    };
    const pedirTexto = (titulo, rotulo, botao, url, campo) => modal(`<h2 style="margin-top:0">${titulo}</h2><label class="opc" for="mTxt">${rotulo}</label><textarea id="mTxt"></textarea><p class="erro" id="mErro"></p>
      <div class="acoes"><button class="btn prim" id="mOk" type="button">${botao}</button><button class="btn" data-fechar type="button">Cancelar</button></div>`, (j) => {
      $('#mTxt', j).focus();
      $('#mOk', j).onclick = async () => { try { await api('POST', url, { [campo]: $('#mTxt', j).value }); fecharModal(); await carregar(); await abrirProcesso(p.id); } catch (err) { $('#mErro', j).textContent = err.message; } };
    });
    if ($('#bDevolver')) $('#bDevolver').onclick = () => pedirTexto('Devolver ao corretor', 'O que o corretor precisa resolver?', 'Devolver', '/api/processos/' + p.id + '/devolver', 'motivo');
    if ($('#bEncerrar')) $('#bEncerrar').onclick = () => pedirTexto('Encerrar processo', 'Motivo (ex.: CPF reprovado, crédito negado, desistência)', 'Encerrar', '/api/processos/' + p.id + '/encerrar', 'motivo');
    if ($('#bRetomar')) $('#bRetomar').onclick = () => pedirTexto('Pendência resolvida', 'O que foi resolvido? (opcional)', 'Retomar processo', '/api/processos/' + p.id + '/retomar', 'nota');
    $('#bCom').onclick = async () => { const t = $('#tCom').value.trim(); if (!t) return; try { await api('POST', '/api/processos/' + p.id + '/comentario', { texto: t }); await abrirProcesso(p.id); } catch (err) { toast(esc(err.message)); } };
  }
  function checklistHTML(e, p, podeEditar) {
    const podeMarcar = ehEquipe() && podeEditar;
    return `<ul class="lista-chk">${e.checklist.map((it) => {
      const arqs = p.arquivos.filter((a) => a.item === it.k);
      return `<li><label><input type="checkbox" data-chk="${it.k}" ${p.checks[it.k] ? 'checked' : ''} ${podeMarcar ? '' : 'disabled'}> ${esc(it.label)} ${it.opcional ? '<span class="opc">(se aplicável)</span>' : ''}</label>
        <span class="arqs">${arqs.map((a) => `<a href="/api/arquivos/${p.id}/${a.id}" target="_blank" rel="noopener">${esc(a.nome)}</a>`).join('')}</span>
        ${it.doc && p.status !== 'encerrado' ? `<label class="btn" style="padding:4px 10px;font-size:12px">Anexar<input class="up" data-item="${it.k}" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden></label>` : ''}</li>`;
    }).join('')}</ul>`;
  }
  function enviarArquivo(inp) {
    const f = inp.files[0]; if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast('O arquivo precisa ter até 15 MB.'); return; }
    const tipo = f.type === 'image/jpg' ? 'image/jpeg' : f.type;
    const r = new FileReader();
    r.onload = async () => {
      try { await api('POST', '/api/processos/' + S.proc.id + '/arquivos', { item: inp.dataset.item, nome: f.name, tipo, base64: String(r.result).split(',')[1] }); toast('<b>Anexado:</b> ' + esc(f.name)); await abrirProcesso(S.proc.id); }
      catch (err) { toast(esc(err.message)); }
    };
    r.readAsDataURL(f);
  }
  function painelEspelho(d) {
    const linhas = [
      ['Valor de compra (CCV)', d.valor_compra, null],
      ['Valor de avaliação (laudo)', d.valor_avaliado, d.valor_avaliado && d.valor_compra && Number(d.valor_avaliado) < Number(d.valor_compra) ? 'Laudo abaixo do valor de compra' : null],
      ['Financiamento: aprovado × CCV', d.valor_financiamento, Number(d.financiamento_ccv) > Number(d.valor_financiamento) ? 'CCV acima do aprovado' : null, d.financiamento_ccv],
      ['Subsídio: aprovado × CCV', d.subsidio, Number(d.subsidio_ccv) !== Number(d.subsidio || 0) && d.subsidio_ccv !== undefined ? 'Divergente' : null, d.subsidio_ccv],
      ['FGTS: aprovado × CCV', d.fgts_valor, Number(d.fgts_ccv || 0) !== Number(d.fgts_valor || 0) ? 'Divergente' : null, d.fgts_ccv],
      ['Entrada do cliente (sinal + recursos próprios)', (Number(d.sinal) || 0) + (Number(d.entrada_propria) || 0), null],
      ['Parcela informada pelo banco', d.parcela, null]
    ];
    return `<table class="cmp"><thead><tr><th>Item</th><th class="num">Banco / laudo</th><th class="num">CCV</th><th>Conferência</th></tr></thead><tbody>
      ${linhas.map(([n, a, dif, b]) => `<tr class="${dif ? 'dif' : ''}"><td>${n}</td><td class="num">${brl(a)}</td><td class="num">${b === undefined ? '' : brl(b)}</td><td>${dif || 'OK'}</td></tr>`).join('')}</tbody></table><br>`;
  }

  /* ---------------- impressão ---------------- */
  function imprimir(html) { $('#impressao').innerHTML = html; window.print(); }
  function cab(p, titulo) { return `<p style="font-size:9pt;letter-spacing:.15em;text-transform:uppercase">${esc(S.config.imobiliaria || '')}</p><h1>${titulo}</h1><p>Processo ${esc(p.codigo)} · emitido em ${new Date().toLocaleDateString('pt-BR')}</p>`; }
  function imprimirResumo(p) {
    const d = p.dados;
    const L = [['Comprador', d.nome], ['CPF', d.cpf], ['Segundo proponente', d.segundo_proponente || '—'], ['Imóvel', d.imovel], ['Vendedor', (d.vendedor || '—') + (d.vendedor_doc ? ' · ' + d.vendedor_doc : '')],
      ['Instituição financeira', d.instituicao || '—'], ['Modalidade', d.modalidade || '—'], ['Valor de compra e venda', brl(d.valor_compra)], ['Sinal / ato', brl(d.sinal)], ['Entrada com recursos próprios', brl(d.entrada_propria)],
      ['Parcelamento da entrada', d.parcelamento_entrada || '—'], ['FGTS', brl(d.fgts_ccv)], ['Subsídio', brl(d.subsidio_ccv)], ['Financiamento', brl(d.financiamento_ccv)], ['Desconto da construtora', brl(d.desconto)],
      ['Prazo · sistema · taxa', (d.prazo_meses || '—') + ' meses · ' + (d.amortizacao || '—') + ' · ' + (d.taxa_juros ? d.taxa_juros + '% a.a.' : '—')], ['Primeira parcela informada pelo banco', brl(d.parcela)], ['Valor de avaliação', brl(d.valor_avaliado)]];
    imprimir(cab(p, 'Quadro-resumo da compra') + `<table>${L.map(([a, b]) => `<tr><th style="text-align:left;width:45%">${a}</th><td>${esc(b)}</td></tr>`).join('')}</table>
      <p style="font-size:9pt;margin-top:14px">Valores sujeitos à confirmação no contrato da instituição financeira. A parcela pode variar conforme o sistema de amortização e a data de assinatura.</p>
      <br><br><table style="border:0"><tr><td style="border:0;border-top:1px solid #000;text-align:center">Comprador</td><td style="border:0"></td><td style="border:0;border-top:1px solid #000;text-align:center">Corretor / imobiliária</td></tr></table>`);
  }
  function imprimirPasta(p) {
    const e = ETAPAS.find((x) => x.k === 'documentos');
    imprimir(cab(p, 'Checklist da pasta de financiamento') + `<p>Cliente: <b>${esc(p.dados.nome)}</b> · CPF ${esc(p.dados.cpf)} · ${esc(p.dados.imovel)}</p>
      <table><tr><th style="width:8%">OK</th><th>Documento</th><th style="width:28%">Observação</th></tr>${e.checklist.map((it) => `<tr><td style="text-align:center">${p.checks[it.k] ? '✔' : '☐'}</td><td>${esc(it.label)}${it.opcional ? ' (se aplicável)' : ''}</td><td></td></tr>`).join('')}</table>`);
  }

  /* ---------------- painel do gestor ---------------- */
  function vPainel() {
    const ps = S.processos;
    const ativos = ps.filter((p) => p.status === 'ativo' || p.status === 'pendencia');
    const atras = ativos.filter((p) => prazo(p).cls === 'atrasado');
    const mesIni = new Date(); mesIni.setDate(1); mesIni.setHours(0, 0, 0, 0);
    const concl = ps.filter((p) => p.status === 'concluido');
    const vgv = ativos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
    const max = Math.max(1, ...ETAPAS.slice(1).map((e) => ativos.filter((p) => p.etapa === e.k).length));
    const gargalos = ETAPAS.slice(1, -1).map((e) => { const it = ativos.filter((p) => p.etapa === e.k); return { e, n: it.length, media: it.length ? it.reduce((s, p) => s + prazo(p).dias, 0) / it.length : 0 }; }).filter((g) => g.n).sort((a, b) => (b.media / (b.e.sla || 1)) - (a.media / (a.e.sla || 1)));
    const porCorretor = {}; ps.forEach((p) => { const c = porCorretor[p.corretor] = porCorretor[p.corretor] || { a: 0, c: 0, e: 0 }; if (p.status === 'concluido') c.c++; else if (p.status === 'encerrado') c.e++; else c.a++; });
    $('#area').innerHTML = `<h1>Painel do gestor</h1><p class="sub">Onde estão os processos, quanto valor está em andamento e qual etapa está travando.</p>
      <div class="kpis"><div class="kpi"><span>Em andamento</span><b>${ativos.length}</b></div><div class="kpi"><span>Atrasados</span><b style="color:var(--bad)">${atras.length}</b></div>
        <div class="kpi"><span>VGV em andamento</span><b>${brl(vgv).replace(',00', '')}</b></div><div class="kpi"><span>Concluídos</span><b>${concl.length}</b></div></div>
      <section class="bloco"><h2>Processos por etapa</h2><div class="barras">${ETAPAS.slice(1).map((e) => { const it = ativos.filter((p) => p.etapa === e.k); const a = it.filter((p) => prazo(p).cls === 'atrasado').length;
        return `<div class="barra"><span>${esc(e.nome)}</span><span class="trilho"><i style="width:${(it.length - a) / max * 100}%;background:var(--brass)"></i><i style="width:${a / max * 100}%;background:var(--bad)"></i></span><span class="v">${it.length}${a ? ' · ' + a + ' atras.' : ''}</span></div>`; }).join('')}</div></section>
      <section class="bloco"><h2>Gargalos: tempo médio parado × prazo da etapa</h2>${gargalos.length ? `<div class="tabela"><table><thead><tr><th>Etapa</th><th class="num">Processos</th><th class="num">Média parada</th><th class="num">Prazo</th></tr></thead><tbody>${gargalos.map((g) => `<tr><td>${esc(g.e.nome)}</td><td class="num">${g.n}</td><td class="num">${g.media.toFixed(1)} dias</td><td class="num">${g.e.sla} dias</td></tr>`).join('')}</tbody></table></div>` : '<p class="opc">Sem processos em andamento.</p>'}</section>
      <section class="bloco"><h2>Por corretor</h2><div class="tabela"><table><thead><tr><th>Corretor</th><th class="num">Em andamento</th><th class="num">Concluídos</th><th class="num">Encerrados</th></tr></thead><tbody>${Object.entries(porCorretor).map(([n, c]) => `<tr><td>${esc(n)}</td><td class="num">${c.a}</td><td class="num">${c.c}</td><td class="num">${c.e}</td></tr>`).join('') || '<tr><td colspan="4">Nenhum processo ainda.</td></tr>'}</tbody></table></div></section>`;
  }

  /* ---------------- equipe e configuração ---------------- */
  async function vEquipe() {
    S.usuarios = await api('GET', '/api/usuarios');
    $('#area').innerHTML = `<h1>Equipe e configuração</h1><p class="sub">Cadastre quem usa a esteira. Corretor envia clientes e acompanha os seus; analista de crédito trabalha todas as etapas; gestor vê tudo e administra.</p>
      <section class="bloco"><h2>Usuários</h2><div class="tabela"><table><thead><tr><th>Nome</th><th>Usuário</th><th>Papel</th><th>Situação</th><th></th></tr></thead><tbody>
        ${S.usuarios.map((x) => `<tr><td>${esc(x.nome)}</td><td>${esc(x.usuario)}</td><td>${papelNome[x.papel]}</td><td>${x.ativo ? '<span class="pilula ok">ativo</span>' : '<span class="pilula">desativado</span>'}</td>
          <td>${x.id !== S.me.id ? `<button class="btn" data-tog="${x.id}" data-ativo="${x.ativo}" type="button">${x.ativo ? 'Desativar' : 'Reativar'}</button> <button class="btn" data-senha="${x.id}" type="button">Nova senha</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
        <form id="fUser" class="form" style="margin-top:14px"><label>Nome<input id="u_nome" required></label><label>Usuário<input id="u_user" required></label>
          <label>Papel<select id="u_papel"><option value="corretor">Corretor</option><option value="analista">Analista de crédito</option><option value="gestor">Gestor</option></select></label>
          <label>Senha inicial (mínimo 6)<input id="u_senha" type="password" required minlength="6"></label><div class="largo"><button class="btn prim" type="submit">Adicionar usuário</button> <span class="erro" id="uErro"></span></div></form></section>
      <section class="bloco"><h2>Imobiliária</h2><form id="fCfg" class="form"><label>Nome exibido no sistema<input id="g_imob" value="${esc(S.config.imobiliaria)}"></label><label>Cidade<input id="g_cid" value="${esc(S.config.cidade)}"></label><div class="largo"><button class="btn" type="submit">Salvar</button></div></form></section>
      <section class="bloco"><h2>Dados</h2><p class="sub">Os dados ficam só neste servidor, na pasta <b>data</b>. Uma cópia automática é feita por dia (últimos 30 dias). Baixe um backup completo de vez em quando e guarde fora do PC.</p>
        <div class="acoes"><a class="btn" href="/api/backup">Baixar backup completo</a><button class="btn" id="bDemo" type="button">Carregar processos de demonstração</button></div></section>`;
    $('#fUser').onsubmit = async (ev) => { ev.preventDefault(); try { await api('POST', '/api/usuarios', { nome: $('#u_nome').value, usuario: $('#u_user').value, papel: $('#u_papel').value, senha: $('#u_senha').value }); toast('<b>Usuário criado.</b>'); vEquipe(); } catch (e) { $('#uErro').textContent = e.message; } };
    $('#fCfg').onsubmit = async (ev) => { ev.preventDefault(); S.config = await api('PUT', '/api/config', { imobiliaria: $('#g_imob').value, cidade: $('#g_cid').value }); toast('<b>Configuração salva.</b>'); render(); };
    document.querySelectorAll('[data-tog]').forEach((b) => b.onclick = async () => { await api('PATCH', '/api/usuarios/' + b.dataset.tog, { ativo: b.dataset.ativo !== 'true' }); vEquipe(); });
    document.querySelectorAll('[data-senha]').forEach((b) => b.onclick = () => modal(`<h2 style="margin-top:0">Nova senha</h2><div class="form" style="grid-template-columns:1fr"><label>Nova senha (mínimo 6)<input id="mSenha" type="password"></label></div><p class="erro" id="mErro"></p>
      <div class="acoes"><button class="btn prim" id="mOk" type="button">Salvar</button><button class="btn" data-fechar type="button">Cancelar</button></div>`, (j) => {
      $('#mOk', j).onclick = async () => { try { await api('PATCH', '/api/usuarios/' + b.dataset.senha, { senha: $('#mSenha', j).value }); fecharModal(); toast('<b>Senha alterada.</b>'); } catch (e) { $('#mErro', j).textContent = e.message; } };
    }));
    $('#bDemo').onclick = () => modal(`<h2 style="margin-top:0">Carregar demonstração</h2><p>Isso adiciona 8 processos fictícios (código DEMO) e 3 usuários de teste: carla, diego e ana, todos com a senha <b>demo123</b>. Use em reuniões ou treinamento, não no servidor com clientes reais.</p>
      <div class="acoes"><button class="btn prim" id="mOk" type="button">Carregar</button><button class="btn" data-fechar type="button">Cancelar</button></div>`, (j) => {
      $('#mOk', j).onclick = async () => { await api('POST', '/api/demo'); fecharModal(); await carregar(); toast('<b>Demonstração carregada.</b>'); S.view = 'quadro'; render(); };
    });
  }
  function vSenha() {
    $('#area').innerHTML = `<h1>Trocar minha senha</h1><form class="bloco form" id="fSenha" style="max-width:520px;grid-template-columns:1fr"><label>Senha atual<input id="p_atual" type="password" required autocomplete="current-password"></label>
      <label>Nova senha (mínimo 6)<input id="p_nova" type="password" required minlength="6" autocomplete="new-password"></label><div><button class="btn prim" type="submit">Trocar senha</button> <span class="erro" id="pErro"></span></div></form>`;
    $('#fSenha').onsubmit = async (ev) => { ev.preventDefault(); try { await api('POST', '/api/senha', { atual: $('#p_atual').value, nova: $('#p_nova').value }); toast('<b>Senha alterada.</b>'); S.view = 'quadro'; render(); } catch (e) { $('#pErro').textContent = e.message; } };
  }

  /* ---------------- avisos entre os PCs (a cada 10 s) ---------------- */
  let vigiando = false;
  function vigiar() {
    if (vigiando) return; vigiando = true;
    api('GET', '/api/eventos?desde=' + 1e15).then((r) => { S.ultimoEvento = r.ultimo; }).catch(() => {});
    setInterval(async () => {
      try {
        const r = await api('GET', '/api/eventos?desde=' + S.ultimoEvento);
        S.ultimoEvento = r.ultimo;
        if (!r.eventos.length) return;
        r.eventos.forEach((e) => { S.naoLidos.push(e); toast('<b>' + esc(e.autor || 'Aviso') + '</b> · ' + esc(e.texto)); });
        const sino = $('#bSino'); if (sino) sino.innerHTML = 'Avisos<i>' + S.naoLidos.length + '</i>';
        await carregar();
        const editando = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if (S.view === 'quadro' && !editando) vQuadro(true);
        if (S.view === 'lista' && !editando) vLista(true);
        if (S.view === 'processo' && !editando && !S.sujo && r.eventos.some((e) => e.pid === S.pid)) abrirProcesso(S.pid);
      } catch (e) { if (e.status === 401) location.reload(); }
    }, 10000);
  }

  iniciar();
})();
