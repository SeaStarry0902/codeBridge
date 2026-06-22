import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Bot, User } from 'lucide-react';
// 💡 引入 Markdown 與程式碼高亮套件
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'github-markdown-css/github-markdown.css';

function Chatbot({ isOpen, onClose, activeData, sessionId }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: `嗨！我是你的專案 AI 助手。我已經幫你載入了「${activeData?.option || '當前文件'}」，有任何關於此文件或程式碼的問題都可以問我喔！` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // 當切換左側分頁（文件改變）時，重置或加入提示
    useEffect(() => {
        if (activeData) {
            setMessages([
                { role: 'assistant', text: `已切換至「${activeData.option}」。你可以問我關於此文件的任何問題！` }
            ]);
        }
    }, [activeData]);

    // 自動滾動到底部
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // 💡 定義聊天室內專門渲染 Markdown 程式碼塊的組件
    const chatRenderers = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';

            if (inline) {
                return (
                    <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                    </code>
                );
            }

            return (
                <div className="my-2 rounded-lg overflow-hidden shadow-inner text-xs font-mono max-w-full">
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="pre"
                        showLineNumbers={false} // 聊天室代碼通常較短，關閉行號看起來比較乾淨
                        customStyle={{ margin: 0, padding: '0.75rem' }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            );
        }
    };

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:8000/qa/sessions/${sessionId}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    question: userMessage
                })
            });
            const data = await response.json();
            console.log("AI 回應數據:", data);
            setMessages(prev => [...prev, { role: 'assistant', text: data.answer || "AI 回應失敗" }]);
        } catch (error) {
            console.error("AI 連線失敗", error);
            setMessages(prev => [...prev, { role: 'assistant', text: "❌ 連線錯誤，請稍後再試。" }]);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="w-80 md:w-96 h-screen bg-white border-l border-gray-200 flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-right shrink-0">
            {/* 頂部 Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                    <Sparkles className="size-4 animate-pulse" />
                    <span>Gemini 文件助手</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="size-4" />
                </button>
            </div>

            {/* 聊天內容區 */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50/50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                        <div className={`size-7 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                            {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                        </div>
                        {/* 💡 修改這裡：將原本的 <p> 標籤替換為 ReactMarkdown */}
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden break-words ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                            <div className={`prose max-w-full text-sm ${msg.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={chatRenderers}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-2.5 max-w-[85%] self-start">
                        <div className="size-7 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Bot className="size-4" />
                        </div>
                        <div className="p-3 rounded-2xl text-sm bg-white text-gray-400 border border-gray-100 rounded-tl-none flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* 輸入區 */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`問問關於「${activeData?.option || '此文件'}」的細節...`}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-sm shrink-0 cursor-pointer">
                    <Send className="size-4" />
                </button>
            </form>
        </div>
    );
}

export default Chatbot;