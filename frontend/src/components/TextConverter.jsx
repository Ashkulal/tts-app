import React, { useState } from 'react';

function TextConverter({ token }) {
  const [inputType, setInputType] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    setError('');
    setAudioUrl('');
    setLoading(true);

    try {
      const formData = new FormData();

      if (inputType === 'text') {
        formData.append('text', text);
      } else if (inputType === 'url') {
        formData.append('url', url);
      } else if (inputType === 'pdf' && pdfFile) {
        formData.append('pdf', pdfFile);
      }

      const res = await fetch('/api/tts/convert', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Conversion failed');
        return;
      }

      setAudioUrl(data.audioUrl);
      setCharCount(data.charCount);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setError('Please select a PDF file');
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
        <button
          className={`tab ${inputType === 'pdf' ? 'active' : ''}`}
          onClick={() => setInputType('pdf')}
        >
          Upload PDF
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

      {inputType === 'pdf' && (
        <div className="form-group">
          <label>Upload PDF</label>
          <div className="file-upload" onClick={() => document.getElementById('pdf-input').click()}>
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {pdfFile ? <p>{pdfFile.name}</p> : <p>Click to select PDF file</p>}
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleConvert}
        disabled={loading || (inputType === 'text' && !text) || (inputType === 'url' && !url) || (inputType === 'pdf' && !pdfFile)}
      >
        {loading ? 'Converting...' : 'Convert to Speech'}
      </button>

      {audioUrl && (
        <div className="audio-player">
          <p>Audio ready ({charCount.toLocaleString()} characters)</p>
          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}

export default TextConverter;
