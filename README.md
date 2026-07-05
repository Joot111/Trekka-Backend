# Trekka - API Backend

Este repositório contém a API backend da aplicação **Trekka**, desenvolvida no âmbito do Mestrado em IoT (Internet das Coisas), especificamente para a unidade curricular de **Desenvolvimento de Aplicações Móveis Avançadas**.

A API serve como a infraestrutura de suporte para o registo, gestão e partilha de trilhos e rotas pedestres, bem como autenticação de utilizadores.

---

## 🚀 Tecnologias Utilizadas

A API foi desenvolvida em JavaScript utilizando a plataforma **Node.js** com os seguintes pacotes:
*   **Express**: Framework web para criação de rotas e middleware.
*   **MongoDB & Mongoose**: Base de dados NoSQL e modelação de dados.
*   **Cors**: Permite o acesso a recursos a partir de origens externas (Cross-Origin Resource Sharing).
*   **Dotenv**: Gestão de variáveis de ambiente de forma segura.
*   **Bcryptjs** & **JSONWebToken**: Ferramentas destinadas a segurança e autenticação (estruturadas para expansões futuras).

---

## 📁 Estrutura do Projeto

```text
trekka-backend/
├── trekka-backend/
│   ├── .env                 # Configuração de variáveis de ambiente (Ignorado no Git)
│   ├── index.js             # Ponto de entrada e lógica principal da API (Modelos e Rotas)
│   ├── package.json         # Dependências e scripts do projeto
│   └── package-lock.json    # Lockfile das dependências
├── .gitignore               # Configuração de ficheiros a ignorar pelo Git
└── README.md                # Documentação do projeto (este ficheiro)
```
