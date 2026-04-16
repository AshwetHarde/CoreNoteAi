import { useState, useRef, useEffect } from 'react'
import Header from './components/Header'
import Chat from './components/Chat'
import Tasks from './components/Tasks'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useVoiceSynthesis } from './hooks/useVoiceSynthesis'
import { useTaskManager } from './hooks/useTaskManager'
import { useAICommand } from './hooks/useAICommand'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  const [isSessionActive, setIsSessionActive] = useState(false)
  const messagesEndRef = useRef(null)
  const handleSendRef = useRef(null)
  const silenceTimerRef = useRef(null)

  // Custom hooks
  const {
    tasks,
    addTask,
    addMultipleTasks,
    toggleTask,
    deleteTask,
    editTask,
    updateTaskPriority,
    updateTaskCategory,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateTaskNotes,
    addTagToTask,
    removeTagFromTask,
    editingTask,
    editText,
    setEditText,
    startEdit,
    cancelEdit,
    saveEdit,
    getTasksForDate,
    getTomorrowDate,
    parseDate
  } = useTaskManager()

  const { isLoading, processCommand } = useAICommand(tasks, messages, (command, parseDateFn, getTasksForDateFn) => {
    switch (command.action) {
      case 'add':
        if (command.data?.text) {
          const parsedDate = command.data?.date ? parseDateFn(command.data.date) : null
          const time = command.data?.time || '00:00'
          const priority = command.data?.priority || 'medium'
          const category = command.data?.category || 'other'
          const tags = command.data?.tags || []
          const notes = command.data?.notes || ''
          const subtasks = command.data?.subtasks || []
          const parentId = command.data?.parentId || null
          addTask(command.data.text, parsedDate, time, priority, category, tags, notes, subtasks, parentId)
        }
        break
      case 'add_multiple':
        if (command.data?.tasks && Array.isArray(command.data.tasks)) {
          const enhancedTasks = command.data.tasks.map(task => ({
            ...task,
            date: task.date ? parseDateFn(task.date) : new Date().toISOString().split('T')[0],
            time: task.time || '00:00',
            priority: task.priority || 'medium',
            category: task.category || 'other',
            tags: task.tags || [],
            notes: task.notes || '',
            subtasks: task.subtasks || [],
            parentId: task.parentId || null
          }))
          addMultipleTasks(enhancedTasks)
        }
        break
      case 'breakdown':
        if (command.data?.tasks && Array.isArray(command.data.tasks)) {
          const enhancedTasks = command.data.tasks.map(task => ({
            ...task,
            date: task.date ? parseDateFn(task.date) : new Date().toISOString().split('T')[0],
            time: task.time || '00:00',
            priority: task.priority || 'medium',
            category: task.category || 'other',
            tags: task.tags || [],
            notes: task.notes || '',
            subtasks: task.subtasks || [],
            parentId: task.parentId || null
          }))
          addMultipleTasks(enhancedTasks)
        }
        break
      case 'list':
        break
      case 'complete':
        if (command.data?.text) {
          const task = tasks.find(t => t.text.toLowerCase().includes(command.data.text.toLowerCase()))
          if (task) toggleTask(task.id)
        }
        break
      case 'delete':
        if (command.data?.text) {
          const task = tasks.find(t => t.text.toLowerCase().includes(command.data.text.toLowerCase()))
          if (task) deleteTask(task.id)
        }
        break
      case 'edit':
        if (command.data?.text && command.data?.id) {
          const task = tasks.find(t => t.id === command.data.id)
          if (task) {
            if (command.data.newText) editTask(task.id, command.data.newText)
            if (command.data.priority) updateTaskPriority(task.id, command.data.priority)
            if (command.data.category) updateTaskCategory(task.id, command.data.category)
            if (command.data.notes !== undefined) updateTaskNotes(task.id, command.data.notes)
          }
        }
        break
      case 'schedule':
        if (command.data?.date) {
          const parsedDate = parseDateFn(command.data.date)
          command.data.tasks = getTasksForDateFn(parsedDate)
          command.data.parsedDate = parsedDate
        } else if (command.data?.text?.toLowerCase().includes('tomorrow')) {
          const tomorrowTasks = getTasksForDateFn(getTomorrowDate())
          command.data.tasks = tomorrowTasks
          command.data.parsedDate = getTomorrowDate()
        } else if (command.data?.text?.toLowerCase().includes('today')) {
          const todayTasks = getTasksForDateFn(new Date().toISOString().split('T')[0])
          command.data.tasks = todayTasks
          command.data.parsedDate = new Date().toISOString().split('T')[0]
        }
        break
      default:
        break
    }
  })

  const {
    isListening,
    startListening,
    stopListening,
    setSessionActive: setRecognitionSessionActive,
    setSpeaking: setRecognitionSpeaking
  } = useSpeechRecognition({
    onFinalTranscript: (transcript, confidence) => {
      const endingWords = ['bye', 'goodbye', 'ok bye', 'okay bye', 'bye bye', 'see you', 'see ya', 'end', 'stop', 'quit']
      const lowerTranscript = transcript.toLowerCase()
      
      if (endingWords.some(word => lowerTranscript === word || lowerTranscript.endsWith(word))) {
        stopLiveSession()
        return
      }
      
      setInput(transcript)
      handleSendRef.current(transcript, true)
    },
    onInterimTranscript: (transcript) => {
      setInput(transcript)
    }
  })

  const { speak, stopSpeaking, setSessionActive: setVoiceSessionActive } = useVoiceSynthesis({
    onSpeakingStart: () => {
      setIsSpeaking(true)
      setRecognitionSpeaking(true)
      stopListening()
    },
    onSpeakingEnd: () => {
      setIsSpeaking(false)
      setRecognitionSpeaking(false)
    }
  })

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setRecognitionSessionActive(isSessionActive)
    setVoiceSessionActive(isSessionActive)
  }, [isSessionActive, setRecognitionSessionActive, setVoiceSessionActive])

  const toggleSession = async () => {
    try {
      if (isSessionActive) {
        stopLiveSession()
      } else {
        await startLiveSession()
      }
    } catch (error) {
    }
  }

  const startLiveSession = async () => {
    try {
      // Request microphone permission before starting
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (permError) {
        alert('Microphone permission denied. Please allow microphone access in your browser settings to use voice features.')
        return
      }
      
      setIsSessionActive(true)
      startListening()
    } catch (error) {
      alert('Failed to start voice conversation: ' + error.message)
      setIsSessionActive(false)
    }
  }

  const stopLiveSession = () => {
    setIsSessionActive(false)
    setIsSpeaking(false)
    stopListening()
    stopSpeaking()
  }

  const handleSend = async (directMessage = null, isVoiceInput = false) => {
    const messageToSend = directMessage || input.trim()
    if (!messageToSend) return

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: messageToSend }])
    stopListening()

    const aiResponse = await processCommand(messageToSend)
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }])
    
    // Only speak if it's a voice session and auto-speak is enabled
    if (isVoiceInput && autoSpeak && isSessionActive) {
      speak(aiResponse)
    }
  }

  useEffect(() => {
    if (!isSessionActive) return
    if (isSpeaking) return
    const t = setTimeout(() => {
      if (isSessionActive && !isSpeaking) {
        startListening()
      }
    }, 500)
    return () => clearTimeout(t)
  }, [isSessionActive, isSpeaking, startListening])

  handleSendRef.current = handleSend

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen sm:h-screen bg-gradient-to-br from-black via-gray-900 to-black transition-colors duration-300 flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-4xl flex-1 flex flex-col overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {activeTab === 'automate' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Chat
              messages={messages}
              input={input}
              setInput={setInput}
              isListening={isListening}
              startListening={startListening}
              stopListening={stopListening}
              isSpeaking={isSpeaking}
              autoSpeak={autoSpeak}
              setAutoSpeak={setAutoSpeak}
              isLoading={isLoading}
              handleSend={handleSend}
              handleKeyPress={handleKeyPress}
              stopSpeaking={stopSpeaking}
              isSessionActive={isSessionActive}
              messagesEndRef={messagesEndRef}
              toggleSession={toggleSession}
            />
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <Tasks
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              editTask={editTask}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveEdit={saveEdit}
              editingTask={editingTask}
              editText={editText}
              setEditText={setEditText}
              getTomorrowDate={getTomorrowDate}
              getTasksForDate={getTasksForDate}
              updateTaskPriority={updateTaskPriority}
              updateTaskCategory={updateTaskCategory}
              addSubtask={addSubtask}
              toggleSubtask={toggleSubtask}
              deleteSubtask={deleteSubtask}
              updateTaskNotes={updateTaskNotes}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
