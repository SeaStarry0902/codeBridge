import React, { useState, useRef } from 'react';
import { Upload, FileArchive, X, FileText, ChevronRight } from 'lucide-react';

function FileUploader({ onResult, results, activeTab, setActiveTab, setSessionId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [isInputUrl, setIsInputUrl] = useState(false);
  const [isUploadUrl, setIsUploadUrl] = useState(false);
  const baseUrl = "http://localhost:8000/api/v1/";
  const fileInputRef = useRef(null);
  const [optionList, setOptionList] = useState([
    { id: 1, name: "生成api使用文件", apiUrl: "docs/api-docs/generate", selected: false, tag: "api_docs" },
    { id: 2, name: "生成系統架構圖和ER圖", apiUrl: "diagrams/generate", selected: false, tag: "diagram" },
    { id: 3, name: "生成專案建制指南", apiUrl: "docs/env-guide/generate", selected: false, tag: "env_guide" },
    { id: 4, name: "生成dockerfile", apiUrl: "dockerfile/generate", selected: false, tag: "dockerfile" },
  ]);

  function handleCheckboxChange(opt) {
    setOptionList(optionList.map(o => o.id === opt.id ? { ...o, selected: !o.selected } : o));
    if (selectedOptions.some(item => item.id === opt.id)) {
      setSelectedOptions(selectedOptions.filter(item => item.id !== opt.id))
    } else {
      setSelectedOptions([...selectedOptions, opt]);
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const isZip = fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z');

      if (isZip) {
        setFile(selectedFile);
      } else {
        alert("格式錯誤，僅限壓縮檔");
      }
    }
  }

  async function uploadUrl() {
    if (!githubUrl) return;
    setUploading(true);
    try {
      // 1. 先進行耗時的文件生成與分析
      const res = await fetch("http://localhost:8000/api/v1/github/analyze-all", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          github_url: githubUrl,
          generate: selectedOptions.map(opt => opt.tag)
        })
      });

      const r = await res.json();
      const allresult = [];
      if (r.api_docs) {
        allresult.push({
          option: "API 使用文件",
          content: r.api_docs.artifacts[0].content
        });
      }
      if (r.diagram) {
        allresult.push({
          option: "系統架構圖與ER圖",
          content: `\n## Architecture Diagram\n\`\`\`mermaid\n${r.diagram.artifacts[0].content}\n\`\`\`\n\n## ER Diagram\n\`\`\`mermaid\n${r.diagram.artifacts[1].content}\n\`\`\``
        });
      }
      if (r.env_guide) {
        allresult.push({
          option: "專案建制指南",
          content: r.env_guide.artifacts[0].content
        });
      }
      if (r.dockerfile) {
        allresult.push({
          option: "Docker 相關文件",
          content: `\n## Dockerfile\n\`\`\`dockerfile\n${r.dockerfile.artifacts[0].content}\n\`\`\`\n\n## Docker Compose\n\`\`\`yaml\n${r.dockerfile.artifacts[1].content}\n\`\`\`\n\n## Docker Ignore\n\`\`\`text\n${r.dockerfile.artifacts[2].content}\n\`\`\``
        });
      }

      // 2. 🌟 文件完全生成成功後，才去獲得新鮮的 sessionId
      const getSessionID = await fetch('http://localhost:8000/qa/sessions/from-github', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          github_url: githubUrl
        })
      });

      const sessionData = await getSessionID.json();
      setSessionId(sessionData.session_id);
      console.log("成功生成文件後取得的 Session ID:", sessionData.session_id);

      // 3. 最後渲染畫面
      console.log("API 回傳的原始資料:", r);
      console.log("整理後傳給主頁面的資料:", allresult);
      onResult(allresult);
      setActiveTab(0);
    }
    catch (error) {
      console.error("失敗", error);
    }
    finally {
      setUploading(false); // 記得要在這裡補上關閉 loading 狀態
    }
  }

  async function uploadFile() {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. 先同步併發多個任務去生成文件
      const resPromises = selectedOptions.map(async (opt) => {
        const response = await fetch(baseUrl + opt.apiUrl, {
          method: 'POST',
          headers: { 'accept': 'application/json' },
          body: formData
        });
        if (response.ok) {
          const data = await response.json();
          let markdown = '';
          console.log("API 回傳的原始資料:", data);

          if (data.artifacts && data.artifacts.length == 2) {
            markdown += `\n## Architecture Diagram\n\`\`\`mermaid\n${data.artifacts[0].content}\n\`\`\`\n\n`;
            markdown += `## ER Diagram\n\`\`\`mermaid\n${data.artifacts[1].content}\n\`\`\``;
          }
          else if (data.artifacts && data.artifacts.length == 3) {
            markdown += `\n## Dockerfile\n\`\`\`dockerfile\n${data.artifacts[0].content}\n\`\`\`\n\n`;
            markdown += `## Docker Compose\n\`\`\`yaml\n${data.artifacts[1].content}\n\`\`\`\n\n`;
            markdown += `## Docker Ignore\n\`\`\`text\n${data.artifacts[2].content}\n\`\`\``;
          }
          else {
            markdown = data.content || JSON.stringify(data);
          }

          return {
            option: opt.name,
            content: markdown
          };
        }
      });

      const allResults = await Promise.all(resPromises);
      const filteredResults = allResults.filter(Boolean); // 暫存過濾後的結果

      // 2. 🌟 確認文件都拿到後，才去打後端 QA Session 路由，這樣 30 分鐘會重新算起
      const getSessionID = await fetch('http://localhost:8000/qa/sessions', {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: formData
      });
      const sessionData = await getSessionID.json();
      console.log("文件分析完畢，新取得的 Session ID:", sessionData);
      setSessionId(sessionData.session_id);

      // 3. 渲染到主頁面
      console.log("所有選項的結果:", filteredResults);
      onResult(filteredResults);
      setActiveTab(0);
    }
    catch (error) {
      console.error("失敗", error);
    } finally {
      setUploading(false);
      setSelectedOptions([]);
      fileInputRef.current.value = null;
      setOptionList(optionList.map(opt => ({ ...opt, selected: false })));
    }
  }

  function resetUploader() {
    setFile(null);
    setUploading(false);
    setSelectedOptions([]);
    setGithubUrl("");
    setIsInputUrl(false);
    setIsUploadUrl(false);
    setOptionList(optionList.map(opt => ({ ...opt, selected: false })));
    if (fileInputRef.current) fileInputRef.current.value = null;
    onResult([]); // 清空主頁面的資料
  }

  // 🌟 Gemini 風格：如果已有分析結果，左側轉化為精緻的歷史檔案列表 (Sidebar)
  if (results && results.length > 0) {
    return (
      <div className="w-64 h-screen bg-gray-900 text-gray-300 flex flex-col justify-between border-r border-gray-800">
        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-sm font-bold tracking-wider text-gray-400">分析產出文件</span>
            <button onClick={resetUploader} className="p-1 hover:bg-gray-800 rounded text-red-400" title="重新上傳">
              <X className="size-4" />
            </button>
          </div>

          {/* 檔案/功能選單清單 */}
          <div className="flex flex-col gap-1">
            {results.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left ${activeTab === index
                  ? 'bg-blue-600 text-white font-medium shadow-md'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="size-4 shrink-0" />
                  <span className="truncate">{item.option}</span>
                </div>
                {activeTab === index && <ChevronRight className="size-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 側邊欄底部專案標記 */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex items-center gap-2">
          <FileArchive className="size-4 text-blue-500" />
          <span className="truncate">{file?.name || "已載入專案"}</span>
        </div>
      </div>
    );
  }

  // 初始尚未上傳的狀態（置中大框框）
  return (
    <div className='flex justify-center items-center h-screen w-full bg-gray-50'>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip,.rar,.7z" className="hidden" />

      {/* 💡 當正在等待後端回傳時，呈現滿版載入中畫面 */}
      {uploading ? (
        <div className="flex flex-col items-center justify-center bg-white p-12 rounded-2xl shadow-md border border-gray-100 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center mb-6">
            <div className="size-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <Upload className="size-6 text-blue-500 absolute animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">AI 正在深度分析中</h3>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            正在解構您的專案結構並生成專屬文件...<br />
            根據專案大小，這可能需要數十秒到一分鐘的時間。
          </p>
          
        </div>
      ) : (
        /* 💡 當沒有在傳輸資料時，才渲染原有的上傳介面 */
        <>
          {!file ? (
            <div className="flex flex-col items-center gap-10 ">
              {!isUploadUrl ? (
                <div className='flex flex-col items-center gap-6 bg-white p-10 rounded-2xl shadow-sm border border-gray-100'>
                  <span className='text-2xl font-medium tracking-wide text-gray-700'>點擊上傳專案壓縮檔</span>
                  <button className='p-6 border-4 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-all cursor-pointer bg-gray-50' onClick={() => fileInputRef.current.click()}>
                    <Upload className='size-24' />
                  </button>
                </div>
              ) : null
              }

              <div className="w-full">
                {!isInputUrl ? (
                  <button onClick={() => setIsInputUrl(!isInputUrl)} className='w-full h-16 border shadow-sm rounded-xl bg-white hover:bg-gray-200 cursor-pointer '>
                    <div className='flex items-center px-8 gap-6 '>
                      <img src="/github.svg" alt="" className="size-10" />
                      <span className="text-2xl">Github URL</span>
                    </div>
                  </button>
                )
                  : (
                    !isUploadUrl ? (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        setIsUploadUrl(true);
                      }}>
                        <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} type="text" placeholder="輸入 Github URL" className='w-76 text-2xl px-4 h-16 border shadow-sm rounded-xl bg-white' />
                        <div className="flex gap-2 mt-2">
                          <button type="submit" className='flex-1 h-12 border border-black bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer rounded-lg shadow-sm'>
                            <span className="text-xl">選擇生成類型</span>
                          </button>
                          <button type="button" onClick={() => setIsInputUrl(!isInputUrl)} className='p-2.5 border bg-white rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer'>
                            <X className='size-5' />
                          </button>
                        </div>
                      </form>
                    )
                      :
                      <div className='flex flex-col items-center gap-6 bg-white p-10 rounded-2xl shadow-md border border-gray-100 w-full'>
                        <span className='text-xl font-semibold tracking-wide text-gray-800 truncate max-w-xs'>{githubUrl}</span>
                        <div className='flex flex-col items-center justify-center p-4'>
                          <img src="/github.svg" alt="" className="size-32" />
                        </div>

                        <div className='grid grid-cols-1 gap-2 w-full'>
                          {optionList.map((opt) => (
                            <label key={opt.id} className={`flex items-center w-full h-11 px-3 gap-3 border rounded-lg cursor-pointer transition-all ${selectedOptions.some(item => item.id === opt.id) ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              <input type="checkbox" className='size-4 rounded accent-blue-600' checked={selectedOptions.some(item => item.id === opt.id)} onChange={() => handleCheckboxChange(opt)} />
                              <span className='text-sm tracking-wide'>{opt.name}</span>
                            </label>
                          ))}
                        </div>

                        <div className="flex justify-center w-full gap-3 mt-2">
                          <button className='flex-1 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer rounded-lg shadow-sm' onClick={uploadUrl} disabled={uploading}>
                            開始上傳並生成
                          </button>
                          <button className='p-2.5 border border-gray-200 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer' onClick={() => setIsUploadUrl(false)} disabled={uploading}>
                            <X className='size-5' />
                          </button>
                        </div>
                      </div>
                  )
                }
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-6 bg-white p-10 rounded-2xl shadow-md border border-gray-100 w-full max-w-md'>
              <span className='text-xl font-semibold tracking-wide text-gray-800 truncate max-w-xs'>{file.name}</span>
              <div className='flex flex-col items-center p-4 border border-gray-200 rounded-xl bg-gray-50'>
                <FileArchive className='size-20 text-blue-500' />
              </div>

              <div className='grid grid-cols-1 gap-2 w-full'>
                {optionList.map((opt) => (
                  <label key={opt.id} className={`flex items-center w-full h-11 px-3 gap-3 border rounded-lg cursor-pointer transition-all ${selectedOptions.some(item => item.id === opt.id) ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="checkbox" className='size-4 rounded accent-blue-600' checked={selectedOptions.some(item => item.id === opt.id)} onChange={() => handleCheckboxChange(opt)} />
                    <span className='text-sm tracking-wide'>{opt.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-center w-full gap-3 mt-2">
                <button className='flex-1 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer rounded-lg shadow-sm' onClick={uploadFile} disabled={uploading}>
                  開始上傳並生成
                </button>
                <button className='p-2.5 border border-gray-200 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer' onClick={resetUploader} disabled={uploading}>
                  <X className='size-5' />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FileUploader;