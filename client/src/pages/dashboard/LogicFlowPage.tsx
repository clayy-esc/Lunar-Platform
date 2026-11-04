import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Survey, LogicRule } from '../../types';
import { useToast } from '../../components/ui/useToast';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { nanoid } from 'nanoid';
import api from '../../lib/api';
import { 
  ReactFlow, 
  Background, 
  Controls,
  Edge,
  Node,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Trash2, Plus, GitMerge } from 'lucide-react';

const QuestionNode = ({ data }: { data: { title: string, isEnd: boolean, order: number } }) => {
  return (
    <div className={`logic-question-node px-4 py-3 shadow-md rounded-xl bg-white border-2 ${data.isEnd ? 'border-[#27804d]' : 'border-[#4169b2]'}`}>
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-[#66718a]">
          {data.isEnd ? 'END' : `Q${data.order + 1}`}
        </span>
        <span className="max-w-37.5 truncate text-sm font-bold text-[#172342]">
          {data.title || 'Untitled Question'}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2" />
    </div>
  );
};

const nodeTypes = { question: QuestionNode };

export const LogicFlowPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await api.get(`/surveys/${surveyId}`);
        setSurvey(res.data.survey);
      } catch {
        addToast('Failed to load survey', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvey();
  }, [surveyId, navigate, addToast]);

  useEffect(() => {
    if (!survey) return;

    // Generate nodes
    const generatedNodes: Node[] = survey.questions.map((q, i) => ({
      id: q.id,
      type: 'question',
      position: { x: 250, y: i * 150 + 50 },
      data: { title: q.title, isEnd: false, order: i },
    }));

    // Add End node
    generatedNodes.push({
      id: 'end',
      type: 'question',
      position: { x: 250, y: survey.questions.length * 150 + 50 },
      data: { title: 'Submit Survey', isEnd: true, order: -1 },
    });

    // Generate edges
    const generatedEdges: Edge[] = [];

    // Default sequential edges
    for (let i = 0; i < survey.questions.length; i++) {
      const q = survey.questions[i];
      // Check if this question has a custom logic rule that overrides default flow
      const hasRule = survey.logic?.find(r => r.sourceQuestionId === q.id);
      
      const targetId = i < survey.questions.length - 1 ? survey.questions[i+1].id : 'end';
      
      generatedEdges.push({
        id: `default-${q.id}-${targetId}`,
        source: q.id,
        target: targetId,
        type: 'smoothstep',
        animated: !hasRule,
        style: { stroke: hasRule ? 'var(--muted-foreground)' : 'var(--primary)', strokeWidth: hasRule ? 1 : 2, strokeDasharray: hasRule ? '5 5' : 'none' },
        markerEnd: { type: MarkerType.ArrowClosed, color: hasRule ? 'var(--muted-foreground)' : 'var(--primary)' },
      });
    }

    // Custom logic edges
    survey.logic?.forEach((rule) => {
      generatedEdges.push({
        id: rule.id,
        source: rule.sourceQuestionId,
        target: rule.targetQuestionId,
        type: 'smoothstep',
        label: `${rule.condition} ${rule.value}`,
        labelStyle: { fill: 'var(--primary)', fontWeight: 700 },
        labelBgStyle: { fill: 'var(--card)', fillOpacity: 0.94 },
        animated: true,
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);

  }, [survey, setNodes, setEdges]);

  const handleSave = async () => {
    if (!survey) return;
    setIsSaving(true);
    try {
      await api.put(`/surveys/${survey._id}`, { logic: survey.logic });
      addToast('Logic rules saved', 'success');
    } catch {
      addToast('Failed to save logic rules', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addRule = () => {
    if (!survey) return;
    const newRule: LogicRule = {
      id: nanoid(8),
      sourceQuestionId: survey.questions[0]?.id || '',
      condition: 'equals',
      value: '',
      targetQuestionId: 'end'
    };
    setSurvey({ ...survey, logic: [...(survey.logic || []), newRule] });
  };

  const updateRule = (id: string, updates: Partial<LogicRule>) => {
    if (!survey) return;
    setSurvey({
      ...survey,
      logic: survey.logic.map((r) => r.id === id ? { ...r, ...updates } : r)
    });
  };

  const removeRule = (id: string) => {
    if (!survey) return;
    setSurvey({
      ...survey,
      logic: survey.logic.filter((r) => r.id !== id)
    });
  };

  const questionOptions = useMemo(() => {
    if (!survey) return [];
    return survey.questions.map(q => ({ label: `Q${q.order + 1}: ${q.title}`, value: q.id }));
  }, [survey]);

  const targetOptions = useMemo(() => {
    if (!survey) return [];
    return [
      ...survey.questions.map(q => ({ label: `Q${q.order + 1}: ${q.title}`, value: q.id })),
      { label: 'End of Survey (Submit)', value: 'end' }
    ];
  }, [survey]);

  if (isLoading || !survey) {
    return <AppShell><div className="flex h-full items-center justify-center"><Spinner size="lg" /></div></AppShell>;
  }

  return (
    <AppShell survey={survey}>
      <div className="flex min-h-full flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold text-[#66718a]">Logic flow</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#172342]">Guide every response</h2>
            <p className="mt-1 text-sm text-[#66718a]">Create rules that send respondents to the right next question.</p>
          </div>
          <span className="hidden rounded-full bg-[#eaf0ff] px-3 py-1.5 text-xs font-bold text-[#4169b2] sm:inline-flex">
            {survey.logic?.length || 0} {(survey.logic?.length || 0) === 1 ? 'rule' : 'rules'}
          </span>
        </div>
      <div className="logic-flow-height flex min-h-0 gap-6">
        {/* Logic Rules Sidebar */}
        <div className="flex h-full w-96 shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e4e9f3] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e4e9f3] bg-[#f8faff] p-4">
            <h3 className="flex items-center font-extrabold text-[#172342]">
              <GitMerge className="mr-2 h-4 w-4 text-[#4169b2]" />
              Branching Logic
            </h3>
            <Button size="sm" onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!survey.logic || survey.logic.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#dce3f2] bg-[#f8faff] px-4 py-8 text-center text-sm text-[#66718a]">
                No logic rules defined.<br/>Survey will follow sequential order.
              </div>
            ) : (
              survey.logic.map((rule) => (
                <Card key={rule.id} className="logic-rule-card border-[#e4e9f3] bg-[#f8faff] p-4 shadow-none">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#66718a]">If answer to</label>
                      <Select 
                        value={rule.sourceQuestionId}
                        onChange={(e) => updateRule(rule.id, { sourceQuestionId: e.target.value })}
                        options={questionOptions}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select 
                          value={rule.condition}
                          onChange={(e) => updateRule(rule.id, { condition: e.target.value as any })}
                          options={[
                            { label: 'Equals', value: 'equals' },
                            { label: 'Not Equals', value: 'not_equals' },
                            { label: 'Contains', value: 'contains' },
                            { label: 'Greater Than', value: 'greater_than' },
                            { label: 'Less Than', value: 'less_than' },
                          ]}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder="Enter a value"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#66718a]">Then skip to</label>
                      <Select 
                        value={rule.targetQuestionId}
                        onChange={(e) => updateRule(rule.id, { targetQuestionId: e.target.value })}
                        options={targetOptions}
                        className="h-8 text-sm mt-1 border-primary/50 focus:border-primary"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)} className="h-7 text-[#b42318] hover:bg-[#fff0ef] hover:text-[#8f1d14]">
                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
            
            <Button variant="outline" className="w-full border-dashed" onClick={addRule}>
              <Plus className="w-4 h-4 mr-2" /> Add Logic Rule
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="logic-flow-canvas relative flex-1 overflow-hidden rounded-2xl border border-[#dce3f2] shadow-inner">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="var(--border)" gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      </div>
    </AppShell>
  );
};
