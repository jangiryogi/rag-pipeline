import { useState, useEffect } from 'react';
import { uploadDocument, listDocuments, deleteDocument } from '../services/api';

export default function Upload() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (file) => {
    if (!file || (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt'))) {
        setMessage('❌ Only PDF and TXT files are supported');
    }
    setUploading(true);
    setMessage('');
    try {
      const result = await uploadDocument(file);
      setMessage(`✅ ${result.filename} uploaded successfully!`);
      fetchDocuments();
    } catch (err) {
      setMessage('❌ Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    await deleteDocument(id);
    fetchDocuments();
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Documents</h2>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <div className="text-5xl mb-4">📄</div>
        <p className="text-gray-600 font-medium">Drag and drop a PDF or TXT here</p>
        <p className="text-gray-400 text-sm mt-1">or click to browse</p>
        <input
          id="fileInput"
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </div>

      {/* Status Message */}
      {uploading && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
          ⏳ Processing document... this may take a moment
        </div>
      )}
      {message && !uploading && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Documents List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Uploaded Documents ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No documents uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">📄 {doc.filename}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {doc.id} · {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-400 hover:text-red-600 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}