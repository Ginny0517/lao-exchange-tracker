@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ====================================
echo Laos Exchange Rates - Git Push
echo ====================================
echo.

if not exist .git (
  echo [1/5] Initializing git repository...
  git init
  echo.
) else (
  echo [1/5] Git repository already initialized
  echo.
)

set REMOTE=origin
git remote get-url %REMOTE% >nul 2>&1
if errorlevel 1 (
  echo [2/5] Adding remote: https://github.com/Ginny0517/lao-exchange-tracker.git
  git remote add origin https://github.com/Ginny0517/lao-exchange-tracker.git
  echo.
) else (
  echo [2/5] Remote origin already exists
  echo.
)

echo [3/5] Staging all changes...
git add -A
echo.

echo [4/5] Current status:
git status
echo.

set /p confirm="[5/5] Commit and push? (y/n): "
if /i not "%confirm%"=="y" (
  echo Operation cancelled.
  pause
  exit /b 0
)

echo.
echo Committing changes...
git commit -m "fix: resolve all TypeScript errors and Vercel deployment issues - Exclude scraper from Next.js build - Fix InstantDB query type assertions - Update tsconfig and dependencies"

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main 2>nul || (
  echo.
  echo Push to 'main' failed, trying 'master'...
  git branch -M master
  git push -u origin master
)

echo.
echo ====================================
echo Done! Check Vercel for auto-deploy.
echo ====================================
pause
