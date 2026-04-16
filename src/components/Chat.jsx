import { MessageSquare, Send, Mic, MicOff, PhoneOff, ArrowUp } from 'lucide-react'
import { RiVoiceAiFill } from "react-icons/ri"
import { MdCallEnd } from "react-icons/md"
import { useState, useRef, useEffect } from 'react'

export default function Chat({
  messages,
  input,
  setInput,
  isListening,
  startListening,
  stopListening,
  isSpeaking,
  autoSpeak,
  setAutoSpeak,
  isLoading,
  handleSend,
  handleKeyPress,
  stopSpeaking,
  isSessionActive,
  messagesEndRef,
  toggleSession
}) {
  const textareaRef = useRef(null)
  const [showListeningState, setShowListeningState] = useState(false)
  const listeningTimeoutRef = useRef(null)

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }

  useEffect(() => {
    if (isListening && !isSpeaking) {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current)
      }
      setShowListeningState(true)
    } else {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current)
      }
      listeningTimeoutRef.current = setTimeout(() => {
        setShowListeningState(false)
      }, 300)
    }
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current)
      }
    }
  }, [isListening, isSpeaking])

  if (isSessionActive) {
    return (
      <div className="relative flex flex-col h-full border border-white/10 shadow-2xl transition-colors duration-300 overflow-hidden rounded-2xl">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
          <div className="text-sm font-medium text-white/60">
            {showListeningState && !isSpeaking ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Voice'}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Listening animation - slow breathing */}
            {showListeningState && !isSpeaking && (
              <>
                <div className="absolute inset-0 -m-4 sm:-m-6 animate-pulse" style={{ animationDuration: '2.5s' }}>
                  <div className="absolute inset-0 rounded-full bg-blue-400/15" />
                </div>
                <div className="absolute inset-0 -m-8 sm:-m-10 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                  <div className="absolute inset-0 rounded-full bg-blue-400/10" />
                </div>
              </>
            )}
            {/* Speaking animation - faster pulse */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 -m-3 sm:-m-4 animate-ping" style={{ animationDuration: '0.8s' }}>
                  <div className="absolute inset-0 rounded-full bg-blue-400/25" />
                </div>
                <div className="absolute inset-0 -m-6 sm:-m-8 animate-ping" style={{ animationDuration: '0.8s', animationDelay: '0.2s' }}>
                  <div className="absolute inset-0 rounded-full bg-blue-400/15" />
                </div>
                <div className="absolute inset-0 -m-9 sm:-m-12 animate-ping" style={{ animationDuration: '0.8s', animationDelay: '0.4s' }}>
                  <div className="absolute inset-0 rounded-full bg-blue-400/8" />
                </div>
              </>
            )}
            {/* Main circle */}
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-sky-200/90 to-blue-600/80 shadow-2xl transition-all duration-500 ${showListeningState && !isSpeaking ? 'scale-105' : isSpeaking ? 'scale-110' : 'scale-100'}`} />
          </div>
        </div>

        <div className="pb-8 sm:pb-10 px-4 sm:px-6">
          <div className="flex items-center justify-center">
            <button
              onClick={toggleSession}
              className="w-28 h-12 sm:w-32 sm:h-14 rounded-full bg-red-500 border border-red-600 text-white flex items-center justify-center"
              title="End Call"
            >
              <MdCallEnd size={24} sm:size={28} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-100px)] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-colors duration-300 rounded-2xl">
      <div className={`flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 scrollbar-hide ${messages.length === 0 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center opacity-70">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white`}>
                {isSessionActive ? 'Voice Conversation Active' : 'CoreNote AI'}
              </h2>
              {isSessionActive ? (
                <p className="mb-4 sm:mb-5 text-sm sm:text-base text-gray-400">
                  Just speak naturally. The AI listens and responds when you pause. Keep talking — it stays on.
                </p>
              ) : (
                <>
                  <p className="mb-1 sm:mb-2 text-sm sm:text-base text-gray-400">
                    Manage tasks and schedule with AI.
                  </p>
                  <p className="mb-4 sm:mb-5 text-sm sm:text-base text-gray-400">
                    Start with voice or text.
                  </p>
                </>
              )}
              {isSessionActive && (
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm bg-gray-800 text-green-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-700">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-medium">{isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready'}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-white rounded-2xl rounded-br-xl shadow-lg'
                  : 'bg-gradient-to-r from-gray-700/30 to-gray-600/30 border border-gray-500/30 text-gray-100 rounded-2xl rounded-bl-xl shadow-lg'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 sm:px-6 sm:py-4 rounded-2xl rounded-bl-xl bg-gradient-to-r from-gray-700/30 to-gray-600/30 border border-gray-500/30 shadow-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-bounce bg-blue-400/60" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-bounce delay-100 bg-purple-400/60" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-bounce delay-200 bg-cyan-400/60" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-gray-800 p-2 sm:p-4 transition-colors duration-300">
        {/* Voice conversation status bar */}
        {isSessionActive && (
          <div className="flex items-center justify-between mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gray-800 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                isListening ? 'bg-green-400 animate-pulse' : isSpeaking ? 'bg-purple-400 animate-pulse' : 'bg-indigo-400'
              }`} />
              <span className="text-xs sm:text-sm font-semibold text-gray-200">
                {isListening ? 'Listening...' : isSpeaking ? 'AI Speaking...' : 'Ready for your input'}
              </span>
            </div>
            <button
              onClick={toggleSession}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-xs sm:text-sm font-semibold"
            >
              <PhoneOff size={12} sm:size={14} />
              <span className="hidden sm:inline">End Chat</span>
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isSessionActive ? "Speak or type to continue..." : "Type your message..."}
              className="flex-1 p-3 sm:p-4 rounded-2xl resize-none focus:outline-none focus:ring-0 transition-all duration-300 text-sm sm:text-base text-white placeholder-gray-500 scrollbar-hide overflow-y-auto border border-gray-700 bg-transparent"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSession}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
                  isSessionActive 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
                title={isSessionActive ? "End Voice Chat" : "Start Voice Chat"}
              >
                <span className="text-sm sm:text-base font-medium">Voice</span>
                <RiVoiceAiFill size={20} sm:size={24} />
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-medium px-2"
                >
                  Stop speaking
                </button>
              )}
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2 sm:p-2.5 bg-white text-black rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <ArrowUp size={24} sm:size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
