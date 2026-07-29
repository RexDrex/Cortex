import { useState, useRef, useEffect, useCallback } from 'react'
import useVoiceInput from '../logic/useVoiceInput'

// Stage 5 (pulled forward): the interactive heart of the landing moment.
// A centered console — mic + text input — that the greeting voice speaks
// into. Speech-to-text and typed text both land in the same field.
// Reports its "active" state (typing or speaking) up via onActivityChange
// so the Field's orbs can enter the Listening state while input is live.
export default function CenterConsole({ onSubmitIntent, onActivityChange }) {
  const [value, setValue] = useState('')
  const inputRef = useRef()

  const handleResult = useCallback((transcript) => {
    setValue(transcript)
  }, [])

  const { listening, supported, start, stop } = useVoiceInput({
    onResult: handleResult,
  })

  useEffect(() => {
    onActivityChange && onActivityChange(listening || value.trim().length > 0)
  }, [listening, value, onActivityChange])

  const toggleMic = () => {
    if (listening) stop()
    else start()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onSubmitIntent && onSubmitIntent(value.trim())
    setValue('')
  }

  return (
    <div className="console-wrap">
      <div className={`console-ring console-ring-outer${listening ? ' is-listening' : ''}`} />
      <div className="console-ring console-ring-inner" />
      <div className="console-spark console-spark-1" />
      <div className="console-spark console-spark-2" />
      <div className="console-spark console-spark-3" />

      <form className="console-panel" onSubmit={handleSubmit}>
        <button
          type="button"
          className={`console-mic${listening ? ' is-listening' : ''}`}
          onClick={toggleMic}
          disabled={!supported}
          title={supported ? 'Talk' : 'Voice input not supported in this browser'}
          aria-label="Toggle voice input"
        >
          <MicIcon />
        </button>
        <input
          ref={inputRef}
          className="console-input"
          type="text"
          placeholder="What do you want to do?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </form>

      {!supported && (
        <p className="console-hint">Voice input isn't supported in this browser — typing works everywhere.</p>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z"
        stroke="currentColor" strokeWidth="1.4"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17.5V21"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      />
    </svg>
  )
}
