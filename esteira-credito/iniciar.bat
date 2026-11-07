@echo off
title Esteira de Credito
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js nao encontrado. Instale em https://nodejs.org ^(versao LTS^) e rode de novo. & pause & exit /b)
node server.js
pause
