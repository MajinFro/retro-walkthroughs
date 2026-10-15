import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';
import { PlayStationButton, parsePlaystationButtons } from '../components/PlayStationButton';

// Define a safe Mermaid renderer component
function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = React.useState<string>('');
  
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };
    renderChart();
  }, [chart]);

  return svg ? (
    <div 
      className="flex justify-center my-8 bg-slate-900 p-4 rounded-xl border border-slate-800" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  ) : (
    <pre className="text-slate-400 bg-slate-900 p-4 my-8 rounded-xl overflow-x-auto text-sm border border-slate-800">
      {chart}
    </pre>
  );
}

export const Route = createFileRoute('/walkthroughs/$gameId')({
  loader: async ({ params: { gameId } }) => {
    try {
      const mdModule = await import(`../../content/walkthroughs/${gameId}.md?raw`);
      const masterModule = await import(`../../content/master.json`);
      const metadata = masterModule.default[gameId as keyof typeof masterModule.default];
      if (!metadata) throw new Error("Metadata not found in master.json");
      return {
        content: mdModule.default,
        metadata: metadata
      };
    } catch (e) {
      throw new Error(`Walkthrough for game ${gameId} not found`);
    }
  },
  component: WalkthroughPage,
})

function WalkthroughPage() {
  const { content, metadata } = Route.useLoaderData();

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Hero Section */}
      <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-700/50 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />
        
        {metadata.boxArt && (
          <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 bg-slate-950 rounded-2xl border border-slate-700 flex items-center justify-center p-4 shadow-inner z-10">
            <img src={metadata.boxArt} alt={metadata.title} className="max-w-full max-h-full object-contain" />
          </div>
        )}
        
        <div className="flex-1 text-center md:text-left z-10">
          <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm font-semibold tracking-wide mb-4">
            {metadata.system}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4 leading-tight">
            {metadata.title}
          </h1>
          <p className="text-slate-400 text-lg">
            Complete 100% Walkthrough & Achievement Guide
          </p>
        </div>
      </div>

      {/* Markdown Content */}
      <div 
        className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-strong:text-slate-200 prose-code:text-slate-200 prose-code:bg-slate-800 prose-code:border prose-code:border-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:shadow-sm prose-code:text-sm prose-code:font-medium prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a({node, href, children, ...props}: any) {
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
            },
            p({children, ...props}: any) {
              return <p {...props}>{parsePlaystationButtons(children)}</p>;
            },
            li({children, ...props}: any) {
              return <li {...props}>{parsePlaystationButtons(children)}</li>;
            },
            td({children, ...props}: any) {
              return <td {...props}>{parsePlaystationButtons(children)}</td>;
            },
            th({children, ...props}: any) {
              return <th {...props}>{parsePlaystationButtons(children)}</th>;
            },
            strong({children, ...props}: any) {
              return <strong {...props}>{parsePlaystationButtons(children)}</strong>;
            },
            em({children, ...props}: any) {
              return <em {...props}>{parsePlaystationButtons(children)}</em>;
            },
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match && match[1] === 'mermaid') {
                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
              }
              const str = typeof children === 'string' ? children : String(children ?? '');
              if (/\[(?:Square|Triangle|Cross|Circle|X|L1|R1|L2|R2|L3|R3|Start|Select|D-Pad|Up|Down|Left|Right)\]/i.test(str)) {
                return (
                  <span className="inline-flex items-center gap-0.5 align-middle px-1 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 shadow-sm font-mono text-sm">
                    {parsePlaystationButtons(str)}
                  </span>
                );
              }
              return <code className={className} {...props}>{children}</code>;
            },
            // Handle GitHub alerts mapping blockquotes
            blockquote({node, children, ...props}: any) {
              const extractText = (n: any): string => {
                if (typeof n === 'string') return n;
                if (Array.isArray(n)) return n.map(extractText).join('');
                if (n && n.props && n.props.children) return extractText(n.props.children);
                return '';
              };
              
              const text = extractText(children);
              const match = text.match(/\[!(CAUTION|WARNING|IMPORTANT|TIP|NOTE|ACHIEVEMENT)\]/);
              
              if (match) {
                const type = match[1];

                if (type === "ACHIEVEMENT") {
                  let imageUrl = "";
                  
                  // Helper to strip the tag AND extract/remove the image from rendering
                  const processAchievementNodes = (n: any): any => {
                    if (typeof n === 'string') return n.replace(`[!ACHIEVEMENT]`, '');
                    
                    if (n && n.props && n.props.node?.tagName === 'img') {
                      imageUrl = n.props.src;
                      return null; // Remove the image from the text flow
                    }
                    if (n && n.type === 'img') {
                      imageUrl = n.props.src;
                      return null;
                    }
                    
                    if (Array.isArray(n)) return n.map(processAchievementNodes).filter(Boolean);
                    if (n && n.props && n.props.children) {
                      const processedChildren = processAchievementNodes(n.props.children);
                      return { ...n, props: { ...n.props, children: processedChildren } };
                    }
                    return n;
                  };

                  const cleanChildren = parsePlaystationButtons(processAchievementNodes(children));

                  return (
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-r from-amber-900/40 to-slate-900/80 border border-amber-500/30 rounded-2xl p-6 my-8 shadow-2xl shadow-amber-900/20 backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {imageUrl && (
                        <div className="flex-shrink-0 relative">
                          <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-full scale-150"></div>
                          <img src={imageUrl} alt="Achievement Badge" className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] transform group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      
                      <div className="flex-1 text-center sm:text-left z-10">
                        <div className="text-xs font-black tracking-[0.2em] text-amber-500 mb-2 drop-shadow-md">ACHIEVEMENT UNLOCKED</div>
                        <div className="text-slate-200 text-lg sm:text-xl font-medium prose-p:my-0 prose-strong:text-amber-100 prose-strong:font-extrabold">
                          {cleanChildren}
                        </div>
                      </div>
                    </div>
                  );
                }

                let colorClass = "border-indigo-500 bg-indigo-950/30 text-indigo-200"; // Note / Tip
                if (type === "CAUTION") colorClass = "border-red-500 bg-red-950/30 text-red-200";
                if (type === "WARNING") colorClass = "border-amber-500 bg-amber-950/30 text-amber-200";
                if (type === "IMPORTANT") colorClass = "border-purple-500 bg-purple-950/30 text-purple-200";
                
                // Helper to strip the tag from rendering
                const stripTag = (n: any): any => {
                  if (typeof n === 'string') return n.replace(`[!${type}]`, '');
                  if (Array.isArray(n)) return n.map(stripTag);
                  if (n && n.props && n.props.children) {
                    return { ...n, props: { ...n.props, children: stripTag(n.props.children) } };
                  }
                  return n;
                };

                const cleanChildren = parsePlaystationButtons(stripTag(children));

                return (
                  <blockquote className={`border-l-4 my-6 p-4 rounded-r-lg shadow-sm ${colorClass}`} {...props}>
                    <div className="font-bold text-sm tracking-wider mb-2 opacity-90">{type}</div>
                    {cleanChildren}
                  </blockquote>
                );
              }
              return <blockquote {...props}>{parsePlaystationButtons(children)}</blockquote>;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
