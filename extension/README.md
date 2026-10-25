# Little Plane — Rádio do YouTube

Extensão Manifest V3 para conectar a rádio do Little Plane à aba aberta do YouTube ou YouTube Music.

## O que faz
- Detecta uma aba aberta do YouTube/YouTube Music.
- Lê título, canal, miniatura, duração, posição e estado de reprodução da faixa.
- Mostra os metadados na rádio do jogo durante o Voo Livre.
- Os botões da rádio tentam controlar a aba original: anterior, play/pause e próxima.

## Instalação local (Chrome)
1. Baixe o ZIP da branch [feature/youtube-radio-extension](https://github.com/cezar0810/Little_Plane/archive/refs/heads/feature/youtube-radio-extension.zip) e extraia.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta `extension` extraída.
5. Abra ou recarregue o Little Plane em https://little-plane.cezaraugust76.workers.dev/.
6. Deixe uma aba do YouTube ou YouTube Music aberta.

## Domínios autorizados
A extensão está configurada para o domínio de produção `little-plane.cezaraugust76.workers.dev`, o domínio de teste `little-plane-test.pages.dev` e desenvolvimento local (`localhost` / `127.0.0.1`).

## Limitações
- Se houver várias abas do YouTube, prioriza a aba ativa; caso nenhuma esteja ativa, usa a mais recentemente acessada.
- Os seletores do YouTube podem mudar com atualizações do site.
- Não acessa contas, cookies nem credenciais. Só lê informações da faixa na página aberta e envia comandos básicos de mídia.
- Esta versão é instalada manualmente; ainda não foi publicada na Chrome Web Store.

## Segurança e privacidade
A extensão não envia dados para servidores externos. A comunicação entre a extensão e o jogo ocorre localmente no navegador.
