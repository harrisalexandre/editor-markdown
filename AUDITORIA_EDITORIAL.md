# Auditoria do motor editorial — Caderno

## Escopo e método

> **Status considerados:** “Existe e funciona”, “Parcial” e “Não existe”. A avaliação considera exclusivamente o aplicativo client-side atual: interpretação Markdown no navegador, montagem visual em HTML/CSS, impressão pelo navegador e ePub gerado em ZIP. Não há um motor paginador dedicado, servidor de renderização ou pipeline XeLaTeX/Pandoc nesta versão.

O salvamento automático local solicitado diretamente foi implementado nesta entrega. Ele persiste texto, estrutura, metadados e configurações no `localStorage` do mesmo navegador; imagens precisam ser reenviadas após uma restauração, pois dados binários não são armazenados nesse mecanismo.

## Auditoria por recurso

| Área | Recurso | Status | Situação atual e lacuna principal |
|---|---|---:|---|
| Página e trim | A5, A4, Carta e tamanho customizado | **Existe e funciona** | A prova e a impressão aceitam formatos básicos e medidas personalizadas. |
| Página e trim | Margens assimétricas com gutter | **Não existe** | Há apenas margem superior, inferior e lateral única. |
| Página e trim | Margens espelhadas par/ímpar | **Não existe** | O CSS atual não conhece paridade física de página. |
| Página e trim | Sangria full-bleed | **Não existe** | A capa ocupa página, mas não há controle de bleed ou marcas de corte. |
| Capítulos | Capítulo em página própria | **Parcial** | A composição inicia cada capítulo em uma página visual, mas capítulos extensos fluem sem paginação física controlada. |
| Capítulos | Início no recto com página em branco | **Não existe** | Exige cálculo de paridade em um motor paginado. |
| Capítulos | Espaço fixo até título | **Parcial** | Há espaçamento CSS configurado visualmente, sem controle exposto por capítulo. |
| Capítulos | Suprimir cabeçalho/rodapé na primeira página | **Não existe** | Cabeçalho e fólios são definidos globalmente. |
| Capítulos | Capitular | **Existe e funciona** | Há ativação, fonte, cor e altura de linhas para o primeiro parágrafo. |
| Quebras | Regras por nível de heading | **Não existe** | O Markdown é renderizado sem mapeamento de níveis para quebras. |
| Quebras | Órfãs e viúvas | **Parcial** | Existem regras CSS básicas de `orphans` e `widows`; o navegador não garante resultado idêntico entre impressoras. |
| Quebras | Evitar heading isolado | **Parcial** | Títulos recebem `break-inside: avoid`, sem controle quantitativo de linhas. |
| Cabeçalho/rodapé | Páginas arábicas no corpo | **Parcial** | Há numeração visual, mas a contagem não é física nem recalculada por página impressa. |
| Cabeçalho/rodapé | Romano no pré-textual | **Não existe** | Não há zonas pré-textuais com esquema de numeração próprio. |
| Cabeçalho/rodapé | Running heads alternados | **Não existe** | Há cabeçalho fixo; não alterna autor/título por paridade. |
| Cabeçalho/rodapé | Excluir front matter | **Parcial** | Capa não recebe número; sumário e aberturas ainda seguem a configuração global. |
| Tipografia | Fonte de corpo e fallback | **Existe e funciona** | Há seleção de fontes serifadas e fallback CSS. |
| Tipografia | Hifenização pt-BR e justificação | **Não existe** | Falta `lang`, hifenização e ajuste de justificação no motor de saída. |
| Tipografia | Espaço ou recuo, nunca ambos | **Parcial** | O recuo é configurável; a alternativa sem recuo/com espaçamento não é um modo exclusivo. |
| Tipografia | Aspas curvas e travessões automáticos | **Não existe** | O conteúdo Markdown preserva a digitação original. |
| Estrutura | Pré-textuais separados | **Parcial** | Capa e sumário são opcionais; ficha, dedicatória e outras folhas não têm blocos próprios. |
| Estrutura | Sumário automático de headings | **Parcial** | Há sumário por capítulos/atos; não inspeciona headings internos nem suporta exclusão seletiva. |
| Estrutura | Partes acima de capítulo | **Parcial** | “Atos/seções” funcionam como partes, mas não há metadado editorial específico. |
| Imagens | DPI mínimo | **Não existe** | Arquivos são aceitos sem leitura de dimensão, resolução ou alerta. |
| Imagens | Centralização e legenda | **Parcial** | Imagens são centralizadas; não há sintaxe ou UI para legenda. |
| Imagens | Ornamento de separador de cena | **Parcial** | `---` tem regra visual simples; não há escolha de ornamento ou conversão explícita de `***`. |

## Restrições técnicas relevantes

A saída em PDF usa a janela de impressão do navegador. Isso é adequado para prova de leitura, conteúdo refluível e exportação simples, mas não garante paginação determinística, paridade, fontes embutidas ou pós-processamento de páginas. A saída ePub é adequada para leitores digitais e não deve herdar regras próprias de um livro impresso, como recto/verso e margens espelhadas.

> Para atingir a referência de uma edição impressa refinada, o caminho equivalente ao pipeline descrito no briefing é introduzir uma saída de produção fora do navegador: Pandoc + XeLaTeX/LuaLaTeX para a primeira composição e PyMuPDF para revisões pontuais de fólios, fontes e páginas. Isso requer um serviço de geração, pois o projeto atual é estático e client-side.

## Priorização por impacto e esforço

| Prioridade | Entrega | Impacto | Esforço | Justificativa |
|---:|---|---|---|---|
| P0 | Salvar localmente texto e configurações | Alto | Baixo | Evita perda de trabalho na edição diária. **Concluído nesta entrega.** |
| P1 | Margens interna/externa, espelhamento e posição externa do fólio | Alto | Médio | É a maior diferença visual entre prova digital e livro impresso. |
| P1 | Blocos pré-textuais e esquema romano/arábico | Alto | Médio | Organiza o livro como objeto editorial, não apenas capítulos. |
| P1 | Perfis tipográficos: recuo *ou* espaçamento, hifenização e justificação | Alto | Médio | Melhora imediatamente o ritmo de leitura e a aparência profissional. |
| P2 | Regras de capítulos: recto, primeira página limpa e espaço de abertura | Alto | Alto | Depende de paginação real ou de um motor de layout dedicado. |
| P2 | Sumário por headings e partes formais | Médio | Médio | Amplia navegação, ePub e estrutura editorial. |
| P2 | Validação de DPI, legendas e ornamentos | Médio | Médio | Essencial para livros com imagens e acabamento visual. |
| P3 | Smart typography e normalização de diálogos | Médio | Baixo | Pode ser oferecida como transformação reversível antes da exportação. |
| P3 | Pipeline de produção Pandoc/LaTeX + PyMuPDF | Muito alto | Alto | Necessário para fidelidade impressa, fontes embutidas e correções cirúrgicas. |

## Próxima etapa recomendada

A evolução mais eficiente é criar primeiro um **perfil de impressão de livro** com gutter, páginas espelhadas, posição externa do fólio, modos de parágrafo e blocos pré-textuais. Em paralelo, a arquitetura deve ser elevada de projeto estático para uma saída de produção com backend, permitindo Pandoc/XeLaTeX e pós-processamento por PyMuPDF sem tentar reproduzir paginação profissional apenas com CSS de navegador.
