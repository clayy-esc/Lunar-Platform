import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Survey, SurveyResponse } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Download, Trash2, FileText } from 'lucide-react';
import api from '../../lib/api';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const SubmissionsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [viewResponse, setViewResponse] = useState<SurveyResponse | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [surveyRes, responsesRes] = await Promise.all([
          api.get(`/surveys/${surveyId}`),
          api.get(`/surveys/${surveyId}/responses`, { params: { page, limit: 20, search } })
        ]);
        setSurvey(surveyRes.data.survey);
        setResponses(responsesRes.data.responses);
        setTotal(responsesRes.data.pagination.total);
      } catch (err: any) {
        addToast('Failed to load submissions', 'error');
        if (err.response?.status === 404) navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [surveyId, page, search, navigate, addToast]);

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/surveys/${surveyId}/responses`, {
        data: {
          responseIds: Array.from(selectedIds),
          confirm: 'DELETE'
        }
      });
      addToast(`${selectedIds.size} responses deleted`, 'success');
      setSelectedIds(new Set());
      setPage(1);
      // Trigger reload
      setSearch(search + ' ');
      setTimeout(() => setSearch(search.trim()), 0);
    } catch {
      addToast('Failed to delete responses', 'error');
    } finally {
      setIsDeleting(false);
      setIsBulkDeleteOpen(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const url = `${api.defaults.baseURL}/surveys/${surveyId}/responses/export/${format}`;
    const token = localStorage.getItem('token');
    
    // Create a temporary anchor to trigger download with token in query or use fetch
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `${survey?.title.replace(/[^a-z0-9]/gi, '_')}_export.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => addToast('Export failed', 'error'));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === responses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(responses.map(r => r._id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const columns: Column<SurveyResponse>[] = [
    {
      header: 'Submitted At',
      accessor: (row) => new Date(row.metadata.submittedAt).toLocaleString(),
    },
    {
      header: 'Time (s)',
      accessor: (row) => row.metadata.completionTime ? `${row.metadata.completionTime}s` : '-',
    },
    {
      header: 'Preview (Q1)',
      accessor: (row) => {
        const firstAns = row.answers[0]?.value;
        if (!firstAns) return '-';
        const str = Array.isArray(firstAns) ? firstAns.join(', ') : String(firstAns);
        return <span className="truncate max-w-50 inline-block">{str}</span>;
      },
    },
  ];

  if (!survey && isLoading) {
    return <AppShell><div className="flex h-full items-center justify-center"><Spinner size="lg" /></div></AppShell>;
  }

  return (
    <AppShell survey={survey}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#66718a]">Responses</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#172342]">Submission inbox</h2>
            <p className="mt-1 text-sm text-[#66718a]">{total} total responses collected</p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <Button variant="danger" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedIds.size}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={total === 0}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')} disabled={total === 0}>
              <FileText className="w-4 h-4 mr-2" /> Export JSON
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={responses}
          keyExtractor={(r) => r._id}
          isLoading={isLoading}
          onRowClick={(r) => setViewResponse(r)}
          page={page}
          totalPages={Math.ceil(total / 20)}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search answers..."
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectRow={toggleSelectRow}
        />
      </div>

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Responses"
        description={`Are you sure you want to permanently delete ${selectedIds.size} response(s)?`}
        confirmText="Delete"
        isDestructive={true}
        requiredTypedConfirmation="DELETE"
        isLoading={isDeleting}
      />

      {/* Answer Inspection Modal */}
      <Modal isOpen={!!viewResponse} onClose={() => setViewResponse(null)} title="Response Details" maxWidth="2xl">
        {viewResponse && survey && (
          <div className="space-y-6 pb-6">
            <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted p-4 rounded-md">
              <div><strong>ID:</strong> <span className="font-mono text-xs">{viewResponse._id}</span></div>
              <div><strong>Submitted:</strong> {new Date(viewResponse.metadata.submittedAt).toLocaleString()}</div>
              {viewResponse.metadata.completionTime && <div><strong>Time:</strong> {viewResponse.metadata.completionTime}s</div>}
            </div>

            <div className="space-y-6">
              {survey.questions.map((q, i) => {
                const answer = viewResponse.answers.find(a => a.questionId === q.id);
                let displayValue = '-';
                
                if (answer && answer.value !== null && answer.value !== undefined) {
                  if (Array.isArray(answer.value)) {
                    displayValue = answer.value.join(', ');
                  } else {
                    displayValue = String(answer.value);
                  }
                }

                return (
                  <div key={q.id} className="border-b border-border pb-4 last:border-0">
                    <h4 className="font-medium text-foreground mb-1">
                      {i + 1}. {q.title}
                    </h4>
                    <p className="text-foreground whitespace-pre-wrap">{displayValue}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};
