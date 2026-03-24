@echo off
echo Starting Mentordashboard CIOS...
start http://localhost:8000
python -m http.server 8000
if %ERRORLEVEL% NEQ 0 (
    echo Python niet gevonden, probeer npx serve...
    npx serve . -p 8000
)
