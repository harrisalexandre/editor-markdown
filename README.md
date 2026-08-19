# Caderno — Editor Markdown de Livros

O **Caderno** é um ateliê digital para organizar, revisar e montar livros a partir de arquivos Markdown. O aplicativo funciona inteiramente no navegador: o manuscrito permanece na sessão local enquanto você edita capítulos, testa a ordem da leitura e prepara uma prova para impressão.

## Teste público

Após a conclusão da publicação automática, a versão de teste ficará disponível em **[harrisalexandre.github.io/editor-markdown](https://harrisalexandre.github.io/editor-markdown/)**. A cada alteração enviada para a branch `main`, o fluxo de publicação compila o aplicativo e atualiza esse endereço.

> A primeira publicação pode levar alguns minutos depois do push. Se a página ainda não abrir, consulte a aba **Actions** do repositório e aguarde a execução `Deploy to GitHub Pages` terminar.

## Roteiro de teste

| Passo | O que fazer | Resultado esperado |
| --- | --- | --- |
| 1 | Abra o link público e escolha **Abrir livro-exemplo**. | A árvore de atos, o editor e a prova de leitura devem aparecer. |
| 2 | Edite um parágrafo em Markdown. | A pré-visualização ao lado deve refletir a alteração imediatamente. |
| 3 | Reordene capítulos pela alça de arrastar ou desmarque um capítulo. | A estrutura e a montagem devem respeitar a nova sequência e as inclusões. |
| 4 | Envie um `.zip` com `index.json`, `.md` e `assets/`. | Título, autoria, atos, capítulos e imagens locais devem ser importados. |
| 5 | Abra **Montagem** e depois **Impressão**. | Capa, sumário, aberturas de ato e páginas de capítulo devem responder às configurações. |
| 6 | Clique em **Preparar prova** e escolha salvar como PDF no navegador. | A janela de impressão deve abrir com texto selecionável e páginas em formato de livro. |

## Estrutura de arquivo recomendada

```text
meu-livro.zip
├── index.json
├── prologo.md
├── capitulo-01.md
├── capitulo-02.md
└── assets/
    ├── capa.jpg
    └── mapa.png
```

O arquivo `index.json` é opcional. Caso exista, ele define metadados e a sequência da montagem:

```json
{
  "titulo": "Nome do Livro",
  "autor": "Nome do Autor",
  "descricao": "Sinopse curta",
  "capitulos": [
    { "arquivo": "capitulo-01.md", "titulo": "Capítulo 1 — Nome", "ato": "Ato I — Nome do Ato" }
  ]
}
```

As imagens podem ser referenciadas por caminhos relativos, como `![Mapa](assets/mapa.png)`. O Caderno as resolve em memória durante a sessão e preserva os arquivos no ZIP atualizado.

## Recursos incluídos

O ambiente permite importar ZIP ou pasta, editar Markdown em preview ao vivo, criar/reordenar/incluir capítulos, alterar atos e títulos exibidos, baixar capítulos isolados e exportar o projeto completo. A área de montagem compõe folha de rosto, sumário, aberturas de ato e páginas de capítulo. As configurações de impressão ajustam tamanho de página, margens, tipografia, ritmo de leitura, cabeçalhos e numeração.

## Desenvolvimento local

Instale as dependências com `pnpm install`, use `pnpm dev` para iniciar o ambiente de desenvolvimento e execute `pnpm check` para validar tipos. O comando abaixo cria a versão de produção com o mesmo caminho usado pelo GitHub Pages:

```bash
VITE_BASE_PATH=/editor-markdown/ pnpm build
```

## Limitações conhecidas

O estado do livro não é persistido após recarregar a página, portanto exporte o ZIP antes de sair. A paginação apresentada é uma prova visual com uma página por capítulo e por abertura de ato; a paginação definitiva deve ser conferida no PDF do navegador conforme fonte, sistema operacional e impressora usados.

## Referência

O repositório-fonte é [harrisalexandre/editor-markdown](https://github.com/harrisalexandre/editor-markdown). O fluxo de publicação utiliza GitHub Pages e é definido em `.github/workflows/deploy-pages.yml`.
