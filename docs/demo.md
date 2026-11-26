# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

1. Siga o "Como rodar" do `README.md`: PostgreSQL de pé, `.env` preenchido, `npm install` e `npm start`.
2. Use um banco **sem doações** (por exemplo, recrie o contêiner do README), para os números da coordenação baterem com os deste roteiro.
3. No celular, na mesma rede Wi-Fi do computador, abra `http://<ip-do-computador>:3000`. Sem celular, use a emulação móvel do navegador em 360 × 800.

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:15 | O problema em uma frase: "Depois que a ONG aceitava, ninguém sabia se a comida tinha sido buscada, e a Marta não tinha como mostrar se a coleta está ficando mais rápida." | por que estas quatro histórias existem |
| 0:15–1:30 | Passos 1 a 6: o pão é publicado, aceito e coletado, e a padaria acompanha cada etapa | H1 e H2 de ponta a ponta |
| 1:30–2:10 | Passos 7 a 9: o bolo é aceito, a ONG tenta devolver sem motivo (erro) e depois devolve | H3 e um caso de erro tratado |
| 2:10–2:40 | Passo 10: o resultado do mês na tela da coordenação | H4 |
| 2:40–3:00 | O que falta (fim deste arquivo) | que o grupo conhece os limites do produto |

## Passo a passo reproduzível

Cada passo: **ação** → resultado esperado.

1. **Página inicial → "Sou um estabelecimento". Em "Nome do estabelecimento", digite `Padaria Pão Bom`. Publique `Pão francês`, `40 unidades`, validade amanhã.** → Aviso "Doação de "Pão francês" publicada com sucesso." e, em "Minhas doações", o pão como "Disponível, aguardando uma ONG".
2. **Voltar → "Sou uma ONG". Em "Nome da ONG", digite `Casa Esperança` e toque fora do campo. No pão, toque em "Reservar para coleta".** → Aviso "reservada para Casa Esperança"; o pão sai de "Disponíveis" e aparece em "Reservadas pela sua ONG".
3. **Voltar → "Sou um estabelecimento".** → O nome da padaria já vem preenchido e o pão aparece como "Aceita por Casa Esperança em …".
4. **Voltar → "Sou voluntário". Digite `Rui` em "Seu nome" e `Casa Esperança` em "ONG"; toque em "Ver doações para buscar".** → O pão aparece com "Doador: Padaria Pão Bom".
5. **Toque em "Confirmei a coleta".** → Aviso "Coleta de "Pão francês" confirmada por Rui." e a lista fica "Nenhuma doação aceita esperando coleta."
6. **Voltar → "Sou um estabelecimento".** → O pão aparece como "Coletada para Casa Esperança em …", com o horário da confirmação. O nome do voluntário não aparece para o doador (decisão 7).
7. **Publique `Bolo de fubá`, `2 bolos`, validade amanhã. Vá a "Sou uma ONG" (o nome Casa Esperança já vem preenchido) e reserve o bolo.** → O bolo aparece em "Reservadas pela sua ONG", com o campo "Motivo da devolução".
8. **Caso de erro: no bolo, deixe o motivo vazio e toque em "Devolver doação".** → Aviso vermelho "informe o motivo da devolução"; o bolo continua reservado.
9. **Digite `sem voluntário hoje` no motivo e toque em "Devolver doação".** → Aviso "Doação de "Bolo de fubá" devolvida. Ela voltou para a lista de disponíveis."; o bolo aparece em "Disponíveis", sem ONG, e some das reservadas.
10. **Voltar → "Coordenação".** → O mês atual já vem selecionado: Publicadas 2, Aceitas 1, Coletadas 1, Devolvidas 1 e "Tempo médio até a coleta" com as horas entre a publicação e a coleta do pão (na demo, "0 h", porque a coleta veio minutos depois). No histórico, o pão aparece como "coletada em …". Troque o mês para janeiro de 2025 e toque em "Ver resultado" → tudo 0 e "sem coletas no mês".

## O que falta

- Login para doador, ONG e voluntário: hoje cada um se identifica pelo nome digitado.
- Tirar da lista das ONGs a doação que venceu depois de publicada.
- Avisar o doador quando a doação é aceita, coletada ou devolvida.

## Testado por

| Quem (não escreveu o roteiro) | Quando | O que mudou depois |
|---|---|---|
| Yuri | 19/11 | versão anterior do roteiro (publicar, reservar e erro de campo vazio) |
| Yuri | 26/11 | nada |
