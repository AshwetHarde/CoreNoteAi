import { useState, useRef, useEffect } from 'react'

export const useSpeechRecognition = ({ onFinalTranscript, onInterimTranscript }) => {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const isSessionActiveRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const isStartingRef = useRef(false)
  const isStoppingRef = useRef(false)
  const restartTimeoutRef = useRef(null)
  const stateChangeTimeoutRef = useRef(null)
  const lastTranscriptRef = useRef('')
  const lastStartAtRef = useRef(0)
  const restartAttemptRef = useRef(0)
  const isAndroidRef = useRef(/Android/i.test(navigator.userAgent || ''))

  const startListening = () => {
    if (isStartingRef.current) {
      return
    }
    if (isListening) {
      return
    }

    const now = Date.now()
    if (now - lastStartAtRef.current < 1200) {
      return
    }
    
    // Clear any pending state changes
    if (stateChangeTimeoutRef.current) {
      clearTimeout(stateChangeTimeoutRef.current)
    }
    
    // Recreate recognition if it was nullified
    if (!recognitionRef.current && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      // Android Chrome can become unstable with continuous mode (rapid end/restart loops).
      // Using non-continuous + controlled restart is more reliable.
      recognitionRef.current.continuous = !isAndroidRef.current
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.maxAlternatives = 3

      recognitionRef.current.onresult = (event) => {
        if (!isSessionActiveRef.current) {
          return
        }
        if (isSpeakingRef.current) {
          return
        }
        let interimTranscript = ''
        let finalTranscript = ''
        let bestConfidence = 0
        let bestTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          
          if (result.isFinal) {
            for (let j = 0; j < result.length; j++) {
              const alternative = result[j]
              if (alternative.confidence > bestConfidence) {
                bestConfidence = alternative.confidence
                bestTranscript = alternative.transcript
              }
            }
            finalTranscript += bestTranscript || result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        if (interimTranscript && onInterimTranscript) {
          onInterimTranscript(interimTranscript)
        }

        if (finalTranscript.trim() && onFinalTranscript) {
          if (bestConfidence > 0 && bestConfidence < 0.7) {
            return
          }
          
          const cleanedTranscript = finalTranscript
            .trim()
            .replace(/\s+/g, ' ')
            .charAt(0).toUpperCase() + finalTranscript.trim().slice(1)
          
          // Prevent duplicate transcripts
          if (cleanedTranscript === lastTranscriptRef.current) {
            return
          }
          lastTranscriptRef.current = cleanedTranscript

          // We got a valid final result; reset restart backoff.
          restartAttemptRef.current = 0
          
          onFinalTranscript(cleanedTranscript, bestConfidence)
        }
      }

      recognitionRef.current.onerror = (event) => {
        if (event?.error === 'aborted' || event?.error === 'no-speech') {
          // Mobile Chrome often emits these during natural pauses.
          // Avoid rapid toggling; schedule a controlled restart instead.
          isStartingRef.current = false
          setIsListening(false)

          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
          }

          const baseDelay = 1200
          const backoff = Math.min(restartAttemptRef.current, 4) * 600
          const delay = baseDelay + backoff

          restartTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current && !isStoppingRef.current) {
              restartAttemptRef.current += 1
              startListening()
            }
          }, delay)
          return
        }

        setIsListening(false)
        isStartingRef.current = false
        
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings to use voice features.')
          return
        }
        
        if (event.error === 'not-found') {
          alert('No microphone found. Please connect a microphone to use voice features.')
          return
        }
      }

      recognitionRef.current.onend = () => {
        isStartingRef.current = false
        if (isStoppingRef.current) {
          isStoppingRef.current = false
          setIsListening(false)
          return
        }
        
        // Auto-restart if session is still active and not speaking
        if (isSessionActiveRef.current && !isSpeakingRef.current) {
          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
          }
          
          setIsListening(false)

          const baseDelay = 1200
          const backoff = Math.min(restartAttemptRef.current, 4) * 600
          const delay = baseDelay + backoff

          restartTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current && !isStoppingRef.current) {
              restartAttemptRef.current += 1
              startListening()
            }
          }, delay)
        } else {
          setIsListening(false)
        }
      }
    }
    
    if (recognitionRef.current) {
      try {
        isStartingRef.current = true
        isStoppingRef.current = false
        recognitionRef.current.start()
        lastStartAtRef.current = Date.now()
        // Small delay before setting state to prevent flickering
        stateChangeTimeoutRef.current = setTimeout(() => {
          setIsListening(true)
          isStartingRef.current = false
        }, 50)
      } catch (e) {
        isStartingRef.current = false
        if (e?.name === 'InvalidStateError' || (e?.message && e.message.includes('already started'))) {
          setIsListening(true)
        } else {
          setIsListening(false)
        }
      }
    } else {
      setIsListening(false)
    }
  }

  const stopListening = () => {
    // Clear any pending timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
    if (stateChangeTimeoutRef.current) {
      clearTimeout(stateChangeTimeoutRef.current)
      stateChangeTimeoutRef.current = null
    }
    
    if (recognitionRef.current) {
      try {
        isStoppingRef.current = true
        isStartingRef.current = false
        recognitionRef.current.stop()
        setIsListening(false)
        restartAttemptRef.current = 0
      } catch (e) {
        setIsListening(false)
        isStartingRef.current = false
      }
    }
  }

  const setSessionActive = (active) => {
    isSessionActiveRef.current = active
  }

  const setSpeaking = (speaking) => {
    isSpeakingRef.current = speaking
  }

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      // Android Chrome can become unstable with continuous mode (rapid end/restart loops).
      // Using non-continuous + controlled restart is more reliable.
      recognitionRef.current.continuous = !isAndroidRef.current
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.maxAlternatives = 3

      recognitionRef.current.onresult = (event) => {
        if (!isSessionActiveRef.current) {
          return
        }
        let interimTranscript = ''
        let finalTranscript = ''
        let bestConfidence = 0
        let bestTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          
          if (result.isFinal) {
            for (let j = 0; j < result.length; j++) {
              const alternative = result[j]
              if (alternative.confidence > bestConfidence) {
                bestConfidence = alternative.confidence
                bestTranscript = alternative.transcript
              }
            }
            finalTranscript += bestTranscript || result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        if (interimTranscript && onInterimTranscript) {
          onInterimTranscript(interimTranscript)
        }

        if (finalTranscript.trim() && onFinalTranscript) {
          if (bestConfidence > 0 && bestConfidence < 0.7) {
            return
          }
          
          const cleanedTranscript = finalTranscript
            .trim()
            .replace(/\s+/g, ' ')
            .charAt(0).toUpperCase() + finalTranscript.trim().slice(1)
          
          // Prevent duplicate transcripts
          if (cleanedTranscript === lastTranscriptRef.current) {
            return
          }
          lastTranscriptRef.current = cleanedTranscript

          // We got a valid final result; reset restart backoff.
          restartAttemptRef.current = 0
          
          onFinalTranscript(cleanedTranscript, bestConfidence)
        }
      }

      recognitionRef.current.onerror = (event) => {
        if (event?.error === 'aborted' || event?.error === 'no-speech') {
          // Mobile Chrome frequently fires these during pauses.
          // Avoid rapid start/stop loops; restart with backoff.
          isStartingRef.current = false
          setIsListening(false)

          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
          }

          const baseDelay = 1200
          const backoff = Math.min(restartAttemptRef.current, 4) * 600
          const delay = baseDelay + backoff

          restartTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current && !isStoppingRef.current) {
              restartAttemptRef.current += 1
              startListening()
            }
          }, delay)
          return
        }

        setIsListening(false)
        isStartingRef.current = false
        
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings to use voice features.')
          return
        }
        
        if (event.error === 'not-found') {
          alert('No microphone found. Please connect a microphone to use voice features.')
          return
        }
      }

      recognitionRef.current.onend = () => {
        isStartingRef.current = false
        if (isStoppingRef.current) {
          isStoppingRef.current = false
          setIsListening(false)
          return
        }
        
        // Auto-restart if session is still active and not speaking
        if (isSessionActiveRef.current && !isSpeakingRef.current) {
          // Clear any existing restart timeout
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
          }

          setIsListening(false)

          const baseDelay = 1200
          const backoff = Math.min(restartAttemptRef.current, 4) * 600
          const delay = baseDelay + backoff

          restartTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current && !isStoppingRef.current) {
              restartAttemptRef.current += 1
              startListening()
            }
          }, delay)
        } else {
          setIsListening(false)
        }
      }
    }

    return () => {
      // Clear all timeouts
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current)
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore stop errors
        }
      }
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isSessionActiveRef.current && isListening) {
          stopListening()
        }
      } else {
        if (isSessionActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current) {
              startListening()
            }
          }, 500)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startListening, stopListening])

  return {
    isListening,
    startListening,
    stopListening,
    setSessionActive,
    setSpeaking
  }
}
