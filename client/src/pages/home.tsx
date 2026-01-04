import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { InfinityGrid } from '@/components/infinity-grid';
import { useTraining, Topic, Subtopic } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as LucideIcons from 'lucide-react';

// Helper to get list of icon names
const ICON_NAMES = Object.keys(LucideIcons).filter(key => isNaN(Number(key)) && key !== 'createLucideIcon');

export default function Home() {
  const { topics, currentUser, addTopic, updateTopic } = useTraining();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Change text under modules to black by using custom styling
  const moduleTextStyle = { color: 'black' };

  // Form state for Module
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('HelpCircle');
  const [subtopicsInput, setSubtopicsInput] = useState(''); // Simple comma/newline separated for prototype

  const handleOpenDialog = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setTitle(topic.title);
      setIcon(topic.icon);
      // setSubtopicsInput(topic.subtopics.map(s => s.title).join('\n')); // Removed
    } else {
      setEditingTopic(null);
      setTitle('');
      setIcon('HelpCircle');
      // setSubtopicsInput(''); // Removed
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    // No longer handling subtopics here
    const subtopics: Subtopic[] = editingTopic ? editingTopic.subtopics : [];

    if (editingTopic) {
      updateTopic({
        ...editingTopic,
        title,
        icon,
        // Keep existing subtopics
        subtopics: editingTopic.subtopics
      });
    } else {
      addTopic({
        title,
        icon,
        subtopics: [] // New topics start with no subtopics
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center gap-8 w-full">
        <div className="text-center space-y-4 max-w-2xl mx-auto mt-8 relative w-full">
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-white">
            Training Modules
          </h1>
          <div className="relative">
            <p className="text-lg text-white">
              Explore the training hub. Select any module to expand your knowledge.
            </p>
            {currentUser?.role === 'admin' && (
              <div className="absolute top-0 left-full ml-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="shadow-lg bg-[#006400] hover:bg-[#7acc00] text-white gap-2 px-4 whitespace-nowrap" 
                      onClick={() => handleOpenDialog()}
                      title="Add New Module"
                    >
                      <Plus className="h-5 w-5" />
                      Add Module
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white text-black border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-black">{editingTopic ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right text-black">Title</Label>
                        <Input 
                          id="title" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          className="col-span-3 bg-white text-black border-gray-200" 
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="icon" className="text-right text-black">Icon</Label>
                        <Select value={icon} onValueChange={setIcon}>
                          <SelectTrigger className="col-span-3 bg-white text-black border-gray-200">
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                          <SelectContent className="h-64 bg-white text-black border-gray-200">
                             {[
                               // Hydrographic & Surveying Related
                               'Anchor', 'Ship', 'Navigation', 'Compass', 'Map', 'MapPin', 'Globe', 'Waves', 'Wind', 'CloudRain', 
                               'Droplets', 'Fish', 'Target', 'Crosshair', 'Radar', 'Scan', 'Sonar', 'Search', 'Locate', 'Satellite',
                               'Radio', 'Signal', 'Wifi', 'Server', 'Database', 'HardDrive', 'Cpu', 'Activity', 'BarChart', 'BarChart2',
                               'LineChart', 'PieChart', 'TrendingUp', 'Ruler', 'Triangle', 'Square', 'Circle', 'Hexagon', 'Layers', 'Box',
                               'Package', 'Container', 'Truck', 'Sailboat', 'Thermometer', 'Sun', 'Moon', 'Sunrise', 'Sunset', 'Eye',
                               
                               // General Professional
                               'Briefcase', 'Building', 'Building2', 'Users', 'UserCheck', 'UserPlus', 'UserCog', 'User', 'File', 'FileText',
                               'FileCheck', 'FilePlus', 'Folder', 'FolderOpen', 'FolderPlus', 'Clipboard', 'ClipboardCheck', 'ClipboardList',
                               'CheckSquare', 'List', 'Layout', 'Grid', 'Table', 'Calendar', 'Clock', 'Timer', 'Watch', 'AlarmClock',
                               'Mail', 'MessageSquare', 'MessageCircle', 'Phone', 'Smartphone', 'Monitor', 'Laptop', 'Tablet', 'Printer',
                               'Settings', 'Sliders', 'Filter', 'Search', 'ZoomIn', 'ZoomOut', 'HelpCircle', 'Info', 'AlertCircle', 'AlertTriangle',
                               'Shield', 'ShieldCheck', 'Lock', 'Unlock', 'Key', 'CreditCard', 'DollarSign', 'Euro', 'Pound', 'Bitcoin',
                               'Award', 'Medal', 'Star', 'Heart', 'ThumbsUp', 'ThumbsDown', 'Zap', 'Power', 'Battery', 'Plug'
                             ].map(name => (
                               <SelectItem key={name} value={name} className="text-black hover:bg-gray-100 focus:bg-gray-100">
                                 <div className="flex items-center gap-2">
                                   {/* Render icon preview if possible, otherwise just name */}
                                   {name}
                                 </div>
                               </SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button onClick={handleSubmit} className="bg-black text-white hover:bg-[#7acc00]">Save Module</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        <div className="w-full py-8 relative">
          <InfinityGrid topics={topics} onEdit={currentUser?.role === 'admin' ? handleOpenDialog : undefined} />
        </div>
      </div>
    </Layout>
  );
}
