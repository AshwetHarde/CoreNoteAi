import cnLogo from '../assets/cn_logo.png'
import { Moon, Sun } from 'lucide-react'

function Header({ activeTab, setActiveTab }) {
  const handleToggle = () => {
    setActiveTab(activeTab === 'manual' ? 'automate' : 'manual')
  }

  return (
    <div className="mb-6 sm:mb-8"> 
      <div className="flex items-center justify-between">
        <img src={cnLogo} alt="Core Note AI Logo" className="h-10 sm:h-12 md:h-14 w-auto" />
        <div
          onClick={handleToggle}
          className="relative flex bg-gray-800/60 p-1 sm:p-1.5 rounded-full border border-gray-700/50 cursor-pointer shadow-xl"
        >
          <div
            className={`absolute h-[calc(100%-0.5rem)] sm:h-[calc(100%-0.75rem)] rounded-full bg-white transition-all duration-300 ease-out shadow-lg ${
              activeTab === 'manual' ? 'left-1 sm:left-1.5 w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]' : 'left-[50%] w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.375rem)]'
            }`}
          />
          <div
            className={`relative px-4 py-1 sm:px-8 sm:py-1.5 md:px-10 md:py-2 rounded-full font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base z-10 w-1/2 text-center ${
              activeTab === 'manual' ? 'text-black' : 'text-gray-400'
            }`}
          >
            Manual
          </div>
          <div
            className={`relative px-4 py-1 sm:px-8 sm:py-1.5 md:px-10 md:py-2 rounded-full font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base z-10 w-1/2 text-center ${
              activeTab === 'automate' ? 'text-black' : 'text-gray-400'
            }`}
          >
            Auto
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
