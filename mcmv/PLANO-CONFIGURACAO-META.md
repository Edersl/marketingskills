# Plano: colocar o bot de comentários no ar

Status em 03/10/2026. O código está pronto em `Edersl/agente-mcmv` → `mcmv-comentarios-bot/` e passou no teste de simulação. Falta configurar a Meta e subir em nuvem.

A ideia: o Eder faz só o que exige login dele (uns 15 minutos) e o Claude faz o resto numa sessão nova.

---

## Parte A: o que só o Eder pode fazer

Faça tudo **no mesmo dia** em que for abrir a sessão. O token do Graph API Explorer vence em cerca de 1 hora.

### A1. Base (conferir no Instagram)

- [ ] @eder_lopes_imoveis é conta profissional (Empresa ou Criador de conteúdo)
- [ ] O Instagram está vinculado à Página do Facebook
- [ ] O login do Facebook é **administrador** da Página
- [ ] Instagram → Configurações → Mensagens → Ferramentas conectadas → **Permitir acesso a mensagens** ligado

### A2. Criar o app da Meta

1. developers.facebook.com → Meus apps → **Criar app**
2. Nome: `MCMV Comentários`. Caso de uso: **Outro** → tipo **Empresa**. Se pedir Portfólio Empresarial, use o mesmo dos anúncios.
3. Configurações do app → Básico: anote o **ID do aplicativo** e a **Chave secreta**

### A3. Gerar o token (fazer por último, logo antes da sessão)

Graph API Explorer → selecione o app → marque as permissões abaixo → **Generate Access Token** → aceite tudo na janela da Meta.

```
pages_show_list
pages_read_engagement
pages_manage_engagement
pages_read_user_content
pages_manage_metadata
pages_messaging
instagram_basic
instagram_manage_comments
instagram_manage_messages
ads_read
```

### A4. Chave da Claude API

console.anthropic.com → API Keys → criar chave. Coloque alguns dólares de crédito: com o modelo Haiku, cada comentário custa frações de centavo.

### A5. Conta no Railway (para rodar 24h)

1. railway.com → entrar com o GitHub → autorizar o acesso ao repositório `agente-mcmv`
2. Account Settings → Tokens → criar um token

### A6. Guardar tudo no ambiente do Claude (nunca no chat)

No Claude, no menu do ambiente de nuvem (barra de título da sessão) → **Edit**:

**Variáveis de ambiente:**

| Variável | Valor |
|---|---|
| `META_APP_ID` | ID do aplicativo (A2) |
| `META_APP_SECRET` | Chave secreta (A2) |
| `META_USER_TOKEN` | Token do Graph API Explorer (A3) |
| `ANTHROPIC_API_KEY` | Chave da Claude (A4) |
| `RAILWAY_TOKEN` | Token do Railway (A5) |
| `WHATSAPP_LINK` | `https://wa.me/55DDDNUMERO?text=SIMULA` |

**Acesso à rede:** mude para **Custom** e, mantendo a lista padrão, adicione:

```
graph.facebook.com
backboard.railway.com
backboard.railway.app
```

Hoje o ambiente bloqueia esses endereços. Sem essa liberação, a configuração tem que ser feita no PC do Eder (Plano B, mais abaixo).

### A7. Abrir a sessão nova

Abra uma sessão nova com os repositórios `Edersl/agente-mcmv` (com permissão de push) e `Edersl/marketingskills` e mande:

> Leia mcmv/PLANO-CONFIGURACAO-META.md na branch claude/puxar-conversas-chat-kslz7l do marketingskills e execute a Parte B.

---

## Parte B: o que o Claude faz na sessão

Regra de ouro: nenhum segredo aparece no chat, no log ou em commit. Os valores vêm das variáveis de ambiente e vão direto para o Railway pela API.

1. **Conferir o ambiente:** as 6 variáveis existem (só checar se estão preenchidas, sem imprimir) e `graph.facebook.com` responde.
2. **Clonar** `Edersl/agente-mcmv` e rodar `npm install` em `mcmv-comentarios-bot/`.
3. **Criar o serviço no Railway** pelo `RAILWAY_TOKEN`: projeto novo ligado ao repositório, diretório raiz `mcmv-comentarios-bot`, comando `npm start`, volume em `/data`, domínio público. Anotar a URL.
4. **Rodar o configurador da Meta** com `URL_PUBLICA` apontando para essa URL:
   `URL_PUBLICA=https://... npm run configurar-meta`
   Ele troca o token por um de longa duração, acha a Página, o Instagram e a conta de anúncios, liga a Página ao app, cadastra os webhooks e grava o `.env` local.
5. **Copiar as variáveis para o Railway** pela API, sem exibir os valores: as 7 `META_*` geradas, mais `ANTHROPIC_API_KEY`, `WHATSAPP_LINK` e `DRY_RUN=true`.
6. **Verificar:** `npm run checar`, mais uma chamada GET em `/webhook` com o verify token, para confirmar que o Railway responde.
7. **Teste real em simulação:** pedir ao Eder um comentário num post e confirmar que ele aparece em `/historico`, com a resposta que a Claude teria dado.
8. **Reportar** ao Eder o que ficou pronto e o que falta (modo Ao vivo do app e, se a Meta exigir, Revisão do App).
9. **Higiene:** lembrar o Eder de apagar `META_USER_TOKEN` e `RAILWAY_TOKEN` do ambiente. Depois do passo 4, o token da Página não vence e o de usuário não é mais necessário.

## Parte C: ligar de verdade (depois de 1 ou 2 dias)

- [ ] Eder conferiu as respostas em `https://SUA-URL/historico?chave=SEU_VERIFY_TOKEN`
- [ ] App da Meta em modo **Ao vivo** (sem isso, o bot só enxerga comentários de quem tem função no app)
- [ ] `DRY_RUN=false` no Railway

---

## Plano B: sem liberar a rede da nuvem

Use o Claude Code no PC do Eder, com o repositório `agente-mcmv` clonado:

```bash
cd mcmv-comentarios-bot
npm install
npm run configurar-meta   # digita ID, chave e token no terminal; Enter na URL se ainda não subiu
```

Depois, crie o serviço no Railway pelo painel web (New Project → Deploy from GitHub → `agente-mcmv`, Root Directory `mcmv-comentarios-bot`). Cadastre as variáveis do `.env` no painel, rode o configurador de novo informando a URL pública e finalize com `npm run checar`.

## Referências

- Código e passo a passo completo: `Edersl/agente-mcmv` → `mcmv-comentarios-bot/README.md`
- Histórico da conversa: [conversa-2026-10-02-automacoes.md](conversa-2026-10-02-automacoes.md)
