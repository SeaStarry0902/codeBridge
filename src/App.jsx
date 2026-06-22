import { useState } from 'react'
import Header from './components/Header'
import FileUploader from './components/FileUploader'
import Content from './components/Content'
import Chatbot from './components/Chatbot' 
import { MessageSquareShare } from 'lucide-react' 

function App() {
  const [results, setResults] = useState([]); 
  const [activeTab, setActiveTab] = useState(0); 
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [sessionId, setSessionId] = useState(null); 

  function handleDeleteResult() {
    const updatedResults = results.filter((_, index) => index !== activeTab);
    setResults(updatedResults);
    setActiveTab(prev => (prev > 0 ? prev - 1 : 0));
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {results.length === 0 && <Header />}
      <div className="flex flex-1 h-full w-screen overflow-hidden bg-white">
        <FileUploader
          onResult={setResults}
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSessionId={setSessionId}
        />

        {/* 主要內容展示區 */}
        <div className="flex-1 h-full overflow-y-auto bg-gray-50 relative flex flex-col">
          {results.length > 0 ? (
            <>
              {/* 💡 懸浮 AI 開啟按鈕：當聊天室關閉時顯示 */}
              {!isChatOpen && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer font-medium text-sm"
                >
                  <MessageSquareShare className="size-4" />
                  <span>詢問 AI 助手</span>
                </button>
              )}
              
              <Content
                activeData={results[activeTab]}
                deleteResult={handleDeleteResult}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <p className="text-lg font-medium">請在左側選擇並上傳專案壓縮檔</p>
              <p className="text-sm">上傳成功後，分析產出的文件與圖表將會顯示在此處。</p>
            </div>
          )}
        </div>

        {/* 💡 側邊 AI 聊天室 */}
        {results.length > 0 && (
          <Chatbot 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            activeData={results[activeTab]} 
            sessionId={sessionId}
          />
        )}
      </div>
    </div>
  );
}

export default App;