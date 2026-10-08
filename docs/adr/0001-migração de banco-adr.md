# ADR 0001 — Migração de SQLite para Supabase (PostgreSQL)

- **Data:** 08/10/26
- **Status:** Aceito

## Contexto
Atualmente, o PratoCheio utiliza SQLite como banco de dados. Essa escolha é adequada para as primeiras etapas do projeto, pois permite executar a aplicação localmente sem configurar um servidor de banco de dados separado.

Entretanto, com a evolução do sistema, torna-se interessante utilizar um banco de dados centralizado, acessível pelos integrantes da equipe e preparado para a continuidade do desenvolvimento. O PostgreSQL oferece recursos que podem apoiar a evolução do sistema e a validação das regras de negócio.

O Supabase foi escolhido como plataforma para disponibilizar o PostgreSQL sem exigir que a equipe mantenha manualmente um servidor. Além do banco gerenciado, a plataforma oferece recursos adicionais que poderão ser avaliados futuramente, caso sejam necessários.

A migração ocorrerá somente na Unidade 3 porque as Unidades 1 e 2 priorizam a implementação e a validação do fluxo principal do Walking Skeleton: cadastrar uma doação, disponibilizá-la para consulta e permitir que uma ONG a aceite, tornando-a indisponível para outras instituições.

Antecipar a migração aumentaria o esforço de configuração, adaptação e testes antes de o comportamento central estar consolidado. Manter o SQLite nas primeiras unidades reduz esse risco e permite concentrar o trabalho na entrega dos requisitos funcionais.

## Alternativas consideradas

**Alternativa A** — Permanecer com SQLite

**Prós**:

- Configuração simples e execução local.
- Não depende de conexão com um serviço externo.
- Baixo custo operacional para desenvolvimento e testes.
- Evita adaptações no código de persistência durante as primeiras unidades.

**Contras**:

- Os dados ficam vinculados ao ambiente em que o banco é executado, salvo se houver compartilhamento ou sincronização adicional.
- Não permite validar a aplicação com PostgreSQL durante o desenvolvimento.
- Adia a identificação de incompatibilidades entre SQLite e PostgreSQL.
- A equipe precisará realizar a migração em uma etapa posterior.

**Alternativa B** — PostgreSQL instalado localmente

**Prós**:

- Permite utilizar um banco de dados cliente-servidor.
- Não exige depender de um serviço hospedado para executar o banco.
- Possibilita validar as consultas e regras de negócio com PostgreSQL.

**Contras**:

- Cada integrante precisa instalar e configurar o banco, ou depender de uma instância compartilhada.
- Versões, credenciais, portas e configurações diferentes podem gerar problemas de integração.
- A equipe assume a manutenção e a atualização do servidor.
- O compartilhamento dos dados entre os integrantes exige configuração adicional.

**Alternativa C** — PostgreSQL em contêiner Docker

**Prós**:

- Permite padronizar a versão e a configuração do banco.
- Facilita recriar o ambiente de desenvolvimento.
- Permite executar o banco localmente sem uma instalação tradicional no sistema operacional.

**Contras**:

- Exige Docker instalado e funcionando nas máquinas dos integrantes.
- A equipe precisa gerenciar contêineres, volumes, atualizações e cópias de segurança.
- O compartilhamento de dados entre integrantes exige uma instância acessível ou sincronização adicional.

**Alternativa D** — PostgreSQL gerenciado pelo Supabase — **escolhida**

**Prós**:

- Disponibiliza PostgreSQL sem exigir que a equipe mantenha um servidor local.
- Permite que os integrantes autorizados utilizem uma base compartilhada.
- Reduz o esforço de configuração e manutenção da infraestrutura do banco.
- Facilita a continuidade do projeto caso a aplicação seja hospedada futuramente em outro ambiente.
- Oferece recursos adicionais, como autenticação e armazenamento de arquivos, que poderão ser avaliados se forem necessários ao projeto.

**Contras**:

- O desenvolvimento e os testes de integração dependem de conectividade com o serviço, salvo quando forem configurados ambientes locais alternativos.
- A equipe fica sujeita aos limites, à disponibilidade e às condições do plano utilizado.
- É necessário administrar credenciais, permissões e acesso à base compartilhada.
- A equipe passa a depender de um provedor externo e precisa planejar a exportação ou restauração dos dados.

## Decisão
Migrar o banco SQLite para PostgreSQL hospedado no Supabase, utilizando a conexão PostgreSQL da plataforma a partir do backend do PratoCheio.

Essa alternativa foi escolhida por reduzir a necessidade de manutenção de infraestrutura e permitir o compartilhamento do banco entre os integrantes. A permanência no SQLite não atenderia ao objetivo de validar a aplicação com PostgreSQL; a instalação local ou em contêiner exigiria que a equipe gerenciasse o servidor, enquanto o Supabase oferece essa infraestrutura como serviço.

O Supabase será utilizado inicialmente como provedor do banco de dados. Recursos adicionais da plataforma somente serão adotados se houver necessidade identificada e uma decisão específica da equipe.

Até a Unidade 3, o SQLite continuará sendo utilizado para evitar antecipar o custo da migração.

## Consequências

**Consequências positivas**
- Os integrantes autorizados poderão acessar uma base de dados compartilhada.
- A equipe não precisará instalar e manter um servidor PostgreSQL para o ambiente principal de desenvolvimento.
- Será possível validar o comportamento da aplicação com PostgreSQL antes de uma eventual implantação.
- A equipe poderá identificar incompatibilidades de SQL e problemas de integridade durante a migração.
- A infraestrutura de persistência ficará preparada para a continuidade do desenvolvimento.

**Consequências negativas**

| Consequência ou risco | Quem paga | Mitigação |
|---|---|---|
| Adaptar consultas e acesso aos dados | Responsável pelo backend | Migrar as consultas e executar testes de regressão |
| Configurar o projeto e as credenciais do Supabase | Responsável por DevOps e backend | Documentar as variáveis de ambiente e o procedimento de conexão |
| Administrar permissões de acesso à base | Responsável pela configuração do Supabase | Conceder somente os acessos necessários e não compartilhar credenciais privilegiadas indiscriminadamente |
| Depender de internet e da disponibilidade do serviço | Toda a equipe | Documentar a dependência e definir como executar os testes quando o serviço estiver indisponível |
| Atingir limites do plano ou precisar de recursos pagos | Equipe responsável pelo projeto | Monitorar o consumo e confirmar os limites vigentes do plano utilizado |
| Perder dados por erro de migração ou alteração do esquema | Responsável pela persistência | Fazer exportação ou cópia de segurança antes da migração e validar a restauração |
| Ter testes afetados por dados compartilhados entre integrantes | Responsáveis pelo backend e pelos testes | Isolar os dados de teste e garantir limpeza controlada após cada execução |

**Plano de retorno**

Se a migração impedir a execução dos fluxos principais e o problema não puder ser corrigido no prazo da entrega, a equipe irá retornar temporariamente à versão anterior da aplicação com SQLite.

O retorno exige utilizar a versão compatível do código e do esquema. Os dados armazenados no Supabase não poderão ser simplesmente copiados para o SQLite como se os formatos fossem idênticos, ou seja, caso necessário preservar os dados, a equipe deverá exportá-los e definir um procedimento de conversão.

**Validação**

A migração deverá preservar o comportamento funcional do PratoCheio. A mudança de banco não poderá alterar as regras de cadastro, consulta, validade e aceite de doações.

| O que deve continuar igual | Como validar |
|---|---|
| A aplicação consegue conectar ao banco | Iniciar o backend com as variáveis de ambiente configuradas e executar uma requisição de saúde ou uma operação de consulta |
| Os dados permanecem após reiniciar o backend | Teste de integração que cadastra uma doação, reinicia a conexão e consulta o registro |
| O cadastro exige tipo, quantidade e validade | Testes automatizados para cada campo obrigatório |
| Uma ONG consegue aceitar uma doação disponível | Teste de integração que confirma o aceite bem-sucedido |
| Uma segunda ONG não consegue aceitar a mesma doação | Teste de integração que verifica a rejeição da segunda tentativa |
| Doações vencidas não podem ser aceitas | Teste de integração com uma doação cuja validade esteja no passado |
| Os fluxos já implementados continuam funcionando | Executar `npm test` com os testes adaptados para PostgreSQL no Supabase |


## Rastreabilidade

**Requisitos e riscos relacionados**

RN03 — Aceite exclusivo: uma doação aceita por uma ONG não pode ser aceita por outra.
RN07 — Validade: uma doação vencida não pode ser aceita.
RN08 — Disponibilidade: somente doações disponíveis podem ser aceitas.
RN14 — Expiração automática: doações que ultrapassam a validade ou a janela aplicável devem deixar de estar disponíveis, conforme a regra definida na análise.
Risco de não concluir o Walking Skeleton: a manutenção do SQLite nas primeiras unidades reduz o trabalho de infraestrutura e prioriza a implementação do fluxo principal.

A migração está relacionada à preparação da persistência e à validação das regras de negócio com PostgreSQL. Ela não garante, por si só, o cumprimento das regras: a aplicação e os testes devem continuar assegurando o comportamento esperado.


## Revisão - Backup mensal do banco para Vigilância Sanitária

**Data**: 08/10/26
**Status**: Valido com complemento de escopo

## O que mudou no contexto?

Foi acrescentado um novo requisito ao projeto: a Vigilância Sanitária solicitará mensalmente uma cópia dos dados armazenados no banco de dados (backup).

Essa mudança exige que o projeto contemple um procedimento de exportação periódica dos dados necessários à rastreabilidade das doações. A exportação deverá incluir, no mínimo, as informações de tipo de alimento, quantidade e validade, além de outros dados relevantes disponíveis, como identificação da doação, estabelecimento doador, ONG destinatária e datas das operações.

Também será necessário definir o formato da cópia, o período abrangido e o prazo de entrega.

## O que deixa de valer?

Nenhuma decisão deixa de valer.

A decisão de migrar do SQLite para PostgreSQL hospedado no Supabase na Unidade 3 permanece válida. Entretanto, a implementação da persistência passa a incluir também a necessidade de exportar os dados mensalmente para atender à solicitação da Vigilância Sanitária.

## O que continua válido no projeto?

Tudo descrito anterioemnte ainda esta válido.

Isso acontece pois o Supabase ainda atende à necessidade de utilizar um banco PostgreSQL compartilhado e gerenciado. O novo requisito acrescenta uma responsabilidade de exportação e entrega dos dados, mas não exige, por si só, a substituição da tecnologia escolhida.

## Consequências

A equipe deverá incluir no planejamento uma rotina mensal de exportação e validação dos dados, definir os responsáveis pela geração e entrega e confirmar com a Vigilância Sanitária o formato esperado.

A exportação deverá ser testada para garantir que contenha os campos exigidos, corresponda aos registros consultados no banco e possa ser aberta ou importada pelo destinatário.

## Validação

A revisão será considerada atendida quando houver um procedimento testado que:

- Gere a cópia mensal a partir dos dados do Supabase.
- Inclua os campos de rastreabilidade definidos com a Vigilância Sanitária.
- Permita conferir os registros exportados com os dados de origem.
- Preserve os registros originais do banco.
- Proteja o arquivo durante o armazenamento e a transferência.
- Registre a data de geração e a entrega da cópia.