import { File } from 'lucide-react';
function Header() {
  return(
    <header className="flex items-center w-full h-20 px-16 gap-6 bg-[#FFFFFF] border-b border-gray-200 shadow-md">
      <File className='text-[#4F46E5] size-14' strokeWidth={2} />
      <span className='text-3xl text-[#4F46E5] tracking-widest '>專案導讀平台</span>
    </header>
  )
}
export default Header