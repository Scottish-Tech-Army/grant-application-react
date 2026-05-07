import { useState, useEffect, useRef } from 'react';

export default function CharityBot({ isEnabled }) {
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Standby');

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setStatus('Transcribing...');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setStatus('Ready');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('STT Error:', event.error);
        setStatus('Error: ' + event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setIsListening(true);
      setStatus('Listening...');
      recognitionRef.current.start();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    setStatus('Copied to Clipboard!');
    setTimeout(() => setStatus('Ready'), 2000);
  };

  if (!isEnabled) return null;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px',
          background: isListening ? '#ef4444' : 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          zIndex: 1000, transition: 'all 0.3s ease'
        }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{
      position: 'fixed', bottom: '2rem', right: '2rem', width: '340px',
      borderTop: '5px solid var(--primary)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      zIndex: 1000, padding: '1.25rem', borderRadius: '16px', background: '#fff'
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div style={{ background: isListening ? '#ef4444' : 'var(--primary)', padding: '0.6rem', borderRadius: '50%', color: '#fff' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}> Charity Assist</h4>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
      </div>

      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#1a1a1a', minHeight: '120px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.7rem', color: isListening ? '#ef4444' : '#64748b', fontWeight: 800, display: 'block', marginBottom: '8px' }}>
          {isListening ? '● RECORDING...' : 'STATUS: ' + status.toUpperCase()}
        </span>
        {transcript || <i style={{ color: '#94a3b8' }}>Say something to convert to text...</i>}
      </div>

      <div className="flex gap-2">
        <button
          className="btn"
          onClick={toggleListening}
          style={{
            flex: 2, background: isListening ? '#ef4444' : 'var(--primary)', color: '#fff',
            fontWeight: 700, borderRadius: '8px', gap: '8px'
          }}
        >
          {isListening ? 'Stop Recording' : 'Start GrantAssist'}
        </button>
        <button
          className="btn btn-outline"
          onClick={copyToClipboard}
          disabled={!transcript}
          style={{ flex: 1, color: 'var(--primary)', borderColor: 'var(--border-color)', background: '#fff' }}
        >
          Copy
        </button>
      </div>

      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
        Use this tool to draft field values with your voice.
      </p>
    </div>
  );
}
