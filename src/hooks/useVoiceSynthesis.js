import { useRef } from 'react'

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY

export const useVoiceSynthesis = ({ onSpeakingStart, onSpeakingEnd }) => {
  const isSessionActiveRef = useRef(false)

  const setSessionActive = (active) => {
    isSessionActiveRef.current = active
  }

  const speak = async (text) => {
    if (!text) return
    
    if (onSpeakingStart) onSpeakingStart()
    
    // Sarvam AI streaming TTS
    try {
      const response = await fetch('https://api.sarvam.ai/text-to-speech/stream', {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          target_language_code: 'en-IN',
          speaker: 'shubh',
          model: 'bulbul:v3',
          pace: 1.1,
          speech_sample_rate: 22050,
          output_audio_codec: 'mp3',
          enable_preprocessing: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Sarvam AI API Error:', response.status, errorText)
        if (onSpeakingEnd) onSpeakingEnd()
        return
      }
      
      // Use MediaSource API for real-time streaming
      if ('MediaSource' in window && MediaSource.isTypeSupported('audio/mpeg')) {
        const audio = new Audio()
        const mediaSource = new MediaSource()
        const audioUrl = URL.createObjectURL(mediaSource)
        audio.src = audioUrl
        
        mediaSource.addEventListener('sourceopen', async () => {
          try {
            const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
            const reader = response.body.getReader()
            
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                // Wait for the last append to complete before ending stream
                await new Promise(resolve => {
                  if (sourceBuffer.updating) {
                    sourceBuffer.addEventListener('updateend', resolve, { once: true })
                  } else {
                    resolve()
                  }
                })
                try {
                  mediaSource.endOfStream()
                } catch (e) {
                  console.warn('Could not end stream:', e)
                }
                break
              }
              
              // Wait for previous append to complete
              await new Promise(resolve => {
                if (sourceBuffer.updating) {
                  sourceBuffer.addEventListener('updateend', resolve, { once: true })
                } else {
                  resolve()
                }
              })
              
              sourceBuffer.appendBuffer(value)
            }
          } catch (error) {
            console.error('❌ MediaSource error:', error)
            if (onSpeakingEnd) onSpeakingEnd()
          }
        })
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          if (onSpeakingEnd) onSpeakingEnd()
        }
        
        audio.onerror = () => {
          console.error('❌ Audio playback error')
          URL.revokeObjectURL(audioUrl)
          if (onSpeakingEnd) onSpeakingEnd()
        }
        
        audio.play()
      } else {
        // Fallback to chunk collection if MediaSource not supported
        const chunks = []
        const reader = response.body.getReader()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        
        const blob = new Blob(chunks, { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(blob)
        const audioElement = new Audio(audioUrl)
        
        audioElement.onended = () => {
          URL.revokeObjectURL(audioUrl)
          if (onSpeakingEnd) onSpeakingEnd()
        }
        
        audioElement.onerror = () => {
          console.error('❌ Audio playback error')
          URL.revokeObjectURL(audioUrl)
          if (onSpeakingEnd) onSpeakingEnd()
        }
        
        audioElement.play()
      }
    } catch (error) {
      console.error('❌ Sarvam AI TTS Error:', error)
      if (onSpeakingEnd) onSpeakingEnd()
    }
  }

  const stopSpeaking = () => {
    // Stop any audio elements
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  return {
    speak,
    stopSpeaking,
    setSessionActive
  }
}
