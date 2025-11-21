import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';

interface Props {
    content: string;
    role: 'user' | 'assistant';
}

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
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
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

export const AIMessageRenderer: React.FC<Props> = ({ content, role }) => {
    // Parse thinking tag if present
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/;
    const match = content.match(thinkingRegex);
    const thinking = match ? match[1].trim() : null;
    const response = content.replace(thinkingRegex, '').trim();

    return (
        <div className="w-full">
            {thinking && (
                <details className="mb-3 p-2 bg-slate-100 dark:bg-slate-800/50 rounded text-xs border border-slate-200 dark:border-slate-700">
                    <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-400">
                        💭 Thinking Process
                    </summary>
                    <div className="mt-2 text-slate-500 dark:text-slate-500 whitespace-pre-wrap font-mono text-[10px]">
                        {thinking}
                    </div>
                </details>
            )}

            <div className="markdown-body">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';

                            // Safely extract text content
                            const content = String(children).replace(/\n$/, '');

                            if (!inline && match) {
                                return (
                                    <CodeBlock language={language} value={content} />
                                );
                            }
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        // Explicitly handle pre to avoid double wrapping or styling issues
                        pre: ({ children }) => <>{children}</>
                    }}
                >
                    {response}
                </ReactMarkdown>
            </div>
        </div>
    );
};
