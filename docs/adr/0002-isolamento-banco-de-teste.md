# ADR 0002 — Testes usam sempre o próprio banco e a limpeza recusa outro banco

- **Data:** 22/10/2026
- **Status:** aceito

## Contexto
O piloto já tinha doações reais cadastradas. Uma pessoa da equipe da Marta rodou os testes na máquina do piloto com a configuração apontando para o banco real, e a limpeza dos testes apagou todas as doações. A Marta pediu que isso não possa acontecer de novo.

Lendo o código, o caminho do acidente é este:

- `src/db.js` abre o arquivo indicado em `DATABASE_FILE` (padrão `dados.sqlite`).
- A única coisa que manda os testes para um banco separado é `env: { DATABASE_FILE: ':memory:' }` no `vitest.config.js`. Basta rodar com outra configuração (`npx vitest -c outra.config.js`), editar esse arquivo ou usar outro executor de testes para o `DATABASE_FILE` da máquina valer.
- `limparBanco()` executa `DELETE FROM doacoes` no banco que estiver aberto, sem conferir qual é.

Ou seja, a proteção dependia de uma configuração externa, e a operação destrutiva não tinha nenhuma barreira própria.

## Alternativas consideradas
1. **Manter como está e documentar** ("nunca rode os testes com `DATABASE_FILE` do piloto")
   - Prós: nenhum código novo.
   - Contras: depende de cada pessoa lembrar da regra. Foi exatamente isso que falhou.
2. **Os testes usam sempre o próprio banco**: sob o Vitest, `src/db.js` ignora `DATABASE_FILE` e abre SQLite em memória.
   - Prós: nenhuma configuração externa troca o banco dos testes, e o banco em memória some ao fim da execução.
   - Contras: só protege quando o código roda sob o Vitest. Um script avulso que chame a limpeza ainda alcançaria o banco real.
3. **A limpeza confere o banco em uso e recusa** se não for o de teste.
   - Prós: a barreira fica na própria operação destrutiva e vale para qualquer forma de chamá-la.
   - Contras: sozinha, ainda deixa os testes rodarem contra o banco real. Inserções e aceites dos testes sujariam os dados do piloto.
4. **Alternativas 2 e 3 combinadas** — **escolhida**.

## Decisão
Combinar as alternativas 2 e 3 em `src/db.js`:

- quando `process.env.VITEST` está definido (o Vitest define essa variável ao rodar), o banco é sempre `:memory:`, qualquer que seja o `DATABASE_FILE`;
- `limparBanco()` lança erro e não apaga nada se o banco em uso não for `:memory:`;
- `vitest.config.js` deixa de definir `DATABASE_FILE`, para não parecer que a proteção mora ali.

A alternativa 1 é a situação que causou o acidente. A 2 e a 3, cada uma sozinha, deixam um dos danos possível: a 2 não impede um script avulso de apagar o banco real, e a 3 não impede os testes de sujar o banco real. Juntas, cobrem os dois.

## Consequências
- **Positivas:** os testes não apagam nem alteram o banco do piloto em nenhuma máquina, e o teste que prova isso roda no CI a cada PR. A regra fica no código, não na memória das pessoas.
- **Negativas / o que abrimos mão:** não dá mais para rodar a suíte contra um arquivo SQLite de verdade, por exemplo para depurar um problema que só aparece com arquivo em disco. Quem paga é a equipe de desenvolvimento, que precisa de um script à parte para isso. Os testes de isolamento sobem processos Node separados e deixam a suíte um pouco mais lenta (cerca de meio segundo).
- **Riscos e o que fazer se der errado:** se alguém trocar o Vitest por outro executor de testes, a variável `VITEST` deixa de existir e a proteção da alternativa 2 para de valer; a da alternativa 3 continua impedindo a limpeza. Quem trocar o executor precisa adaptar a alternativa 2 no mesmo PR. Na Unidade 3, o "é o banco de teste?" muda de `:memory:` para o nome do banco PostgreSQL (ver Revisão de 22/10/2026 no ADR 0001).

## Rastreabilidade
- **Stakeholders (Análise):** a Marta espera "um piloto funcional que permita acompanhar as doações e mostre resultados". Perder as doações quebra exatamente isso.
- **RN12 (Rastreabilidade)** e a Vigilância Sanitária: as doações apagadas eram o registro de tipo, quantidade, validade e ONG.
- **Risco do ADR 0001** "Ter testes afetados por dados compartilhados entre integrantes", que aconteceu no sentido inverso: os testes afetaram os dados reais.

## Critério de validação
`npm test` passa, incluindo `tests/isolamento-banco.test.js`. Ele cria um arquivo SQLite com uma doação, fazendo o papel do banco do piloto, e verifica que:
- sob o Vitest, mesmo com `DATABASE_FILE` apontando para esse arquivo, o banco usado é `:memory:` e a doação continua lá;
- fora do Vitest, `limparBanco()` falha e a contagem de doações continua 1.

Se alguém remover qualquer uma das duas proteções, esses testes falham.