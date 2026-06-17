import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'github-markdown-css/github-markdown.css';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom'; // 💡 引入縮放套件

// 初始化 Mermaid 配置
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
});

function MermaidRenderer({ chartCode }) {
    const previewContainerRef = useRef(null);
    const modalContainerRef = useRef(null);
    const panZoomInstanceRef = useRef(null); // 儲存 svgPanZoom 實例
    
    const [svgHtml, setSvgHtml] = useState('');
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. 負責異步渲染 Mermaid 語法成 SVG 字串
    useEffect(() => {
        if (!chartCode) return;
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

    // 2. 當打開全螢幕燈箱（Modal）且 SVG 渲染完成時，初始化「滑鼠滾輪縮放」功能
    useEffect(() => {
        if (isModalOpen && svgHtml && modalContainerRef.current) {
            const svgElement = modalContainerRef.current.querySelector('svg');
            
            if (svgElement) {
                // 強制讓 SVG 填滿全螢幕容器，交由 svg-pan-zoom 接管縮放比例
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';

                // 初始化縮放控制
                panZoomInstanceRef.current = svgPanZoom(svgElement, {
                    zoomEnabled: true,           // 啟用滑鼠滾輪縮放
                    controlIconsEnabled: true,   // 右下角顯示 放大/縮小/重設 控制按鈕
                    fit: true,                   // 自動適應容器大小
                    center: true,                // 居中顯示
                    minZoom: 0.2,                // 最小縮小到 0.2 倍
                    maxZoom: 15,                 // 💡 最大放大到 15 倍（字體再小都能放大看清）
                    mouseWheelZoomEnabled: true, // 確保滾輪縮放開啟
                });
            }
        }

        // 關閉燈箱時，銷毀縮放實例釋放記憶體
        return () => {
            if (panZoomInstanceRef.current) {
                panZoomInstanceRef.current.destroy();
                panZoomInstanceRef.current = null;
            }
        };
    }, [isModalOpen, svgHtml]);

    if (error) {
        return (
            <div className="my-4 p-4 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm">
                ⚠️ {error}
                <pre className="mt-2 text-xs overflow-x-auto bg-red-100 p-2 rounded">{chartCode}</pre>
            </div>
        );
    }

    return (
        <>
            {/* 網頁內一般的預覽區塊（點擊即可全螢幕） */}
            <div 
                onClick={() => setIsModalOpen(true)}
                className="my-6 p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col justify-center shadow-sm min-h-[150px] items-center cursor-zoom-in hover:border-blue-400 hover:bg-gray-100/50 transition-all relative group"
            >
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                    <span>🔍 點擊進入極致放大模式</span>
                </div>
                <div
                    ref={previewContainerRef}
                    className="w-full flex justify-center pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                    dangerouslySetInnerHTML={{ __html: svgHtml || '<span className="text-gray-400">圖表載入中...</span>' }}
                />
            </div>

            {/* 💡 全螢幕高階縮放燈箱 (Modal) */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-center m-0 p-0"
                    onClick={() => setIsModalOpen(false)}
                >
                    {/* 燈箱主體 - 佔據大部分螢幕 */}
                    <div 
                        className="bg-white w-[92vw] h-[88vh] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // 防止點擊圖表關閉燈箱
                    >
                        {/* 頂部工具列 */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                            <div className="flex flex-col">
                                <span className="text-gray-800 font-semibold text-sm">架構圖/ER圖 互動檢視器</span>
                                <span className="text-xs text-gray-500">操作指南：[滑鼠滾輪] 放大縮小 / [按住滑鼠左鍵] 拖曳平移圖表</span>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 font-medium bg-white border border-gray-200 hover:bg-gray-100 rounded-lg px-3 py-1.5 text-xs shadow-sm transition-colors cursor-pointer"
                            >
                                關閉全螢幕 (✕)
                            </button>
                        </div>

                        {/* 💡 圖表操作核心畫布區 */}
                        <div 
                            ref={modalContainerRef}
                            className="flex-1 bg-gray-50 overflow-hidden cursor-grab active:cursor-grabbing w-full h-full relative"
                            dangerouslySetInnerHTML={{ __html: svgHtml }}
                        />
                    </div>
                </div>
            )}
        </>
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
                const chartCode = String(children)
                    .replace(/\n$/, '')
                    .replace(/\u00A0/g, ' ');

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
            <div className="mb-6 border-b pb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {richMarkdown}
                </ReactMarkdown>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={customRenderers}
                >
                    {finalCollapsibleContent}
                </ReactMarkdown>
            </div>

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