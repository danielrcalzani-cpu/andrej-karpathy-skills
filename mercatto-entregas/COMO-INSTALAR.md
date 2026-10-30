# Como colocar o sistema de entregas para funcionar

O sistema tem duas partes:

- **O servidor** — um programa que fica rodando em **um computador da empresa**. Ele guarda as entregas, as fotos e
  confere quem pode entrar.
- **As telas** — que os funcionários abrem no navegador do computador ou do celular, pelo endereço do servidor.

> **Importante:** abrir o arquivo `.html` com dois cliques **não funciona** — a página precisa do servidor para
> mostrar dados e fazer login. Sempre abra pelo endereço (ex.: `http://localhost:3000`).

## 1. Instalar (uma vez só, no computador do escritório)

1. Instale o **Node.js** (versão LTS): <https://nodejs.org/pt-br/download> → baixar → avançar, avançar, concluir.
2. Descompacte o arquivo `mercatto-entregas.zip` numa pasta fixa (ex.: `C:\MercattoEntregas`).
   Não deixe dentro de “Downloads” para não ser apagado por engano.

## 2. Abrir o sistema

- **Windows:** dois cliques em **`INICIAR.bat`**.
- **Mac:** dois cliques em **`Iniciar no Mac.command`** (na primeira vez: botão direito → Abrir).
- **Linux:** `./iniciar.sh`.

Na **primeira vez**, a janela pede para você criar a **senha do administrador** (mínimo 8 caracteres).
O usuário é **`admin`**. O navegador abre sozinho no sistema.

A janela preta mostra os endereços, por exemplo:

```
Mercatto Entregas está funcionando.
Neste computador:     http://localhost:3000
Na rede da empresa:   http://192.168.0.15:3000
```

**Deixe essa janela aberta** enquanto a equipe usa o sistema. Fechar a janela desliga o sistema.

## 3. Dar acesso aos funcionários (permissões)

Só entra quem tem usuário e senha criados por você. Ninguém consegue ver entregas, endereços ou telefones sem login.

1. Entre como `admin`.
2. **Configurações → Endereço padrão**: informe a cidade (ex.: Manaus / AM).
3. **Entregadores → Novo entregador**: cadastre cada motorista.
4. **Configurações → Usuários e acessos → Novo acesso**, para cada funcionário:
   - **Administrador** — pessoal do escritório: vê e gerencia tudo (agenda, rotas, separação, relatórios, acessos).
   - **Entregador** — vê **somente as entregas atribuídas a ele**, navega, fala com o cliente pelo WhatsApp,
     confere a carga, confirma a entrega com foto e informa problemas. Não vê notas internas nem entregas de outros.
5. Envie a cada um o **endereço**, o **usuário** e a **senha** por um canal reservado.

Para tirar o acesso de alguém: **Configurações → Usuários → Editar → desmarcar “Acesso ativo”**. A pessoa é
desconectada na hora. Para trocar uma senha, use o mesmo lugar.

## 4. Abrir no celular

- **Na empresa (mesmo Wi-Fi):** no celular, abra o endereço “Na rede da empresa” mostrado na janela
  (ex.: `http://192.168.0.15:3000`). O celular abre automaticamente a **versão para celular**.
- **Instalar como aplicativo:** Android (Chrome) → menu ⋮ → *Instalar app*; iPhone (Safari) → Compartilhar →
  *Adicionar à Tela de Início*.

Dica: peça para fixar o IP desse computador no roteador, para o endereço não mudar.

## 5. Entregadores na rua (fora do Wi-Fi da empresa)

O endereço `192.168…` só funciona dentro da empresa. Para os entregadores usarem pelo 4G, o servidor precisa estar
acessível pela internet, com HTTPS (cadeado). Opções — **a escolha é sua**:

| Opção | Custo aproximado | Observação |
|---|---|---|
| Cloudflare Tunnel no computador da empresa | Grátis (+ domínio próprio, ~R$ 40/ano) | O computador precisa ficar ligado |
| Servidor na nuvem (VPS) | ~R$ 30–60/mês | Fica no ar sempre, independe do escritório |

Quando decidir, eu preparo a configuração da opção escolhida.

## 6. Cópia de segurança

Tudo fica na pasta **`data`** (banco de dados e fotos). Copie essa pasta regularmente para um pendrive ou nuvem,
com o sistema fechado. Também há **Configurações → Baixar cópia de segurança**.

## Problemas comuns

| O que aparece | O que fazer |
|---|---|
| Página branca ou “Carregando…” parada | Abra pelo endereço `http://localhost:3000`, não pelo arquivo `.html` |
| “É preciso instalar o Node.js” | Instale o Node.js LTS (passo 1) |
| “A porta 3000 já está em uso” | O sistema já está aberto em outra janela |
| Celular não abre o endereço | Confira se está no mesmo Wi-Fi e se o firewall do Windows permitiu o acesso (aparece um aviso na primeira vez — clique em *Permitir*) |
| Esqueceu a senha do admin | Peça a outro administrador para trocar, ou use `npm run create-user -- novoadmin SenhaNova123 "Nome"` |
