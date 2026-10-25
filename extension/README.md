# Little Plane — Rádio do YouTube

Extensão Manifest V3 para conectar a rádio já existente no Little Plane à aba aberta do YouTube ou YouTube Music.

## O que faz
- Detecta uma aba aberta do YouTube/YouTube Music.
- Lê título, canal, miniatura, duração, posição e estado de reprodução da faixa.
- Mostra os metadados na rádio do jogo durante o Voo Livre.
- Os botões da rádio tentam controlar a aba original: anterior, play/pause e próxima.
- Exibe um aviso no lobby explicando como ativar a extensão.

## Instalação local (Chrome)
1. Baixe o repositório do Little Plane: **Code → Download ZIP**.
2. Extraia o ZIP.
3. Abra `chrome://extensions`.
4. Ative **Modo do desenvolvedor**.
5. Clique em **Carregar sem compactação**.
6. Selecione a pasta `extension` extraída.
7. Abra ou recarregue o Little Plane em `https://little-plane-test.pages.dev`.
8. Deixe o YouTube ou YouTube Music aberto em outra aba.

## Limitações
- Esta versão está configurada para o domínio de teste `little-plane-test.pages.dev` e desenvolvimento local (`localhost`/ `127.0.0.1`). Se o jogo mudar de domínio, adicione o novo domínio em `host_permissions`, `content_scripts.matches` e `web_accessible_resources.matches` no `manifest.json`.
- Se houver várias abas do YouTube, prioriza a aba ativa; caso nenhuma esteja ativa, usa a mais recentemente acessada.
- Os seletores do YouTube podem mudar com atualizações do site.
- Não acessa contas, cookies nem credenciais. Só lê informações públicas da faixa na página aberta e envia comandos básicos de mídia.
- A extensão precisa ser instalada manualmente nesta versão. Para instalação pública simples, publique-a na Chrome Web Store.

## Segurança e privacidade
A extensão não envia dados para servidores externos. A comunicação entre a extensão e o jogo ocorre localmente no navegador.
