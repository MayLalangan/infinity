import React, { useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { Layout } from '@/components/layout';
import { useTraining, ProgressStatus, type Subtopic } from '@/lib/store';
import { Notepad } from '@/components/notepad';
import { ResourceManager } from '@/components/resource-manager';
import { ResourceViewer } from '@/components/resource-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, MessageSquare, CheckCircle2, Settings, GripVertical, Plus, Trash2, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

export default function TopicView() {
  const [, params] = useRoute('/topic/:id');
  const [, setLocation] = useLocation();
  const { topics, progress, updateProgress, addComment, currentUser, viewAsUser, updateSubtopicResources, updateTopic, deleteSubtopic } = useTraining();
  const [activeResource, setActiveResource] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [manageResourcesFor, setManageResourcesFor] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');

  const { toast } = useToast();
  const topic = topics.find(t => t.id === params?.id);

  if (!topic) return <div>Topic not found</div>;
  if (!currentUser) return <div>Please login</div>;

  const displayUser = viewAsUser || currentUser;
  const isAdmin = currentUser.role === 'admin' && !viewAsUser;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSubtopics = [...topic.subtopics];
    const [draggedItem] = newSubtopics.splice(draggedIndex, 1);
    newSubtopics.splice(dropIndex, 0, draggedItem);

    updateTopic({
      ...topic,
      subtopics: newSubtopics
    });

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddSubtopic = () => {
    if (!newSubtopicTitle.trim()) return;

    const newSubtopic: Subtopic = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtopicTitle,
      resources: `# ${newSubtopicTitle}\n\nResources for ${newSubtopicTitle}...`,
      comments: []
    };

    updateTopic({
      ...topic,
      subtopics: [...topic.subtopics, newSubtopic]
    });
    
    setIsAddSubtopicOpen(false);
    setNewSubtopicTitle('');
  };

  const handleDeleteSubtopic = (subtopicId: string) => {
    if (confirm('Are you sure you want to delete this subtopic? This action cannot be undone.')) {
      deleteSubtopic(topic.id, subtopicId);
    }
  };

  const getStatus = (subtopicId: string) => {
    const p = progress.find(p => p.userId === displayUser.id && p.subtopicId === subtopicId);
    return p?.status || 'not_addressed';
  };

  const statusColors: Record<ProgressStatus, string> = {
    not_addressed: 'text-slate-400',
    basic: 'text-yellow-500',
    good: 'text-blue-500',
    fully_understood: 'text-green-500',
  };

  const statusBorderColors: Record<ProgressStatus, string> = {
    not_addressed: 'border-l-slate-200',
    basic: 'border-l-yellow-400',
    good: 'border-l-blue-500',
    fully_understood: 'border-l-green-500',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <nav className="flex items-center text-sm mb-6">
          <Link href="/" className="group flex items-center gap-2 text-white/80 hover:text-white transition-colors px-2 py-1.5 -ml-2 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Modules</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-white/40 mx-2" />
          <span className="text-white font-bold tracking-wide">{topic.title}</span>
        </nav>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {/* Icon placeholder - ideally dynamic */}
            <div className="text-2xl">📚</div> 
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">{topic.title}</h1>
            <p className="text-white font-medium">{topic.subtopics.length} Subtopics</p>
          </div>
          {isAdmin && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              Drag to reorder
            </div>
          )}
        </div>

        <div className="grid gap-8">
          {topic.subtopics.map((subtopic, index) => {
            const currentStatus = getStatus(subtopic.id);
            return (
              <Card 
                key={subtopic.id} 
                className={cn(
                  "border-l-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 pl-1",
                  statusBorderColors[currentStatus],
                  draggedIndex === index && "opacity-50"
                )}
                draggable={isAdmin}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    {isAdmin && (
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-secondary transition-colors">
                        <GripVertical className="w-5 h-5" />
                      </div>
                    )}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{subtopic.title}</h3>
                        <div className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~15 min
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteSubtopic(subtopic.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-2 bg-[#005A9E] hover:bg-[#004a80] text-white border-0 shadow-sm transition-all hover:shadow-md"
                          onClick={() => setActiveResource(subtopic.id)}
                        >
                          <BookOpen className="w-4 h-4" /> Resources ({subtopic.resourceLinks?.length || 0})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 text-slate-600 border-slate-200 hover:border-[#005A9E] hover:text-[#005A9E] hover:bg-blue-50 transition-colors group"
                          onClick={() => setActiveComments(subtopic.id)}
                        >
                          <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-[#005A9E] transition-colors" /> 
                          Notes & Comments ({subtopic.comments.length})
                        </Button>
                        {currentUser?.role === 'admin' && !viewAsUser && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
                            onClick={() => setManageResourcesFor(subtopic.id)}
                          >
                            <Settings className="w-4 h-4" /> Manage Resources
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-2 min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">My Understanding</span>
                        <span className="text-[10px] text-muted-foreground/70">Self-assessed after reviewing content</span>
                      </div>
                      <Select 
                        value={currentStatus} 
                        onValueChange={(val) => {
                          updateProgress(subtopic.id, val as ProgressStatus);
                          toast({
                            description: "Understanding saved",
                            duration: 2000,
                            className: "bg-green-50 border-green-200 text-green-900", // Subtle success style
                          });
                        }}
                      >
                        <SelectTrigger className={cn("w-full transition-colors border-slate-200 hover:border-slate-300", statusColors[currentStatus])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_addressed">Not Addressed</SelectItem>
                          <SelectItem value="basic">Basic Understanding</SelectItem>
                          <SelectItem value="good">Good Understanding</SelectItem>
                          <SelectItem value="fully_understood">Fully Understood</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resource Modal */}
        {activeResource && (
          <ResourceViewer
            resources={topic.subtopics.find(s => s.id === activeResource)?.resourceLinks || []}
            textResources={topic.subtopics.find(s => s.id === activeResource)?.resources}
            subtopicTitle={topic.subtopics.find(s => s.id === activeResource)?.title || ''}
            onClose={() => setActiveResource(null)}
          />
        )}

        {/* Resource Manager (Admin only) */}
        {manageResourcesFor && currentUser?.role === 'admin' && (
          <ResourceManager
            resources={topic.subtopics.find(s => s.id === manageResourcesFor)?.resourceLinks || []}
            subtopicTitle={topic.subtopics.find(s => s.id === manageResourcesFor)?.title || ''}
            onUpdate={(resources) => {
              updateSubtopicResources(topic.id, manageResourcesFor, resources);
            }}
            onClose={() => setManageResourcesFor(null)}
          />
        )}

        {/* Comment Modal */}
        {activeComments && (
          <Notepad 
            title={topic.subtopics.find(s => s.id === activeComments)?.title || ''}
            mode="write"
            onClose={() => setActiveComments(null)}
            onSubmit={async (text, file) => {
              let attachmentUrl;
              if (file) {
                 const formData = new FormData();
                 formData.append('file', file);
                 try {
                   const res = await fetch('/api/upload', { method: 'POST', body: formData });
                   if (res.ok) {
                     const data = await res.json();
                     attachmentUrl = data.url;
                   }
                 } catch (e) {
                   console.error("Upload failed", e);
                 }
              }
              
              addComment(activeComments, { 
                userId: currentUser.id, 
                text,
                imageUrl: attachmentUrl // Using imageUrl field for generic file attachments
              });
              setActiveComments(null);
            }}
          />
        )}
      </div>

      {/* Fixed Add Subtopic Button */}
      {isAdmin && (
        <Dialog open={isAddSubtopicOpen} onOpenChange={setIsAddSubtopicOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-8 right-8 shadow-2xl bg-[#006400] hover:bg-[#7acc00] text-white gap-2 px-6 py-6 rounded-full z-50 transition-all hover:scale-110">
              <Plus className="h-6 w-6" />
              <span className="font-semibold">Add Subtopic</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white text-black border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-black">Add Subtopic to {topic.title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subtopicTitle" className="text-right text-black">Title</Label>
                <Input 
                  id="subtopicTitle" 
                  value={newSubtopicTitle} 
                  onChange={(e) => setNewSubtopicTitle(e.target.value)} 
                  className="col-span-3 bg-white text-black border-gray-200" 
                  placeholder="Subtopic Title"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleAddSubtopic} className="bg-black text-white hover:bg-[#7acc00]">Add Subtopic</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
