import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTraining, type User } from '@/lib/store';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu,
  Infinity,
  Check,
  Upload,
  Camera,
  TrendingUp,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, viewAsUser, setCurrentUser, setViewAsUser, users } = useTraining();
  const [location, setLocation] = useLocation();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    setCurrentUser(null);
    setViewAsUser(null);
    setLocation('/login');
  };

  const handleViewAsUser = (user: User) => {
    if (currentUser?.role !== 'admin') return;
    setViewAsUser(user.id === currentUser.id ? null : user);
  };
  
  const handleAvatarClick = () => {
    if (!viewAsUser) {
      setIsUploadDialogOpen(true);
      setPreviewUrl(null);
      setSelectedFile(null);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions."
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload file
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const { url } = await uploadRes.json();

      // Update user profile
      const updateRes = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url })
      });

      if (!updateRes.ok) throw new Error('Failed to update profile');

      const updatedUser = await updateRes.json();
      setCurrentUser(updatedUser);
      setIsUploadDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile picture. Please try again."
      });
    } finally {
      setIsUploading(false);
      stopCamera();
    }
  };

  // Clean up camera on unmount or dialog close
  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!currentUser) return null;
  
  const displayUser = viewAsUser || currentUser;

  return (
    <div className="min-h-screen bg-white font-sans text-foreground flex flex-col" style={{ 
      backgroundImage: 'url(/images/background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b shadow-sm" style={{ background: 'linear-gradient(to right, #001f3f, #005A9E)' }}>
        <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left Side - Company Logo */}
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Company Logo" className="h-10 object-contain" />
          </div>

          {/* Center Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className={cn("transition-colors", location === '/' ? "text-white font-semibold" : "text-white/70 hover:text-[#7acc00]")}>
              Training Modules
            </Link>
            <Link href="/progress" className={cn("transition-colors", location === '/progress' ? "text-white font-semibold" : "text-white/70 hover:text-[#7acc00]")}>
              Progress Overview
            </Link>
            {currentUser.role === 'admin' && (
              <Link href="/admin" className={cn("transition-colors", location === '/admin' ? "text-white font-semibold" : "text-white/70 hover:text-[#7acc00]")}>
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Side - User Profile and Action Buttons */}
          <div className="flex items-center gap-2">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img 
                  src={displayUser.avatar} 
                  alt={displayUser.name} 
                  className={cn(
                    "h-10 w-10 rounded-full ring-2 ring-primary/20",
                    !viewAsUser && "cursor-pointer hover:ring-4 hover:ring-[#7acc00] transition-all"
                  )}
                  onClick={handleAvatarClick}
                />
                {!viewAsUser && (
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <p className="font-medium leading-none text-sm text-white">
                  {displayUser.name}
                  {viewAsUser && <span className="text-xs text-white/80 ml-2">(viewing)</span>}
                </p>
                <p className="text-xs text-white/80 capitalize">{displayUser.role}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/20 mx-1" />
            {currentUser.role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="View as User">
                    <Users className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>View as User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {users.map(user => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => handleViewAsUser(user)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full" />
                        <span>{user.name}</span>
                      </div>
                      {(viewAsUser?.id === user.id || (!viewAsUser && user.id === currentUser.id)) && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link href="/" className="text-lg font-medium hover:text-secondary">
                      Training Modules
                    </Link>
                    <Link href="/progress" className="text-lg font-medium hover:text-secondary">
                      Progress Overview
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link href="/admin" className="text-lg font-medium hover:text-secondary">
                        Admin Panel
                      </Link>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 md:px-6">
        {children}
      </main>

      {/* Profile Picture Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) stopCamera();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Choose a new profile picture or take a photo.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" onClick={stopCamera}>Upload File</TabsTrigger>
              <TabsTrigger value="camera" onClick={startCamera}>Camera</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-32 w-32 rounded-full object-cover" />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-medium">Click to select file</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG or WebP</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                />
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-4">
                {previewUrl ? (
                   <div className="relative">
                     <img src={previewUrl} alt="Preview" className="h-48 w-48 rounded-lg object-cover" />
                     <Button 
                       variant="secondary" 
                       size="icon" 
                       className="absolute top-2 right-2 h-8 w-8 rounded-full"
                       onClick={() => {
                         setPreviewUrl(null);
                         setSelectedFile(null);
                         startCamera();
                       }}
                       title="Retake photo"
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video w-full max-w-sm flex items-center justify-center">
                     <video 
                       ref={videoRef} 
                       autoPlay 
                       playsInline 
                       muted
                       className="w-full h-full object-cover"
                     />
                     {!isCameraActive && (
                       <Button onClick={startCamera} variant="secondary">
                         Start Camera
                       </Button>
                     )}
                     <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}
                
                {isCameraActive && !previewUrl && (
                  <Button onClick={capturePhoto} className="gap-2">
                    <Camera className="h-4 w-4" /> Capture
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
