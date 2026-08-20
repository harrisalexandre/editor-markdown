# Diagnóstico de divergência entre prévia e PDF

## Conclusão executiva

Os três bugs têm a mesma origem: o Caderno possui **três contextos de layout distintos** para o mesmo manuscrito. A prévia lateral de edição usa um bloco fluido para leitura; a montagem usa caixas visuais de página; e o PDF é produzido pela janela nativa do navegador sob regras de `@media print` e `@page`. Eles compartilham dados React, mas não compartilham uma única árvore de layout paginado.

> **Não há LaTeX, Pandoc, Puppeteer ou serviço de PDF no fluxo atual.** A ação “Gerar prova em PDF” chama `window.print()`, e o PDF é criado pelo mecanismo de impressão do navegador.

| Camada | Componente/regra | Objetivo atual | Problema |
|---|---|---|---|
| Prévia da edição | `.chapter-proof` + `.markdown-body` | Leitura rápida do capítulo | Usa largura, padding e fonte próprios em pixels; ignora a maior parte da geometria editorial. |
| Montagem em tela | `BookPages` + `.book-page` | Simular o livro como pilha de páginas | Cada capítulo é uma caixa visual; não mede nem fragmenta texto longo em páginas físicas. |
| Prova PDF | `print-root` + `BookPages` + `@media print` + `@page` | Impressão pelo navegador | O navegador fragmenta o fluxo em páginas físicas usando regras diferentes das duas prévias em tela. |

## Causa raiz dos bugs relatados

### 1. Paginação errada na visualização

O **Registro de fólios** criado na montagem é estrutural, não tipográfico: ele atribui uma entrada para capa, sumário, ato e capítulo, independentemente da quantidade de texto. Assim, um capítulo de 300 palavras e um de 30 mil palavras recebem uma única “página prevista”. A função de prévia não consulta largura disponível, métrica da fonte, entrelinha, imagens, notas nem quebras do navegador.

A própria montagem em tela também não é um paginador. O elemento `.book-page` recebe a largura do trim (`--page-width`) e uma altura mínima, mas o capítulo permanece um único elemento de DOM. Para texto extenso, ele cresce/ultrapassa a caixa na tela; no modo de impressão, o navegador fragmenta esse fluxo segundo a regra de páginas impressas. Portanto, a posição de quebra vista na montagem não pode coincidir com a quebra do PDF.

Há ainda uma diferença importante de geometria: na tela, `.book-page-content` usa padding lateral de `--print-side`; na impressão com margens espelhadas, a regra `.print-mirrored .book-page-content` zera o padding lateral e transfere a margem para `@page :left`/`@page :right`. Isso torna o bloco disponível ao texto diferente entre tela e impressão.

### 2. Fonte gigante na pré-visualização

A prévia lateral não usa a tipografia de composição. A regra `.markdown-body` aplicada à prévia fixa a fonte em:

```css
font: 400 15px/1.75 "Source Serif 4", Georgia, serif;
```

Já a montagem e a impressão usam as variáveis editoriais:

```css
font-family: var(--book-font);
font-size: var(--book-font-size); /* configurado em pt */
line-height: var(--book-line-height);
```

Como consequência, a prévia lateral mistura **pixels fixos** com uma configuração editorial expressa em **pontos tipográficos**. Ela também usa uma largura fluida de até 540 px e padding em px, não o trim e as margens em mm. Essa é a causa do aspecto desproporcional e da largura de linha incompatível com um livro real.

### 3. Configuração de corpo não reflete na tela

O estado do formulário está sendo atualizado corretamente: `settings.fontSize`, `settings.bodyFont`, `settings.lineHeight`, cor e margem são convertidos em variáveis CSS no contêiner principal. A montagem `BookPages` consome essas variáveis em `.book-markdown`.

O problema está no consumidor da prévia lateral. Ela renderiza uma `div.markdown-body`, que recebe a regra fixa em `15px/1.75` acima e não recebe a classe `.book-markdown`. Logo, não há falha de propagação do estado React; há uma **quebra de contrato de estilo**: a prévia utiliza outro seletor e valores literais que vencem a intenção das configurações.

## A prévia e o PDF usam o mesmo motor?

Eles usam o **mesmo navegador**, mas não o mesmo processo de layout nem as mesmas regras:

| Questão | Resposta |
|---|---|
| Existe um gerador PDF separado? | Não. O PDF vem de `window.print()` no navegador. |
| A prévia lateral usa CSS de impressão? | Não. Ela usa `.chapter-proof` e `.markdown-body` em tela. |
| A montagem em tela usa o mesmo DOM do PDF? | Parcialmente. Ambas renderizam `BookPages`, mas a impressão usa uma segunda instância dentro de `print-root` e ativa `@media print`. |
| A paginação física é a mesma? | Não. Somente a impressão aplica `@page`, margens esquerda/direita, fragmentação, `break-before`, órfãs e viúvas. |

Portanto, o problema não é “CSS versus LaTeX”; é **uma simulação de páginas em tela versus paginação real no modo print**. Enquanto ambos não usarem uma única saída paginada, qualquer contador de páginas será apenas estimativa.

## Plano de correção recomendado

### Fase 1 — Unificar geometria e tipografia

Criar um único contrato `BookLayout` derivado de `PrintSettings`: trim, caixa de texto, margens, gutter, fonte, tamanho em pt, entrelinha, recuo e cores. Todas as visualizações devem consumi-lo por variáveis CSS idênticas.

Em especial, substituir a prévia `.chapter-proof` por uma versão reduzida do componente de página editorial, com dimensões físicas em mm e escala CSS apenas no contêiner externo. A regra fixa `.markdown-body { font: 15px/1.75 ... }` deve deixar de definir tipografia para o manuscrito editorial. Assim, mudar fonte, tamanho, entrelinha, cor ou margem atualiza a prévia imediatamente.

### Fase 2 — Usar um único paginador para prévia e PDF

Adotar uma camada de paginação CSS Paged Media no cliente — por exemplo, **Paged.js** — e gerar uma única árvore de páginas fragmentadas. A mesma árvore deve alimentar:

1. a montagem em tela, com páginas e quebras reais;
2. o Registro de fólios, usando o número das páginas geradas e não uma contagem estrutural;
3. a janela de impressão, imprimindo somente essa árvore paginada.

Isso elimina a fórmula de “um capítulo = uma página prevista” e permite contabilizar corretamente capítulos longos, imagens e espaços em branco necessários para recto/verso.

### Fase 3 — Consolidar as regras de impressão

Manter `@page` como fonte de verdade para tamanho, margens e páginas esquerda/direita. O conteúdo não deve declarar simultaneamente largura de trim inteira dentro de uma área já reduzida pelas margens de `@page`; a caixa de texto deve ser dimensionada uma única vez. Também é necessário remover duplicações entre padding em `BookPages` e margens de `@page`.

### Fase 4 — Garantir o fluxo de exportação

O botão de PDF deve imprimir apenas o resultado paginado consolidado. No diálogo do navegador, a interface deve instruir o usuário a usar **escala 100%**, **margens: nenhuma** e **cabeçalhos/rodapés do navegador desativados**; essas configurações externas ainda podem alterar um PDF mesmo quando o CSS está correto.

## Critérios de aceite

| Cenário | Resultado esperado |
|---|---|
| Alterar corpo de 9 pt para 15 pt | A prévia muda imediatamente e a quantidade de páginas é recalculada. |
| Alterar margem, gutter ou A5/A4 | A largura de linha e quebras da prévia mudam antes de exportar. |
| Capítulo com várias páginas | A montagem mostra cada fragmento físico e o PDF preserva a mesma sequência. |
| Sumário e introdução | Fólios romanos aparecem nas mesmas páginas em tela e no PDF. |
| Início em recto | A prévia mostra a página em branco/verso quando necessária e o PDF repete a decisão. |

## Ordem de implementação sugerida

1. Corrigir a prévia de edição para consumir `BookLayout` e remover fontes/larguras fixas.
2. Substituir o Registro de fólios estrutural por resultado de paginação real.
3. Integrar o paginador comum e imprimir a mesma árvore gerada.
4. Criar um conjunto de regressão com A5, margens espelhadas, imagem, capítulos longos, pré-textual romano e capítulos em recto.

Nenhuma dessas correções foi implementada nesta etapa, conforme solicitado.
