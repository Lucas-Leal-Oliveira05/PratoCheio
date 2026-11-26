# Validação — Prato Cheio

Linhas 1–3 e 7–12: critérios da Unidade 1 no `docs/analise.md`, como estão; 4–6: fatias da História 1 (Unidade 3); 13–24: H1 a H4. Testes em `tests/`, rodando sobre PostgreSQL no CI do `entrega-3`: [Actions do entrega-3](https://github.com/Lucas-Leal-Oliveira05/PratoCheio/actions?query=branch%3Aentrega-3). "Demo": passos do `docs/demo.md`.

| # | Critério de aceite | Status | Evidência |
|:--:|---|:--:|---|
| 1 | **História 1 · Critério 1 - Cadastro com informações obrigatórias.** **Dado** que o doador possui uma doação com tipo de alimento, quantidade e validade informados, **Quando** confirmar o cadastro da doação, **Então** a doação deve ser registrada com essas informações. | atende | cadastro.test.js: "registra a doação com tipo, quantidade e validade informados" |
| 2 | **História 1 · Critério 2 - Tentativa de cadastro com informações incompletas.** **Dado** que o doador está realizando o cadastro de uma doação, **Quando** tentar confirmar o cadastro sem informar o tipo de alimento, a quantidade ou a validade, **Então** o sistema deve informar que os dados obrigatórios precisam ser preenchidos. | atende | cadastro.test.js: "recusa cadastro sem quantidade e avisa que os campos são obrigatórios" |
| 3 | **História 1 · Critério 3 - Validade inválida.** **Dado** que o doador está cadastrando uma doação, **Quando** informar uma data de validade anterior ou igual à data atual, **Então** o sistema deve informar que a validade precisa ser futura para concluir o cadastro. | atende | cadastro.test.js: "recusa cadastrar doação com validade anterior a hoje" e "… igual a hoje" |
| 4 | **H1 · Fatia 1 (U3)** Validade de hoje ou anterior é recusada com "a validade precisa ser uma data futura" e não aparece para as ONGs. | atende | os testes da linha 3 conferem a mensagem e a lista vazia |
| 5 | **H1 · Fatia 2 (U3)** O calendário do formulário começa em amanhã. | não atende | `public/doador.html`: o campo de validade não tem `min` |
| 6 | **H1 · Fatia 3 (U3)** A recusa por campo vazio nomeia o campo que falta ("quantidade"). | parcial | cadastro.test.js: "recusa cadastro sem quantidade…"; a mensagem cita os três campos |
| 7 | **História 3 · Critério 1 - Exibição de doações disponíveis.** **Dado** que existem doações cadastradas, disponíveis e dentro da validade ou janela de retirada, **Quando** o representante da ONG acessar a área de doações, **Então** o sistema deve exibir as doações disponíveis. | atende | doacoes.test.js: "mostra a doação publicada na lista de disponíveis"; demo, passo 2 |
| 8 | **História 3 · Critério 2 - Não exibição de doações indisponíveis.** **Dado** que existe uma doação aceita por outra ONG ou com prazo de retirada expirado, **Quando** o representante da ONG visualizar as doações disponíveis, **Então** essa doação não deve ser exibida como disponível. | parcial | aceita: doacoes.test.js "remove a doação da lista de disponíveis depois de aceita"; expirada: continua na lista |
| 9 | **História 3 · Critério 3 - Informações exibidas.** **Dado** que existe uma doação disponível, **Quando** o representante da ONG visualizar a doação, **Então** deve conseguir identificar o tipo de alimento, a quantidade e a validade ou janela de retirada. | atende | demo, passo 2 ("Pão francês — 40 unidades (até …)"); a API devolve os três campos (linha 1) |
| 10 | **História 4 ★ · Critério 1 - Aceite de uma doação disponível.** **Dado** que existe uma doação disponível e dentro da validade ou janela de retirada, **Quando** o representante da ONG confirmar o aceite da doação, **Então** a doação deve ser reservada para essa ONG. | atende | doacoes.test.js: "marca a doação como aceita pela ONG" |
| 11 | **História 4 ★ · Critério 2 - Exclusividade da doação.** **Dado** que uma doação já foi aceita por uma ONG, **Quando** outra ONG tentar aceitar essa mesma doação, **Então** o sistema deve informar que a doação não está mais disponível. | atende | doacoes.test.js: "recusa aceitar uma doação que já foi aceita por outra ONG" |
| 12 | **História 4 ★ · Critério 3 - Doação aceita deixa de estar disponível.** **Dado** que uma ONG aceitou uma doação disponível, **Quando** outra ONG acessar a lista de doações disponíveis, **Então** a doação aceita não deve aparecer como disponível para novo aceite. | atende | doacoes.test.js: "remove a doação da lista de disponíveis depois de aceita" |
| 13 | **H1·CA1** A padaria publicou duas doações e a Casa Esperança aceitou uma: a padaria vê as duas, uma disponível e outra aceita pela Casa Esperança. | atende | minhas-doacoes.test.js: "mostra ao doador as duas doações, uma disponível e outra aceita pela ONG"; demo, passos 1 a 3 |
| 14 | **H1·CA2** A doação de outro doador não aparece para a padaria. | atende | minhas-doacoes.test.js: "não mostra ao doador as doações de outro doador" |
| 15 | **H1·CA3** Publicação sem doador é recusada com mensagem clara e nada é gravado. | atende | minhas-doacoes.test.js: "recusa a publicação sem doador e não grava nada" |
| 16 | **H2·CA1** Rui confirma a coleta da doação aceita: ela fica coletada, com o voluntário e o horário. | atende | coleta.test.js: "confirma a coleta de uma doação aceita, com o voluntário e o horário"; demo, passos 4 e 5 |
| 17 | **H2·CA2** Confirmar a coleta de doação disponível é recusado e a doação não muda. | atende | coleta.test.js: "recusa confirmar a coleta de uma doação ainda disponível e não muda a doação"; inversão de regra no PR da H2 |
| 18 | **H2·CA3** A doação coletada aparece como coletada para o doador. | atende | coleta.test.js: "a doação coletada aparece como coletada para o doador"; demo, passo 6 |
| 19 | **H3·CA1** A Casa Esperança devolve com "sem voluntário hoje": a doação volta à lista sem ONG e o motivo fica registrado. | atende | devolucao.test.js: "devolve a doação aceita: volta para a lista sem ONG e o motivo fica registrado"; demo, passo 9 |
| 20 | **H3·CA2** Devolver doação já coletada é recusado com mensagem. | atende | devolucao.test.js: "recusa devolver uma doação já coletada" |
| 21 | **H3·CA3** Outra ONG tenta devolver: é recusado e a doação continua aceita pela Casa Esperança. | atende | devolucao.test.js: "recusa a devolução feita por outra ONG e a doação continua aceita pela Casa Esperança" |
| 22 | **H4·CA1** Novembro com 3 publicadas, 2 aceitas e 1 coletada 5 h depois: a Marta vê 3, 2, 1 e "5 h". | atende | resultado-do-mes.test.js: "mostra 3 publicadas, 2 aceitas, 1 coletada e tempo médio de 5 h em novembro" (datas fixas de 2025) |
| 23 | **H4·CA2** Mês sem coleta: o tempo médio aparece como "sem coletas no mês", não zero nem erro. | atende | resultado-do-mes.test.js: "mostra "sem coletas no mês" no tempo médio quando nada foi coletado"; demo, passo 10 |
| 24 | **H4·CA3** Publicada em 31/10 e coletada em 01/11: o grupo decide o mês e o teste diz qual. | atende | decisão 9 (mês da publicação); resultado-do-mes.test.js: "doação publicada em 31/10 e coletada em 01/11 conta em outubro, o mês da publicação" |

## Critérios que não atendem — por quê

- **#5:** a regra vale no servidor (linha 4); falta o `min` de amanhã no calendário. Ficou de fora por ser só interface: o doador vê o erro ao enviar.
- **#6:** a recusa funciona, mas a mensagem cita os três campos; trocar o texto pede mudar junto os testes das linhas 2 e 4.
- **#8:** a doação que vence depois de publicada continua na lista, embora o aceite seja recusado. Falta filtrar `validade >= hoje` em `listarDisponiveis`.

## Mudanças de critério

- Validade e janela de retirada viraram um campo só (`validade`); "igual a hoje" é recusado no cadastro (RN13), mas a doação que vence hoje ainda pode ser aceita.
- O objetivo de impacto 1 mede minutos; a H4 mostra horas com uma casa, como pede o CA1 ("5 h") (decisão 9).
- Na H3, "sem rastro da ONG anterior" vale para a doação: quem devolveu e o motivo ficam em `devolucoes` (decisão 8).
- Não verificáveis: nenhum critério do quadro; as metas dos objetivos de impacto só se medem no piloto.

## Limitações do produto

- Doador e ONG se identificam pelo nome digitado, sem login: quem digitar o mesmo nome vê as mesmas doações, e um erro de digitação cria outro doador.
- A doação vencida depois de publicada continua na lista das ONGs (linha 8).
- O número de um mês ainda muda no início do mês seguinte, enquanto as últimas são coletadas.
- Não há notificação: o doador só vê que a doação foi aceita, coletada ou devolvida ao abrir "Minhas doações".

## Uso de IA

A IA escreveu a maior parte do código, dos testes e dos rascunhos; a evidência foi sempre o teste no CI e a demo no celular. H1: vimos os testes vermelhos antes do código. H2: rodamos a suíte com a regra invertida. H3: o diff da Refatoração 2 não toca em teste e mantém os 45 verdes. H4: no `psql`, `COUNT(*)` volta `bigint` e a média `numeric`; sem os casts, os testes ficam vermelhos.

**Erros da IA que corrigimos:** (1) na fatia 1 da H1, a API passou a exigir o doador mas a tela não o enviava; o campo veio para a mesma fatia. (2) Depois da H2, o histórico da coordenação ainda filtrava só `aceita` e a coletada sumia; vimos ao executar o roteiro e corrigimos com teste ("a doação coletada continua no histórico de aceites da coordenação").
