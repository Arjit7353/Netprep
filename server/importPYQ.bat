@echo off
REM ╔═══════════════════════════════════════════════════════════╗
REM ║  Import Logical Reasoning PYQ - Auto Translate & Save    ║
REM ╚═══════════════════════════════════════════════════════════╝

echo.
echo 🚀 Starting PYQ Import...
echo.

cd /d "%~dp0.."
node scripts/importLogicalReasoningPYQ.js

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ Import completed!
) else (
  echo.
  echo ❌ Import failed. Check the errors above.
  pause
)
