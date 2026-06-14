import { useState, useEffect } from 'react';
import { getQueryLogs } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQueryLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const avgLatency = logs.length
    ? (logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / logs.length).toFixed(0)
    : 0;

  const thumbsUp = logs.filter(l => l.feedback === 1).length;
  const thumbsDown = logs.filter(l => l.feedback === -1).length;

  const latencyData = logs.slice(-20).map((log, i) => ({
    index: i + 1,
    latency: Math.round(log.latency_ms || 0)
  }));

  const feedbackData = [
    { name: '👍 Positive', value: thumbsUp },
    { name: '👎 Negative', value: thumbsDown },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">📊 Monitoring Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Queries</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Avg Latency</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{avgLatency}ms</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Positive Feedback</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{thumbsUp} 👍</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Negative Feedback</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{thumbsDown} 👎</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Latency Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-md font-semibold text-gray-700 mb-4">Response Latency (ms)</h3>
          {latencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data yet</p>
          )}
        </div>

        {/* Feedback Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-md font-semibold text-gray-700 mb-4">User Feedback</h3>
          {thumbsUp + thumbsDown > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feedbackData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No feedback yet</p>
          )}
        </div>
      </div>

      {/* Query Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-md font-semibold text-gray-700">Recent Queries</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No queries yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 text-gray-500 font-medium">Question</th>
                  <th className="text-left p-4 text-gray-500 font-medium">Latency</th>
                  <th className="text-left p-4 text-gray-500 font-medium">Feedback</th>
                  <th className="text-left p-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="p-4 text-gray-800 max-w-xs truncate">{log.question}</td>
                    <td className="p-4 text-gray-600">{Math.round(log.latency_ms || 0)}ms</td>
                    <td className="p-4">
                      {log.feedback === 1 ? '👍' : log.feedback === -1 ? '👎' : '—'}
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}