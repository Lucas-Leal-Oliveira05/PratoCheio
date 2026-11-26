# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

Requisitos:
- URL do banco supabase no arquivo .env
- Caso queira executar testes, é necessário postgre local

comandos necessários:

```bash
git clone https://github.com/Lucas-Leal-Oliveira05/PratoCheio.git
cd PratoCheio
npm install
npm start
```
após estes comandos em sequencia, acessar http://localhost:3000
(para executar teste, comando "run db:migrar", em seguida "npm test")

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | estabelecimentos têm alimentos sobrando que podem ser perdidos, enquanto ONGs necessitam de comida para suas ações. | o por que de o produto existir |
| 0:20–1:50 |  Publicar uma doação como estabelecimento e reservá-la como ONG. Mostrar que ela sai da lista de disponíveis. | A história principal funciona ponta a ponta e os dados persistem no banco. |
| 1:50–2:30 | Tentar publicar uma doação sem preencher a quantidade. | O sistema valida campos obrigatórios e apresenta uma mensagem de erro em vez de cadastrar dados incompletos. |
| 2:30–3:00 | Mostrar o histórico de doações aceitas para maior controle e visibilidade para vigilância. | que o grupo conhece o estado atual, os limites e as necessidades do produto. |

## Passo a passo reproduzível

1. Acessar localhost:3000 / Deve carregar a página
2. Clicar em "Sou um estabelecimento" / Envia o usuário para o crud de doações
3. Preencha os todos os campos (tipo de alimento -> Sopa // Quantidade -> 10) e insira uma data necessariamente futura para validade e retirada / Todos os campos ficam preenchidos
4. Clique em "Publicar doação" // caso preenchido corretamente, uma doação será criada com as informações inseridas nos campos e aparecerá como disponível
5. Volte para a página inicial
6. CLique em "Sou uma ONG" // envia para a página para a ONGs
7. Preencher campo nome da ONG // Campo fica preenchido
8. Na doação disponível, clique em "Reservar coleta" // Registra doação como reservada para a ONG cujo nome estava preenchido no campo e retira da lista de disponíveis

Erro tratado:
1.Volte para a página inicial
2. Clique em "Sou um estabelecimento" // envia para página de crud de doações
3. preencha os campos da doação (tipo de alimento -> feijoada // quantidade -> deixe vazio) e preencha a data com valor necessariamente futuro // os campos ficam preenchidos, menos quantidade
4. Clique em "Publicar doação" // cadastro é recusado e aparece um erro: "tipo, quantidade e validade são obrigatórios"

## Passos novos do Trabalho 3 (no navegador do celular)

**H1 · Minhas doações**
1. Em "Sou um estabelecimento", digite `Padaria Pão Bom` em "Nome do estabelecimento" e publique `Pão francês` / `40 unidades` / validade amanhã // a doação aparece em "Minhas doações" como "Disponível, aguardando uma ONG".
2. Em "Sou uma ONG", com o nome `Casa Esperança`, clique em "Reservar para coleta" no pão // aviso "reservada para Casa Esperança".
3. Volte a "Sou um estabelecimento" // o nome da padaria continua preenchido e o pão aparece como "Aceita por Casa Esperança em …".

**H2 · Coleta confirmada**
1. Em "Sou voluntário", digite `Rui` em "Seu nome" e `Casa Esperança` em "ONG", e toque em "Ver doações para buscar" // o pão da Padaria Pão Bom aparece na lista.
2. Toque em "Confirmei a coleta" // aviso "Coleta de "Pão francês" confirmada por Rui." e o pão sai da lista.
3. Volte a "Sou um estabelecimento" // o pão aparece como "Coletada para Casa Esperança em …", com o horário da confirmação.

**H3 · Devolução**
1. Como `Padaria Pão Bom`, publique `Bolo de fubá` / `2 bolos` / validade amanhã. Em "Sou uma ONG", com `Casa Esperança`, reserve o bolo // o bolo sai de "Disponíveis" e aparece em "Reservadas pela sua ONG".
2. Troque o nome da ONG para `Cozinha Solidária`, volte a `Casa Esperança` e, no bolo, deixe o motivo vazio e toque em "Devolver doação" // erro "informe o motivo da devolução"; o bolo continua reservado.
3. Digite `sem voluntário hoje` no motivo e toque em "Devolver doação" // aviso "devolvida. Ela voltou para a lista de disponíveis."; o bolo aparece em "Disponíveis", sem ONG.
4. Em "Sou um estabelecimento" // o bolo aparece de novo como "Disponível, aguardando uma ONG".

**H4 · Resultado do mês**
1. Na página inicial, toque em "Coordenação" // o mês atual já vem selecionado e os números aparecem: o pão conta como publicada, aceita e coletada; o bolo como publicada e devolvida; "Tempo médio até a coleta" mostra as horas entre a publicação e a coleta do pão.
2. Troque o mês para um mês sem doações (por exemplo, janeiro de 2025) e toque em "Ver resultado" // tudo zero e o tempo médio "sem coletas no mês".

## Testado por

Outro integrante executou este roteiro sem ajuda: **Yuri**, em **19/11**.
