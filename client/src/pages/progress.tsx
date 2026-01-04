import React from 'react';
import { Layout } from '@/components/layout';
import { useTraining, type Topic } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function ProgressOverview() {
  const { topics, progress, currentUser, viewAsUser } = useTraining();
  
  const displayUser = viewAsUser || currentUser;
  const activeTopics = topics.filter(t => !t.isDeleted);

  // Calculate progress stats for a topic
  const getTopicStats = (topic: Topic) => {
    if (!topic.subtopics.length) {
      return {
        total: 0,
        notAddressed: 0,
        basic: 0,
        good: 0,
        fullyUnderstood: 0,
        percentage: 0,
        completed: 0
      };
    }

    const subtopicIds = topic.subtopics.map(s => s.id);
    const topicProgress = progress.filter(p => p.userId === displayUser?.id && subtopicIds.includes(p.subtopicId));
    
    const stats = {
      notAddressed: 0,
      basic: 0,
      good: 0,
      fullyUnderstood: 0
    };

    topic.subtopics.forEach(st => {
      const p = topicProgress.find(tp => tp.subtopicId === st.id);
      const status = p?.status || 'not_addressed';
      
      if (status === 'fully_understood') stats.fullyUnderstood++;
      else if (status === 'good') stats.good++;
      else if (status === 'basic') stats.basic++;
      else stats.notAddressed++;
    });

    const total = topic.subtopics.length;
    const completed = stats.fullyUnderstood;
    const percentage = Math.round((completed / total) * 100);

    return {
      total,
      notAddressed: stats.notAddressed,
      basic: stats.basic,
      good: stats.good,
      fullyUnderstood: stats.fullyUnderstood,
      percentage,
      completed
    };
  };

  // Helper to get image path for a topic
  const getTopicImagePath = (title: string): string | null => {
    const normalizedTitle = title.toLowerCase().trim();
    
    const imageMap: Record<string, string> = {
      'mbes': '/images/topics/mbes.jpg',
      'vc': '/images/topics/svc.png',
      'qinsy': '/images/topics/qinsy.png',
      'apos': '/images/topics/apos.png',
      'naviscan': '/images/topics/naviscan.jpg',
      'sss': '/images/topics/sss.png',
      'svp': '/images/topics/svp.png',
      'cpt': '/images/topics/cpt.png',
      'subc dvr': '/images/topics/subc dvr.png',
      'gnss': '/images/topics/gnss.webp',
      'tss440': '/images/topics/tss440.webp',
      'tss 440': '/images/topics/tss440.webp',
      'obs': '/images/topics/obs.png',
    };
    
    if (imageMap[normalizedTitle]) {
      return imageMap[normalizedTitle];
    }
    
    if (normalizedTitle.includes('online') || normalizedTitle.includes('auto log')) {
      return '/images/topics/onlinelog_autolog.png';
    }
    if (normalizedTitle.includes('helmsman') || normalizedTitle.includes('touchpad')) {
      return '/images/topics/helmsman_touchpad.png';
    }
    if (normalizedTitle.includes('obs')) {
      return '/images/topics/obs.png';
    }
    if (normalizedTitle.includes('tss')) {
      return '/images/topics/tss440.webp';
    }
    
    return null;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Progress Overview</h1>
          <p className="text-lg text-white/80">
            Track your learning journey across all training modules
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTopics.map(topic => {
            const stats = getTopicStats(topic);
            
            // Custom mappings consistent with Homepage
            const getCustomIcon = (title: string, defaultIcon: string) => {
              const t = title.toLowerCase();
              if (t.includes('safety')) return { icon: LucideIcons.LifeBuoy, color: '#ef4444' };
              if (t.includes('navigation')) return { icon: LucideIcons.Anchor, color: '#0ea5e9' };
              if (t.includes('equipment')) return { icon: LucideIcons.Settings, color: '#f59e0b' };
              if (t.includes('data')) return { icon: LucideIcons.LineChart, color: '#8b5cf6' };
              if (t.includes('communication')) return { icon: LucideIcons.Radio, color: '#10b981' };
              if (t.includes('environmental')) return { icon: LucideIcons.Fish, color: '#14b8a6' };
              if (t.includes('vessel')) return { icon: LucideIcons.Ship, color: '#3b82f6' };
              if (t.includes('weather')) return { icon: LucideIcons.CloudLightning, color: '#6366f1' };
              
              return { icon: (LucideIcons as any)[defaultIcon] || LucideIcons.HelpCircle, color: null };
            };

            const { icon: IconComponent, color: iconColor } = getCustomIcon(topic.title, topic.icon);
            const topicImage = getTopicImagePath(topic.title);

            return (
              <Link key={topic.id} href={`/topic/${topic.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-2 hover:border-secondary">
                  <CardContent className="p-6 space-y-4">
                    {/* Header with icon/image and title */}
                    <div className="flex items-center gap-4">
                      {topicImage ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                          <img 
                            src={topicImage} 
                            alt={topic.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: iconColor ? `${iconColor}15` : 'rgba(var(--primary), 0.1)' }}
                        >
                          <IconComponent 
                            className={cn("w-8 h-8", !iconColor && "text-primary")} 
                            style={{ color: iconColor || undefined }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{topic.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.completed} of {stats.total} completed
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-primary">{stats.percentage}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
                        {stats.fullyUnderstood > 0 && (
                          <div 
                            className="bg-green-500 transition-all duration-500"
                            style={{ width: `${(stats.fullyUnderstood / stats.total) * 100}%` }}
                            title={`Fully Understood: ${stats.fullyUnderstood}`}
                          />
                        )}
                        {stats.good > 0 && (
                          <div 
                            className="bg-blue-500 transition-all duration-500"
                            style={{ width: `${(stats.good / stats.total) * 100}%` }}
                            title={`Good Understanding: ${stats.good}`}
                          />
                        )}
                        {stats.basic > 0 && (
                          <div 
                            className="bg-yellow-500 transition-all duration-500"
                            style={{ width: `${(stats.basic / stats.total) * 100}%` }}
                            title={`Basic Understanding: ${stats.basic}`}
                          />
                        )}
                        {stats.notAddressed > 0 && (
                          <div 
                            className="bg-slate-300 transition-all duration-500"
                            style={{ width: `${(stats.notAddressed / stats.total) * 100}%` }}
                            title={`Not Addressed: ${stats.notAddressed}`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Status breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Mastered: {stats.fullyUnderstood}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Good: {stats.good}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-muted-foreground">Basic: {stats.basic}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                        <span className="text-muted-foreground">Not Started: {stats.notAddressed}</span>
                      </div>
                    </div>

                    {/* Subtopics list with status indicators */}
                    <div className="space-y-1.5 pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Subtopics</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {topic.subtopics.map(subtopic => {
                          const p = progress.find(pr => pr.userId === displayUser?.id && pr.subtopicId === subtopic.id);
                          const status = p?.status || 'not_addressed';
                          
                          const statusConfig = {
                            fully_understood: { color: 'text-green-600', icon: CheckCircle2, label: 'Mastered' },
                            good: { color: 'text-blue-600', icon: CheckCircle2, label: 'Good' },
                            basic: { color: 'text-yellow-600', icon: Circle, label: 'Basic' },
                            not_addressed: { color: 'text-slate-400', icon: Circle, label: 'Not Started' }
                          };
                          
                          const config = statusConfig[status];
                          const StatusIcon = config.icon;

                          return (
                            <div key={subtopic.id} className="flex items-center gap-2 text-xs">
                              <StatusIcon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
                              <span className="truncate flex-1">{subtopic.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
