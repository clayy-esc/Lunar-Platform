import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page min-h-screen flex flex-col items-center justify-center p-4">
      <div className="not-found-card max-w-md w-full text-center space-y-6 rounded-3xl p-10">
        <p className="mb-1 text-xs font-semibold text-blue-600">Lunar workspace</p>
        <h1 className="text-9xl font-black text-blue-600/20">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="inline-block mt-4">
          <Button size="lg">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
