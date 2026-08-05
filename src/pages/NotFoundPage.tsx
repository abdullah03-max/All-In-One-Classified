import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
    <div className="text-8xl font-bold text-gradient mb-4">404</div>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Page Not Found</h1>
    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <div className="flex gap-3">
      <Link to="/" className="btn-primary flex items-center gap-2">
        <Home size={16} /> Go Home
      </Link>
      <Link to="/listings" className="btn-secondary flex items-center gap-2">
        <Search size={16} /> Browse Listings
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
