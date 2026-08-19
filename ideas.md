# Direções de design — Editor Markdown de Livros

## Três abordagens consideradas

### 1. Oficina Editorial
**Muito breve:** Um espaço de trabalho que parece uma mesa de edição de verdade: papel, tinta, uma faixa lateral escura e a hierarquia serena de um livro bem composto. A intenção é fazer a organização técnica do Markdown parecer uma prática editorial acessível.

**Probabilidade:** 0.07

### 2. Fichário Modernista
**Muito breve:** Uma linguagem inspirada em fichas catalográficas, tipografia suíça e separadores de arquivo, com blocos geométricos e códigos cromáticos muito nítidos. O resultado seria mais sistemático e operacional.

**Probabilidade:** 0.04

### 3. Sala de Leitura Noturna
**Muito breve:** Uma experiência escura e silenciosa, derivada de salas de leitura e capas literárias contemporâneas, com painéis em carvão e páginas que emergem em tons de marfim. O foco seria uma revisão concentrada à noite.

**Probabilidade:** 0.08

---

## Direção escolhida: Oficina Editorial

### Movimento de design
**Editorial contemporâneo com ecos de tipografia de livro e interfaces de oficina.** A aplicação combina a materialidade do papel impresso com a clareza funcional de um ambiente profissional de edição.

### Princípios centrais

1. **O manuscrito é o protagonista.** O preview usa papel claro, serifas generosas e margens amplas; controles jamais competem com o texto.
2. **Estrutura visível, não opaca.** Atos, capítulos, inclusão na montagem e estado de edição aparecem como uma espinha dorsal organizada na interface.
3. **Ferramentas com densidade calma.** A área de trabalho oferece recursos completos sem transformar a tela em uma coleção de cartões genéricos.
4. **Sinais materiais e precisos.** Divisores finos, marcas de registro, numeração e acentos de tinta substituem efeitos decorativos em excesso.

### Filosofia de cor

O papel não deve ser branco clínico: o fundo principal será um **marfim aquecido** para reduzir fadiga visual e sugerir uma página física. Carvão profundo ancora a navegação e transmite foco. O acento é um carmim de tinta, aplicado apenas em ações editoriais, seleção e estados decisivos; ele sugere a marca de revisão sem conotar erro permanente. Cinzas quentes organizam superfícies e separadores sem depender de bordas pesadas.

### Paradigma de layout

Uma composição assimétrica em três planos: uma **coluna de espinha** fixa para a arquitetura do livro, um **plano de edição** que se expande para escrita e um **plano de página física** para leitura e impressão. Em telas menores, esses planos tornam-se uma sequência de painéis, mantendo a mesma ordem mental: estruturar, editar, montar.

### Elementos de assinatura

1. Uma marca circular de “colofão” composta por linhas e páginas, usada no cabeçalho e favicon.
2. Réguas finas de composição, numeração editorial e pequenos traços carmim em títulos/seleções.
3. Cartões de página com sombra de prensa suave e uma borda superior de registro, como provas de impressão.

### Filosofia de interação

Ações frequentes são diretas e silenciosas: edição autosalva na memória e mudanças de organização recebem feedback visual discreto. Ações de saída — baixar ZIP, gerar PDF e abrir a impressão — ganham mais presença e confirmação. Drag-and-drop é reforçado por um ponto de pega e uma linha de inserção, nunca por animações excessivas.

### Animação

Transições de 140–220 ms, com a curva `cubic-bezier(0.23, 1, 0.32, 1)`. A mudança de capítulo desloca somente a superfície de edição por alguns pixels com opacidade, sem atrasar a digitação. Painéis laterais e menus partem de 95% de escala e baixa opacidade; usuários com preferência por redução de movimento recebem transições minimizadas.

### Sistema tipográfico

**DM Sans** organiza a interface, rótulos e controles em pesos 500–700. **Source Serif 4** compõe texto, preview e páginas impressas, em 400–700. **Playfair Display** é reservada a página de rosto, títulos de ato e a marca, criando contraste dramático sem invadir a área de edição. Títulos trabalham em caixa normal e linhas compactas; metadados usam versaletes e espaçamento moderado.

### Essência de marca

**O ateliê digital para autores que precisam transformar capítulos Markdown em um livro revisável e imprimível, sem depender de ferramentas de diagramação complexas.**

Personalidade: **criteriosa, literária e serena**.

### Voz da marca

Headlines são diretas e editoriais; CTAs usam verbos de ofício, com especificidade e sem frases publicitárias vazias.

> “Dê forma ao manuscrito antes de levá-lo à impressão.”

> “Monte a leitura que o seu livro pede.”

### Wordmark e logo

A marca combina um **colofão circular abstrato** — três lâminas de página dentro de um aro aberto — com o nome “Caderno” em Playfair Display. A interface usa prioritariamente o símbolo, não um texto em fonte padrão.

### Cor de marca

**Tinta Carmim — `#B64036`**. Uma cor de assinatura aplicada com moderação como evidência de decisão editorial.

## Style Decisions

O colofão circular deve funcionar como um selo de editora perceptível na escala da aplicação, repetindo-se discretamente em cabeçalhos, fólios e dossiês. Painéis secundários usam a lógica de ficha catalográfica, nota de prova e inventário de oficina; superfícies de dashboard genéricas só são aceitas quando traduzidas para essa linguagem material. A hierarquia operacional combina DM Sans em controles, Source Serif 4 no manuscrito e Playfair Display exclusivamente em marca e drama de prova, com versaletes e espaçamento medido para metadados e rótulos de produção.
