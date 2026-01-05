import React from 'react';
import { X, Video, FileText, ExternalLink, BookOpen, Download, Globe, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-full">
                <BookOpen className="h-10 w-10 text-slate-300" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-semibold text-slate-900">No resources added yet</h3>
                <p className="text-sm text-slate-500">
                  Manuals, PDFs, videos, or links related to <span className="font-medium text-slate-700">{subtopicTitle}</span> will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Structured Resources */}
              {resources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Learning Materials</h3>
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <Card key={resource.id} className="overflow-hidden border-slate-200 hover:border-blue-300 transition-all duration-200 group">
                        <div className="p-4 flex items-start gap-4">
                          {/* Icon Column */}
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            resource.type === 'video' ? "bg-red-100 text-red-600" :
                            resource.type === 'document' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {resource.type === 'video' ? <Video className="h-5 w-5" /> :
                             resource.type === 'document' ? <FileText className="h-5 w-5" /> :
                             <Globe className="h-5 w-5" />}
                          </div>

                          {/* Content Column */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{resource.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5 capitalize flex items-center gap-2">
                                  {resource.type}
                                  {resource.url && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[200px]">{new URL(resource.url).hostname}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                              
                              <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  {resource.type === 'document' ? <Download className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                  {resource.type === 'document' ? 'Open' : 'Visit'}
                                </a>
                              </Button>
                            </div>

                            {/* Video Embed inline */}
                            {resource.type === 'video' && getYouTubeVideoId(resource.url || '') && (
                              <div className="mt-4 aspect-video w-full rounded-lg overflow-hidden bg-black shadow-sm group-hover:shadow-md transition-shadow">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(resource.url || '')}`}
                                  title={resource.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
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
