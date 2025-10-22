import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [numbers, setNumbers] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('Ready to send messages');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'numbers' | 'file'>('numbers');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!message.trim()) {
      errors.message = 'Message is required';
    }
    
    if (activeTab === 'numbers' && !numbers.trim()) {
      errors.numbers = 'At least one phone number is required';
    }
    
    if (activeTab === 'file' && !file) {
      errors.file = 'Please select a file';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendText = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setStatus('Sending messages...');
    
    try {
      const response = await fetch('http://localhost:8000/send-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          numbers: numbers.split('\n').filter(num => num.trim())
        }),
      });
      
      const result = await response.json();
      setStatus(JSON.stringify(result, null, 2));
      
      if (response.ok) {
        setMessage('');
        setNumbers('');
        setValidationErrors({});
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextFile = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setStatus('Sending messages from file...');
    
    try {
      const formData = new FormData();
      formData.append('text', message);
      formData.append('file', file!);

      const response = await fetch('http://localhost:8000/send-text-file', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setStatus(JSON.stringify(result, null, 2));
      
      if (response.ok) {
        setMessage('');
        setFile(null);
        setValidationErrors({});
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
    if (selectedFile) {
      setValidationErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      setValidationErrors(prev => ({ ...prev, message: '' }));
    }
  };

  const handleNumbersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNumbers(e.target.value);
    if (e.target.value.trim()) {
      setValidationErrors(prev => ({ ...prev, numbers: '' }));
    }
  };

  return (
    <div className="app-container">
      <div className="main-card">
        <header className="header">
          <h1>WhatsApp Bulk Sender</h1>
          <p>Send messages to multiple contacts effortlessly</p>
        </header>

        <main className="content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'numbers' ? 'active' : ''}`}
              onClick={() => setActiveTab('numbers')}
            >
              <span>📝</span>
              Manual Entry
            </button>
            <button
              className={`tab-button ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveTab('file')}
            >
              <span>📄</span>
              File Upload
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Manual Number Entry Tab */}
            <div className={`tab-panel ${activeTab === 'numbers' ? 'active' : ''}`}>
              <div className="form-section">
                <h2 className="section-title">
                  <span>📝</span>
                  Manual Number Entry
                </h2>
                
                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message Content
                  </label>
                  <textarea
                    id="message"
                    className={`form-textarea ${validationErrors.message ? 'error' : message.trim() ? 'success' : ''}`}
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Enter your message here..."
                    rows={4}
                  />
                  {validationErrors.message && (
                    <div className="validation-message error">{validationErrors.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="numbers" className="form-label">
                    Phone Numbers (one per line)
                  </label>
                  <textarea
                    id="numbers"
                    className={`form-textarea ${validationErrors.numbers ? 'error' : numbers.trim() ? 'success' : ''}`}
                    value={numbers}
                    onChange={handleNumbersChange}
                    placeholder="Enter phone numbers, one per line:&#10;+1234567890&#10;+0987654321"
                    rows={6}
                  />
                  {validationErrors.numbers && (
                    <div className="validation-message error">{validationErrors.numbers}</div>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={sendText}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Send Messages
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* File Upload Tab */}
            <div className={`tab-panel ${activeTab === 'file' ? 'active' : ''}`}>
              <div className="form-section">
                <h2 className="section-title">
                  <span>📄</span>
                  File Upload
                </h2>
                
                <div className="form-group">
                  <label htmlFor="file-message" className="form-label">
                    Message Content
                  </label>
                  <textarea
                    id="file-message"
                    className={`form-textarea ${validationErrors.message ? 'error' : message.trim() ? 'success' : ''}`}
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Enter your message here..."
                    rows={4}
                  />
                  {validationErrors.message && (
                    <div className="validation-message error">{validationErrors.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="file-upload" className="form-label">
                    Upload Numbers File (CSV/TXT)
                  </label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".csv,.txt"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="file-upload" 
                      className={`file-upload-label ${file ? 'has-file' : ''} ${validationErrors.file ? 'error' : ''}`}
                    >
                      <span>📎</span>
                      {file ? `Selected: ${file.name}` : 'Choose file or drag & drop'}
                    </label>
                  </div>
                  {validationErrors.file && (
                    <div className="validation-message error">{validationErrors.file}</div>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={sendTextFile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      Send from File
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Status Section */}
          <div className="status-section">
            <h3 className="status-title">
              <span>📊</span>
              Status & Logs
            </h3>
            <div className={`status-content ${status.includes('Error') ? 'status-error' : status.includes('successfully') ? 'status-success' : ''}`}>
              {status}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          by Guilherme de Castro <span className="heart">♥</span>
        </footer>
      </div>
    </div>
  );
}

export default App;