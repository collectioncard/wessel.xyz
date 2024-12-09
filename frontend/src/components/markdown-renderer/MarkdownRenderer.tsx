import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    useEffect(() => {
        if (content) {
            mermaid.initialize({ startOnLoad: true });
            mermaid.run();
        }
    }, [content]);

    return (
        <ReactMarkdown
            children={content}
            remarkPlugins={[remarkGfm]}
            components={{
                code({ className, children, ...props }) {
                    const match = /language-mermaid/.exec(className || '');
                    if (match) {
                        return (
                            <div className="mermaid" {...props as React.HTMLAttributes<HTMLDivElement>}>
                                {String(children).replace(/\n$/, '')}
                            </div>
                        );
                    }
                    const languageMatch = /language-(\w+)/.exec(className || '');
                    return languageMatch ? (
                        <SyntaxHighlighter
                            // @ts-expect-error its literally fine
                            style={tomorrow as { [key: string]: React.CSSProperties }}
                            language={languageMatch[1]}
                            PreTag="div"
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                }
            }}
        />
    );
};

export default MarkdownRenderer;