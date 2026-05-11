import { File } from 'lucide-react';
function Header() {
  return(
    <header className="flex items-center w-full h-20 px-16 gap-6 bg-[#f9fafb]">
      <File className='text-[#4F46E5] size-14' strokeWidth={2} />
      <span className='text-3xl text-[#4F46E5] tracking-widest '>專案自動導讀及快速交接平台</span>
    </header>
  )
}
export default Header