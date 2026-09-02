import os

def update_root():
    path = 'src/routes/__root.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace(
        "      { title: 'Retro Walkthroughs' },",
        "      { name: 'referrer', content: 'no-referrer' },\n      { title: 'Retro Walkthroughs' },"
    )

    text = text.replace(
        "<head>\n        <HeadContent />",
        '<head>\n        <meta name="referrer" content="no-referrer" />\n        <HeadContent />'
    )

    # Convert to CRLF
    text = text.replace('\r\n', '\n').replace('\n', '\r\n')
    with open(path, 'wb') as f:
        f.write(text.encode('utf-8'))
    print("Updated __root.tsx")

def update_walkthrough():
    path = 'src/routes/walkthroughs.$gameId.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Find components={{ in ReactMarkdown
    anchor_component = '''            a({node, href, children, ...props}: any) {
              const isExternal = href?.startsWith('http');
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer noopener' : undefined}
                  referrerPolicy={isExternal ? 'no-referrer' : undefined}
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium"
                  {...props}
                >
                  {children}
                </a>
              );
            },
            img({node, src, alt, ...props}: any) {
              return (
                <img
                  src={src}
                  alt={alt}
                  referrerPolicy="no-referrer"
                  {...props}
                />
              );
            },'''

    target = '          components={{'
    replacement = f'          components={{\n{anchor_component}'
    
    assert target in text, "components={{ not found in walkthroughs.$gameId.tsx"
    text = text.replace(target, replacement, 1)

    # Convert to CRLF
    text = text.replace('\r\n', '\n').replace('\n', '\r\n')
    with open(path, 'wb') as f:
        f.write(text.encode('utf-8'))
    print("Updated walkthroughs.$gameId.tsx")

if __name__ == '__main__':
    update_root()
    update_walkthrough()
