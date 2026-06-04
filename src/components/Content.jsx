import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'github-markdown-css/github-markdown.css';
import mermaid from 'mermaid';

// 💡 初始化 Mermaid 配置（設定主題為基礎或森林色系，適合文件閱讀）
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
});

/**
 * 🛠️ 核心圖表渲染元件
 * 負責將 Mermaid 程式碼字串，即時轉譯成網頁上的真實圖表
 */
function MermaidRenderer({ chartCode }) {
    const containerRef = useRef(null);
    const [svgHtml, setSvgHtml] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!chartCode || !containerRef.current) return;

        // 生成一個隨機且唯一的 ID 給這張圖表
        const id = `mermaid-${Math.floor(Math.random() * 1000000)}`;
        
        async function renderChart() {
            try {
                setError(null);
                // 呼叫 mermaid 核心 API 進行圖表渲染
                const { svg } = await mermaid.render(id, chartCode);
                setSvgHtml(svg);
            } catch (err) {
                console.error("Mermaid 渲染失敗:", err);
                setError("圖表語法解析失敗，無法呈現圖片");
                // 發生錯誤時重置 mermaid，防止壞掉的圖表卡死整個頁面
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

function Content({ data, deleteResult }) {
    const validData = Array.isArray(data) ? data : [];
    const richMarkdown = ` # 這是一個${validData.map((item) => item.option).join('、') || '未知'}的測試`;
    const [activeTab, setActiveTab] = useState(0);

    const rawContent = validData[activeTab]?.content || '';
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
                const chartCode = String(children).replace(/\n$/, '');
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
        <div className="markdown-body pt-10 px-4 ">
            <div className="mb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {richMarkdown}
                </ReactMarkdown>
            </div>

            {/* 動態分頁按鈕 */}
            <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
                {validData.map((item, index) => (
                    <button 
                        key={index}
                        className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all cursor-pointer ${
                            activeTab === index 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`} 
                        onClick={() => setActiveTab(index)}
                    >
                        {item.option || `分頁 ${index}`}
                    </button>
                ))}
            </div>

            {/* 顯示加工與繪圖後的內容 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
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
                    刪除結果
                </button>
            </div>
        </div>
    );
}

export default Content;
// 2版
// import React, { useState } from 'react';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import rehypeRaw from 'rehype-raw';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// import 'github-markdown-css/github-markdown.css';

// function parseMarkdownToCollapsible(text) {
//     if (!text) return '沒有結果';

//     const sections = text.split(/\n(?=##\s)/);
//     let processedText = sections[0]; // 第一個區塊（通常是第一個 ## 之前的內容）

//     for (let i = 1; i < sections.length; i++) {
//         const section = sections[i];
//         const lines = section.split('\n');
//         const firstLine = lines[0]; // 例如 "## 專案概述"
//         const bodyContent = lines.slice(1).join('\n'); // 該小標題底下的內文

//         // 提取出純標題文字（去掉 "## "）
//         const titleText = firstLine.replace(/^##\s+/, '');

//         // 💡 核心修正：${bodyContent} 的上下一定要刻意「強制作出空行」
//         // 這樣 react-markdown 才能穿透 HTML 標籤去正確解析內部的程式碼區塊！
//         processedText += `
// \n
// <details style="margin: 18px 0; border: 1px solid #d0d7de; border-radius: 6px; background-color: #ffffff;" >
//   <summary style="padding: 12px 16px; font-size: 1.15em; font-weight: 600; color: #24292f; cursor: pointer; background-color: #f6f8fa; border-bottom: 1px solid #d0d7de; outline: none; display: flex; align-items: center; justify-content: space-between; user-select: none;">
//     <span>${titleText}</span>
//     <span style="font-size: 0.8em; color: #0969da; font-weight: normal;">(點擊收合)</span>
//   </summary>
//   <div style="padding: 16px; background-color: #ffffff;">

// ${bodyContent}

//   </div>
// </details>
// \n`;
//     }

//     return processedText;
// }

// function Content({ data, deleteResult }) {
//     // 過濾安全資料，防範地圖錯誤
//     const validData = Array.isArray(data) ? data : [];
//     const richMarkdown = ` # 這是一個${validData.map((item) => item.option).join('、') || '未知'}的測試`;
//     const [activeTab, setActiveTab] = useState(0);

//     const rawContent = validData[activeTab]?.content || '';
//     const finalCollapsibleContent = parseMarkdownToCollapsible(rawContent);

//     // 💡 關鍵：自訂渲染器（Components），這會教導 Markdown 如何「對應不同種類的資料」
//     const customRenderers = {
//         // 當發現 Markdown 裡面有程式碼區塊（無論是 dockerfile, yaml, javascript 還是 text）
//         code({ node, inline, className, children, ...props }) {
//             const match = /language-(\w+)/.exec(className || '');
//             const language = match ? match[1] : 'text'; // 抓取像是 'dockerfile' 或 'yaml' 的字眼

//             // 如果是一般的行內代碼 (例如 `npm run dev`)
//             if (inline) {
//                 return (
//                     <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
//                         {children}
//                     </code>
//                 );
//             }

//             // 🌟 如果是區塊程式碼，丟給專業的高亮套件，並自動對應語法種類！
//             return (
//                 <div className="my-3 rounded-lg overflow-hidden shadow-inner text-sm font-mono">
//                     <SyntaxHighlighter
//                         style={vscDarkPlus} // VS Code 經典深色主題
//                         language={language}  // 自動對應種類：yaml / dockerfile / mermaid / text
//                         PreTag="pre"
//                         showLineNumbers={true} // 顯示行號，交接程式碼時超方便
//                         customStyle={{ margin: 0, padding: '1rem' }}
//                         {...props}
//                     >
//                         {String(children).replace(/\n$/, '')}
//                     </SyntaxHighlighter>
//                 </div>
//             );
//         }
//     };

//     return (
//         <div className="markdown-body pt-10 max-w-4xl mx-auto px-4 pb-16" >
//             {/* 上半部動態標題 */}
//             <div className="mb-6">
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                     {richMarkdown}
//                 </ReactMarkdown>
//             </div>

//             {/* 動態生成的精緻頁籤按鈕 */}
//             <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
//                 {validData.map((item, index) => (
//                     <button
//                         key={index}
//                         className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all cursor-pointer ${activeTab === index
//                             ? 'bg-blue-600 text-white shadow'
//                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                             }`}
//                         onClick={() => setActiveTab(index)}
//                     >
//                         {item.option || `分頁 ${index}`}
//                     </button>
//                 ))}
//             </div>

//             {/* 顯示加工後的 API 內容 */}
//             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
//                 <ReactMarkdown
//                     remarkPlugins={[remarkGfm]}
//                     rehypePlugins={[rehypeRaw]}       // 👈 完美解析 <details>，消滅殘影
//                     components={customRenderers}      // 👈 完美對應不同資料，上色高亮
//                 >
//                     {finalCollapsibleContent}
//                 </ReactMarkdown>
//             </div>

//             {/* 底部功能與刪除按鈕 */}
//             <div className="border-t border-gray-200 mt-12 pt-6 flex justify-end">
//                 <button
//                     onClick={deleteResult}
//                     className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
//                 >
//                     刪除結果
//                 </button>
//             </div>
//         </div>
//     );
// }

// export default Content;
// import React, { useState } from 'react';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import rehypeRaw from 'rehype-raw'; // 👈 1. 記得引入這個，才能解析 <details>
// // 引入 GitHub 的 CSS 樣式
// import 'github-markdown-css/github-markdown.css';

// /**
//  * 💡 核心文字處理函式 (放在 Component 外面，乾淨且不影響主邏輯)
//  * 負責把長篇 Markdown 的 "##" 區塊自動加上折疊標籤
//  */
// function parseMarkdownToCollapsible(text) {
//     if (!text) return '沒有結果';

//     // 使用 \n(?=##\s) 斷言：只在「換行且後面是 ## 加空白」的位置切開
//     const sections = text.split(/\n(?=##\s)/);
//     let processedText = sections[0]; // 第一個區塊（通常是第一個 ## 之前的內容）

//     for (let i = 1; i < sections.length; i++) {
//         const section = sections[i];
//         const lines = section.split('\n');
//         const firstLine = lines[0]; // 例如 "## 專案概述"
//         const bodyContent = lines.slice(1).join('\n'); // 該小標題底下的內文

//         // 提取出純標題文字（去掉 "## "）
//         const titleText = firstLine.replace(/^##\s+/, '');

//         // 拼接成原生 HTML 的 <details> 結構，預設是展開的 (open)
//         // 這裡的樣式我有稍微融合 github-markdown-css 的風格，讓它不突兀
//         processedText += `
// \n
// <details style="margin: 16px 0; border: 1px solid #d0d7de; border-radius: 6px; background-color: #ffffff;">
//   <summary style="padding: 10px 16px; font-size: 1.25em; font-weight: 600; color: #24292f; cursor: pointer; background-color: #f6f8fa; border-bottom: 1px solid #d0d7de; outline: none; display: flex; align-items: center; justify-content: space-between; user-select: none;">
//     <span>${titleText}</span>
//     <span style="font-size: 0.75em; color: #0969da; font-weight: normal;">(點擊收合)</span>
//   </summary>
//   <div style="padding: 16px; background-color: #ffffff;">
//     ${bodyContent}
//   </div>
// </details>
// \n`;
//     }

//     return processedText;
// }

// function Content({ data, deleteResult }) {
//     const richMarkdown = ` # 這是一個${data.map((item, index) => item.option).join('、') || '未知'}的測試`;
//     const [activeTab, setActiveTab] = useState(0);

//     // 👈 2. 在這裡攔截當前頁籤的 API 內容，並丟進去 function 加工
//     const rawContent = data[activeTab]?.content;
//     const finalCollapsibleContent = parseMarkdownToCollapsible(rawContent);

//     return (
//         <div className="markdown-body pt-10" >
//             {/* 上半部的測試標題 */}
//             <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                 {richMarkdown}
//             </ReactMarkdown>

//             {/* 頁籤按鈕 */}
//             <button className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => setActiveTab(0)}>
//                 0
//             </button>
//             <button className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => setActiveTab(1)}>
//                 1
//             </button>
//             <button className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => setActiveTab(2)}>
//                 2
//             </button>
//             <button className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => setActiveTab(3)}>
//                 3
//             </button>

//             {/* 👈 3. 顯示加工後的 API 內容，記得補上 rehypePlugins */}
//             <ReactMarkdown
//                 remarkPlugins={[remarkGfm]}
//                 rehypePlugins={[rehypeRaw]} // 關鍵：讓 react-markdown 認得我們塞進去的 HTML 標籤
//             >
//                 {finalCollapsibleContent}
//             </ReactMarkdown>

//             {/* 刪除按鈕 */}
//             <button onClick={deleteResult} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
//                 删除结果
//             </button>
//         </div>
//     );
// }

// export default Content;