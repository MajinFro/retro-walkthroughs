import glob

def fix():
    files = glob.glob('src/routes/walkthroughs*.tsx')
    for path in files:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()

        if 'components={\n            a(' in text:
            text = text.replace('components={\n            a(', 'components={{\n            a(')
            print(f"Fixed {path}")

        # Ensure CRLF
        text = text.replace('\r\n', '\n').replace('\n', '\r\n')
        with open(path, 'wb') as f:
            f.write(text.encode('utf-8'))

if __name__ == '__main__':
    fix()
