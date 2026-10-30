#!/bin/sh
# Mercatto Entregas — inicia o sistema no Mac ou Linux (duplo clique ou ./iniciar.sh)
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  echo "É preciso instalar o Node.js versão 22 ou mais nova: https://nodejs.org/pt-br/download"
  exit 1
fi

if [ ! -f data/mercatto.sqlite ] && [ -z "$ADMIN_PASSWORD" ]; then
  echo ""
  echo "PRIMEIRO USO — crie a senha do administrador (mínimo 8 caracteres)."
  echo "O usuário de acesso será: admin"
  printf "Senha do administrador: "
  stty -echo 2>/dev/null; read -r ADMIN_PASSWORD; stty echo 2>/dev/null; echo ""
  export ADMIN_PASSWORD
fi

( sleep 3; (command -v open >/dev/null && open http://localhost:3000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000) ) >/dev/null 2>&1 &
exec node --experimental-strip-types --disable-warning=ExperimentalWarning server/index.ts
