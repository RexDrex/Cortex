import { useRef, useState, useCallback, useEffect } from 'react'

// Wraps the browser's SpeechRecognition API (Chrome/Edge; not supported in
// Firefox/Safari as of writing — callers should check `supported` and fall
// back to text input, which the CenterConsole always keeps available.
export default function useVoiceInput({ onResult, onEnd } = {}) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(Boolean(SR))
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      let transcript = ''
      let isFinal = false
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
        if (event.results[i].isFinal) isFinal = true
      }
      onResult && onResult(transcript, isFinal)
    }
    recognition.onend = () => {
      setListening(false)
      onEnd && onEnd()
    }
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [onResult, onEnd])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { listening, supported, start, stop }
}
