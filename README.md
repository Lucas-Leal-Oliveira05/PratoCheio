# Prato Cheio

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Bruno Lima Costa — @brunocosta-dev
- Gabriel Vitório Gonçalves — @GabrielVitorioGoncalves
- Lucas Leal de Oliveira — @lucas-leal-oliveira05
- Yuri David Arins Cidral — @YuriDavid1

## Histórias do Trabalho 3: dono e revisor

| Iteração | História | Dono | Revisor |
|---|---|---|---|
| 0 | Iteração 0 (README, definição de pronto, estados da doação) | Yuri | Gabriel |
| 1 | H1 · O doador acompanha as suas doações | Yuri (fatias 1 e 2) e Gabriel (fatia 3) | Gabriel (fatias 1 e 2) e Yuri (fatia 3) |
| 2 | H2 · O voluntário confirma a coleta | Gabriel | Lucas |
| 3 | H3 · A ONG devolve uma doação aceita + Refatoração 2 | Lucas | Bruno |
| 4 | H4 · A Marta vê o resultado do mês | Bruno | Yuri |
| F | Fechamento (validação, demo, retrospectiva, `entrega-3`) | Bruno | todos |

## Como rodar

O produto roda sobre **PostgreSQL**. Requisitos:

- **Node.js 22.13 ou superior**
- **Um PostgreSQL acessível**, com dois bancos: um para o produto e outro só para os testes

### 1. Subir o banco

Com Docker (o mais rápido):

```bash
docker run --name pratocheio-db -e POSTGRES_USER=pratocheio -e POSTGRES_PASSWORD=pratocheio \
  -e POSTGRES_DB=pratocheio -p 5432:5432 -d postgres:16-alpine
docker exec pratocheio-db createdb -U pratocheio pratocheio_test
```

Sem Docker, instale o PostgreSQL 16 e crie os bancos `pratocheio` e `pratocheio_test` (pelo pgAdmin ou com `createdb`).

### 2. Configurar o `.env`

Copie o `.env.example` para `.env` e ajuste usuário e senha. Exemplo com o contêiner acima:

```bash
DATABASE_URL=postgres://pratocheio:pratocheio@localhost:5432/pratocheio
DATABASE_URL_TEST=postgres://pratocheio:pratocheio@localhost:5432/pratocheio_test
```

O `.env` está no `.gitignore`: a senha real nunca vai para o repositório. O `DATABASE_URL_TEST` precisa apontar para um banco **só de testes**, porque a suíte apaga as doações antes de cada teste.

### 3. Os comandos

```bash
npm install       # instala as dependências (só na primeira vez)
npm run db:migrar # cria ou atualiza as tabelas no banco do DATABASE_URL
npm start         # sobe em http://localhost:3000
npm test          # roda os testes no banco do DATABASE_URL_TEST
```

`npm start` também roda a migração antes de subir, então o `db:migrar` só é necessário para preparar o banco sem subir a aplicação. Para desenvolver, `npm run dev` sobe recarregando a cada alteração.

Para abrir no celular, acesse `http://<ip-do-computador>:3000` na mesma rede Wi-Fi.

## O banco

A migração de SQLite para PostgreSQL foi decidida no [ADR 0001](docs/adr/0001-migração%20de%20banco-adr.md) e executada na Refatoração 1 ([docs/refatoracoes.md](docs/refatoracoes.md)). O `src/db.js` expõe `query()` devolvendo `{ rows }`, então a troca do banco ficou contida nele e não vazou para as regras de negócio.

O CI (`.github/workflows/ci.yml`) sobe um `postgres:16-alpine` como serviço e roda os testes sobre ele a cada push e PR.

Os testes nunca usam o banco do `DATABASE_URL`: sob o Vitest o `src/db.js` só conecta no `DATABASE_URL_TEST`, e o `limparBanco()` recusa qualquer outro banco ([ADR 0002](docs/adr/0002-isolamento-banco-de-teste.md)). Sem `DATABASE_URL_TEST`, ele cai no SQLite em memória que sobrou da Unidade 1, e os testes que usam SQL do PostgreSQL falham: configure o `.env` antes do `npm test`.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão, schema e migração do banco
src/app.js           rotas da API
src/doacoes.js       regras de negócio
src/repositorio.js   acesso ao banco (SQL)
public/              telas (funcionam no celular)
tests/               testes automatizados
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

Nada entra direto na `main`:

```bash
git checkout main && git pull
git checkout -b h1/doador-na-publicacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "Publicação exige o doador"
git push -u origin h1/doador-na-publicacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e peça a revisão de **outro integrante**. Antes do merge, atualize o branch com a `main`. Depois do merge, confira o CI da `main`: se ficar vermelho, ninguém integra mais nada até ela voltar a ficar verde.

## Definição de pronto

Pronto, no nosso grupo, é:

- [ ] O CI do PR está verde, rodando sobre PostgreSQL — onde se confere: aba Checks do PR
- [ ] O PR foi aprovado por um integrante que não é o autor — onde se confere: aba Reviews do PR
- [ ] Cada critério de aceite da fatia tem um `it` com o nome da regra (não `it.todo`), e a história tem pelo menos um caso limite ou de erro — onde se confere: diff do PR, pasta `tests/`
- [ ] A descrição do PR tem a história, o critério de origem, as fatias e o Uso de IA preenchidos — onde se confere: descrição do PR
- [ ] Regra em `src/doacoes.js`, SQL só em `src/repositorio.js` com `$1, $2…` no lugar dos valores — onde se confere: diff do PR
- [ ] Decisão que muda o modelo está em `## Decisões de projeto` de `docs/projeto.md` — onde se confere: diff do PR
- [ ] Se o PR mexe em tela, ela abre em 360 × 800 sem rolagem horizontal (RNF02) — onde se confere: tela do celular ou emulação móvel do navegador

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar, corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado com IA e o que vocês alteraram.
