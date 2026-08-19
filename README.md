# Caderno — Editor Markdown de Livros

**Caderno** é um aplicativo web client-side para organizar, revisar e montar livros a partir de um conjunto de arquivos Markdown. Ele foi pensado para autores e preparadores que precisam passar de capítulos em `.md` para uma prova de impressão sem enviar o manuscrito a um servidor.

## Fluxo de uso

Importe um arquivo `.zip` ou escolha uma pasta. O projeto pode conter um `index.json` com os metadados e a ordem dos capítulos, arquivos `.md` e uma pasta `assets/` com imagens. Caso não haja `index.json`, o Caderno organiza os Markdown por ordem alfanumérica e permite reordená-los por arrastar e soltar.

| Área | Função |
| --- | --- |
| **Editar** | Altera o texto Markdown, o título exibido e o ato de cada capítulo, com pré-visualização ao vivo. |
| **Montagem** | Compõe capa, sumário, aberturas de ato e capítulos em páginas de prova. |
| **Impressão** | Configura formato, margens, tipografia, entrelinha, recuo e elementos da montagem. |
| **Exportar** | Baixa um capítulo em `.md`, o projeto inteiro em `.zip` ou abre o diálogo do navegador para salvar a prova como PDF. |

## Estrutura de entrada recomendada

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

O `index.json` é opcional. Quando utilizado, deve seguir esta forma:

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

As imagens Markdown podem usar caminhos relativos, como `![Mapa](assets/mapa.png)`. Durante a sessão, elas são resolvidas para URLs locais em memória e também são preservadas no ZIP exportado.

## Desenvolvimento

Instale as dependências com `pnpm install` e inicie o ambiente local com `pnpm dev`. Execute `pnpm check` para a validação de tipos e `pnpm build` para gerar a versão de produção.

> Os arquivos importados permanecem apenas no estado da sessão do navegador. Recarregar a página limpa o manuscrito que não foi exportado.

## Limitação de paginação

A prova apresenta uma página por capítulo e por abertura de ato, além de estilos de impressão para A4, A5, Carta ou tamanho customizado. A numeração exibida é uma composição de prova; para uma paginação editorial definitiva, valide o PDF gerado pelo navegador conforme a impressora, o navegador e a fonte instalados no ambiente de destino.
