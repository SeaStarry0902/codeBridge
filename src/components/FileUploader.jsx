import React, { useState, useRef } from 'react';
import { Upload, FileArchive, X } from 'lucide-react';

function FileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const fileInputRef = useRef(null);
  const [optionList, setOptionList] = useState([
    { id: 1, name: "生成api使用文件", apiUrl: "/upload", selected: false },
    { id: 2, name: "生成系統架構圖", apiUrl: "/upload-folder", selected: false },
    { id: 3, name: "生成資料庫ER圖", apiUrl: "/upload-github", selected: false },
    { id: 4, name: "生成專案建制指南", apiUrl: "/upload-github", selected: false },
    { id: 5, name: "生成dockerfile", apiUrl: "/upload-github", selected: false },
    { id: 6, name: "系統漏洞分析", apiUrl: "/upload-github", selected: false },
  ]);
  // const optionsList = [
  //   { id: 1, name: "生成api使用文件", apiUrl: "/upload", selected: false },
  //   { id: 2, name: "生成系統架構圖", apiUrl: "/upload-folder", selected: false },
  //   { id: 3, name: "生成資料庫ER圖", apiUrl: "/upload-github", selected: false },
  //   { id: 4, name: "生成專案建制指南", apiUrl: "/upload-github", selected: false },
  //   { id: 5, name: "生成dockerfile", apiUrl: "/upload-github", selected: false },
  //   { id: 6, name: "系統漏洞分析", apiUrl: "/upload-github", selected: false },
  // ]

  function handleCheckboxChange(opt) {
    setOptionList(optionList.map(o => o.id === opt.id ? { ...o, selected: !o.selected } : o));
    console.log(opt);
    if (selectedOptions.includes(opt.id)) {
      setSelectedOptions(selectedOptions.filter(function (item) {
        return item !== opt.id;
      }));
    } else {
      setSelectedOptions([...selectedOptions, opt.id]);
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

  async function uploadFile() {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('myFile', file);

    try {
      alert(selectedOptions);
      setFile(null);
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

  function triggerSelect() {
    fileInputRef.current.click();
  }

  return (
    <div className='flex justify-center mt-28'>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".zip,.rar,.7z" className="hidden" />

      {!file ?
        (
          <div className='flex flex-col items-center gap-8'>
            <span className='text-3xl  tracking-widest'>點擊上傳壓縮檔</span>
            <button className='border-6 rounded-3xl hover:text-blue-500 cursor-pointer' title='上傳壓縮檔' onClick={triggerSelect}>
              <Upload className='size-36' />
            </button>
          </div>
        ) :
        (
          <div className='flex flex-col items-center gap-8'>
            <span className='text-3xl  tracking-widest'>{file.name}</span>
            <div className='flex flex-col items-center p-2 border-4 rounded-2xl'><FileArchive className='size-36' /></div>
            <div className='grid grid-cols-3 gap-2'>
              {optionList.map(function (opt) {
                return (
                  <label key={opt.id} className={`flex items-center w-auto h-10 px-2 gap-2 border-2 rounded-sm cursor-pointer transition-colors hover:bg-gray-200 ${opt.selected == true ? 'bg-gray-200 ' : 'bg-white '}`}>
                    <input type="checkbox" className='size-4' checked={selectedOptions.includes(opt.id)} onChange={function () { handleCheckboxChange(opt) }} />
                    <span className=' tracking-wider'>{opt.name}</span>
                  </label>

                )
              })
              }
            </div>
            <div className="flex justify-center w-full gap-4">
              <button className='flex-1 p-2 w-80 bg-blue-500 text-white hover:bg-blue-700 hover:text-black cursor-pointer border border-black rounded-sm' onClick={uploadFile} disabled={uploading}>
                {uploading ? "執行中" : "開始上傳"}
              </button>
              <button className='group p-2 border rounded-sm bg-red-500 hover:bg-red-700 cursor-pointer ' onClick={function () { setFile(null); fileInputRef.current.value = null; }} disabled={uploading}>
                <X className='size-6 text-white group-hover:text-black' />
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default FileUploader;