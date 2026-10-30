@echo off
chcp 65001 >nul
title Mercatto Entregas
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto semnode
for /f "tokens=1 delims=v." %%v in ('node -v') do set NODEMAJOR=%%v
if %NODEMAJOR% LSS 22 goto semnode

if exist "data\mercatto.sqlite" goto iniciar
if defined ADMIN_PASSWORD goto iniciar
echo.
echo  PRIMEIRO USO
echo  Crie a senha do administrador - minimo 8 caracteres.
echo  O usuario de acesso sera: admin
echo.
set /p ADMIN_PASSWORD= Senha do administrador: 

:iniciar
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
node --experimental-strip-types --disable-warning=ExperimentalWarning server\index.ts
echo.
echo  O sistema foi encerrado.
pause
exit /b 0

:semnode
echo.
echo  E preciso instalar o Node.js versao 22 ou mais nova.
echo  Vamos abrir o site: baixe a versao LTS, instale e abra este arquivo de novo.
start https://nodejs.org/pt-br/download
pause
exit /b 1
