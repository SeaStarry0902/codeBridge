import { useState } from 'react'
import Header from './components/Header'
import FileUploader from './components/FileUploader'
import Content from './components/Content'
function App() {
  const [result, setResult] = useState([])
  const isUpload = result.length > 0
  const handleResult = (data) => {
    console.log('上傳結果:', data)
    setResult(data)
  }
  const deleteResult = () => { setResult([]) }
  return(
    <>
      <Header>
      </Header>
      {!isUpload ? <FileUploader onResult={handleResult} /> : <Content data={result} deleteResult={deleteResult} />}
      {/* <FileUploader /> */}
    </>
  )
}

export default App
