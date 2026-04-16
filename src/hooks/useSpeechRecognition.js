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

  const startListening = () => {
    if (isStartingRef.current) {
      return
    }
    if (isListening) {
      return
    }
    
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge on desktop, or Chrome on Android.')
      return
    }
    
    // Check if HTTPS is required (mobile browsers require HTTPS for microphone)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      alert('Microphone access requires HTTPS. Please use a secure connection (https://) for voice features to work.')
      return
    }
    
    // Clear any pending state changes
    if (stateChangeTimeoutRef.current) {
      clearTimeout(stateChangeTimeoutRef.current)
    }
    
    // Recreate recognition if it was nullified
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.maxAlternatives = 3
      
      // Mobile-specific configuration
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        recognitionRef.current.continuous = false // Mobile browsers work better with non-continuous
        recognitionRef.current.maxAlternatives = 1 // Reduce alternatives for mobile
      }
    } else {
      // Re-configure for mobile if needed
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        recognitionRef.current.continuous = false
      }
    }

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
          
          onFinalTranscript(cleanedTranscript, bestConfidence)
        }
      }

      recognitionRef.current.onerror = (event) => {
        if (event?.error === 'aborted' || event?.error === 'no-speech') {
          // Don't set isListening to false immediately for these errors
          isStartingRef.current = false
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
        
        // Mobile-specific error handling
        if (event.error === 'network') {
          alert('Network error. Please check your internet connection and try again.')
          return
        }
        
        console.error('Speech recognition error:', event.error)
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
          
          // Delay restart to prevent rapid flickering
          restartTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current && !isStoppingRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) {
                // If already started, just set state
                if (e?.name === 'InvalidStateError') {
                  setIsListening(true)
                }
              }
            }
          }, 100)
        } else {
          setIsListening(false)
        }
      }
    }
    
    if (recognitionRef.current) {
      try {
        isStartingRef.current = false
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start()
          }
          // Small delay to set isListening to true to prevent flickering
          stateChangeTimeoutRef.current = setTimeout(() => {
            setIsListening(true)
            isStartingRef.current = false
          }, 50)
          
          // Mobile-specific: Add a timeout to check if recognition actually started
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
              if (!isListening && isStartingRef.current) {
                console.warn('Mobile speech recognition may not have started properly, retrying...')
                isStartingRef.current = false
                setIsListening(false)
              }
            }, 1000)
          }
        } catch (error) {
          console.error('Error starting speech recognition:', error)
          isStartingRef.current = false
          setIsListening(false)
          
          // Mobile-specific error handling
          if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            alert('Mobile speech recognition failed. Please try again or use a different browser.')
          }
        }
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
        // Mark for recreation on next start
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current = null
            } catch (e) {
              // Ignore
            }
          }
        }, 100)
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
      recognitionRef.current.continuous = true
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
          
          onFinalTranscript(cleanedTranscript, bestConfidence)
        }
      }

      recognitionRef.current.onerror = (event) => {
        if (event?.error === 'aborted' || event?.error === 'no-speech') {
          // Don't set isListening to false immediately for these errors
          isStartingRef.current = false
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
        
        // Mobile-specific error handling
        if (event.error === 'network') {
          alert('Network error. Please check your internet connection and try again.')
          return
        }
        
        console.error('Speech recognition error:', event.error)
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
          
          // Delay restart to prevent rapid flickering
          restartTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isSpeakingRef.current && !isStoppingRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) {
                // If already started, just set state
                if (e?.name === 'InvalidStateError') {
                  setIsListening(true)
                }
              }
            }
          }, 100)
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
