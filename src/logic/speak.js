// Speaks a short greeting once the hub is reached. Tries to find a lower,
// smoother-sounding voice from whatever the browser exposes; browsers load
// voices asynchronously, so we wait for the list if it isn't ready yet.
export function speakGreeting(text = 'What do you want to do?') {
  if (!('speechSynthesis' in window)) return

  const speak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find((v) => /Daniel|David|Male|Google UK English Male/i.test(v.name)) ||
      voices.find((v) => v.lang?.startsWith('en')) ||
      voices[0]

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92
    utterance.pitch = 0.8
    utterance.volume = 1
    if (preferred) utterance.voice = preferred

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    speak()
  } else {
    window.speechSynthesis.onvoiceschanged = speak
  }
}
