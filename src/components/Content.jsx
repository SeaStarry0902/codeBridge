import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'github-markdown-css/github-markdown.css';
import mermaid from 'mermaid';

// 初始化 Mermaid 配置
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
});

function MermaidRenderer({ chartCode }) {
    const containerRef = useRef(null);
    const [svgHtml, setSvgHtml] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chartCode || !containerRef.current) return;
        const id = `mermaid-${Math.floor(Math.random() * 1000000)}`;

        async function renderChart() {
            try {
                setError(null);
                const { svg } = await mermaid.render(id, chartCode);
                setSvgHtml(svg);
            } catch (err) {
                console.error("Mermaid 渲染失敗:", err);
                setError("圖表語法解析失敗，無法呈現圖片");
                mermaid.initialize({ startOnLoad: true });
            }
        }
        renderChart();
    }, [chartCode]);

    if (error) {
        return (
            <div className="my-4 p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm">
                ⚠️ {error}
                <pre className="mt-2 text-xs overflow-x-auto bg-red-100 p-2 rounded">{chartCode}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-6 p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-center overflow-x-auto shadow-sm min-h-[150px] items-center"
            dangerouslySetInnerHTML={{ __html: svgHtml || '<span className="text-gray-400">圖表載入中...</span>' }}
        />
    );
}

function parseMarkdownToCollapsible(text) {
    if (!text) return '沒有結果';
    const sections = text.split(/\n(?=##\s)/);
    let processedText = sections[0];
    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        const firstLine = lines[0];
        const bodyContent = lines.slice(1).join('\n');
        const titleText = firstLine.replace(/^##\s+/, '');

        processedText += `
\n
<details style="margin: 18px 0; border: 1px solid #d0d7de; border-radius: 8px; background-color: #ffffff;" >
  <summary style="padding: 14px 18px; font-size: 1.1em; font-weight: 600; color: #24292f; cursor: pointer; background-color: #f6f8fa; border-bottom: 1px solid #d0d7de; outline: none; display: flex; align-items: center; justify-content: space-between; user-select: none;">
    <span>${titleText}</span>
    <span style="font-size: 0.8em; color: #0969da; font-weight: normal;">(點擊收合)</span>
  </summary>
  <div style="padding: 18px; background-color: #ffffff;">

${bodyContent}

  </div>
</details>
\n`;
    }
    return processedText;
}

// 💡 改版重點：只接收「目前選中的單一資料項目 activeData」
function Content({ activeData, deleteResult }) {
    if (!activeData) return <div className="text-gray-400 p-8 text-center">請從左側選擇要檢視的文件</div>;

    const richMarkdown = ` # 📄 ${activeData.option || '未知的測試'}`;
    const rawContent = activeData.content || '';
    const finalCollapsibleContent = parseMarkdownToCollapsible(rawContent);

    const customRenderers = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';

            if (inline) {
                return (
                    <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                    </code>
                );
            }

            if (language === 'mermaid') {
                // 1. 移除結尾換行
                // 2. 使用Regex將全球的不中斷空白 (\u00A0) 替換為標準空格
                const chartCode = String(children)
                    .replace(/\n$/, '')
                    .replace(/\u00A0/g, ' '); // 💡 解決此錯誤的關鍵

                return <MermaidRenderer chartCode={chartCode} />;
            }

            return (
                <div className="my-3 rounded-lg overflow-hidden shadow-inner text-sm font-mono">
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="pre"
                        showLineNumbers={true}
                        customStyle={{ margin: 0, padding: '1rem' }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            );
        }
    };

    return (
        <div className="markdown-body p-6 max-w-4xl mx-auto h-full overflow-y-auto">
            {/* 頂部標題 */}
            <div className="mb-6 border-b pb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {richMarkdown}
                </ReactMarkdown>
            </div>

            {/* 顯示加工與繪圖後的內容 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={customRenderers}
                >
                    {finalCollapsibleContent}
                </ReactMarkdown>
            </div>

            {/* 刪除按鈕 */}
            <div className="border-t border-gray-200 mt-12 pt-6 flex justify-end">
                <button
                    onClick={deleteResult}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                    刪除此結果
                </button>
            </div>
        </div>
    );
}

export default Content;