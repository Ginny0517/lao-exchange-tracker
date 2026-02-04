@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist .git (
  echo Initializing git repository...
  git init
)

set REMOTE=origin
git remote get-url %REMOTE% >nul 2>&1
if errorlevel 1 (
  echo Adding remote: https://github.com/Ginny0517/lao-exchange-tracker.git
  git remote add origin https://github.com/Ginny0517/lao-exchange-tracker.git
) else (
  echo Remote origin already exists.
)

git add -A
git status
echo.
set /p confirm="Commit and push? (y/n): "
if /i not "%confirm%"=="y" exit /b 0

git commit -m "fix: ExchangeTable type errors and db hook return type"
git push -u origin main 2>nul || git push -u origin master 2>nul || echo Please create branch 'main' or 'master' on GitHub and push again.
pause
