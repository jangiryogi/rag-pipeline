import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const links = [
    { path: '/', label: '📄 Upload' },
    { path: '/chat', label: '💬 Chat' },
    { path: '/dashboard', label: '📊 Dashboard' },
  ];

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold text-blue-400">🧠 RAG Pipeline</h1>
      <div className="flex gap-6">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium hover:text-blue-400 transition ${
              location.pathname === link.path ? 'text-blue-400' : 'text-gray-300'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}