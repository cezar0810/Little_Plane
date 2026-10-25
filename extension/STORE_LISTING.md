# Chrome Web Store — rascunho da página

## Nome
Little Plane — Rádio do YouTube

## Resumo curto
Ouça sua música do YouTube ou YouTube Music enquanto joga Little Plane, com capa da faixa e controles de reprodução dentro do jogo.

## Descrição detalhada
Conecte o player do Little Plane à música que já está tocando em uma aba do YouTube ou YouTube Music. Durante o modo Voo Livre, veja o nome da faixa, o canal/artista, a capa e o progresso, e use os controles para voltar, pausar/reproduzir ou avançar.

A extensão funciona localmente no navegador. Ela não envia dados da música para um servidor externo e não lê cookies, senhas ou credenciais.

**Como usar**
1. Instale a extensão.
2. Abra o Little Plane.
3. Abra uma aba do YouTube ou YouTube Music e reproduza uma música.
4. Entre no modo Voo Livre.

Site do jogo: https://little-plane.cezaraugust76.workers.dev/

## Permissões — justificativa para o painel

- `tabs`: localizar a aba do YouTube/YouTube Music que fornece a faixa atual.
- Acesso a `youtube.com` e `music.youtube.com`: ler metadados da faixa e enviar comandos de mídia para a página aberta.
- Acesso ao domínio oficial do Little Plane: conectar os controles do player do jogo à extensão.
- Acesso ao domínio de teste e localhost: usado apenas para testes de desenvolvimento. Antes da publicação, considerar remover esses domínios do pacote público se não forem necessários para usuários finais.

## Privacidade — texto-base para revisar

A extensão lê somente metadados da mídia na página aberta do YouTube ou YouTube Music (título, canal, miniatura, duração, posição e estado de reprodução) para mostrá-los no player do Little Plane. Os comandos de reprodução são enviados à aba correspondente. Esses dados são processados localmente no navegador e não são enviados para servidores externos pela extensão. A extensão não coleta histórico de navegação, cookies, senhas ou dados de autenticação.

Revisar este texto no painel de privacidade para que corresponda exatamente ao pacote final e às políticas atuais da Chrome Web Store.

## Materiais necessários antes do envio

- Ícone 128 × 128 (incluído em `icons/icon128.png`).
- Capturas de tela reais da extensão em funcionamento, mostrando o player do jogo e os controles.
- Categoria adequada e idioma Português (Brasil).
- Confirmação da política de privacidade e das declarações de tratamento de dados.
- Conta de desenvolvedor Chrome Web Store com verificação em duas etapas ativa.
