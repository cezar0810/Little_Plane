# Little Plane — Rádio do YouTube

Extensão Chrome (Manifest V3) que conecta a rádio do Little Plane à música que já está tocando em uma aba do YouTube ou YouTube Music.

## Recursos

- Detecta a faixa atual e atualiza título, canal e capa quando a música muda.
- Mostra controles de faixa anterior, reproduzir/pausar e próxima.
- Interface da rádio usa ícones SVG próprios, sem depender de emojis ou fontes de ícones instaladas no computador.
- A comunicação da extensão com o jogo ocorre localmente no navegador.

## Instalação para teste (manual)

> Esta é a instalação de desenvolvimento. Para o público geral, o objetivo é publicar na Chrome Web Store, onde a instalação será feita com um clique.

1. Baixe o ZIP desta branch: [Baixar Little Plane — Rádio do YouTube](https://github.com/cezar0810/Little_Plane/archive/refs/heads/feature/youtube-radio-extension.zip).
2. Extraia o arquivo ZIP.
3. No Chrome, abra `chrome://extensions`.
4. Ative **Modo do desenvolvedor**.
5. Clique em **Carregar sem compactação** e selecione a pasta `extension` que está dentro da pasta extraída.
6. Abra ou recarregue o jogo: https://little-plane.cezaraugust76.workers.dev/
7. Abra uma aba do YouTube ou YouTube Music e reproduza uma faixa.
8. Entre no modo **Voo Livre** para ver o player.

## Atualização de uma versão instalada manualmente

1. Baixe e extraia o ZIP mais recente.
2. Em `chrome://extensions`, encontre **Little Plane — Rádio do YouTube** e clique em **Recarregar** ou remova a versão antiga e carregue a pasta `extension` nova.
3. Recarregue a aba do jogo e a aba do YouTube.

## Compatibilidade

- Site oficial: `https://little-plane.cezaraugust76.workers.dev/`
- Site de teste: `https://little-plane-test.pages.dev/`
- Desenvolvimento local: `localhost` e `127.0.0.1`

## Privacidade

A extensão não envia o histórico de navegação nem dados da faixa para um servidor externo. Ela consulta o título, canal, capa e estado de reprodução da página aberta do YouTube/YouTube Music e envia comandos básicos de mídia. Não lê cookies, senhas ou credenciais.

## Publicação na Chrome Web Store

A publicação ainda precisa ser concluída pelo proprietário da conta de desenvolvedor. Antes do envio, revisar:

- Criar/confirmar a conta de desenvolvedor e ativar a verificação em duas etapas.
- Preparar ícones e capturas de tela oficiais para a página da loja.
- Preencher a descrição, categoria e a seção de privacidade no painel.
- Declarar apenas as permissões necessárias e explicar por que a extensão acessa as páginas do YouTube e do Little Plane.
- Enviar o pacote ZIP para análise. A loja publica depois da aprovação.

Documentação oficial: https://developer.chrome.com/docs/webstore/publish/
