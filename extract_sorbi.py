import json

src = r"C:\Users\selbe\AppData\Roaming\Claude\local-agent-mode-sessions\41327a3c-8805-4f9e-9bfc-9e480ffcc91e\40efdffc-ecac-4e8e-99d4-b5c0f4170bfa\local_a8ea79e4-3ea7-4f39-a08a-f7f34946470e\.claude\projects\C--Users-selbe-AppData-Roaming-Claude-local-agent-mode-sessions-41327a3c-8805-4f9e-9bfc-9e480ffcc91e-40efdffc-ecac-4e8e-99d4-b5c0f4170bfa-local-a8ea79e4-3ea7-4f39-a08a-f7f34946470e-outputs\aa75d420-40df-4c67-b918-651c2f77922b\tool-results\mcp-bb26fe78-ddb8-4f28-86a7-dcd8a39b78c4-download_file_content-1781636047744.txt"

dst = r"C:\Users\selbe\Downloads\AstroMotor-feat-daphne-v0.5-consultation-engine\AstroMotor-feat-daphne-v0.5-consultation-engine\sorbi-website\sorbi-danismanlik-final.html"

preview_dst = r"C:\Users\selbe\Downloads\AstroMotor-feat-daphne-v0.5-consultation-engine\AstroMotor-feat-daphne-v0.5-consultation-engine\sorbi-website\extract_preview.txt"

with open(src, encoding="utf-8") as f:
    data = json.load(f)

html = data["content"]

with open(dst, "w", encoding="utf-8") as f:
    f.write(html)

with open(preview_dst, "w", encoding="utf-8") as f:
    f.write("TITLE: " + data.get("title", "") + "\n")
    f.write("LENGTH: " + str(len(html)) + " chars\n\n")
    f.write("FIRST 3000 CHARS:\n")
    f.write(html[:3000])

print("DONE -", len(html), "chars")
