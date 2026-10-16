import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { parsePlaystationButtons } from '../components/PlayStationButton';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node && (node as any).props?.children) {
    return extractText((node as any).props.children);
  }
  return '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function createHeading(Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') {
  return function HeadingComponent({ node: _node, children, id: explicitId, className = '', ...props }: any) {
    const text = extractText(children);
    const id = explicitId || slugify(text);
    return (
      <Tag id={id || undefined} className={`scroll-mt-24 ${className}`} {...props}>
        {parsePlaystationButtons(children)}
      </Tag>
    );
  };
}

interface CheckboxContextType {
  checkedMap: Record<string, boolean>;
  toggleCheckbox: (key: string) => void;
}

const CheckboxContext = React.createContext<CheckboxContextType | null>(null);

function useCheckboxContext() {
  const ctx = React.useContext(CheckboxContext);
  if (!ctx) throw new Error('useCheckboxContext must be used within CheckboxContext.Provider');
  return ctx;
}

function TaskItem({ children, className = '', node: _node, checked: _checked, ...props }: any) {
  const { checkedMap, toggleCheckbox } = useCheckboxContext();
  const arr = React.Children.toArray(children);
  const content = arr.slice(1);
  const text = extractText(content).trim();
  const key = slugify(text);

  const isChecked = Boolean(checkedMap[key]);

  const cleanContent = React.Children.map(content, (child, index) => {
    if (index === 0 && typeof child === 'string') {
      return child.replace(/^\s+/, '');
    }
    return child;
  });

  return (
    <li className={`list-none my-1.5 ${className}`} {...props}>
      <div
        role="checkbox"
        aria-checked={isChecked}
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) return;
          toggleCheckbox(key);
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleCheckbox(key);
          }
        }}
        className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition-colors group select-none"
      >
        <span className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
          <span
            className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
              isChecked
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/40'
                : 'border-slate-600 bg-slate-900/90 group-hover:border-indigo-400 group-hover:bg-slate-800'
            }`}
          >
            {isChecked && (
              <svg className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </span>
        </span>
        <span
          className={`flex-1 text-sm md:text-base leading-relaxed transition-colors ${
            isChecked
              ? 'text-slate-400 line-through decoration-slate-600'
              : 'text-slate-200 group-hover:text-white'
          }`}
        >
          {parsePlaystationButtons(cleanContent)}
        </span>
      </div>
    </li>
  );
}

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
    } catch (_e) {
      throw new Error(`Walkthrough for game ${gameId} not found`);
    }
  },
  component: WalkthroughPage,
})

function WalkthroughPage() {
  const { gameId } = Route.useParams();
  const { content, metadata } = Route.useLoaderData();
  const [checkedMap, setCheckedMap] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`rw_checks_${gameId}`);
      if (stored) {
        setCheckedMap(JSON.parse(stored));
      } else {
        setCheckedMap({});
      }
    } catch (e) {
      console.error('Failed to load checkbox states from localStorage', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `rw_checks_${gameId}`) {
        try {
          setCheckedMap(e.newValue ? JSON.parse(e.newValue) : {});
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [gameId]);

  const toggleCheckbox = React.useCallback(
    (key: string) => {
      setCheckedMap((prev) => {
        const current = Boolean(prev[key]);
        const nextVal = !current;
        const next = { ...prev, [key]: nextVal };
        try {
          localStorage.setItem(`rw_checks_${gameId}`, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save checkbox state to localStorage', e);
        }
        return next;
      });
    },
    [gameId]
  );

  const resetProgress = React.useCallback(() => {
    try {
      localStorage.removeItem(`rw_checks_${gameId}`);
    } catch (e) {
      console.error('Failed to clear checkbox states from localStorage', e);
    }
    setCheckedMap({});
  }, [gameId]);

  const tasks = React.useMemo(() => {
    const list: { key: string }[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^[>\s]*-\s+\[[ x]\]\s+(.*)/);
      if (match) {
        const key = slugify(match[1].trim());
        list.push({ key });
      }
    }
    return list;
  }, [content]);

  const totalTasks = tasks.length;
  const completedTasks = React.useMemo(() => {
    return tasks.filter((t) => Boolean(checkedMap[t.key])).length;
  }, [tasks, checkedMap]);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hasProgress = completedTasks > 0;

  useEffect(() => {
    const scrollToHash = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const id = decodeURIComponent(window.location.hash.slice(1));
        const el = document.getElementById(id) || document.getElementById(id.toLowerCase());
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    const timer = setTimeout(scrollToHash, 100);
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, [content]);

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

      {/* Checklist Progress Section */}
      {totalTasks > 0 && (
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">Checklist Progress</span>
              <div className="text-xl font-bold text-slate-100 flex items-baseline gap-2 mt-0.5">
                <span>{completedTasks} of {totalTasks} items completed</span>
                <span className="text-sm font-semibold text-indigo-400/90">({progressPercent}%)</span>
              </div>
            </div>
            {hasProgress && (
              <button
                type="button"
                onClick={resetProgress}
                className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Reset all checkboxes back to 0%"
              >
                Reset Progress
              </button>
            )}
          </div>
          <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Markdown Content */}
      <div 
        className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-indigo-400 prose-a:hover:text-indigo-300 prose-strong:text-slate-200 prose-code:text-slate-200 prose-code:bg-slate-800 prose-code:border prose-code:border-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:shadow-sm prose-code:text-sm prose-code:font-medium prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
      >
        <CheckboxContext.Provider value={{ checkedMap, toggleCheckbox }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: createHeading('h1'),
              h2: createHeading('h2'),
              h3: createHeading('h3'),
              h4: createHeading('h4'),
              h5: createHeading('h5'),
              h6: createHeading('h6'),
              ul({ node: _node, className = '', children, ...props }: any) {
                const isTaskList = className?.includes('contains-task-list');
                return (
                  <ul className={`${className} ${isTaskList ? 'list-none pl-0 space-y-1 contains-task-list' : ''}`} {...props}>
                    {children}
                  </ul>
                );
              },
              li({ node: _node, checked: _checked, className = '', children, ...props }: any) {
                const isTaskList = className?.includes('task-list-item');
                if (isTaskList) {
                  return <TaskItem className={className} {...props}>{children}</TaskItem>;
                }
                return <li className={className} {...props}>{parsePlaystationButtons(children)}</li>;
              },
              input({ node: _node, ...props }: any) {
                if (props.type === 'checkbox') {
                  return null;
                }
                return <input {...props} />;
              },
              a({node: _node, href, children, className = '', onClick, ...props}: any) {
                const isExternal = href?.startsWith('http');
                const isHash = href?.startsWith('#');
                return (
                  <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer noopener' : undefined}
                    referrerPolicy={isExternal ? 'no-referrer' : undefined}
                    className={`text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium cursor-pointer ${className}`}
                    onClick={(e) => {
                      if (onClick) onClick(e);
                      if (isHash && href) {
                        const targetId = decodeURIComponent(href.slice(1));
                        const el = document.getElementById(targetId) || document.getElementById(targetId.toLowerCase());
                        if (el) {
                          e.preventDefault();
                          el.scrollIntoView({ behavior: 'smooth' });
                          window.history.pushState(null, '', href);
                        }
                      }
                    }}
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
        </CheckboxContext.Provider>
      </div>
    </div>
  )
}
