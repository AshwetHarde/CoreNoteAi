import { useState } from 'react'
import { CheckCircle, Edit, Trash2, Calendar, ClipboardList, Plus, X, AlertCircle, Tag, PlusCircle } from 'lucide-react'

function Tasks({
  tasks,
  addTask,
  toggleTask,
  deleteTask,
  editTask,
  startEdit,
  cancelEdit,
  saveEdit,
  editingTask, 
  editText,
  setEditText,
  getTomorrowDate,
  getTasksForDate,
  updateTaskPriority,
  updateTaskCategory,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  updateTaskNotes
}) {
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskCategory, setNewTaskCategory] = useState('other')
  const [newTaskNotes, setNewTaskNotes] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTaskData, setEditingTaskData] = useState(null)
  const [showSubtaskInput, setShowSubtaskInput] = useState(null)
  const [newSubtaskText, setNewSubtaskText] = useState('')

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      const date = newTaskDate || new Date().toISOString().split('T')[0]
      const time = newTaskTime || '00:00'
      addTask(newTaskText.trim(), date, time, newTaskPriority, newTaskCategory, [], newTaskNotes, [])
      setNewTaskText('')
      setNewTaskDate('')
      setNewTaskTime('')
      setNewTaskPriority('medium')
      setNewTaskCategory('other')
      setNewTaskNotes('')
      setShowAddModal(false)
    }
  }

  const handleEditModal = (task) => {
    setEditingTaskData(task)
    setNewTaskText(task.text)
    setNewTaskDate(task.date || '')
    setNewTaskTime(task.time || '00:00')
    setNewTaskPriority(task.priority || 'medium')
    setNewTaskCategory(task.category || 'other')
    setNewTaskNotes(task.notes || '')
    setShowEditModal(true)
  }

  const handleSaveEdit = () => {
    if (editingTaskData && newTaskText.trim()) {
      editTask(editingTaskData.id, newTaskText.trim())
      updateTaskPriority(editingTaskData.id, newTaskPriority)
      updateTaskCategory(editingTaskData.id, newTaskCategory)
      updateTaskNotes(editingTaskData.id, newTaskNotes)
      setShowEditModal(false)
      setEditingTaskData(null)
      setNewTaskText('')
      setNewTaskDate('')
      setNewTaskTime('')
      setNewTaskPriority('medium')
      setNewTaskCategory('other')
      setNewTaskNotes('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask()
    }
  }

  const handleAddSubtask = (taskId) => {
    if (newSubtaskText.trim()) {
      addSubtask(taskId, newSubtaskText.trim())
      setNewSubtaskText('')
      setShowSubtaskInput(null)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'personal': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'health': return 'text-pink-400 bg-pink-400/10 border-pink-400/20'
      case 'shopping': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'learning': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = getTomorrowDate()

  // Function to get date category for sorting
  const getDateCategory = (date) => {
    if (!date) return 3 // No date - last
    if (date === today) return 0 // Today - first
    if (date === tomorrow) return 1 // Tomorrow - second
    return 2 // Other dates - third
  }

  const filteredTasks = activeTab === 'today'
    ? tasks.filter(task => {
        const taskDate = new Date(task.date)
        const todayDate = new Date(today)
        const taskDateStr = taskDate.toISOString().split('T')[0]
        return taskDateStr >= todayDate.toISOString().split('T')[0]
      })
    : filterDate
      ? tasks.filter(task => task.date === filterDate)
      : tasks.filter(task => 
          searchQuery 
            ? task.text.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by completion status first (completed tasks at bottom)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    
    // Sort by date category (today first, then tomorrow, then other dates)
    const categoryA = getDateCategory(a.date)
    const categoryB = getDateCategory(b.date)
    if (categoryA !== categoryB) {
      return categoryA - categoryB
    }
    
    // If same category, sort by date
    if (!a.date) return 1
    if (!b.date) return -1
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime()
    }
    // If same date, sort by time (ascending)
    const timeA = a.time || '00:00'
    const timeB = b.time || '00:00'
    return timeA.localeCompare(timeB)
  })

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-80px)] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-colors duration-300 rounded-2xl overflow-hidden">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold text-white flex items-center gap-2 flex-shrink-0">
            <ClipboardList size={18} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
            <span>Tasks</span>
          </h2>
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'today'
                  ? 'bg-white/20 border border-white/30 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-white/20 border border-white/30 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter - Only show in All Tasks view */}
      {activeTab === 'all' && (
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 mb-3 sm:mb-4">
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pl-9 sm:pl-10 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-xs sm:text-sm"
            />
            <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-2">
            {/* Date Filter Dropdown */}
            <div className="relative flex-1">
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pr-8 sm:pr-10 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-xs sm:text-sm appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">All Dates</option>
                <option value={today} className="bg-gray-900">Today</option>
                <option value={tomorrow} className="bg-gray-900">Tomorrow</option>
                <option value="custom" className="bg-gray-900">Custom...</option>
              </select>
              <svg className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Clear Filters */}
            {(filterDate || searchQuery) && (
              <button
                onClick={() => { setFilterDate(''); setSearchQuery(''); }}
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/20 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Picker - shown only when custom selected */}
        {filterDate === 'custom' && (
          <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <input
              type="date"
              value=""
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-transparent text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm"
            />
          </div>
        )}

        {/* Active Filter Tags */}
        {(filterDate && filterDate !== 'custom') && (
          <div className="flex gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm text-white">
              {filterDate === today ? 'Today' : filterDate === tomorrow ? 'Tomorrow' : filterDate}
              <button
                onClick={() => setFilterDate('')}
                className="ml-1 text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>
      )}

      {/* Tasks */}
      <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden relative">
        {/* Floating Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-10 backdrop-blur-xl"
        >
          <Plus size={24} className="sm:w-6 sm:h-6" />
        </button>

        <div className="h-full overflow-y-auto scrollbar-hide pb-20 sm:pb-4">
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white">
                Tasks
              </h2>
              <p className="mb-1 sm:mb-2 text-sm sm:text-base text-gray-400">
                {activeTab === 'today' ? 'No current or upcoming tasks.' : searchQuery ? 'No tasks found matching your search.' : 'No tasks for this date.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 md:space-y-4 pt-2">
            {sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300 bg-white/5 border-white/10 ${task.completed ? 'opacity-60' : ''}`}
              >
              {editingTask === task.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveEdit()
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all font-semibold text-xs sm:text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-all font-semibold text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        task.completed
                          ? 'bg-green-500/20 border-green-500 text-green-500'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {task.completed && <CheckCircle size={12} className="sm:w-4 sm:h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm sm:text-base md:text-lg break-words ${
                          task.completed
                            ? 'line-through text-gray-500'
                            : 'text-white'
                        }`}
                      >
                        {task.text}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.date && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={10} className="sm:w-3 sm:h-3" />
                            {task.date === today ? 'Today' : task.date === tomorrow ? 'Tomorrow' : task.date}
                          </p>
                        )}
                        {task.time && (
                          <p className="text-xs text-gray-500">
                            {task.time}
                          </p>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          {task.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditModal(task)}
                        className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/10"
                        title="Edit"
                      >
                        <Edit size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all text-gray-400 hover:text-red-400 hover:bg-white/10"
                        title="Delete"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#212121' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Add Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:gap-3">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Task description..."
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                />
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                >
                  <option value="low" className="bg-gray-900">Low Priority</option>
                  <option value="medium" className="bg-gray-900">Medium Priority</option>
                  <option value="high" className="bg-gray-900">High Priority</option>
                </select>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                >
                  <option value="other" className="bg-gray-900">Other</option>
                  <option value="work" className="bg-gray-900">Work</option>
                  <option value="personal" className="bg-gray-900">Personal</option>
                  <option value="health" className="bg-gray-900">Health</option>
                  <option value="shopping" className="bg-gray-900">Shopping</option>
                  <option value="learning" className="bg-gray-900">Learning</option>
                </select>
              </div>
              <textarea
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                rows={2}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm resize-none"
              />
              <button
                onClick={handleAddTask}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/20 text-white rounded-lg sm:rounded-xl hover:bg-white/20 transition-all font-semibold text-sm"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTaskData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#212121' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white">Edit Task</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:gap-3">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit()
                  }
                }}
                placeholder="Task description..."
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                />
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                >
                  <option value="low" className="bg-gray-900">Low Priority</option>
                  <option value="medium" className="bg-gray-900">Medium Priority</option>
                  <option value="high" className="bg-gray-900">High Priority</option>
                </select>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-[#212121] text-white focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm [color-scheme:dark]"
                >
                  <option value="other" className="bg-gray-900">Other</option>
                  <option value="work" className="bg-gray-900">Work</option>
                  <option value="personal" className="bg-gray-900">Personal</option>
                  <option value="health" className="bg-gray-900">Health</option>
                  <option value="shopping" className="bg-gray-900">Shopping</option>
                  <option value="learning" className="bg-gray-900">Learning</option>
                </select>
              </div>
              <textarea
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                rows={2}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-white/20 bg-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white/30 focus:outline-none transition-all text-sm resize-none"
              />
              <button
                onClick={handleSaveEdit}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/20 text-white rounded-lg sm:rounded-xl hover:bg-white/20 transition-all font-semibold text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
