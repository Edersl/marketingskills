# Fluxo de Qualificação MCMV: BotConversa

**Eder Lopes | Corretor de Imóveis | CRECI MS-7971 | Campo Grande/MS**
Versão 1: outubro de 2026

---

## 1. Visão geral

**Objetivo:** em cerca de 2 minutos, transformar quem chegou no WhatsApp em um lead **classificado** (quente, morno ou frio), com os dados salvos, e entregar a você só quem está pronto para conversar, já com o resumo na mão.

```
Gatilho
  → Boas-vindas
  → Nome
  → Objetivo
  → Trabalho
  → Renda familiar
  → FGTS
  → Nome limpo
  → Entrada guardada
  → Prazo
  → Região
  → CLASSIFICAÇÃO
       ├─ QUENTE → resumo para o Eder + agendamento
       ├─ MORNO  → plano de preparo + follow-up
       └─ FRIO   → nutrição + reativação
```

**Regras de ouro do fluxo**
- **Uma pergunta por mensagem.** Nada de formulário.
- **Opções numeradas** ("responda com o número"). A API oficial do WhatsApp limita os botões a 3 por mensagem, e algumas perguntas têm 4 ou 5 opções.
- **Uma frase de mentor entre as perguntas.** O lead aprende enquanto responde. É isso que diferencia você do corretor que só manda tabela.
- **Nunca prometer aprovação.** Use "você tem perfil" ou "as chances são boas".
- **Saída para humano em qualquer ponto:** se o lead digitar "EDER" ou "ATENDENTE", o fluxo para e transfere para você.

---

## 2. Configuração no BotConversa

### Campos personalizados (crie antes de montar o fluxo)

| Campo | Tipo | Exemplo de valor |
|---|---|---|
| `nome` | Texto | Taiane |
| `origem` | Texto | anuncio-jardim-los-angeles / instagram-simular / organico |
| `objetivo` | Texto | sair-do-aluguel / trocar-imovel / investir |
| `tipo_renda` | Texto | clt / autonomo-mei / servidor-aposentado / informal |
| `faixa_renda` | Texto | ate-3200 / 3200-5000 / 5000-9600 / 9600-13000 / acima-13000 |
| `fgts_3anos` | Texto | sim / nao / nao-sei |
| `nome_limpo` | Texto | sim / pendencia / nao-sei |
| `entrada` | Texto | zero / ate-10k / 10k-30k / acima-30k |
| `prazo` | Texto | agora / 3-meses / pesquisando |
| `regiao` | Texto | Moreninhas, Santa Inês... |
| `temperatura` | Texto | quente / morno / frio |

### Etiquetas (tags)

- **Origem:** `origem:anuncio`, `origem:instagram`, `origem:indicacao`, `origem:organico`
- **Temperatura:** `lead:quente`, `lead:morno`, `lead:frio`
- **Pendências:** `pendencia:nome-sujo`, `pendencia:renda-informal`, `pendencia:sem-fgts`
- **Status:** `status:aguardando-eder`, `status:simulacao-enviada`, `status:visita-agendada`, `status:sem-resposta`
- **Fora do MCMV:** `rota:sbpe` (renda acima da última faixa)

---

## 3. Gatilhos de entrada

| Gatilho | Ação |
|---|---|
| Primeira mensagem de um contato novo | Inicia o fluxo e marca `origem:organico` |
| Mensagem contém "anúncio", "vi o anúncio" ou o nome de um empreendimento | Salva no campo `origem` o empreendimento citado e marca `origem:anuncio` |
| Palavra-chave **SIMULAR** (e as antigas: CASA, QUERO FINANCIAR, SANTA INÊS) | Inicia o fluxo e marca `origem:instagram` |
| "EDER", "ATENDENTE" ou "FALAR COM VOCÊ" em qualquer etapa | Pausa o bot e transfere para o atendimento humano |

> **Dica de rastreamento:** em cada anúncio de clique para o WhatsApp, configure uma **mensagem pré-preenchida diferente**, por exemplo: *"Oi Eder, vi o anúncio do Jardim Los Angeles"*. O bot lê o texto e etiqueta a origem. Assim você sabe qual campanha gera contrato.

---

## 4. Mensagens do fluxo (prontas para colar)

### BLOCO 1: Boas-vindas

```
Olá! 😊 Aqui é o Eder Lopes, corretor especialista em Minha Casa Minha Vida aqui em Campo Grande.

Antes de falar de imóvel, eu faço uma coisa que a maioria não faz: entendo o SEU cenário pra montar a melhor estratégia de compra.

São 8 perguntas rápidas, leva 2 minutinhos. Bora?

1️⃣ Bora!
2️⃣ Prefiro falar direto com o Eder
```
- **1** → BLOCO 2
- **2** → marca `status:aguardando-eder` e transfere para o humano com a mensagem: *"Fechado! Já te passo pro Eder. Enquanto isso, me diz seu nome? 😊"*

### BLOCO 2: Nome

```
Show! Como posso te chamar?
```
→ salva em `{nome}`

### BLOCO 3: Objetivo

```
Prazer, {nome}! 🤝

Me conta: qual é o seu objetivo hoje?

1️⃣ Sair do aluguel / primeiro imóvel
2️⃣ Trocar meu imóvel por um maior
3️⃣ Investir
```
→ salva em `{objetivo}`

### BLOCO 4: Tipo de renda

```
Perfeito. Agora sobre o seu trabalho, que é o que o banco olha primeiro:

1️⃣ Carteira assinada (CLT)
2️⃣ Autônomo ou MEI
3️⃣ Servidor público ou aposentado
4️⃣ Trabalho sem comprovação de renda
```
→ salva em `{tipo_renda}`. Se a resposta for **4**, marca `pendencia:renda-informal`.

**Mensagem de mentor (enviar logo depois):**
- Se **1 ou 3:** *"Ótimo, esse é o perfil que o banco aprova com mais facilidade. ✅"*
- Se **2:** *"Dá pra financiar sim! A diferença é que o banco pede extratos para comprovar a renda. Eu te oriento nisso."*
- Se **4:** *"Fica tranquilo, tem caminho. Muita gente regulariza como MEI e financia depois. Vamos continuar que eu te mostro."*

### BLOCO 5: Renda familiar

```
{nome}, qual é a renda BRUTA da família, somando todo mundo que vai comprar junto com você?

1️⃣ Até R$ 3.200
2️⃣ De R$ 3.200 a R$ 5.000
3️⃣ De R$ 5.000 a R$ 9.600
4️⃣ De R$ 9.600 a R$ 13.000
5️⃣ Acima de R$ 13.000

💡 Dica: somar a renda com cônjuge ou familiar pode aumentar o valor que você consegue financiar.
```
→ salva em `{faixa_renda}`. Se a resposta for **5**, marca `rota:sbpe`.

> ⚠️ **Confira as faixas antes de publicar.** Usei os limites do seu post de 22/10 (até R$ 3.200, R$ 5.000, R$ 9.600 e R$ 13.000). Se as regras do programa mudarem, atualize só este bloco.

### BLOCO 6: FGTS

```
E o FGTS? Somando todos os seus empregos com carteira, você tem pelo menos 3 anos de FGTS?

1️⃣ Sim
2️⃣ Não
3️⃣ Não sei
```
→ salva em `{fgts_3anos}`

**Mensagem de mentor:**
- Se **1:** *"Excelente! O FGTS pode entrar como parte da entrada e isso faz muita diferença. 💰"*
- Se **2:** *"Sem problema. Tem outros caminhos para a entrada, como subsídio e parcelamento com a construtora."*
- Se **3:** *"Dá pra conferir em 1 minuto no app FGTS. Depois eu te mostro onde olhar."*

### BLOCO 7: Nome limpo

```
Pergunta importante, e fica só entre a gente 🤐

Seu nome está limpo hoje (sem restrição no SPC/Serasa)?

1️⃣ Sim, tudo certo
2️⃣ Tenho alguma pendência
3️⃣ Não sei
```
→ salva em `{nome_limpo}`. Se a resposta for **2**, marca `pendencia:nome-sujo`.

**Mensagem de mentor:**
- Se **2:** *"Obrigado pela sinceridade! Isso não fecha a porta, só muda a ordem dos passos. Primeiro a gente resolve a pendência, e enquanto isso já deixo tudo pronto pra você dar entrada assim que limpar."*
- Se **3:** *"Dá pra consultar grátis no app da Serasa. Vale olhar antes da simulação."*

### BLOCO 8: Entrada guardada

```
Você já tem algum valor guardado para a entrada?

1️⃣ Ainda não tenho nada
2️⃣ Até R$ 10 mil
3️⃣ Entre R$ 10 mil e R$ 30 mil
4️⃣ Mais de R$ 30 mil
```
→ salva em `{entrada}`

**Mensagem de mentor:**
- Se **1:** *"Calma, isso é mais comum do que você imagina! No MCMV dá pra combinar subsídio, FGTS e parcelamento da entrada. É exatamente aqui que eu entro com a estratégia. 🎯"*

### BLOCO 9: Prazo

```
Última parte! Quando você quer estar com a chave na mão?

1️⃣ O quanto antes
2️⃣ Nos próximos 3 meses
3️⃣ Ainda estou pesquisando
```
→ salva em `{prazo}`

### BLOCO 10: Região (opcional)

```
Tem alguma região de Campo Grande que você prefere? (Ex: Moreninhas, Santa Inês, Universitário...)

Se não tiver preferência, é só responder "tanto faz".
```
→ salva em `{regiao}`

---

## 5. Classificação (condições no BotConversa)

| Temperatura | Regra | Ação |
|---|---|---|
| 🔥 **QUENTE** | Nome limpo **E** renda comprovável (CLT, servidor/aposentado ou autônomo/MEI) **E** prazo "o quanto antes" ou "3 meses" **E** renda até R$ 13.000 | Mensagem de fechamento + aviso para você |
| 🌤️ **MORNO** | Tem **uma** pendência (nome sujo, renda informal ou sem FGTS e sem entrada) **OU** prazo de 3 meses ou mais com o resto ok | Plano de preparo + régua de follow-up |
| ❄️ **FRIO** | "Ainda estou pesquisando" **OU** mais de uma pendência | Nutrição com conteúdo + reativação em 30 dias |
| 🏦 **SBPE** | Renda acima de R$ 13.000 | Rota de financiamento fora do MCMV (continua sendo lead!) |

> **Ordem das condições no BotConversa:** SBPE → FRIO → MORNO → QUENTE. Quem não cair nas três primeiras é quente.

---

## 6. Mensagens de fechamento

### 🔥 QUENTE

```
{nome}, analisei suas respostas e tenho uma ótima notícia: você TEM PERFIL para o Minha Casa Minha Vida! 🏡

O próximo passo é a sua simulação personalizada, com valor de parcela, entrada e quanto do subsídio pode entrar na sua compra.

Vou te chamar pessoalmente em instantes. Qual horário é melhor para conversarmos?

1️⃣ Agora
2️⃣ Hoje à tarde
3️⃣ Hoje à noite
4️⃣ Amanhã
```
→ marca `lead:quente` e `status:aguardando-eder` → **dispara o aviso interno para você (seção 7)**

### 🌤️ MORNO

```
{nome}, obrigado pelas respostas! 🙏

Pelo que vi, você está perto, mas tem um ponto pra ajustar antes de dar entrada: {pendência}.

E é aí que muita gente erra: vai direto no banco, é reprovada e desiste. Comigo, a gente monta o plano primeiro.

Quer que eu te mande o passo a passo do que fazer agora?

1️⃣ Quero sim
2️⃣ Prefiro conversar com o Eder
```
→ marca `lead:morno` → entra na **régua de follow-up (seção 8)**

> Para o texto da `{pendência}`, use uma condição por etiqueta:
> - `pendencia:nome-sujo` → "regularizar a pendência no seu nome"
> - `pendencia:renda-informal` → "conseguir comprovar a sua renda"
> - sem FGTS e sem entrada → "montar a estratégia da sua entrada"

### ❄️ FRIO

```
Fechado, {nome}! Pesquisar antes é atitude de quem compra bem. 👏

Vou te mandar de vez em quando conteúdos curtos que vão te ajudar a decidir com segurança: como funciona o subsídio, como usar o FGTS e como diminuir a entrada.

Quando quiser fazer sua simulação, é só mandar SIMULAR aqui. 😉
```
→ marca `lead:frio` → nutrição

### 🏦 SBPE (renda acima da última faixa)

```
{nome}, com a sua renda você está acima das faixas do Minha Casa Minha Vida, mas isso é bom: você tem acesso a outras linhas de financiamento e a mais opções de imóvel. 🏠

Quer que eu faça uma simulação nessas linhas também?

1️⃣ Quero
2️⃣ Agora não
```

---

## 7. Aviso interno para o Eder (lead quente)

Configure uma **mensagem para o seu próprio número** (ou para um grupo interno), disparada assim que o lead for classificado como quente:

```
🔥 LEAD QUENTE: {nome}
📱 {telefone}
📍 Origem: {origem}

🎯 Objetivo: {objetivo}
💼 Renda: {tipo_renda} | {faixa_renda}
💰 FGTS 3+ anos: {fgts_3anos}
✅ Nome limpo: {nome_limpo}
🏦 Entrada guardada: {entrada}
⏰ Prazo: {prazo}
🗺️ Região: {regiao}
🕐 Melhor horário: {horario}
```

**Ganho:** você abre a conversa já sabendo tudo e começa direto pela simulação, sem perguntar nada de novo.

---

## 8. Recuperação de quem parou no meio

| Quando | Mensagem |
|---|---|
| **10 min** sem responder | *"{nome}, ficou alguma dúvida? Faltam só {N} perguntinhas pra eu montar sua análise. 😊"* |
| **24 h** sem responder | *"Oi {nome}! Ontem a gente começou sua análise e parou no meio. Quer continuar? Leva 1 minuto. 1️⃣ Continuar 2️⃣ Agora não"* |
| **3 dias** | *"{nome}, o aluguel em Campo Grande subiu 16% este ano. Cada mês esperando é dinheiro que não volta. Quer que eu faça sua simulação? Responde SIMULAR."* |
| **7 dias** | Última tentativa → marca `status:sem-resposta` → entra na reativação de 30 dias |

> Confira no seu plano do BotConversa como configurar o "tempo limite de resposta" nas perguntas. Se não houver essa opção, use **Sequências** acionadas pela etiqueta `status:sem-resposta`.

---

## 9. Integração com o HubSpot

No final do fluxo (em todos os ramos), adicione um bloco de **Webhook** ou **integração via Zapier** que cria ou atualiza o contato no HubSpot com:

| BotConversa | HubSpot |
|---|---|
| `nome` | Nome |
| telefone | Telefone |
| `origem` | Fonte do lead (campo personalizado) |
| `temperatura` | Status do lead (quente = Novo / Em andamento) |
| `faixa_renda`, `tipo_renda`, `fgts_3anos`, `nome_limpo`, `entrada`, `prazo`, `regiao` | Campos personalizados com os mesmos nomes |

Isso acaba com o cadastro manual que aparece hoje nos seus contatos mais recentes.

---

## 10. Versão express: 4 perguntas (direct do Instagram ou WhatsApp)

Use quando o lead chegar pelo SIMULAR e você quiser filtrar rápido antes de assumir a conversa. Mande uma pergunta por vez.

**Abertura**
```
Oi! Aqui é o Eder 😊 Pra montar sua simulação do jeito certo, me responde 4 perguntinhas rápidas, combinado?
```

**1. Renda**
```
Somando todo mundo que vai comprar junto, qual é a renda BRUTA da família?
1️⃣ Até R$ 3.200
2️⃣ R$ 3.200 a R$ 5.000
3️⃣ R$ 5.000 a R$ 9.600
4️⃣ R$ 9.600 a R$ 13.000
5️⃣ Acima de R$ 13.000
```

**2. Comprovação**
```
E como você recebe?
1️⃣ Carteira assinada ou servidor/aposentado
2️⃣ Autônomo ou MEI
3️⃣ Sem comprovação
```

**3. Nome**
```
Seu nome está limpo hoje (sem restrição no SPC/Serasa)? Fica só entre a gente 🤐
1️⃣ Sim
2️⃣ Tenho pendência
3️⃣ Não sei
```

**4. Prazo**
```
Última! Quando você quer estar com a chave na mão?
1️⃣ O quanto antes
2️⃣ Nos próximos 3 meses
3️⃣ Só pesquisando por enquanto
```

**Classificação**
| Resultado | Regra | Ação |
|---|---|---|
| 🔥 Quente | Renda até R$ 13.000 + comprovação (1 ou 2) + nome limpo + prazo 1 ou 2 | Você assume na hora: "Você tem perfil! Vou montar sua simulação. Qual o melhor horário pra gente conversar?" |
| 🌤️ Morno | Uma pendência: nome, renda sem comprovação ou prazo 3 | Plano de preparo + follow-up em 3 e 7 dias |
| ❄️ Frio | Mais de uma pendência | Conteúdo educativo + reativação em 30 dias |
| 🏦 Fora do MCMV | Renda acima de R$ 13.000 | Simulação em outras linhas de financiamento |

**Resumo que chega para você (lead quente)**
```
🔥 {nome} | {telefone}
Renda: {faixa} | {comprovação}
Nome limpo: {sim/não} | Prazo: {prazo}
Origem: Instagram – SIMULAR
```

As perguntas sobre FGTS, entrada e região você faz na conversa, já com o lead qualificado.

### Respostas "fora do roteiro" (fase 1: fluxo + humano)

Configure em **cada uma das 4 perguntas**: se a resposta não for uma opção válida, o fluxo segue esta ordem.

**1ª resposta fora do roteiro (acolhe e repete a pergunta)**
```
Boa pergunta, {nome}! Vou te responder direitinho, prometo. 😊

Só preciso dessa informação antes pra não te passar nada errado. É só responder com o número:
{repete as opções da pergunta atual}
```

**2ª resposta fora do roteiro (transfere para o Eder)**
```
Entendi, {nome}! Sua dúvida merece uma resposta pessoal. Vou te passar pro Eder agora mesmo, ele já te responde por aqui. 🙏
```
→ marca `status:aguardando-eder` e `pendencia:fora-do-fluxo` → **aviso interno para o Eder:**
```
⚠️ LEAD COM DÚVIDA FORA DO FLUXO
👤 {nome} | 📱 {telefone}
📍 Origem: {origem}
❓ Parou na pergunta: {pergunta_atual}
💬 Última mensagem: "{ultima_mensagem}"
✅ Já respondeu: {respostas_coletadas}
```

**Áudio em vez de texto**
```
Recebi seu áudio, {nome}! 🎧 Pra eu seguir com sua análise agora, me responde só com o número da opção, tá bom?
{repete as opções}
```
(O Eder ouve o áudio depois, junto com o resumo.)

**Palavras-chave com resposta própria** (verificar antes da 1ª resposta fora do roteiro)

| O lead escreve algo com... | Resposta | Depois |
|---|---|---|
| "quanto fica", "parcela", "valor", "preço" | *"Ótima pergunta! A parcela depende da renda da família, e no Minha Casa Minha Vida ela não pode passar de 30% dela. Por isso eu não chuto número: com mais 2 ou 3 respostas eu já te dou uma noção real 😉"* | Repete a pergunta atual |
| "nome sujo", "negativado", "spc", "serasa" | *"Fica tranquilo(a), isso não fecha a porta! Muita gente que atendo começou assim. Já já te explico o caminho 🙏"* | Repete a pergunta atual |
| "não tenho como provar", "informal", "por fora", "autônomo" | *"Tem caminho sim! Renda informal pode ser comprovada com extratos ou abrindo um MEI. Já te explico melhor 💪"* | Repete a pergunta atual |
| "é golpe", "é confiável", "verdade" | *"Pergunta justa! Sou o Eder Lopes, corretor de imóveis com CRECI MS-7971, e atendo em Campo Grande. Você pode conferir meu registro no site do CRECI-MS. A simulação é gratuita e eu não peço nenhum pagamento 🙏"* | Repete a pergunta atual |
| "atendente", "humano", "falar com você", "eder" | *"Claro! Vou te passar pro Eder agora 🙏"* | Transfere na hora |

---

### Sequência para o lead QUENTE

**1. Resposta imediata (até 5 minutos depois da 4ª resposta)**
```
{nome}, ótima notícia: pelo que você me respondeu, você TEM PERFIL pro Minha Casa Minha Vida! 🎉🏡

Agora vem a parte que eu mais gosto: montar a SUA estratégia. Na simulação eu te mostro:
✅ Quanto você consegue financiar
✅ O valor da parcela
✅ Quanto do subsídio e do FGTS podem entrar na entrada

Leva uns 15 minutinhos. Qual horário fica melhor pra gente conversar?
1️⃣ Hoje
2️⃣ Amanhã de manhã
3️⃣ Amanhã à tarde ou à noite
```
Depois desta mensagem, mande um **áudio curto (20 a 30 segundos)** se apresentando com a sua voz.

**2. Confirmação do horário**
```
Fechado, {nome}! Ficou marcado pra {dia} às {hora}. 🗓️

Pra simulação sair certinha, deixa à mão (pode ser foto mesmo):
📄 RG e CPF (seu e de quem vai compor renda)
💼 Último holerite ou, se for autônomo/MEI, extratos dos últimos 3 meses
🏦 Saldo do FGTS (aparece no app FGTS)

Se não tiver tudo agora, sem problema: a gente começa assim mesmo. 😉
```

**3. Lembrete (2 horas antes)**
```
Oi {nome}! Passando pra lembrar da nossa conversa hoje às {hora}. Tô te esperando pra montar sua simulação! 🏡
```

**4. Se não responder à mensagem 1**
- **Depois de 2 horas:**
```
{nome}, sua análise ficou ótima e eu não queria deixar ela parada! 😊 Qual o melhor horário pra eu te ligar rapidinho?
```
- **No dia seguinte:**
```
Oi {nome}! Bom dia ☀️ Ontem vi que você tem perfil pro Minha Casa Minha Vida. Separei um horário hoje pra fazer sua simulação. Prefere de manhã ou à tarde?
```
- **Depois de 3 dias sem resposta:** passa para a retomada do morno (dias 3 e 7).

**5. Depois da simulação**
```
{nome}, foi um prazer conversar com você! Como combinamos:
💰 Valor financiável: R$ {valor}
📅 Parcela estimada: R$ {parcela}
🏦 Entrada estimada: R$ {entrada} (já considerando subsídio e FGTS)

Os valores são estimados e dependem da análise de crédito da Caixa.

Próximo passo: separei {n} opções de imóvel que cabem nesse número. Quer visitar no {dia sugerido}?
```

### Respostas para o lead MORNO (uma pendência)

**Nome com pendência**
```
{nome}, obrigado pela sinceridade! 🙏

Nome com pendência não fecha a porta, só muda a ordem dos passos:
1️⃣ Primeiro você consulta a dívida (app Serasa ou Registrato do Banco Central, grátis)
2️⃣ Negocia: muitas vezes sai com desconto grande e resolve rápido
3️⃣ Enquanto isso, eu já deixo sua simulação e documentação prontas

Assim que o nome limpar, a gente dá entrada sem perder tempo. Quer que eu te mande a lista de documentos pra ir adiantando?
```

**Renda sem comprovação**
```
{nome}, dá pra resolver! 💪

O banco precisa enxergar sua renda no papel. O caminho mais comum é:
1️⃣ Abrir um MEI (é gratuito e sai no mesmo dia)
2️⃣ Passar a receber pela conta do MEI e guardar os extratos
3️⃣ Com alguns meses de movimentação, a gente já consegue simular de verdade

Também dá pra somar a renda de quem vai morar com você, se essa pessoa tiver carteira assinada. Tem alguém assim na sua casa?
```

**Só pesquisando**
```
Perfeito, {nome}! Pesquisar antes é atitude de quem compra bem. 👏

Pela sua renda, você já se encaixa no Minha Casa Minha Vida, e isso significa juros menores e possibilidade de subsídio na entrada.

Faço uma proposta: te mando sua simulação agora, sem compromisso. Aí você pesquisa já sabendo quanto pode financiar e quanto fica a parcela. Pode ser?
```

**Retomada do morno**
- **Dia 3:**
```
Oi {nome}! Passando pra saber se deu pra olhar aquele primeiro passo que te mandei. Ficou alguma dúvida? Tô aqui pra te ajudar 😊
```
- **Dia 7:**
```
{nome}, o aluguel em Campo Grande subiu mais de 16% este ano. Cada mês esperando é dinheiro que não volta.

Se quiser, a gente monta junto o seu plano pra sair do aluguel ainda nos próximos meses. Me responde SIM que eu te chamo. 🏡
```

### Resposta para o lead FRIO (mais de uma pendência)

```
{nome}, obrigado pelas respostas! Pelo que vi, hoje ainda tem alguns pontos pra ajustar antes do financiamento. E tá tudo bem: quase todo cliente meu começou assim. 🙏

O caminho é passo a passo:
1️⃣ Regularizar o nome
2️⃣ Conseguir comprovar a renda (MEI ou somando renda com alguém da casa)
3️⃣ Aí sim, simulação e aprovação

Vou te mandar de vez em quando conteúdos curtos que ajudam nesse caminho. Quando resolver o primeiro ponto, me chama aqui que a gente segue pro próximo. Combinado?
```

**Reativação do frio (dia 30)**
```
Oi {nome}! Aqui é o Eder 😊 Faz um mês que a gente conversou sobre sua casa própria.

Conseguiu avançar em algum daqueles pontos (nome ou renda)? Se sim, já dá pra refazer sua análise. Me conta como está!
```

---

## 11. Checklist de implementação

- [ ] Criar os campos personalizados (seção 2)
- [ ] Criar as etiquetas (seção 2)
- [ ] Montar os blocos de 1 a 10
- [ ] Configurar as condições de classificação na ordem SBPE → FRIO → MORNO → QUENTE
- [ ] Configurar o aviso interno de lead quente
- [ ] Configurar a recuperação de 10 min, 24 h, 3 dias e 7 dias
- [ ] Conectar ao HubSpot
- [ ] **Testar com o seu próprio número** os 4 caminhos (quente, morno, frio e SBPE)
- [ ] Trocar a mensagem pré-preenchida de cada anúncio de WhatsApp para rastrear a origem
- [ ] Padronizar o CTA dos posts para **SIMULAR**
