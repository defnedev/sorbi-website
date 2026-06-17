import json, base64, os

# Read from simple copied path to avoid Windows MAX_PATH issues
src = r'C:\temp\src.txt'
dst = r'C:\Users\selbe\Downloads\AstroMotor-feat-daphne-v0.5-consultation-engine\AstroMotor-feat-daphne-v0.5-consultation-engine\sorbi-website\sorbi-danismanlik-from-drive.html'
result_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'result.txt')

try:
    print(f'src exists: {os.path.exists(src)}')
    with open(src, encoding='utf-8') as f:
        data = json.load(f)

    content_b64 = data['content']
    html = base64.b64decode(content_b64).decode('utf-8')

    with open(dst, 'w', encoding='utf-8') as f:
        f.write(html)

    msg = f'OK {len(html)} chars written'
    print(msg)
    with open(result_file, 'w', encoding='utf-8') as f:
        f.write(msg)
except Exception as e:
    import traceback
    err = f'ERROR: {e}\n{traceback.format_exc()}'
    print(err)
    with open(result_file, 'w', encoding='utf-8') as f:
        f.write(err)
