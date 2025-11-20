import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, BrainCircuit, Copy, Check } from 'lucide-react';
import { simpleCn } from '../../utils';
import 'highlight.js/styles/atom-one-dark.css'; // Import highlight.js styles

interface Props {
    content: string;
    role: 'user' | 'model';
}

export const AIMessageRenderer: React.FC<Props> = ({ content, role }) => {
    // Function to extract thinking process
    const parseContent = (text: string) => {
        const thinkRegex = /<(think|thinking)>([\s\S]*?)<\/\1>/i;
        const match = text.match(thinkRegex);

        if (match) {
            return {
                thinking: match[2].trim(),
                response: text.replace(match[0], '').trim()
            };
        }
        return { thinking: null, response: text };
    };

    const { thinking, response } = parseContent(content);

    return (
        <div className="w-full overflow-hidden">
            {thinking && (
                <ThinkingBlock content={thinking} />
            )}

            <div className={simpleCn(
                "prose prose-sm max-w-none dark:prose-invert",
                "prose-pre:bg-[#282c34] prose-pre:p-0 prose-pre:rounded-lg prose-pre:overflow-hidden",
                "prose-code:bg-slate-100 dark:prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
                role === 'user' ? "text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"
            )}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';

                            if (!inline && match) {
                                return (
                                    <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />
                                );
                            }
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {response}
                </ReactMarkdown>
            </div>
        </div>
    );
};

const ThinkingBlock: React.FC<{ content: string }> = ({ content }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mb-3 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-white/5">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <BrainCircuit size={14} className="text-nebula-500" />
                <span>Thinking Process</span>
            </button>

            {isExpanded && (
                <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 font-mono whitespace-pre-wrap leading-relaxed">
                    {content}
                </div>
            )}
        </div>
    );
};

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-[#282c34] border-b border-slate-200 dark:border-white/10">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-nebula-500 dark:hover:text-nebula-400 transition-colors"
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-3 bg-white dark:bg-[#282c34] overflow-x-auto text-xs font-mono leading-relaxed">
                <pre>
                    <code className={`language-${language}`}>{value}</code>
                </pre>
            </div>
        </div>
    );
};
