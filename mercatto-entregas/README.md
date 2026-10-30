# Mercatto Decor — Gestão de Entregas

Painel administrativo + app do entregador (**Minhas Entregas**) para a agenda de entregas da Mercatto Decor.
Interface em português (pt-BR), datas DD/MM/AAAA, horário 24h, fuso `America/Manaus`.

## Requisitos

- Node.js **22.6 ou superior** (usa o SQLite embutido do Node e execução direta de TypeScript)
- Nenhum serviço pago. Nenhum banco externo.

## Instalação e uso

```bash
npm install
cp .env.example .env        # defina ADMIN_PASSWORD (mín. 8 caracteres)
npm run build               # gera a interface em dist/
npm start                   # http://localhost:3000
```

No primeiro início, o administrador definido em `ADMIN_USERNAME`/`ADMIN_PASSWORD` é criado. Depois:

1. **Configurações → Endereço padrão**: informe a cidade/UF (usado nos cadastros e na navegação de endereços antigos).
2. **Entregadores**: cadastre os entregadores (e veículos, se quiser).
3. **Configurações → Usuários**: crie o acesso de cada entregador (perfil *Entregador*, vinculado ao cadastro).
   O entregador entra pelo mesmo endereço no celular e vê somente as próprias entregas.

**Sem `npm install`:** o servidor usa apenas módulos nativos do Node. Se a pasta `dist/` já estiver presente
(como no arquivo .zip distribuído), basta `cp .env.example .env`, definir a senha e rodar `npm start`.
`npm install` só é necessário para desenvolver ou gerar um novo build.

**Celular:** o app pode ser instalado na tela inicial (Android: menu → *Instalar app*; iPhone: Compartilhar →
*Adicionar à Tela de Início*). Ele abre rápido e abre mesmo sem sinal; os dados de entregas continuam vindo do servidor.

Desenvolvimento: `npm run dev` (API na porta 3000 + Vite na 5173 com proxy).

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta HTTP |
| `DATA_DIR` | `./data` | Banco SQLite, fotos de comprovante e backups automáticos |
| `APP_TIMEZONE` | `America/Manaus` | Fuso da operação ("hoje", relatórios) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NAME` | `admin` / — / `Administrador` | Admin inicial (só se não houver usuários) |
| `COOKIE_SECURE` | `0` | Use `1` em produção com HTTPS |
| `MAX_PHOTO_MB` | `8` | Limite por foto (as fotos são reduzidas no celular antes do envio) |

**Produção:** coloque atrás de HTTPS (ex.: Nginx/Caddy) e use `COOKIE_SECURE=1`. A câmera do celular e o
acesso seguro dependem de HTTPS. Faça backup periódico da pasta `DATA_DIR` (banco + fotos).

## Migração da agenda antiga

O código-fonte da agenda anterior não estava disponível; os registros são trazidos por importação, sem apagar nada:

- **Configurações → Dados → Importar agenda antiga (JSON)**, ou `npm run import-legacy -- arquivo.json`.
- Reconhece os campos: Cliente, Vendedor, WhatsApp de quem recebe, Nº do pedido ou nota, Endereço de entrega,
  Materiais a entregar, Data da entrega (DD/MM/AAAA ou AAAA-MM-DD), Período, Entregador ou motorista,
  Material separado?, Situação, Urgência (cores: vermelho → Urgente, amarelo/laranja → Atenção, verde → Sem pressa)
  e Observações.
- O registro original fica guardado intacto em cada entrega (`legacy_data`) e a situação antiga aparece no detalhe.
- Reimportar o mesmo arquivo não duplica (cada registro tem uma chave própria).
- Endereço e materiais antigos ficam em texto livre (não são “adivinhados” em campos). Observações antigas vão para
  “Observações para o entregador”, como eram visíveis a todos na agenda anterior.

Antes de qualquer migração de esquema futura, o servidor grava automaticamente uma cópia do banco em
`DATA_DIR/backups/`. **Configurações → Baixar cópia de segurança** exporta tudo em JSON (sem senhas).

## Como funciona

**Situação** (derivada no servidor, sempre pelas mesmas regras):

| Situação | Quando |
|---|---|
| Aguardando agendamento | sem data de entrega |
| Aguardando separação | com data, material não separado **e** conferido |
| Pronta para entrega | com data e material conferido (ou liberada por exceção justificada) |
| Em rota | entregador iniciou a entrega |
| Entregue | comprovante registrado |
| Problema na entrega | problema em aberto |
| Cancelada | cancelada com motivo |

Preparação de material (separado → conferido → carregado) é guardada por item, separada da execução.
Toda mudança de situação, reagendamento (com data/entregador anteriores), conferência, exceção e problema fica em
`delivery_events`, com data/hora e usuário.

**Sincronização:** todos os aparelhos usam o mesmo servidor. As telas atualizam a cada 30 s, ao voltar para o app e
após cada ação. Não há atualização instantânea (push/tempo real).

**Segurança:** senhas com scrypt; sessão em cookie HttpOnly/SameSite; tokens de sessão guardados como hash;
permissões verificadas no servidor (entregador só acessa as próprias entregas, fotos e itens de carga; notas internas
não são enviadas a ele); proteção CSRF por cabeçalho; CSP e cabeçalhos de segurança; limite de tentativas de login;
fotos validadas (tipo + assinatura do arquivo + tamanho), gravadas fora da pasta pública e servidas só a quem tem
acesso; links de Maps/Waze levam apenas o endereço; `Referrer-Policy: no-referrer`.

## Integrações

| Integração | Situação |
|---|---|
| ViaCEP (preenchimento por CEP) | Ativa, gratuita, chamada pelo navegador; o endereço sempre pode ser corrigido à mão |
| Google Maps / Waze | Links universais (`google.com/maps/dir`, `waze.com/ul`) — abrem o app no Android/iPhone ou o site |
| WhatsApp | Links `wa.me` com mensagem editável. O sistema não envia mensagens nem afirma que foram enviadas |
| Otimização de rotas | **Não configurada.** A ordem é manual (arrastar/setas) e o sistema avisa quando ela contraria horários combinados. Exigiria geocodificação/roteirização externa (ex.: Google Routes, OSRM), a decidir |

## Testes

```bash
npm run check    # typecheck + testes + build
```

`tests/api.test.ts` sobe o servidor com banco em memória e cobre: criação com e sem data, preservação dos campos,
validação, envio duplicado, separação/conferência/carregamento, bloqueio de entrega sem material conferido, início de rota,
upload de foto (inválida, grande demais, válida), confirmação com comprovante, histórico de situações, isolamento entre
entregadores, bloqueio de rotas administrativas, problema → resolução com reagendamento, conflito de edição simultânea,
exceção auditada, ordem de rota igual para admin e entregador, filtros, cancelamento/reabertura, relatório e importação.
`tests/domain.test.ts` cobre WhatsApp, links de navegação, contagem de volumes, regras de situação e datas.

## Limitações conhecidas

- Sem atualização em tempo real (intervalo de 30 s).
- Sem modo offline completo: o entregador consulta a última lista salva sem internet, mas as ações exigem conexão
  (nada é marcado como sincronizado sem confirmação do servidor).
- Sem assinatura manuscrita (o comprovante usa nome de quem recebeu + foto opcional).
- Fotos ficam no disco do servidor (`DATA_DIR/photos`); para vários servidores seria preciso armazenamento compartilhado.
- O seletor de data nativo segue o idioma do aparelho (em celulares pt-BR aparece DD/MM/AAAA).
