import React, { useState } from 'react';
import { X, Plus, Video, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { Resource } from '@/lib/store';

interface ResourceManagerProps {
  resources: Resource[];
  onUpdate: (resources: Resource[]) => void;
  onClose: () => void;
  subtopicTitle: string;
}

export function ResourceManager({ resources, onUpdate, onClose, subtopicTitle }: ResourceManagerProps) {
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    type: 'video',
    title: '',
    url: ''
  });

  const handleAddResource = () => {
    if (!newResource.title || !newResource.url) {
      alert('Please fill in all fields');
      return;
    }

    const resource: Resource = {
      id: Math.random().toString(36).substr(2, 9),
      type: newResource.type as 'video' | 'document',
      title: newResource.title,
      url: newResource.url
    };

    onUpdate([...resources, resource]);
    setNewResource({ type: 'video', title: '', url: '' });
  };

  const handleRemoveResource = (id: string) => {
    onUpdate(resources.filter(r => r.id !== id));
  };

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Manage Resources - {subtopicTitle}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Resource */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Add New Resource</h3>
            <div className="space-y-4">
              <div>
                <Label>Resource Type</Label>
                <Select 
                  value={newResource.type} 
                  onValueChange={(value) => setNewResource({ ...newResource, type: value as 'video' | 'document' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video (YouTube)</SelectItem>
                    <SelectItem value="document">Document Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input 
                  placeholder="e.g., Introduction to MBES"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                />
              </div>

              <div>
                <Label>
                  {newResource.type === 'video' ? 'YouTube URL' : 'Document URL'}
                </Label>
                <Input 
                  placeholder={newResource.type === 'video' 
                    ? "https://www.youtube.com/watch?v=..." 
                    : "https://docs.google.com/document/..."}
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                />
                {newResource.type === 'video' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: youtube.com/watch?v=ID or youtu.be/ID
                  </p>
                )}
              </div>

              <Button onClick={handleAddResource} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Resource
              </Button>
            </div>
          </Card>

          {/* Existing Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Resources ({resources.length})</h3>
            {resources.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No resources added yet</p>
            ) : (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <Card key={resource.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {resource.type === 'video' ? (
                          <Video className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                        ) : (
                          <FileText className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{resource.title}</h4>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {resource.url}
                          </a>
                          {resource.type === 'video' && getYouTubeVideoId(resource.url || '') && (
                            <div className="mt-2">
                              <iframe
                                width="100%"
                                height="200"
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(resource.url || '')}`}
                                title={resource.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="rounded"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveResource(resource.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
