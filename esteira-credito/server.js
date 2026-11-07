#!/usr/bin/env node
/* Esteira de Crédito Imobiliário — servidor da rede local.
   Sem dependências: só Node.js 18+. Rode em um PC; os outros acessam pelo navegador. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { ETAPAS, bloqueios, cpfValido } = require('./public/etapas.js');

const PORT = Number(process.env.PORT) || 3210;
const DATA = path.join(__dirname, 'data');
const FILES = path.join(DATA, 'arquivos');
const BACKUPS = path.join(DATA, 'backups');
const DB_FILE = path.join(DATA, 'db.json');
const PUB = path.join(__dirname, 'public');
const MAX_UPLOAD = 15 * 1024 * 1024;
const TIPOS_OK = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png' };
[DATA, FILES, BACKUPS].forEach((d) => fs.mkdirSync(d, { recursive: true }));

/* ---------- banco de dados em arquivo (gravação atômica + backup diário) ---------- */
let db = { config: { imobiliaria: '', cidade: '' }, usuarios: [], processos: [], eventos: [], seq: 1 };
if (fs.existsSync(DB_FILE)) db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
let gravando = false, pendente = false;
function salvar() {
  if (gravando) { pendente = true; return; }
  gravando = true;
  const tmp = DB_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(db), (err) => {
    if (!err) fs.renameSync(tmp, DB_FILE);
    const hoje = new Date().toISOString().slice(0, 10);
    const bk = path.join(BACKUPS, 'db-' + hoje + '.json');
    if (!err && !fs.existsSync(bk)) {
      fs.copyFileSync(DB_FILE, bk);
      fs.readdirSync(BACKUPS).sort().slice(0, -30).forEach((f) => fs.unlinkSync(path.join(BACKUPS, f)));
    }
    gravando = false;
    if (pendente) { pendente = false; salvar(); }
  });
}

/* ---------- autenticação ---------- */
const sessoes = new Map(); // token -> userId
function hash(senha, sal) { return crypto.scryptSync(senha, sal, 32).toString('hex'); }
function criarUsuario({ nome, usuario, senha, papel }) {
  const sal = crypto.randomBytes(16).toString('hex');
  const u = { id: 'u' + db.seq++, nome, usuario: usuario.toLowerCase().trim(), papel, sal, hash: hash(senha, sal), ativo: true };
  db.usuarios.push(u); return u;
}
function publico(u) { return u && { id: u.id, nome: u.nome, usuario: u.usuario, papel: u.papel, ativo: u.ativo }; }
function usuarioDa(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  const id = m && sessoes.get(m[1]);
  const u = id && db.usuarios.find((x) => x.id === id && x.ativo);
  return u || null;
}

/* ---------- utilidades ---------- */
function enviar(res, status, obj, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers || {}));
  res.end(JSON.stringify(obj));
}
function corpo(req, limite) {
  return new Promise((ok, falha) => {
    let tam = 0; const partes = [];
    req.on('data', (c) => { tam += c.length; if (tam > limite) { falha(new Error('Arquivo grande demais')); req.destroy(); } else partes.push(c); });
    req.on('end', () => { try { ok(partes.length ? JSON.parse(Buffer.concat(partes).toString('utf8')) : {}); } catch (e) { falha(new Error('Dados inválidos')); } });
  });
}
function agora() { return new Date().toISOString(); }
function evento(tipo, processo, autor, texto, para) {
  db.eventos.push({ id: db.seq++, em: agora(), tipo, pid: processo && processo.id, autor: autor && autor.nome, texto, para: para || [] });
  if (db.eventos.length > 1000) db.eventos.splice(0, db.eventos.length - 1000);
}
function podeVer(u, p) { return u.papel !== 'corretor' || p.corretorId === u.id; }
function etapaDe(p) { return ETAPAS.find((e) => e.k === p.etapa); }
function idsAnalistas() { return db.usuarios.filter((x) => x.ativo && x.papel !== 'corretor').map((x) => x.id); }
function resumo(p) {
  const e = etapaDe(p);
  return { id: p.id, codigo: p.codigo, nome: p.dados.nome, cpf: p.dados.cpf, imovel: p.dados.imovel, valor: p.dados.valor_compra || p.dados.valor_imovel,
    instituicao: p.dados.instituicao || p.dados.banco_pretendido, etapa: p.etapa, etapaNome: e && e.nome, status: p.status, sla: e ? e.sla : 0,
    desdeEtapa: p.desdeEtapa, criadoEm: p.criadoEm, corretor: p.corretorNome, responsavel: p.responsavelNome, alerta: p.alerta || null };
}
function log(p, u, texto, tipo) { p.historico.push({ em: agora(), por: u ? u.nome : 'Sistema', texto, tipo: tipo || 'info' }); }
function validarCampos(dados) {
  const permitidos = new Set(); ETAPAS.forEach((e) => (e.campos || []).forEach((c) => permitidos.add(c.k)));
  const out = {};
  Object.keys(dados || {}).forEach((k) => {
    if (!permitidos.has(k)) return;
    const v = dados[k];
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) out[k] = typeof v === 'string' ? v.slice(0, 4000) : v;
  });
  return out;
}

/* ---------- rotas ---------- */
async function api(req, res, url) {
  const m = req.method, p = url.pathname;
  const u = usuarioDa(req);

  if (p === '/api/estado' && m === 'GET') return enviar(res, 200, { configurado: db.usuarios.length > 0, usuario: publico(u), config: db.config });

  if (p === '/api/setup' && m === 'POST') {
    if (db.usuarios.length) return enviar(res, 403, { erro: 'O sistema já foi configurado.' });
    const b = await corpo(req, 1e5);
    if (!b.nome || !b.usuario || !b.senha || b.senha.length < 6) return enviar(res, 400, { erro: 'Preencha nome, usuário e uma senha com pelo menos 6 caracteres.' });
    db.config.imobiliaria = String(b.imobiliaria || '').slice(0, 80);
    db.config.cidade = String(b.cidade || '').slice(0, 60);
    const nu = criarUsuario({ nome: b.nome, usuario: b.usuario, senha: b.senha, papel: 'gestor' });
    const t = crypto.randomBytes(24).toString('hex'); sessoes.set(t, nu.id); salvar();
    return enviar(res, 200, { usuario: publico(nu) }, { 'Set-Cookie': 'sid=' + t + '; HttpOnly; SameSite=Strict; Path=/' });
  }

  if (p === '/api/login' && m === 'POST') {
    const b = await corpo(req, 1e4);
    const x = db.usuarios.find((y) => y.usuario === String(b.usuario || '').toLowerCase().trim() && y.ativo);
    if (!x || !crypto.timingSafeEqual(Buffer.from(hash(String(b.senha || ''), x.sal), 'hex'), Buffer.from(x.hash, 'hex'))) return enviar(res, 401, { erro: 'Usuário ou senha incorretos.' });
    const t = crypto.randomBytes(24).toString('hex'); sessoes.set(t, x.id);
    return enviar(res, 200, { usuario: publico(x) }, { 'Set-Cookie': 'sid=' + t + '; HttpOnly; SameSite=Strict; Path=/' });
  }

  if (!u) return enviar(res, 401, { erro: 'Faça login para continuar.' });

  if (p === '/api/logout' && m === 'POST') {
    const mm = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || ''); if (mm) sessoes.delete(mm[1]);
    return enviar(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; Max-Age=0; Path=/' });
  }

  if (p === '/api/senha' && m === 'POST') {
    const b = await corpo(req, 1e4);
    if (!b.nova || b.nova.length < 6) return enviar(res, 400, { erro: 'A nova senha precisa de pelo menos 6 caracteres.' });
    if (hash(String(b.atual || ''), u.sal) !== u.hash) return enviar(res, 400, { erro: 'A senha atual está incorreta.' });
    u.sal = crypto.randomBytes(16).toString('hex'); u.hash = hash(b.nova, u.sal); salvar();
    return enviar(res, 200, { ok: true });
  }

  /* usuários e configuração: só gestor */
  if (p === '/api/usuarios') {
    if (u.papel !== 'gestor') return enviar(res, 403, { erro: 'Só o gestor gerencia usuários.' });
    if (m === 'GET') return enviar(res, 200, db.usuarios.map(publico));
    if (m === 'POST') {
      const b = await corpo(req, 1e4);
      if (!b.nome || !b.usuario || !b.senha || b.senha.length < 6 || !['corretor', 'analista', 'gestor'].includes(b.papel)) return enviar(res, 400, { erro: 'Preencha nome, usuário, papel e senha (mínimo 6 caracteres).' });
      if (db.usuarios.some((x) => x.usuario === b.usuario.toLowerCase().trim())) return enviar(res, 400, { erro: 'Esse nome de usuário já existe.' });
      const nu = criarUsuario(b); salvar(); return enviar(res, 200, publico(nu));
    }
  }
  const mu = /^\/api\/usuarios\/(u\d+)$/.exec(p);
  if (mu && m === 'PATCH') {
    if (u.papel !== 'gestor') return enviar(res, 403, { erro: 'Só o gestor gerencia usuários.' });
    const x = db.usuarios.find((y) => y.id === mu[1]); if (!x) return enviar(res, 404, { erro: 'Usuário não encontrado.' });
    const b = await corpo(req, 1e4);
    if (typeof b.ativo === 'boolean' && x.id !== u.id) x.ativo = b.ativo;
    if (b.senha) { if (b.senha.length < 6) return enviar(res, 400, { erro: 'Senha muito curta.' }); x.sal = crypto.randomBytes(16).toString('hex'); x.hash = hash(b.senha, x.sal); }
    salvar(); return enviar(res, 200, publico(x));
  }
  if (p === '/api/config' && m === 'PUT') {
    if (u.papel !== 'gestor') return enviar(res, 403, { erro: 'Só o gestor altera a configuração.' });
    const b = await corpo(req, 1e4);
    db.config.imobiliaria = String(b.imobiliaria || '').slice(0, 80); db.config.cidade = String(b.cidade || '').slice(0, 60);
    salvar(); return enviar(res, 200, db.config);
  }
  if (p === '/api/backup' && m === 'GET') {
    if (u.papel !== 'gestor') return enviar(res, 403, { erro: 'Só o gestor baixa o backup.' });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="esteira-backup-' + agora().slice(0, 10) + '.json"' });
    return res.end(JSON.stringify(db));
  }
  if (p === '/api/demo' && m === 'POST') {
    if (u.papel !== 'gestor') return enviar(res, 403, { erro: 'Só o gestor carrega a demonstração.' });
    require('./demo.js')(db, ETAPAS, u); salvar(); return enviar(res, 200, { ok: true });
  }

  /* eventos para notificação entre os PCs */
  if (p === '/api/eventos' && m === 'GET') {
    const desde = Number(url.searchParams.get('desde')) || 0;
    const meus = db.eventos.filter((e) => e.id > desde && (e.para.length === 0 || e.para.includes(u.id))).filter((e) => {
      const pr = db.processos.find((x) => x.id === e.pid); return !pr || podeVer(u, pr);
    });
    return enviar(res, 200, { ultimo: db.eventos.length ? db.eventos[db.eventos.length - 1].id : 0, eventos: meus.slice(-30) });
  }

  /* processos */
  if (p === '/api/processos' && m === 'GET') return enviar(res, 200, db.processos.filter((x) => podeVer(u, x)).map(resumo));
  if (p === '/api/processos' && m === 'POST') {
    const b = await corpo(req, 2e5);
    const dados = validarCampos(b.dados);
    const falta = bloqueios(ETAPAS[0], dados, {});
    if (falta.length) return enviar(res, 400, { erro: falta.join(' · ') });
    const ano = new Date().getFullYear();
    const n = db.processos.filter((x) => x.codigo.startsWith(String(ano))).length + 1;
    const pr = { id: 'p' + db.seq++, codigo: ano + '-' + String(n).padStart(4, '0'), dados, checks: {}, arquivos: [], comentarios: [], historico: [],
      etapa: 'cpf', status: 'ativo', criadoEm: agora(), desdeEtapa: agora(), corretorId: u.id, corretorNome: u.nome, responsavelNome: null };
    log(pr, u, 'Processo criado e enviado para análise de CPF');
    db.processos.push(pr);
    evento('novo', pr, u, 'Novo cliente para análise: ' + dados.nome, idsAnalistas());
    salvar(); return enviar(res, 200, resumo(pr));
  }

  const mp = /^\/api\/processos\/(p\d+)(\/[a-z]+)?$/.exec(p);
  if (mp) {
    const pr = db.processos.find((x) => x.id === mp[1]);
    if (!pr || !podeVer(u, pr)) return enviar(res, 404, { erro: 'Processo não encontrado.' });
    const acao = mp[2] || '';
    const ehEquipe = u.papel !== 'corretor';

    if (!acao && m === 'GET') return enviar(res, 200, Object.assign({}, pr, { arquivos: pr.arquivos.map((a) => ({ id: a.id, item: a.item, nome: a.nome, em: a.em, por: a.por, tamanho: a.tamanho })) }));

    if (!acao && m === 'PATCH') {
      const b = await corpo(req, 2e5);
      const novos = validarCampos(b.dados);
      if (!ehEquipe) { // corretor só edita o cadastro e só enquanto o processo está no início ou com pendência
        if (!(pr.etapa === 'cpf' || pr.status === 'pendencia')) return enviar(res, 403, { erro: 'O cadastro só pode ser alterado no início do processo ou quando houver pendência.' });
        const doCadastro = new Set(ETAPAS[0].campos.map((c) => c.k));
        Object.keys(novos).forEach((k) => { if (!doCadastro.has(k)) delete novos[k]; });
      }
      Object.assign(pr.dados, novos);
      if (ehEquipe && b.checks && typeof b.checks === 'object') Object.keys(b.checks).forEach((k) => { pr.checks[k] = !!b.checks[k]; });
      if (ehEquipe && !pr.responsavelNome) pr.responsavelNome = u.nome;
      pr.alerta = null;
      const ev = etapaDe(pr);
      if (pr.etapa === 'avaliacao' && Number(pr.dados.valor_avaliado) && Number(pr.dados.valor_compra) && Number(pr.dados.valor_avaliado) < Number(pr.dados.valor_compra)) {
        pr.alerta = 'Laudo abaixo do valor de compra: revisar entrada';
      }
      salvar(); return enviar(res, 200, { ok: true, bloqueios: ev ? bloqueios(ev, pr.dados, pr.checks) : [] });
    }

    if (acao === '/avancar' && m === 'POST') {
      if (!ehEquipe) return enviar(res, 403, { erro: 'Quem avança as etapas é a equipe de crédito.' });
      if (pr.status !== 'ativo') return enviar(res, 400, { erro: 'Este processo não está ativo.' });
      const i = ETAPAS.findIndex((e) => e.k === pr.etapa);
      const falta = bloqueios(ETAPAS[i], pr.dados, pr.checks);
      if (falta.length) return enviar(res, 400, { erro: 'Ainda não dá para avançar', bloqueios: falta });
      if (i >= ETAPAS.length - 1) return enviar(res, 400, { erro: 'O processo já está na última etapa.' });
      const de = ETAPAS[i], para = ETAPAS[i + 1];
      pr.etapa = para.k; pr.desdeEtapa = agora(); pr.responsavelNome = u.nome;
      if (para.k === 'concluido') pr.status = 'concluido';
      log(pr, u, de.nome + ' concluída → ' + para.nome, 'etapa');
      evento('etapa', pr, u, pr.dados.nome + ': ' + de.nome + ' concluída. Agora em ' + para.nome, [pr.corretorId].concat(idsAnalistas()));
      salvar(); return enviar(res, 200, resumo(pr));
    }

    if (acao === '/devolver' && m === 'POST') {
      if (!ehEquipe) return enviar(res, 403, { erro: 'Só a equipe de crédito devolve processos.' });
      const b = await corpo(req, 2e4);
      if (!b.motivo) return enviar(res, 400, { erro: 'Escreva o que o corretor precisa resolver.' });
      pr.status = 'pendencia'; pr.alerta = 'Pendência com o corretor: ' + String(b.motivo).slice(0, 200);
      log(pr, u, 'Devolvido ao corretor: ' + b.motivo, 'pendencia');
      evento('pendencia', pr, u, pr.dados.nome + ': pendência para resolver. ' + b.motivo, [pr.corretorId]);
      salvar(); return enviar(res, 200, resumo(pr));
    }

    if (acao === '/retomar' && m === 'POST') {
      if (pr.status !== 'pendencia') return enviar(res, 400, { erro: 'Este processo não está com pendência.' });
      const b = await corpo(req, 2e4);
      pr.status = 'ativo'; pr.alerta = null; pr.desdeEtapa = agora();
      log(pr, u, 'Pendência resolvida' + (b.nota ? ': ' + b.nota : ''), 'etapa');
      evento('retomado', pr, u, pr.dados.nome + ': pendência resolvida pelo ' + (ehEquipe ? 'time de crédito' : 'corretor'), ehEquipe ? [pr.corretorId] : idsAnalistas());
      salvar(); return enviar(res, 200, resumo(pr));
    }

    if (acao === '/encerrar' && m === 'POST') {
      if (!ehEquipe) return enviar(res, 403, { erro: 'Só a equipe de crédito encerra processos.' });
      const b = await corpo(req, 2e4);
      if (!b.motivo) return enviar(res, 400, { erro: 'Informe o motivo do encerramento.' });
      pr.status = 'encerrado'; pr.alerta = 'Encerrado: ' + String(b.motivo).slice(0, 200);
      log(pr, u, 'Processo encerrado: ' + b.motivo, 'encerrado');
      evento('encerrado', pr, u, pr.dados.nome + ': processo encerrado. ' + b.motivo, [pr.corretorId]);
      salvar(); return enviar(res, 200, resumo(pr));
    }

    if (acao === '/comentario' && m === 'POST') {
      const b = await corpo(req, 2e4);
      const t = String(b.texto || '').trim().slice(0, 2000); if (!t) return enviar(res, 400, { erro: 'Escreva o comentário.' });
      pr.comentarios.push({ em: agora(), por: u.nome, papel: u.papel, texto: t });
      evento('comentario', pr, u, u.nome + ' comentou em ' + pr.dados.nome + ': ' + t.slice(0, 80), ehEquipe ? [pr.corretorId] : idsAnalistas());
      salvar(); return enviar(res, 200, { ok: true });
    }

    if (acao === '/arquivos' && m === 'POST') {
      const b = await corpo(req, MAX_UPLOAD * 1.4);
      const ext = TIPOS_OK[b.tipo];
      if (!ext) return enviar(res, 400, { erro: 'Envie PDF, JPG ou PNG.' });
      const buf = Buffer.from(String(b.base64 || ''), 'base64');
      if (!buf.length || buf.length > MAX_UPLOAD) return enviar(res, 400, { erro: 'O arquivo precisa ter até 15 MB.' });
      const fid = crypto.randomBytes(8).toString('hex');
      const dir = path.join(FILES, pr.id); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, fid + ext), buf);
      const a = { id: fid, ext, tipo: b.tipo, item: String(b.item || 'outros').slice(0, 40), nome: String(b.nome || 'arquivo' + ext).slice(0, 120), em: agora(), por: u.nome, tamanho: buf.length };
      pr.arquivos.push(a);
      if (a.item !== 'outros' && ehEquipe) pr.checks[a.item] = true;
      log(pr, u, 'Documento anexado: ' + a.nome);
      salvar(); return enviar(res, 200, { id: fid });
    }
  }

  const ma = /^\/api\/arquivos\/(p\d+)\/([a-f0-9]{16})$/.exec(p);
  if (ma && m === 'GET') {
    const pr = db.processos.find((x) => x.id === ma[1]);
    if (!pr || !podeVer(u, pr)) return enviar(res, 404, { erro: 'Arquivo não encontrado.' });
    const a = pr.arquivos.find((x) => x.id === ma[2]); if (!a) return enviar(res, 404, { erro: 'Arquivo não encontrado.' });
    res.writeHead(200, { 'Content-Type': a.tipo, 'Content-Disposition': 'inline; filename="' + encodeURIComponent(a.nome) + '"' });
    return fs.createReadStream(path.join(FILES, pr.id, a.id + a.ext)).pipe(res);
  }

  return enviar(res, 404, { erro: 'Rota não encontrada.' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const alvo = path.normalize(path.join(PUB, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!alvo.startsWith(PUB) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(alvo).pipe(res);
  } catch (e) {
    enviar(res, 500, { erro: e.message || 'Erro interno' });
  }
});

if (require.main === module) {
  servidor.listen(PORT, '0.0.0.0', () => {
    const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
    console.log('\n  Esteira de Crédito no ar.');
    console.log('  Neste PC:        http://localhost:' + PORT);
    ips.forEach((ip) => console.log('  Nos outros PCs:  http://' + ip + ':' + PORT));
    console.log('\n  Deixe esta janela aberta enquanto a equipe estiver usando.\n');
  });
}
module.exports = { servidor, cpfValido };
