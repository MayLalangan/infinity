import React from 'react';
import { Link } from 'wouter';
import * as LucideIcons from 'lucide-react';
import { Topic, useTraining } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Edit, ArrowRight, CheckCircle2, Clock, Circle } from 'lucide-react';

interface InfinityGridProps {
  topics: Topic[];
  onEdit?: (topic: Topic) => void;
}

// Helper to determine a descriptor based on title (simulated category)
const getTopicDescriptor = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('mbes') || t.includes('sss') || t.includes('sonar')) return 'Hydrographic Survey';
  if (t.includes('qinsy') || t.includes('naviscan') || t.includes('apos')) return 'Software Suite';
  if (t.includes('gnss') || t.includes('gps') || t.includes('position')) return 'Positioning Systems';
  if (t.includes('vessel') || t.includes('ship')) return 'Vessel Operations';
  if (t.includes('safety') || t.includes('hse')) return 'Health & Safety';
  if (t.includes('data')) return 'Data Processing';
  return 'Training Module';
};

// Helper function to get image path for a topic (Optional usage in card)
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
  
  if (imageMap[normalizedTitle]) return imageMap[normalizedTitle];
  if (normalizedTitle.includes('online')) return '/images/topics/onlinelog_autolog.png';
  if (normalizedTitle.includes('helmsman')) return '/images/topics/helmsman_touchpad.png';
  if (normalizedTitle.includes('obs')) return '/images/topics/obs.png';
  if (normalizedTitle.includes('tss')) return '/images/topics/tss440.webp';
  
  return null;
};

export function InfinityGrid({ topics, onEdit }: InfinityGridProps) {
  const { progress, currentUser, viewAsUser } = useTraining();
  
  // Filter out archived topics
  const activeTopics = topics.filter(t => !t.isDeleted);
  const displayUser = viewAsUser || currentUser;

  // Calculate completion percentage for a topic
  const getTopicProgress = (topic: Topic) => {
    if (!topic.subtopics.length) return 0;
    
    const subtopicIds = topic.subtopics.map(s => s.id);
    const topicProgress = progress.filter(p => p.userId === displayUser?.id && subtopicIds.includes(p.subtopicId));
    
    let score = 0;
    topic.subtopics.forEach(st => {
      const p = topicProgress.find(tp => tp.subtopicId === st.id);
      const status = p?.status || 'not_addressed';
      if (status === 'fully_understood') score += 1;
      else if (status === 'good') score += 0.75;
      else if (status === 'basic') score += 0.25;
    });
    
    return (score / topic.subtopics.length) * 100;
  };

  const getTopicState = (pct: number) => {
    if (pct >= 100) return 'completed';
    if (pct > 0) return 'in-progress';
    return 'not-started';
  };

  return (
    <div className="w-full relative px-4 pb-20 pt-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {activeTopics.map((topic) => {
           const pct = getTopicProgress(topic);
           const state = getTopicState(pct);
           const descriptor = getTopicDescriptor(topic.title);
           
           // Icon Logic - Default is Neutral/Blue
           const getCustomIcon = (title: string, defaultIcon: string) => {
             const t = title.toLowerCase();
             // Base colors
             let baseColor = 'text-blue-600';
             let baseBg = 'bg-blue-50';

             if (t.includes('safety')) { baseColor = 'text-red-500'; baseBg = 'bg-red-50'; }
             else if (t.includes('navigation')) { baseColor = 'text-cyan-500'; baseBg = 'bg-cyan-50'; }
             else if (t.includes('equipment')) { baseColor = 'text-amber-500'; baseBg = 'bg-amber-50'; }
             
             // Intensity Logic based on State
             // Status only affects border/badge, not icon color anymore
             
             // Always return full color
             return { 
                icon: (LucideIcons as any)[defaultIcon] || LucideIcons.HelpCircle, 
                color: baseColor, 
                bg: baseBg 
             };
           };

           const { icon: IconComponent, color: iconColorClass, bg: iconBgClass } = getCustomIcon(topic.title, topic.icon);

           return (
             <div key={topic.id} className="relative group">
               <Link href={`/topic/${topic.id}`}>
                 <div className={cn(
                   "h-full relative bg-white rounded-2xl transition-all duration-300 p-6 flex flex-col gap-5 cursor-pointer overflow-hidden group-hover:-translate-y-1",
                   // Gradient Overlay
                   "bg-gradient-to-b from-white to-gray-50/30",
                   // Border logic
                   state === 'completed' ? "border border-[#7acc00] ring-1 ring-[#7acc00]" : 
                   state === 'in-progress' ? "border border-blue-200 ring-4 ring-blue-50/50" : 
                   "border border-gray-200"
                 )}>
                   
                    {/* Header: Icon & Status Badge */}
                    <div className="flex justify-between items-start">
                      <div className={cn("p-3 rounded-xl transition-all duration-300", iconBgClass)}>
                        <IconComponent className={cn("w-6 h-6", iconColorClass)} />
                      </div>
                      
                      {/* Status Badges */}
                      {state === 'completed' && (
                        <div className="flex items-center gap-1.5 bg-[#7acc00]/10 text-[#7acc00] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </div>
                      )}
                      
                      {state === 'in-progress' && (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In Progress</span>
                        </div>
                      )}
                      
                      {state === 'not-started' && (
                         <div className="flex items-center gap-1.5 text-gray-400 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-gray-200">
                           <Circle className="w-3.5 h-3.5" />
                         </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1 mb-2">
                      <h3 className={cn(
                        "text-xl font-bold leading-tight transition-colors text-black group-hover:text-blue-700"
                      )}>
                        {topic.title}
                      </h3>
                      <p className="text-sm text-gray-900 font-semibold">
                        {descriptor}
                      </p>
                    </div>

                    {/* Footer: Intensity Bar (Optional subtle hint instead of progress bar) */}
                    <div className="mt-auto pt-2">
                       {state === 'in-progress' && (
                         <p className="text-xs font-bold text-blue-900">
                           {Math.round(pct)}% Complete
                         </p>
                       )}
                       {state === 'not-started' && (
                         <p className="text-xs font-bold text-black group-hover:underline transition-all">
                           Tap to start
                         </p>
                       )}
                       {state === 'completed' && (
                         <p className="text-xs font-bold text-[#5c9900]">
                           Mastered
                         </p>
                       )}
                    </div>

                    {/* Hover Arrow Effect */}
                    <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                 </div>
               </Link>

               {/* Edit Button */}
               {onEdit && (
                 <button
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     onEdit(topic);
                   }}
                   className="absolute top-2 right-2 z-20 p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-gray-100"
                   title="Edit Module"
                 >
                   <Edit className="w-4 h-4" />
                 </button>
               )}
             </div>
           );
         })}
      </div>
    </div>
  );
}
