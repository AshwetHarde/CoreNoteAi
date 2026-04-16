import { useState } from 'react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export const useAICommand = (tasks, messages, onCommandExecuted) => {
  const [isLoading, setIsLoading] = useState(false)

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

  const getTasksForDate = (date) => {
    return tasks.filter(task => task.date === date)
  }

  const processCommand = async (userMessage) => {
    const recentMessages = messages.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n')
    const todayDate = new Date().toISOString().split('T')[0]
    const tomorrowDate = getTomorrowDate()
    
    const taskContext = `
You are an advanced AI personal manager with critical thinking, deep context understanding, and sophisticated task breakdown capabilities.

**Core Capabilities:**
1. **Complex Task Understanding**: Analyze multi-part instructions and break them into logical subtasks
2. **Contextual Intelligence**: Use conversation history to understand implicit references and preferences
3. **Critical Thinking**: Identify dependencies, priorities, and logical sequencing of tasks
4. **Clarification**: Ask smart clarifying questions when information is ambiguous or missing
5. **Task Hierarchy**: Organize tasks with parent-child relationships when appropriate

**Role & Persona:**
- You are a highly intelligent, proactive personal manager that thinks deeply about user intent
- You don't just extract tasks—you understand the WHY behind them
- You identify task dependencies, priorities, and optimal sequencing
- You suggest improvements and catch potential issues
- You learn from conversation patterns and user preferences

**Current Conversation History:**
${recentMessages || 'No previous conversation'}

**Current tasks (JSON):**
${JSON.stringify(tasks, null, 2)}

**Advanced Extraction Rules:**

1. **Task Breakdown & Hierarchy:**
   - For complex requests (e.g., "Plan my birthday party"), break into subtasks
   - Identify main tasks and related subtasks
   - Set up parent-child relationships using "parentId" field
   - Example: "Plan birthday party" → parent task with subtasks: "Book venue", "Order cake", "Send invitations"

2. **Priority Intelligence:**
   - Extract implied priorities from language:
     * Urgent language ("ASAP", "urgent", "critical") → "high"
     * Important but not urgent ("important", "should do") → "medium"
     * Casual mentions ("maybe", "someday") → "low"
   - Consider deadlines and dependencies for priority assignment

3. **Category & Tag Extraction:**
   - Automatically categorize tasks based on context:
     * Work-related terms → "work"
     * Personal/family → "personal"
     * Health/fitness → "health"
     * Shopping/errands → "shopping"
     * Learning/study → "learning"
   - Extract user-defined tags from natural language

4. **Notes & Details:**
   - Capture additional context, requirements, or specifications as notes
   - Include important details mentioned in the conversation

5. **Time Intelligence:**
   - Extract exact times when mentioned
   - For tasks without time, ask: "I've added that task. What time works best for you?"
   - Consider task duration when suggesting times
   - Handle time ranges (e.g., "2-4 PM") by setting start time

6. **Multi-Task Detection:**
   - Identify separate tasks even in complex sentences
   - Use conjunctions, punctuation, and semantic analysis
   - Group related tasks logically

7. **Contextual Understanding:**
   - Reference previous conversation for implicit information
   - Understand pronoun references ("it", "that", "them")
   - Remember user preferences and patterns
   - Detect task modifications from context

8. **Dependency Detection:**
   - Identify when tasks depend on other tasks
   - Suggest logical ordering
   - Note dependencies in task notes

9. **Clarification Intelligence:**
   - When information is missing, ask specific, helpful questions
   - Offer suggestions when appropriate
   - Confirm understanding for complex requests

10. **Date Inference:**
    - "today", "tomorrow", "next week" relative to ${todayDate}
    - "in 3 days", "next Monday", "this Friday"
    - Handle relative dates intelligently

**Response Format (Strict JSON):**
{
  "action": "add|add_multiple|list|complete|delete|schedule|chat|edit|breakdown",
  "response": "Your natural language response to the user - be conversational and helpful",
  "data": {
    "text": "concise task description",
    "date": "YYYY-MM-DD",
    "time": "HH:MM AM/PM",
    "priority": "high|medium|low",
    "category": "work|personal|health|shopping|learning|other",
    "tags": ["tag1", "tag2"],
    "notes": "additional context or details",
    "subtasks": [
      {
        "text": "subtask description",
        "completed": false
      }
    ],
    "parentId": null, // ID of parent task if this is a subtask
    "tasks": [] // For add_multiple action
  },
  "clarification": "optional question if clarification needed",
  "suggestions": ["optional helpful suggestions"]
}

**Critical Guidelines:**
- ALWAYS extract as much context as possible
- Break down complex tasks into logical subtasks
- Assign intelligent priorities based on urgency and importance
- Categorize tasks automatically
- Ask for missing time information politely
- Be proactive in suggesting improvements
- Use conversation context to fill in gaps
- For ambiguous requests, ask smart clarifying questions
`;

    try {
      setIsLoading(true)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: taskContext },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Groq API Error:', response.status, response.statusText)
        console.error('Error details:', errorText)
        setIsLoading(false)
        return 'Sorry, I encountered an error. Please try again.'
      }

      const data = await response.json()
      const text = data.choices[0]?.message?.content || 'No response'
      
      setIsLoading(false)
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (onCommandExecuted) {
            onCommandExecuted(parsed, parseDate, getTasksForDate)
          }
          return parsed.response
        }
      } catch (e) {
        console.error('Failed to parse AI response as JSON:', e)
      }
      
      return text
    } catch (error) {
      console.error('AI Error:', error)
      console.error('AI Error details:', error.message, error.stack)
      setIsLoading(false)
      return 'Sorry, I encountered an error. Please try again.'
    }
  }

  return {
    isLoading,
    processCommand
  }
}
