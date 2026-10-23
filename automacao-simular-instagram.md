# Automação SIMULAR: comentário → direct → WhatsApp

**Eder Lopes | Corretor de Imóveis | CRECI MS-7971**
Versão 1: outubro de 2026

---

## 1. Como funciona

```
Post com CTA "Comenta SIMULAR"
   ↓
Lead comenta SIMULAR
   ↓ (automático, em segundos)
① Resposta pública no comentário  →  prova social para quem está vendo o post
② Direct privado com o botão do WhatsApp
   ↓
Lead toca no botão → abre o WhatsApp com a mensagem pronta:
"Oi Eder, vim do Instagram e quero SIMULAR"
   ↓
BotConversa reconhece a palavra SIMULAR → etiqueta origem:instagram → fluxo de qualificação
```

**Por que funciona:** comentar é o menor esforço possível para o lead. Comentário também aumenta o alcance do post, e o algoritmo entrega mais. E cada comentário vira um lead identificado.

---

## 2. Onde configurar (escolha 1)

| Ferramenta | Prós | Contras |
|---|---|---|
| **BotConversa** (se o seu plano tiver integração com Instagram) | Tudo num lugar só, junto com o fluxo do WhatsApp | Precisa confirmar se o seu plano inclui Instagram |
| **ManyChat** | Referência em automação de comentário para direct, tem plano gratuito | Mais uma ferramenta para gerenciar |
| **Meta Business Suite** (respostas automáticas) | Grátis e nativa | Menos flexível (sem botões e sem follow-up) |

**Recomendação:** amanhã, no levantamento do BotConversa pelo Chrome, confirmar se tem Instagram. Se tiver, usa ele. Se não tiver, usa o **ManyChat** (plano gratuito) só para essa ponta do Instagram e deixa o WhatsApp com o BotConversa.

---

## 3. Configuração da automação

**Gatilho:** comentário que **contém** a palavra `SIMULAR` (sem diferenciar maiúscula e minúscula), em **qualquer post ou reels**.
Aceite também variações: `simular`, `simulação`, `simulacao`, `quero simular`.

**Também acionar por:**
- Direct com a palavra SIMULAR
- Resposta de story com a palavra SIMULAR

---

## 4. Mensagens (prontas para colar)

### ① Resposta pública no comentário

Configure **4 variações em rodízio**. Respostas sempre iguais podem ser lidas como spam pelo Instagram.

```
Te mandei no direct! 📩
```
```
Já está no seu direct, dá uma olhada! 😉
```
```
Mandei os detalhes no seu direct 🏡
```
```
Corre no direct que já te respondi! 📲
```

### ② Direct automático

```
Oi! Aqui é o Eder 😊 Vi que você quer simular sua casa própria. Ótimo passo!

A simulação é gratuita e sem compromisso: eu te mostro quanto você consegue financiar, o valor da parcela e como usar FGTS e subsídio pra facilitar a entrada. 🏡

Toca no botão abaixo que a gente continua pelo WhatsApp 👇
```
**Botão:** `Quero minha simulação` → link:
```
https://wa.me/5567991505351?text=Oi%20Eder%2C%20vim%20do%20Instagram%20e%20quero%20SIMULAR
```
Esse link abre o WhatsApp já com a mensagem: *"Oi Eder, vim do Instagram e quero SIMULAR"*. O BotConversa lê a palavra SIMULAR e inicia o fluxo de qualificação com a etiqueta `origem:instagram`.

### ③ Lembrete (se o lead não tocar no botão)

Envie em até **23 horas** depois do comentário. Depois de 24 horas o Instagram não permite mais mensagem automática.

```
Oi! Passando só pra não deixar sua simulação pra trás 😊

Muita gente desiste antes de saber que já tem perfil pra financiar. Leva 2 minutinhos, é só tocar aqui 👇
```
**Botão:** `Fazer minha simulação` → o mesmo link do WhatsApp.

---

## 5. CTA padrão para as legendas

Use **sempre a mesma palavra**. Trocar a palavra a cada post (CASA, QUERO FINANCIAR, AMORTIZAR...) confunde o seguidor e quebra a automação.

**Final de post educativo:**
```
💬 Comenta SIMULAR que eu te mando no direct como fazer a sua simulação grátis.
```

**Final de post de imóvel:**
```
💬 Comenta SIMULAR que eu te mando os valores e a simulação desse imóvel no direct.
```

**Story (com a caixinha de pergunta ou o sticker de link):**
```
Quer saber se você já pode sair do aluguel? Me responde SIMULAR 👇
```

**Na fala dos Reels (últimos 3 segundos):**
> "Quer saber quanto fica a sua parcela? Comenta SIMULAR que eu te mando no direct."

---

## 6. Ajuste no BotConversa

No gatilho de palavra-chave do fluxo de qualificação:
- Se a mensagem contém **"vim do Instagram"** ou **"SIMULAR"** → etiqueta `origem:instagram` → BLOCO 1 (boas-vindas)
- Para reconhecer o lead logo de cara, use uma boas-vindas um pouco diferente:
```
Olá! 😊 Que bom que você veio do Instagram! Aqui é o Eder.

Vamos fazer sua simulação? São 8 perguntas rápidas, leva 2 minutinhos.

1️⃣ Bora!
2️⃣ Prefiro falar direto com o Eder
```

---

## 7. Como medir (toda segunda-feira)

| Métrica | Onde ver | Meta inicial |
|---|---|---|
| Comentários SIMULAR na semana | ManyChat / BotConversa | 10 ou mais |
| % que tocou no botão do WhatsApp | ManyChat / BotConversa | 40% ou mais |
| Leads com `origem:instagram` | BotConversa / HubSpot | Crescendo semana a semana |
| Leads quentes vindos do Instagram | HubSpot | 2 ou mais por semana |

---

## 8. Checklist de implementação

- [ ] Confirmar se o BotConversa tem integração com Instagram (amanhã, pelo Chrome)
- [ ] Se não tiver: criar conta no ManyChat e conectar o @eder_lopes_imoveis
- [ ] Criar o gatilho de comentário com SIMULAR (todos os posts)
- [ ] Cadastrar as 4 respostas públicas em rodízio
- [ ] Cadastrar o direct com o botão do WhatsApp
- [ ] Cadastrar o lembrete de 23 horas
- [ ] Ativar também para direct e resposta de story
- [ ] Ajustar o gatilho no BotConversa ("vim do Instagram" / SIMULAR)
- [ ] **Testar:** pedir para alguém comentar SIMULAR num post e conferir o caminho completo
- [ ] Editar as legendas antigas com mais alcance trocando o CTA por SIMULAR
