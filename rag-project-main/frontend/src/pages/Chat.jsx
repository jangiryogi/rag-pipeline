import { useState, useEffect, useRef } from 'react';
import { listDocuments, askQuestion, submitFeedback } from '../services/api';

export default function Chat() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    listDocuments().then(setDocuments);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedDoc || loading) return;

    const question = input;
    setInput('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    // Add empty assistant message
    const assistantIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', logId: null, chunks: [] }]);

    await askQuestion(
      question,
      parseInt(selectedDoc),
      // onToken - stream tokens in
      (token) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            content: updated[assistantIndex].content + token
          };
          return updated;
        });
      },
      // onDone - save log id and chunks
      (data) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            logId: data.log_id,
            chunks: data.chunks || []
          };
          return updated;
        });
      }
    );

    setLoading(false);
  };

  const handleFeedback = async (logId, feedback) => {
    await submitFeedback(logId, feedback);
    setMessages(prev =>
      prev.map(m => m.logId === logId ? { ...m, feedback } : m)
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat with Document</h2>

      {/* Document Selector */}
      <select
        className="mb-4 p-3 border border-gray-300 rounded-lg text-gray-700 bg-white"
        value={selectedDoc}
        onChange={(e) => setSelectedDoc(e.target.value)}
      >
        <option value="">-- Select a document --</option>
        {documents.map(doc => (
          <option key={doc.id} value={doc.id}>{doc.filename}</option>
        ))}
      </select>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-4xl mb-3">💬</p>
            <p>Select a document and ask a question</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content || '...'}</p>

              {/* Source chunks */}
              {msg.chunks?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-2">Sources:</p>
                  {msg.chunks.slice(0, 2).map((chunk, j) => (
                    <p key={j} className="text-xs text-gray-500 mb-1 line-clamp-2">
                      [{j + 1}] {chunk.content?.slice(0, 100)}...
                    </p>
                  ))}
                </div>
              )}

              {/* Feedback */}
              {msg.role === 'assistant' && msg.logId && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleFeedback(msg.logId, 1)}
                    className={`text-lg ${msg.feedback === 1 ? 'opacity-100' : 'opacity-40'}`}
                  >👍</button>
                  <button
                    onClick={() => handleFeedback(msg.logId, -1)}
                    className={`text-lg ${msg.feedback === -1 ? 'opacity-100' : 'opacity-40'}`}
                  >👎</button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
          placeholder="Ask a question about your document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!selectedDoc || loading}
        />
        <button
          onClick={sendMessage}
          disabled={!selectedDoc || loading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}