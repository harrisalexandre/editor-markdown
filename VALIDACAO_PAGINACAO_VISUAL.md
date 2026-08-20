# Validação visual da montagem

Foi testado um capítulo Markdown com 16 parágrafos longos na etapa **Preparar impressão**, usando o trim A5 padrão e as margens espelhadas ativas. A montagem produziu nove folhas de capítulo consecutivas: uma abertura e oito continuações.

Em cada folha, a área de conteúdo apresentou `overflow-y: hidden` e a inspeção de layout confirmou ausência de rolagem interna. A navegação da composição ocorre exclusivamente pela rolagem geral da página, enquanto cada folha conserva os limites físicos configurados.

> Esta composição de tela é uma estimativa editorial por blocos Markdown. A prova final em PDF permanece submetida às regras de impressão do navegador.
