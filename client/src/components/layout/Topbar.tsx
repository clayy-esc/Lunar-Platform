import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowLeft, Menu, Share, ExternalLink, EyeOff } from 'lucide-react';
import { Survey } from '../../types';

interface TopbarProps {
  survey?: Survey | null;
  onPublish?: () => void;
  isPublishing?: boolean;
  onUnpublish?: () => void;
  isUnpublishing?: boolean;
  onMenuOpen?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ survey, onPublish, isPublishing, onUnpublish, isUnpublishing, onMenuOpen }) => {
  const navigate = useNavigate();

  return (
    <header className="relative z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/75 px-4 backdrop-blur-2xl sm:px-6 lg:px-8 shadow-xs">
      <div className="flex min-w-0 items-center flex-1">
        {survey && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate('/dashboard')}
            title="Return to dashboard"
            aria-label="Return to dashboard"
            className="mr-3 h-9 w-9 shrink-0 rounded-full border border-slate-200/80 bg-white/80 hover:bg-white shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </Button>
        )}
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open survey navigation"
          aria-expanded={Boolean(onMenuOpen)}
          aria-controls="survey-navigation"
          className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-foreground hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden shadow-xs"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        {survey ? (
          <div>
            <h1 className="survey-title-clamp truncate text-base font-extrabold leading-tight text-slate-900 sm:text-lg">{survey.title}</h1>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                survey.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                survey.status === 'closed' ? 'bg-rose-50 text-rose-700 border-rose-200/80' :
                'bg-amber-50 text-amber-800 border-amber-200/80'
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {survey.status}
              </span>
              {survey.publicSlug && (
                survey.status === 'published' ? (
                  <a 
                    href={`/s/${survey.publicSlug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Live Survey
                  </a>
                ) : (
                  <span
                    className="flex items-center text-[11px] font-medium text-slate-400 cursor-help"
                    title="Publish the survey to activate this public link"
                  >
                    <ExternalLink className="w-3 h-3 mr-1 opacity-40" />
                    Live Link (Requires Publish)
                  </span>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <h1 className="text-base font-bold text-slate-800">Survey Workspace</h1>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {survey && survey.status === 'draft' && onPublish && (
          <Button size="sm" onClick={onPublish} isLoading={isPublishing} className="rounded-full shadow-md shadow-indigo-600/15">
            <Share className="w-4 h-4 mr-2" />
            Publish
          </Button>
        )}
        {survey && survey.status === 'published' && onUnpublish && (
          <Button size="sm" variant="outline" onClick={onUnpublish} isLoading={isUnpublishing} className="rounded-full">
            <EyeOff className="w-4 h-4 mr-2" />
            Unpublish
          </Button>
        )}
      </div>
    </header>
  );
};
