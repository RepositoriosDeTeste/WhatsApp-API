# WhatsApp-API

## Introdução

**WhatsApp-API** é um projeto que permite a interação programática com o WhatsApp. O objetivo principal do projeto é fornecer uma forma simples e eficiente para enviar e receber mensagens através do WhatsApp, facilitando a integração com outras aplicações e serviços.

### Objetivos
- Facilitar a comunicação via WhatsApp através de uma API.
- Proporcionar uma solução flexível e extensível para desenvolvedores.
- Garantir a segurança e privacidade das mensagens.

### Tecnologias Utilizadas
- Node.js
- Express
- MongoDB Atlas

## Instalação

### Pré-requisitos

- Node.js v14 ou superior (<a href="https://nodejs.org/en/download/package-manager">baixe aqui</a>)
- Conta do MongoDB Atlas (<a href="https://account.mongodb.com/account/login">crie sua conta</a>)

### Passos para Instalação

1. Clone o repositório:
    ```bash
    git clone https://github.com/RepositoriosDeTeste/WhatsApp-API.git
    cd WhatsApp-API
    ```

2. Instale as dependências:
    ```bash
    npm install
    ```

3. Configure as variáveis de ambiente:
    - Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
        ```env
        RESTORE_SESSIONS_ON_STARTUP=BOOL  # OPCIONAL; DEFAULT=false
        WEBHOOK_ENABLED=BOOL  # OPCIONAL; DEFAULT=false
        SAVE_BASE_64=BOOL  # OPCIONAL; DEFAULT=false
        MARK_MESSAGES_READ=BOOL  # OPCIONAL; DEFAULT=false
        PROTECT_ROUTES=BOOL  # OPCIONAL; DEFAULT=false
        PORT=app_port  # OPCIONAL; DEFAULT=8080
        TOKEN=secret_token  # OPCIONAL
        APP_URL=application_url  # OPCIONAL
        WEBHOOK_URL=your_webhook_url  # OPCIONAL
        LOG_LEVEL="silent"
        MAX_QR_RETRY=2
        DB_URI=your_mongodb_atlas_uri
        ```

4. Inicie o servidor:
    ```bash
    npm run start
    ```

## Uso

### Instancia
A instancia é o ponto inicial para utilizar esta api, crie uma instancia com o nome ou numero do usuario para facilitar a identificação, note tambem que as identificações das keys são valores unicos

#### Iniciando uma Instancia
Para iniciar uma instancia, faça uma requisição POST para `/instance/init?key=<INSTANCE_KEY:string>&webhook=<WEBHOOK_ALLOWED:true or false>&webhookURL=<WEBHOOK_URL:string>` e substitua os valores entre `<>`. `Webhook` & `<webhookUrl>` são opcionais

Retorno: 
  ```json
    {
    	"error": false,
    	"message": "Instancia inicializada",
    	"key": "<instanceKey>",
    	"webhook": {
    		"enabled": false
    	},
    	"qrcode": {
    		"url": "http://localhost:8080/instance/qr?key=<instanceKey>"
    	}
    }
  ```




