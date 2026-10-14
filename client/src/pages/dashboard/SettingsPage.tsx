import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Survey, StorageHealth } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import api from '../../lib/api';
import { HardDrive, AlertTriangle, Download, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { addToast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [purgeDate, setPurgeDate] = useState('');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveyRes, healthRes] = await Promise.all([
          api.get(`/surveys/${surveyId}`),
          api.get('/storage/health')
        ]);
        setSurvey(surveyRes.data.survey);
        setHealth(healthRes.data);
      } catch {
        addToast('Failed to load settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [surveyId, addToast]);

  const handleBackup = () => {
    const url = `${api.defaults.baseURL}/surveys/${surveyId}/responses/export/csv`;
    const token = localStorage.getItem('token');
    
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `backup_${survey?.title.replace(/[^a-z0-9]/gi, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast('Backup downloaded. You may now safely purge old records.', 'success');
      })
      .catch(() => addToast('Backup export failed', 'error'));
  };

  const handlePurge = async () => {
    if (!purgeDate) return;
    setIsPurging(true);
    try {
      const res = await api.delete('/storage/purge', {
        data: {
          surveyId: survey?._id,
          before: purgeDate,
          confirm: 'PURGE'
        }
      });
      addToast(res.data.message, 'success');
      
      // Refresh health stats
      const healthRes = await api.get('/storage/health');
      setHealth(healthRes.data);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to purge data', 'error');
    } finally {
      setIsPurging(false);
      setIsPurgeModalOpen(false);
    }
  };

  if (isLoading || !survey || !health) {
    return <AppShell><div className="flex h-full items-center justify-center"><Spinner size="lg" /></div></AppShell>;
  }

  const getHealthColor = () => {
    if (health.status === 'critical') return 'text-red-500 bg-red-500';
    if (health.status === 'warning') return 'text-yellow-500 bg-yellow-500';
    return 'text-green-500 bg-green-500';
  };

  return (
    <AppShell survey={survey}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground mt-1">Manage survey configuration and storage limits.</p>
        </div>

        {/* Storage Health Monitor */}
        <Card className="border-2 border-border overflow-hidden">
          <div className="bg-muted/50 p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center">
              <HardDrive className="w-5 h-5 mr-3 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Storage Health</h3>
                <p className="text-sm text-muted-foreground">Monitor database storage usage and limits.</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              health.status === 'critical' ? 'bg-red-100 text-red-700' :
              health.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {health.status}
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span>{health.storage.totalSizeMB} MB Used</span>
              <span>{health.storage.limitMB} MB Total</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className={`h-full ${getHealthColor().split(' ')[1]} transition-all duration-1000`} 
                style={{ width: `${Math.min(100, health.storage.usagePercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-background border border-border p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Data Size</div>
                <div className="font-semibold">{health.storage.dataSizeMB} MB</div>
              </div>
              <div className="bg-background border border-border p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Index Size</div>
                <div className="font-semibold">{health.storage.indexSizeMB} MB</div>
              </div>
              <div className="bg-background border border-border p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Documents</div>
                <div className="font-semibold">{health.documents.toLocaleString()}</div>
              </div>
              <div className="bg-background border border-border p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Usage %</div>
                <div className="font-semibold">{health.storage.usagePercent}%</div>
              </div>
            </div>

            {health.status !== 'healthy' && (
              <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-md flex items-start border border-yellow-200">
                <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Storage limit approaching.</strong> If you hit 512MB, new responses will be rejected. 
                  Please backup and purge old responses to free up space.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup and retention controls */}
        <Card>
          <CardHeader>
            <CardTitle>Backup & data retention</CardTitle>
            <CardDescription>Download a response archive and remove older records when storage needs to be reclaimed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Input 
                  type="date" 
                  label="Delete responses older than"
                  value={purgeDate}
                  onChange={(e) => setPurgeDate(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleBackup} className="w-full sm:w-auto shrink-0">
                <Download className="w-4 h-4 mr-2" /> Download backup
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setIsPurgeModalOpen(true)}
                disabled={!purgeDate}
                className="w-full sm:w-auto shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete old responses
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Always download a full CSV backup before running a purge operation. Purged data is permanently deleted from MongoDB.
            </p>
          </CardContent>
        </Card>

      </div>

      <ConfirmDialog
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onConfirm={handlePurge}
        title="Purge Responses"
        description={`This will permanently delete all responses for this survey submitted before ${purgeDate}. Have you downloaded a backup first?`}
        confirmText="Yes, Purge Data"
        isDestructive={true}
        requiredTypedConfirmation="PURGE"
        isLoading={isPurging}
      />
    </AppShell>
  );
};
