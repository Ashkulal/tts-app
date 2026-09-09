import React, { useState } from 'react';
import { api, API_URL } from '../config';

function TextConverter({ token }) {
  const [inputType, setInputType] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    setError('');
    setAudioUrl('');
    setLoading(true);

    try {
      const res = await fetch(api.tts.convert, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: inputType === 'text' ? text : undefined,
          url: inputType === 'url' ? url : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Conversion failed');
        return;
      }

      // Backend returns /audio/filename.mp3
      // Convert it to the Render backend URL.
      const fullAudioUrl = data.audioUrl.startsWith('http')
        ? data.audioUrl
        : `${API_URL}${data.audioUrl}`;

      setAudioUrl(fullAudioUrl);
      setCharCount(data.charCount);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Convert Text to Speech</h2>

      <div className="tabs">
        <button
          className={`tab ${inputType === 'text' ? 'active' : ''}`}
          onClick={() => setInputType('text')}
        >
          Paste Text
        </button>

        <button
          className={`tab ${inputType === 'url' ? 'active' : ''}`}
          onClick={() => setInputType('url')}
        >
          Enter URL
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {inputType === 'text' && (
        <div className="form-group">
          <label>Paste your text</label>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter or paste text to convert to speech..."
          />
        </div>
      )}

      {inputType === 'url' && (
        <div className="form-group">
          <label>Enter URL</label>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
          />
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleConvert}
        disabled={
          loading ||
          (inputType === 'text' && !text) ||
          (inputType === 'url' && !url)
        }
      >
        {loading ? 'Converting...' : 'Convert to Speech'}
      </button>

      {audioUrl && (
        <div className="audio-player">
          <p>
            Audio ready ({charCount.toLocaleString()} characters)
          </p>

          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}

export default TextConverter;
