# Validação funcional — importação de livro

## Livro de teste usado

O fixture local contém `index.json`, os arquivos `abertura.md` e `capitulo-01.md`, além de `assets/marca.svg`. O `index.json` define título, autora, descrição, títulos exibidos, atos e ordem dos capítulos.

## Resultado antes da correção

A importação do ZIP foi aceita, reconheceu os dois arquivos Markdown e aplicou os metadados, a ordem e os atos definidos no `index.json`. A árvore apresentou corretamente as seções `Prelúdio` e `Ato I`. A primeira verificação mostrou, contudo, que a sanitização de HTML removia o atributo `src` da imagem extraída e que um heading Markdown igual ao título do capítulo era duplicado na prova.

## Correções aplicadas

- A sanitização do Markdown agora permite URLs locais `blob:` para imagens extraídas em memória.
- A extração do ZIP infere o MIME type pela extensão do arquivo, inclusive `image/svg+xml`.
- O heading Markdown inicial é omitido da prova apenas quando corresponde exatamente ao título configurado do capítulo.

## Verificação concluída

Após reimportar o mesmo ZIP, o título de capítulo passou a aparecer uma única vez na prova e a imagem SVG local foi exibida por meio de uma URL `blob:` válida. A aba **Montagem** gerou a capa, o sumário, uma abertura para cada ato e páginas de capítulo em A5. A aba **Impressão** apresentou os controles de formato, margens, tipografia, escopo e elementos de montagem, todos refletidos no preview e na folha de estilos de impressão.
