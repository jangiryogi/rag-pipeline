import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Documents
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const listDocuments = async () => {
  const response = await api.get('/documents/');
  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

// Chat
export const askQuestion = async (question, documentId, onToken, onDone) => {
  const response = await fetch(`${BASE_URL}/chat/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      document_id: documentId,
      user_id: 1
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.token) onToken(data.token);
        if (data.done) onDone(data);
      }
    }
  }
};

export const submitFeedback = async (logId, feedback) => {
  const response = await api.post('/chat/feedback', {
    log_id: logId,
    feedback
  });
  return response.data;
};

export const getQueryLogs = async () => {
  const response = await api.get('/chat/logs');
  return response.data;
};