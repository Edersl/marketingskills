# Esteira de Crédito Imobiliário

Programa para a rede da imobiliária. Ele acompanha cada cliente desde o momento em que o corretor envia para análise até a averbação na prefeitura.

Um PC fica como **servidor**. Todos os outros (corretores, analista de crédito, gestor) abrem pelo navegador. Não usa internet, não tem mensalidade e os dados ficam dentro da imobiliária.

## Como instalar (uma vez, no PC servidor)

1. Escolha um PC que fique ligado durante o expediente.
2. Instale o **Node.js versão LTS** em https://nodejs.org (é só avançar no instalador).
3. Copie a pasta `esteira-credito` para esse PC (por exemplo em `C:\esteira-credito`).
4. Dê dois cliques em **`iniciar.bat`**.
   - Vai abrir uma janela preta mostrando os endereços.
   - Se o Windows perguntar sobre o firewall, clique em **Permitir acesso** (rede privada).
5. No navegador desse PC, abra `http://localhost:3210` e crie o usuário do gestor.

## Como os outros PCs acessam

- A janela do servidor mostra uma linha assim: `Nos outros PCs: http://192.168.0.10:3210`.
- Em cada PC da equipe, abra esse endereço no Chrome ou no Edge e salve nos favoritos.
- **Dica:** peça ao técnico de informática para fixar o IP do PC servidor no roteador. Assim o endereço nunca muda.

## Quem faz o quê

| Papel | O que pode fazer |
|---|---|
| **Corretor** | Cadastra o cliente, envia para análise, vê só os próprios clientes, anexa documentos, comenta e resolve pendências |
| **Analista de crédito** (colaboradora) | Trabalha todas as etapas, conclui, devolve ao corretor ou encerra processos |
| **Gestor** | Tudo o que a analista faz, mais o painel, os usuários, a configuração e o backup |

Quando alguém envia, conclui uma etapa, devolve ou comenta, **os outros PCs recebem o aviso em até 10 segundos.**

## As 15 etapas da esteira

| # | Etapa | Prazo | O sistema só deixa avançar quando… |
|---|---|---|---|
| 1 | Cadastro do cliente | 1 dia | dados obrigatórios preenchidos e CPF válido |
| 2 | Consulta de CPF | 1 dia | checklist feito e resultado "CPF bom" |
| 3 | Análise de crédito no banco | 5 dias | crédito aprovado, com o valor de financiamento |
| 4 | Contrato de compra e venda | 3 dias | a composição fecha no valor de compra e não passa do aprovado |
| 5 | Documentação e pasta | 7 dias | todos os documentos obrigatórios conferidos |
| 6 | Envio da pasta ao banco | 2 dias | data de envio registrada |
| 7 | Avaliação de engenharia | 10 dias | laudo recebido, com o valor de avaliação |
| 8 | Espelho da proposta | 2 dias | espelho conferido contra CCV, crédito e laudo |
| 9 | Conformidade | 7 dias | conformidade aprovada |
| 10 | Contrato do banco e assinatura | 7 dias | assinado por todas as partes |
| 11 | ITBI | 5 dias | ITBI pago |
| 12 | Registro em cartório | 30 dias | contrato registrado |
| 13 | Retorno ao banco e liberação | 7 dias | recurso liberado ao vendedor |
| 14 | Averbação na prefeitura | 15 dias | averbação concluída |
| 15 | Concluído | — | chaves entregues |

### O que acrescentei ao fluxo original

- **Etapa 13, retorno ao banco:** o contrato registrado volta ao banco para liberar o dinheiro ao vendedor. Sem ela, a construtora não recebe.
- **Conferência da composição no contrato de compra e venda:** sinal + entrada + FGTS + subsídio + financiamento + desconto precisa dar exatamente o valor de compra. Financiamento e subsídio não podem passar do que o banco aprovou.
- **Alerta automático de laudo abaixo do valor de compra.** Nesse caso a entrada do cliente pode aumentar, então o corretor precisa ser avisado na hora.
- **Espelho com tabela de conferência** entre banco, laudo e contrato de compra e venda, para pegar divergência antes da conformidade.
- **Itens de MCMV na consulta de CPF:** CADMUT (financiamento habitacional ativo) e se o cliente já é proprietário de imóvel.
- **Validade curta de documentos** lembrada na pasta: matrícula de até 30 dias e certidões do vendedor.
- **Pendência e encerramento:** devolver ao corretor com motivo e encerrar processo, tudo registrado no histórico.

Para mudar etapas, prazos ou checklists, edite só o arquivo `public/etapas.js` e reinicie o servidor.

## A consulta de CPF é manual

O programa **não consulta SPC, Serasa ou Boa Vista sozinho**. Essas consultas exigem um contrato pago com o birô. A analista consulta no serviço que a imobiliária já usa e registra o resultado no checklist:

- **Receita Federal:** situação cadastral do CPF, no site da Receita.
- **SPC, Serasa ou Boa Vista:** pelo contrato do birô que a imobiliária assina.
- **Registrato (Banco Central):** o próprio cliente emite pelo gov.br e envia.
- **Protestos:** pela central de protestos dos cartórios.

Se a imobiliária tiver API de um birô, dá para integrar depois.

## Impressos

Dentro do processo:
- **Imprimir quadro-resumo:** os valores da compra, com campo de assinatura.
- **Imprimir checklist da pasta:** a lista de documentos para conferir na mão.

## Dados, LGPD e backup

- **Onde ficam os dados:** tudo fica na pasta `data` do PC servidor. Os documentos anexados ficam em `data/arquivos`.
- **Backup automático:** o sistema guarda uma cópia por dia, dos últimos 30 dias, em `data/backups`.
- **Backup do gestor:** de vez em quando, baixe o backup completo em **Equipe e configuração**. Os anexos não entram nesse arquivo, então copie também a pasta `data` inteira para um pen drive ou para a nuvem da empresa.
- **Senhas:** cada pessoa tem o próprio usuário e senha. O corretor só vê os clientes dele.
- **Antivírus:** não apague nem coloque a pasta `data` em quarentena.

## Demonstração para reuniões

Em **Equipe e configuração**, o botão **Carregar processos de demonstração** cria 8 clientes fictícios. Também cria três usuários de teste:

| Usuário | Senha |
|---|---|
| carla | demo123 |
| diego | demo123 |
| ana | demo123 |

**Use a demonstração numa instalação separada, nunca no servidor com clientes reais.**

## Problemas comuns

- **"Não consegui falar com o servidor":** a janela preta do servidor foi fechada ou o PC desligou. Abra o `iniciar.bat` de novo.
- **Outro PC não abre o endereço:** confira se os dois PCs estão na mesma rede e se o firewall do servidor liberou o Node.js.
- **Trocar a porta:** antes de iniciar, defina a variável `PORT` (por exemplo `set PORT=8080` no Windows).
