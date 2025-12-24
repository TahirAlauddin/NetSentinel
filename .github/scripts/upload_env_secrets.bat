@echo off
setlocal enabledelayedexpansion

REM Change to .github directory where secrets files are located
cd /d "%~dp0.."

REM Function to upload secrets from a file to an environment
call :upload_secrets "staging.secrets" "staging"
goto :eof

:upload_secrets
set "file=%~1"
set "env=%~2"

echo Uploading secrets from %file% to environment "%env%"...

if not exist "%file%" (
    echo ❌ File not found: %file%
    echo    Expected location: .github\%file%
    goto :eof
)

for /f "usebackq tokens=* delims=" %%A in ("%file%") do (
    set "line=%%A"
    REM Skip empty lines and comments
    if not "!line!"=="" if not "!line:~0,1!"=="#" (
        for /f "tokens=1* delims==" %%B in ("!line!") do (
            set "key=%%B"
            set "value=%%C"
            echo 🔑 Setting !key!...
            echo !value! | gh secret set !key! --env %env% --repo "%GITHUB_REPO%"
        )
    )
)

echo ✅ All secrets uploaded for environment: %env%
goto :eof
