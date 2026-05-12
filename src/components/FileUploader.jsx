import React, { useState, useRef } from 'react';
import { Upload, FileArchive, X } from 'lucide-react';

function FileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const fileInputRef = useRef(null);
  const optionsList = [
    { id: 1, name: "1", apiUrl: "/upload" },
    { id: 2, name: "2", apiUrl: "/upload-folder" },
    { id: 3, name: "3", apiUrl: "/upload-github" },
    { id: 4, name: "4", apiUrl: "/upload-github" },
    { id: 5, name: "5", apiUrl: "/upload-github" },
    { id: 6, name: "6", apiUrl: "/upload-github" },
  ]

  function handleCheckboxChange(id) {
    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter(function (item) {
        return item !== id;
      }));
    } else {
      setSelectedOptions([...selectedOptions, id]);
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
            <button onClick={function () { setFile(null); fileInputRef.current.value = null; }} disabled={uploading}>
              <X />
            </button>

            <div>
              {optionsList.map(function (opt) {
                return (
                  <label key={opt.id} className='flex'>
                    <input type="checkbox" checked={selectedOptions.includes(opt.id)} onChange={function () { handleCheckboxChange(opt.id) }} />
                    {opt.name}
                  </label>

                )
              })
              }
            </div>

            <button onClick={uploadFile} disabled={uploading}>
              {uploading ? "執行中" : "開始上傳"}
            </button>
          </div>
        )}
    </div>
  );
}

export default FileUploader;