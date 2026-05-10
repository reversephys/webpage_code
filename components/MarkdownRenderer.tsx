"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface MarkdownRendererProps {
    content: string;
    small?: boolean;
}

export function MarkdownRenderer({ content, small }: MarkdownRendererProps) {
    return (
        <div className={`prose ${small ? 'prose-sm' : 'prose-lg'} dark:prose-invert mx-auto max-w-none`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className={`${small ? 'text-xl mt-5 mb-2' : 'text-4xl mt-12 mb-6'} font-bold font-serif tracking-tight`}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className={`${small ? 'text-lg mt-4 mb-2 pb-2' : 'text-3xl mt-10 mb-4 pb-3'} font-bold font-serif tracking-tight border-b border-gray-200 dark:border-gray-700`}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className={`${small ? 'text-base mt-3 mb-2' : 'text-2xl mt-8 mb-3'} font-semibold font-serif tracking-tight`}>{children}</h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className={`${small ? 'text-sm mt-3 mb-1' : 'text-xl mt-6 mb-2'} font-semibold font-serif tracking-tight`}>{children}</h4>
                    ),
                    h6: ({ children }) => (
                        <h6 className={`${small ? 'text-[11px] mt-2 mb-1' : 'text-base mt-4 mb-2'} font-semibold font-serif tracking-tight text-gray-500`}>{children}</h6>
                    ),
                    p: ({ children }) => (
                        <div className={`${small ? 'mb-3 text-[11px]' : 'mb-6 text-base'} leading-relaxed text-gray-700 dark:text-gray-300`}>
                            {children}
                        </div>
                    ),
                    ul: ({ children }) => (
                        <ul className={`list-disc ${small ? 'pl-4 mb-3 text-[11px]' : 'pl-6 mb-6 text-base'} text-gray-700 dark:text-gray-300`}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className={`list-decimal ${small ? 'pl-4 mb-3 text-[11px]' : 'pl-6 mb-6 text-base'} text-gray-700 dark:text-gray-300`}>{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className={`${small ? 'mb-1 text-[11px]' : 'mb-2 text-base'}`}>{children}</li>
                    ),
                    img: (props) => {
                        const { src, alt } = props;
                        if (!src) return null;
                        return (
                            <span className={`block ${small ? 'my-3' : 'my-8'}`}>
                                <Image
                                    src={src as string}
                                    alt={alt || ""}
                                    width={800}
                                    height={450}
                                    className="w-full h-auto rounded-lg shadow-md"
                                    unoptimized
                                />
                            </span>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className={`bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto ${small ? 'text-[10px] my-3' : 'text-sm my-6'} leading-relaxed`}>
                            {children}
                        </pre>
                    ),
                    code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        if (isBlock) {
                            return <code className={`${className} ${small ? 'text-[10px]' : ''}`}>{children}</code>;
                        }
                        return (
                            <code className={`bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono ${small ? 'text-[10px]' : 'text-sm'}`}>
                                {children}
                            </code>
                        );
                    },
                    table: ({ children }) => (
                        <table className={`min-w-full border-collapse border border-gray-300 dark:border-gray-600 ${small ? 'my-3 text-[11px]' : 'my-6 text-base'}`}>
                            {children}
                        </table>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
