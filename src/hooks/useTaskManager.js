import { useState, useEffect } from 'react'

export const useTaskManager = () => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks')
    return saved ? JSON.parse(saved) : []
  })

  const [editingTask, setEditingTask] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  const addTask = (text, date = null, time = null, priority = 'medium', category = 'other', tags = [], notes = '', subtasks = [], parentId = null) => {
    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '00:00',
      priority: priority || 'medium',
      category: category || 'other',
      tags: tags || [],
      notes: notes || '',
      subtasks: subtasks || [],
      parentId: parentId || null,
      createdAt: new Date().toISOString()
    }
    setTasks([...tasks, newTask])
  }

  const addMultipleTasks = (taskList) => {
    const newTasks = taskList.map(task => ({
      id: Date.now() + Math.random(),
      text: task.text,
      completed: false,
      date: task.date || new Date().toISOString().split('T')[0],
      time: task.time || '00:00',
      priority: task.priority || 'medium',
      category: task.category || 'other',
      tags: task.tags || [],
      notes: task.notes || '',
      subtasks: task.subtasks || [],
      parentId: task.parentId || null,
      createdAt: new Date().toISOString()
    }))
    setTasks([...tasks, ...newTasks])
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const editTask = (id, newText) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, text: newText } : task
    ))
  }

  const updateTaskPriority = (id, priority) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, priority } : task
    ))
  }

  const updateTaskCategory = (id, category) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, category } : task
    ))
  }

  const addSubtask = (taskId, subtaskText) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: [...task.subtasks, { id: Date.now(), text: subtaskText, completed: false }] }
        : task
    ))
  }

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: task.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          )}
        : task
    ))
  }

  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: task.subtasks.filter(st => st.id !== subtaskId) }
        : task
    ))
  }

  const updateTaskNotes = (id, notes) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, notes } : task
    ))
  }

  const addTagToTask = (taskId, tag) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, tags: [...new Set([...task.tags, tag])] }
        : task
    ))
  }

  const removeTagFromTask = (taskId, tag) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, tags: task.tags.filter(t => t !== tag) }
        : task
    ))
  }

  const startEdit = (task) => {
    setEditingTask(task.id)
    setEditText(task.text)
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditText('')
  }

  const saveEdit = () => {
    if (editingTask && editText.trim()) {
      editTask(editingTask, editText.trim())
      setEditingTask(null)
      setEditText('')
    }
  }

  const getTasksForDate = (date) => {
    return tasks.filter(task => task.date === date)
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const parseDate = (dateString) => {
    const lowerDate = dateString.toLowerCase()
    const today = new Date()
    
    if (lowerDate.includes('today')) {
      return today.toISOString().split('T')[0]
    }
    if (lowerDate.includes('tomorrow')) {
      return getTomorrowDate()
    }
    if (lowerDate.includes('next week')) {
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      return nextWeek.toISOString().split('T')[0]
    }
    if (lowerDate.includes('yesterday')) {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      return yesterday.toISOString().split('T')[0]
    }
    
    const dateMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      return dateString
    }
    
    const usDateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})/)
    if (usDateMatch) {
      const month = usDateMatch[1].padStart(2, '0')
      const day = usDateMatch[2].padStart(2, '0')
      const year = today.getFullYear()
      return `${year}-${month}-${day}`
    }
    
    return today.toISOString().split('T')[0]
  }

  return {
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
  }
}
