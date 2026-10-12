# World2D

Sandbox 2D procedural e extensível por mods, criado como projeto pessoal e experimento de desenvolvimento assistido por IA.

O projeto começou com uma proposta simples: construir um jogo 2D genérico inspirado em jogos sandbox como Minecraft e observar até onde uma IA generativa poderia auxiliar na criação e evolução de um jogo com sistemas progressivamente mais complexos.

## Identificação

- **Projeto:** World2D
- **Aluno:** Pedro Henrique
- **Código do aluno:** 04145413
- **Contexto:** projeto pessoal / experimental
- **Repositório:** `yRickzC/World2D`

## Objetivo

O World2D tem como objetivo oferecer um ambiente sandbox procedural em que o jogador possa explorar e interagir com um mundo composto por sistemas independentes de gameplay.

Além do jogador tradicional, o projeto também considera criadores de mods e desenvolvedores como usuários do sistema, permitindo que novos conteúdos sejam adicionados sem alterar diretamente o núcleo principal do jogo.

## Funcionalidades principais

Entre as funcionalidades existentes e em desenvolvimento estão:

- geração e gerenciamento de mundo procedural;
- inventário e hotbar;
- sistema de itens e blocos;
- entidades e spawning;
- interação com o mundo;
- crafting;
- clima e ciclo de mundo;
- sistema de mods com validação, versionamento e dependências;
- interface de desenvolvimento/modding;
- renderização em Canvas;
- game loop próprio.

## Tecnologias atuais

O projeto atualmente utiliza principalmente:

- **TypeScript**;
- **React 19**;
- **Vite**;
- **Tailwind CSS**;
- **HTML Canvas** para renderização do jogo;
- **JSZip** para manipulação de pacotes;
- **Motion** para animações de interface;
- **Lucide React** para ícones;
- **Node.js / npm** como ambiente de desenvolvimento.

O projeto também possui dependências experimentais relacionadas ao uso de IA generativa durante o desenvolvimento.

## Como executar

### Requisitos

- Node.js instalado;
- npm instalado.

### Instalação

```bash
npm install
```

### Executar em desenvolvimento

```bash
npm run dev
```

Por padrão, o Vite inicia o projeto na porta `3000`.

### Build

```bash
npm run build
```

### Verificação de tipos

```bash
npm run lint
```

## Organização atual

O projeto cresceu de forma incremental e atualmente possui uma organização modular parcial.

```text
src/
├── core/
│   ├── CoreSystem.ts
│   ├── configuracao/
│   ├── engine/
│   └── utilitarios/
│
├── gameplay/
│   ├── BlockSystem/
│   ├── EntitySystem/
│   ├── ItemSystem/
│   ├── ModSystem/
│   ├── crafting/
│   ├── entidades/
│   ├── interacao/
│   ├── inventario/
│   ├── mundo/
│   └── sistemas/
│
├── mods/
├── sistemas/
├── ui/
├── dev/
├── App.tsx
└── main.tsx
```

### Core

O `core` concentra responsabilidades consideradas fundamentais ao funcionamento da engine, incluindo versionamento do Core e o game loop.

O `CoreSystem` também possui regras de compatibilidade de versão utilizadas pelo sistema de mods.

### Gameplay

A camada `gameplay` concentra a maior parte das regras e sistemas do jogo. Ela é dividida em subsistemas como entidades, blocos, itens, inventário, crafting, interação, mundo e mods.

### ModSystem

O sistema de mods possui componentes responsáveis por:

- geração de pacotes de mod;
- validação;
- resolução de dependências;
- registro de itens e blocos;
- controle de compatibilidade com a versão do Core;
- rollback quando um mod falha durante o carregamento.

Os mods utilizam namespaces próprios para reduzir conflitos entre conteúdos.

### UI

A interface é construída em React. O `GameCanvas` funciona atualmente como um dos principais pontos de integração do jogo, conectando renderização, mundo, chunks, inventário, crafting, entidades, clima, áudio e outros sistemas.

Essa concentração de responsabilidades é um dos principais pontos identificados para evolução arquitetural.

## Análise arquitetural resumida

O projeto conseguiu atingir o objetivo inicial de criar rapidamente um MVP de sandbox com diferentes sistemas funcionando em conjunto. O inventário e a estrutura inicial de mods são exemplos de partes que se mostraram úteis e reutilizáveis.

Entretanto, o crescimento experimental também produziu alguns problemas arquiteturais:

- alto acoplamento entre determinadas partes do sistema;
- responsabilidades de simulação e apresentação parcialmente misturadas;
- dependência de registries e objetos globais em alguns subsistemas;
- dificuldade para alterar o sistema de mods sem afetar partes já existentes do mundo;
- fronteiras pouco claras entre alguns módulos;
- tendência de componentes centrais acumularem responsabilidades conforme novas funcionalidades são adicionadas.

## Direcionadores arquiteturais

Os principais fatores que direcionam a evolução do projeto são:

1. **Extensibilidade:** novos conteúdos e mods devem ser adicionados sem exigir alterações constantes no núcleo.
2. **Desempenho:** o projeto pretende evoluir para simulações com milhares de entidades ativas simultaneamente.
3. **Evolução do sistema:** o Core deve continuar crescendo sem aumentar excessivamente o acoplamento entre gameplay, interface e integrações externas.

As características arquiteturais priorizadas são **modificabilidade, desempenho e extensibilidade**.

## Evolução arquitetural proposta

A principal evolução planejada é separar progressivamente a simulação do jogo da camada de apresentação.

A proposta é transformar o Core em um runtime independente, com fronteiras explícitas entre:

```text
Apresentação / UI
       │
       ▼
Input / Commands
       │
       ▼
Core / Simulação
       │
       ├── Mundo
       ├── Entidades
       ├── Sistemas
       └── Regras do gameplay
       │
       ├── Rendering Adapter
       ├── Mod API
       └── AI Adapter
```

A interface não deve ser responsável por controlar diretamente a simulação. Ela deve apresentar o estado do jogo e enviar comandos ao Core.

## Migração futura para Rust

Como evolução de longo prazo, existe a intenção de migrar o Core e a simulação para **Rust**.

A escolha está relacionada principalmente a:

- desempenho;
- controle de memória;
- paralelismo;
- previsibilidade do runtime;
- necessidade futura de processar milhares de entidades simultaneamente.

A apresentação deverá permanecer desacoplada do Core, permitindo que a representação visual evolua sem alterar as regras fundamentais da simulação.

Apesar de o jogo ser visualmente 2D, o mundo possui conceito de altura. Por isso, o Core deve representar o estado do mundo de forma independente da maneira como ele é renderizado.

## Evolução futura: Redes Neurais Evolutivas

A principal necessidade futura utilizada como direcionador para a revisão arquitetural é a integração de **Redes Neurais Evolutivas (RNE)** para NPCs.

A proposta considera um mundo com potencialmente milhares de NPCs autônomos. Cada NPC poderá possuir uma rede neural própria e aprender durante sua existência.

Os NPCs deverão receber apenas dados estruturados e observáveis do mundo e utilizar o mesmo conjunto básico de ações disponibilizado pelo Core, por exemplo:

- mover;
- pegar;
- usar;
- atacar;
- soltar;
- colocar;
- comunicar.

A IA não deverá conhecer antecipadamente o significado específico de itens adicionados pelo jogo ou por mods. Ela deverá experimentar ações e aprender suas consequências.

### Evolução genética

Quando NPCs se reproduzirem, características de suas redes poderão ser combinadas e sofrer mutações. NPCs que morrerem sem transmitir seus genes desaparecem da população.

Não haverá necessariamente uma pontuação global de sucesso. A própria sobrevivência no ambiente, reprodução, fome, frio, animais, idade e competição funcionarão como pressões de seleção.

### StudySystem

Um sistema separado, chamado provisoriamente de `StudySystem`, deverá manter dados históricos sobre características genéticas que surgiram ao longo das gerações.

O objetivo não é controlar quais NPCs sobrevivem, mas permitir posteriormente a análise de informações como:

- genes associados a maior longevidade;
- reprodução;
- locomoção;
- resistência a ameaças;
- características que desapareceram da população;
- genealogia e gerações.

### Serviço de IA

A proposta atual é manter o processamento das redes em um serviço separado escrito em **Python**.

```text
World2D / Core em Rust
        │
        │ comunicação assíncrona
        ▼
Serviço de IA em Python
        │
        ├── RNE do NPC A
        ├── RNE do NPC B
        ├── RNE do NPC C
        └── ...
```

Um único serviço deverá processar múltiplas redes em lote, evitando a criação de um processo separado para cada NPC.

A comunicação poderá ser realizada por uma interface assíncrona, como WebSocket, para que a simulação continue executando enquanto decisões são processadas.

O estado persistente do mundo deverá incluir também informações necessárias para reconstruir NPCs, redes neurais, memórias, genealogia, gerações e histórico do `StudySystem`.

## Decisão arquitetural principal

A principal decisão proposta é:

> Migrar progressivamente o runtime do World2D para um Core independente em Rust, separando simulação, apresentação e serviços externos, de forma que o mundo possa suportar milhares de entidades e futuramente integrar um serviço Python de Redes Neurais Evolutivas sem acoplar a IA ao jogo.

Essa decisão busca preparar o projeto para crescimento sem exigir uma reescrita completa de todos os componentes ao mesmo tempo.

## Trade-offs

### Separação entre UI e Core

**Decisão:** transformar a simulação em um Core independente da interface.

**Benefício:** menor acoplamento, maior testabilidade e possibilidade de utilizar diferentes formas de apresentação.

**Consequência:** necessidade de criar contratos claros para troca de estado e comandos entre interface e runtime.

### Serviço externo de IA

**Decisão:** executar as RNEs em um serviço Python independente.

**Benefício:** permite evoluir a implementação de IA sem misturar bibliotecas e regras de aprendizado ao Core do jogo.

**Consequência:** adiciona comunicação entre processos, sincronização de estado e necessidade de lidar com indisponibilidade ou atraso do serviço.

## Desenvolvimento

O World2D é um projeto experimental desenvolvido por Pedro Henrique com auxílio de IA generativa durante diferentes etapas do desenvolvimento.

Essa característica faz parte do contexto do projeto: o crescimento rápido permitiu validar funcionalidades e construir um MVP, mas também evidenciou a necessidade de rever responsabilidades, dependências e limites entre os módulos antes de evoluir para uma simulação significativamente maior.

## Status

O projeto encontra-se em desenvolvimento e sua arquitetura ainda está sendo revisada. As seções de migração para Rust e Redes Neurais Evolutivas representam **direções futuras e propostas arquiteturais**, não funcionalidades concluídas na versão atual.
