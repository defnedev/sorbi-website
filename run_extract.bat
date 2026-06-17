@echo off
mkdir C:\temp 2>nul
copy /Y "C:\Users\selbe\AppData\Roaming\Claude\local-agent-mode-sessions\41327a3c-8805-4f9e-9bfc-9e480ffcc91e\40efdffc-ecac-4e8e-99d4-b5c0f4170bfa\local_a8ea79e4-3ea7-4f39-a08a-f7f34946470e\.claude\projects\C--Users-selbe-AppData-Roaming-Claude-local-agent-mode-sessions-41327a3c-8805-4f9e-9bfc-9e480ffcc91e-40efdffc-ecac-4e8e-99d4-b5c0f4170bfa-local-a8ea79e4-3ea7-4f39-a08a-f7f34946470e-outputs\aa75d420-40df-4c67-b918-651c2f77922b\tool-results\mcp-bb26fe78-ddb8-4f28-86a7-dcd8a39b78c4-download_file_content-1781635220923.txt" "C:\temp\src.txt"
echo Copy exit code: %ERRORLEVEL%
python "%~dp0extract_html.py"
echo Exit code: %ERRORLEVEL%
pause
