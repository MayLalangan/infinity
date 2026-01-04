import React from 'react';
import { X, Video, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Resource } from '@/lib/store';

interface ResourceViewerProps {
  resources: Resource[];
  textResources?: string;
  onClose: () => void;
  subtopicTitle: string;
}

export function ResourceViewer({ resources, textResources, onClose, subtopicTitle }: ResourceViewerProps) {
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

  const hasContent = resources.length > 0 || textResources;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Resources - {subtopicTitle}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!hasContent ? (
            <p className="text-muted-foreground text-center py-8">No resources available yet</p>
          ) : (
            <>
              {/* Structured Resources */}
              {resources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Learning Materials</h3>
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <Card key={resource.id} className="p-4">
                        <div className="flex items-start gap-3">
                          {resource.type === 'video' ? (
                            <Video className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          ) : (
                            <FileText className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold">{resource.title}</h4>
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline flex-shrink-0"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open
                              </a>
                            </div>
                            
                            {resource.type === 'video' && getYouTubeVideoId(resource.url || '') ? (
                              <div className="aspect-video w-full">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(resource.url || '')}`}
                                  title={resource.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="rounded"
                                />
                              </div>
                            ) : resource.type === 'document' ? (
                              <div className="text-sm text-muted-foreground">
                                Click "Open" to view this document in a new tab
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
