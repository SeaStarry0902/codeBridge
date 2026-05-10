import React, { useState, useRef } from 'react';
import { Upload, FileArchive, X } from 'lucide-react';

function FileUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        alert("完成");
        setFile(null);
      }
    } catch (error) {
      console.error("失敗", error);
    } finally {
      setUploading(false);
    }
  }

  function triggerSelect() {
    fileInputRef.current.click();
  }

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".zip,.rar,.7z"
        style={{ display: 'none' }}
      />

      {!file ? (
        <button onClick={triggerSelect}>
          <Upload /> 選擇檔案
        </button>
      ) : (
        <div>
          <FileArchive />
          <span>{file.name}</span>
          <button onClick={function() { setFile(null); }} disabled={uploading}>
            <X />
          </button>
          <button onClick={uploadFile} disabled={uploading}>
            {uploading ? "執行中" : "開始上傳"}
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUploader;