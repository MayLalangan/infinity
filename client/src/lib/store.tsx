import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'admin' | 'employee';
export type ProgressStatus = 'not_addressed' | 'basic' | 'good' | 'fully_understood';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Comment {
  id: string;
  userId: string;
  text?: string;
  imageUrl?: string;
  drawingUrl?: string;
  timestamp: Date;
}

export interface Resource {
  id: string;
  type: 'video' | 'document' | 'text';
  title: string;
  url?: string;
  content?: string;
}

export interface Subtopic {
  id: string;
  title: string;
  resources: string;
  resourceLinks?: Resource[];
  comments: Comment[];
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  subtopics: Subtopic[];
  isDeleted?: boolean;
}

export interface UserProgress {
  userId: string;
  subtopicId: string;
  status: ProgressStatus;
}

interface TrainingContextType {
  currentUser: User | null;
  viewAsUser: User | null;
  users: User[];
  topics: Topic[];
  progress: UserProgress[];
  setCurrentUser: (user: User | null) => void;
  setViewAsUser: (user: User | null) => void;
  updateProgress: (subtopicId: string, status: ProgressStatus) => void;
  addComment: (subtopicId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  addTopic: (topic: Omit<Topic, 'id'>) => void;
  updateTopic: (topic: Topic) => void;
  archiveTopic: (topicId: string) => void;
  restoreTopic: (topicId: string) => void;
  updateSubtopicResources: (topicId: string, subtopicId: string, resources: Resource[]) => void;
  deleteSubtopic: (topicId: string, subtopicId: string) => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'training_current_user',
  VIEW_AS_USER: 'training_view_as_user'
};

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Initialize from sessionStorage on mount
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [viewAsUser, setViewAsUser] = useState<User | null>(() => {
    // Initialize from sessionStorage on mount
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.VIEW_AS_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Persist currentUser to sessionStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.VIEW_AS_USER);
    }
  }, [currentUser]);

  // Persist viewAsUser to sessionStorage whenever it changes
  useEffect(() => {
    if (viewAsUser) {
      sessionStorage.setItem(STORAGE_KEYS.VIEW_AS_USER, JSON.stringify(viewAsUser));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.VIEW_AS_USER);
    }
  }, [viewAsUser]);

  // Load initial data only after user logs in
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch topics
        const topicsRes = await fetch('/api/topics');
        const topicsData = await topicsRes.json();
        setTopics(topicsData);
        
        // If admin, load all users for the directory/admin view
        if (currentUser.role === 'admin') {
          const userIds = new Set<string>(['u1', 'u2', 'u3', 'u4', 'u5', 'u6']);
          topicsData.forEach((topic: Topic) => {
            topic.subtopics.forEach(subtopic => {
              subtopic.comments.forEach(comment => {
                userIds.add(comment.userId);
              });
            });
          });
          
          const userPromises = Array.from(userIds).map(id => 
            fetch(`/api/users/${id}`).then(r => r.ok ? r.json() : null).catch(() => null)
          );
          const usersData = (await Promise.all(userPromises)).filter(u => u !== null);
          setUsers(usersData);
        } else {
          // Non-admin users only see themselves
          setUsers([currentUser]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser]);

  // Load progress when viewing user changes (admin viewing others) or current user changes
  useEffect(() => {
    if (!currentUser) return;
    
    const userToLoad = viewAsUser || currentUser;
    
    const loadData = async () => {
      try {
        const progressRes = await fetch(`/api/progress/${userToLoad.id}`);

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData);
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    };

    loadData();
  }, [currentUser, viewAsUser]);

  const updateProgress = (subtopicId: string, status: ProgressStatus) => {
    const userToUpdate = viewAsUser || currentUser;
    if (!userToUpdate) {
      console.error('No user available for progress update');
      return;
    }
    
    const newProgress: UserProgress = {
      userId: userToUpdate.id,
      subtopicId,
      status
    };

    setProgress(prev => {
      const existing = prev.findIndex(p => p.userId === userToUpdate.id && p.subtopicId === subtopicId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newProgress;
        return updated;
      }
      return [...prev, newProgress];
    });

    // Save to backend
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProgress)
    })
    .then(res => {
      if (!res.ok) {
        console.error('Failed to save progress - HTTP status:', res.status);
        return res.text().then(text => {
          console.error('Response:', text);
          throw new Error('Failed to save progress');
        });
      }
      return res.json();
    })
    .catch(err => {
      alert('Failed to save progress. Please try again.');
    });
  };

  const addComment = (subtopicId: string, commentData: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = {
      ...commentData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setTopics(prevTopics => {
      return prevTopics.map(topic => {
        const subtopicIndex = topic.subtopics.findIndex(st => st.id === subtopicId);
        if (subtopicIndex >= 0) {
          const newSubtopics = [...topic.subtopics];
          newSubtopics[subtopicIndex] = {
            ...newSubtopics[subtopicIndex],
            comments: [...newSubtopics[subtopicIndex].comments, newComment]
          };
          return { ...topic, subtopics: newSubtopics };
        }
        return topic;
      });
    });

    // Save comment to backend
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopicId, comment: newComment })
    }).catch(err => console.error('Failed to save comment:', err));
  };

  const addTopic = (topicData: Omit<Topic, 'id'>) => {
    const newTopic: Topic = { 
      ...topicData, 
      id: Math.random().toString(36).substr(2, 9) 
    };

    setTopics(prev => [...prev, newTopic]);

    // Save to backend
    fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTopic)
    }).catch(err => console.error('Failed to save topic:', err));
  };

  const updateTopic = (updatedTopic: Topic) => {
    setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));

    // Save to backend
    fetch(`/api/topics/${updatedTopic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTopic)
    }).catch(err => console.error('Failed to update topic:', err));
  };

  const archiveTopic = (topicId: string) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, isDeleted: true } : t));

    // Save to backend
    fetch(`/api/topics/${topicId}`, {
      method: 'DELETE'
    }).catch(err => console.error('Failed to archive topic:', err));
  };

  const restoreTopic = (topicId: string) => {
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, isDeleted: false } : t));

    // Save to backend
    fetch(`/api/topics/${topicId}/restore`, {
      method: 'POST'
    }).catch(err => console.error('Failed to restore topic:', err));
  };

  const updateSubtopicResources = (topicId: string, subtopicId: string, resources: Resource[]) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          subtopics: topic.subtopics.map(subtopic => 
            subtopic.id === subtopicId 
              ? { ...subtopic, resourceLinks: resources }
              : subtopic
          )
        };
      }
      return topic;
    }));

    // Save to backend
    const updatedTopic = topics.find(t => t.id === topicId);
    if (updatedTopic) {
      const updated = {
        ...updatedTopic,
        subtopics: updatedTopic.subtopics.map(subtopic => 
          subtopic.id === subtopicId 
            ? { ...subtopic, resourceLinks: resources }
            : subtopic
        )
      };
      fetch(`/api/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(err => console.error('Failed to update subtopic resources:', err));
    }
  };

  const deleteSubtopic = (topicId: string, subtopicId: string) => {
    setTopics(prev => prev.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          subtopics: topic.subtopics.filter(subtopic => subtopic.id !== subtopicId)
        };
      }
      return topic;
    }));

    // Save to backend
    const updatedTopic = topics.find(t => t.id === topicId);
    if (updatedTopic) {
      const updated = {
        ...updatedTopic,
        subtopics: updatedTopic.subtopics.filter(subtopic => subtopic.id !== subtopicId)
      };
      fetch(`/api/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(err => console.error('Failed to delete subtopic:', err));
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <TrainingContext.Provider value={{ 
      currentUser, viewAsUser, users, topics, progress, 
      setCurrentUser, setViewAsUser, updateProgress, addComment, addTopic, updateTopic,
      archiveTopic, restoreTopic, updateSubtopicResources, deleteSubtopic
    }}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) throw new Error('useTraining must be used within a TrainingProvider');
  return context;
}
