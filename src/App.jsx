import { useState } from 'react'
import Header from './components/Header'
import FileUploader from './components/FileUploader'
import Content from './components/Content'

function App() {
  const [results, setResults] = useState([]); // 存放 API 回傳的所有分頁資料
  const [activeTab, setActiveTab] = useState(0); // 主控端紀錄目前點擊了左邊的第幾個項目

  // 刪除目前單一結果的處理方法
  function handleDeleteResult() {
    const updatedResults = results.filter((_, index) => index !== activeTab);
    setResults(updatedResults);
    // 刪除後自動往前跳一格，避免 index 溢出
    setActiveTab(prev => (prev > 0 ? prev - 1 : 0));
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {results.length === 0 && <Header />}
      <div className="flex h-screen w-screen overflow-hidden bg-white font-sans">
        {/* 左側：負責上傳。若有資料，則會自動轉化為 Gemini 側邊欄 */}
        <FileUploader
          onResult={setResults}
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* 右側：主內容呈現區 */}
        <div className="flex-1 h-screen overflow-y-auto bg-gray-50">
          {results.length > 0 ? (
            <Content
              activeData={results[activeTab]}
              deleteResult={handleDeleteResult}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <p className="text-lg font-medium">請在左側選擇並上傳專案壓縮檔</p>
              <p className="text-sm">上傳成功後，分析產出的文件與圖表將會顯示在此處。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;