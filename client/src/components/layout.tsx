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
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  HelpCircle
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
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(/images/background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b shadow-sm" style={{ background: 'linear-gradient(to right, #001f3f, #005A9E)' }}>
        <div className="w-full flex h-20 items-center justify-between px-4 md:px-6">
          {/* Left Side - Company Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all group">
            <img src="/images/logo.png" alt="Company Logo" className="h-10 object-contain group-hover:rotate-3 transition-transform duration-300" />

          </Link>

          {/* Center Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-12 absolute left-1/2 transform -translate-x-1/2 font-sans text-sm">
            <Link href="/" className={cn(
              "relative group py-3 px-4 flex items-center transition-colors",
              location === '/' ? "text-white font-bold" : "text-white/80 font-medium hover:text-white"
            )}>
              <span>Training Modules</span>
              <span className={cn(
                "absolute -bottom-1 left-0 w-full h-[2px] bg-[#7acc00] transform transition-transform duration-300 origin-left",
                location === '/' ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )} />
            </Link>
            
            <Link href="/progress" className={cn(
              "relative group py-3 px-4 flex items-center transition-colors",
              location === '/progress' ? "text-white font-bold" : "text-white/80 font-medium hover:text-white"
            )}>
              <span>Progress Overview</span>
              <span className={cn(
                "absolute -bottom-1 left-0 w-full h-[2px] bg-[#7acc00] transform transition-transform duration-300 origin-left",
                location === '/progress' ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )} />
            </Link>

            {currentUser.role === 'admin' && (
              <Link href="/admin" className={cn(
                "relative group py-3 px-4 flex items-center transition-colors",
                location === '/admin' ? "text-white font-bold" : "text-white/80 font-medium hover:text-white"
              )}>
                <span>Admin Panel</span>
                <span className={cn(
                  "absolute -bottom-1 left-0 w-full h-[2px] bg-[#7acc00] transform transition-transform duration-300 origin-left",
                  location === '/admin' ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )} />
              </Link>
            )}
          </nav>

          {/* Right Side - User Profile and Action Buttons */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-2 h-auto py-1 hover:bg-white/10 text-white data-[state=open]:bg-white/10 border-0 focus:ring-0">
                   <div className="relative h-9 w-9">
                      <img 
                        src={displayUser.avatar} 
                        alt={displayUser.name} 
                        className={cn(
                          "h-9 w-9 rounded-full ring-2 ring-white/20 transition-all object-cover",
                          viewAsUser && "ring-amber-400"
                        )}
                      />
                      {viewAsUser && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5 border-2 border-[#005A9E]">
                          <Users className="h-2 w-2 text-black" />
                        </div>
                      )}
                   </div>
                   
                   <div className="hidden md:flex flex-col items-start gap-0.5">
                     <span className="text-sm font-semibold leading-none">{displayUser.name}</span>
                     <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">{displayUser.role}</span>
                   </div>
                   
                   <ChevronDown className="h-4 w-4 text-white/50 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{displayUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleAvatarClick} className="gap-2 cursor-pointer">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span>Update Photo</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="gap-2 cursor-pointer">
                   <Settings className="h-4 w-4 text-muted-foreground" />
                   <span>Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="gap-2 cursor-pointer">
                   <HelpCircle className="h-4 w-4 text-muted-foreground" />
                   <span>Help & Support</span>
                </DropdownMenuItem>

                {currentUser.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Admin Controls</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>View As User</span>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="left" className="w-56 p-2">
                          {users.map(user => (
                            <DropdownMenuItem
                              key={user.id}
                              onClick={() => handleViewAsUser(user)}
                              className="gap-2 cursor-pointer"
                            >
                              <img src={user.avatar} className="h-5 w-5 rounded-full" />
                              <span className="flex-1 truncate">{user.name}</span>
                              {(viewAsUser?.id === user.id || (!viewAsUser && user.id === currentUser.id)) && (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <nav className="flex flex-col gap-2 mt-8">
                    <Link href="/" className={cn(
                      "text-lg py-2 transition-all",
                      location === '/' 
                        ? "font-bold text-blue-900 pl-3 border-l-4 border-[#7acc00]" 
                        : "font-medium text-gray-600 hover:text-blue-600 pl-4"
                    )}>
                      Training Modules
                    </Link>
                    <Link href="/progress" className={cn(
                      "text-lg py-2 transition-all",
                      location === '/progress' 
                        ? "font-bold text-blue-900 pl-3 border-l-4 border-[#7acc00]" 
                        : "font-medium text-gray-600 hover:text-blue-600 pl-4"
                    )}>
                      Progress Overview
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link href="/admin" className={cn(
                        "text-lg py-2 transition-all",
                        location === '/admin' 
                          ? "font-bold text-blue-900 pl-3 border-l-4 border-[#7acc00]" 
                          : "font-medium text-gray-600 hover:text-blue-600 pl-4"
                      )}>
                        Admin Panel
                      </Link>
                    )}
                    <div className="h-px bg-gray-100 my-4" />
                    <button onClick={handleLogout} className="text-lg font-medium text-red-600 hover:text-red-700 text-left pl-4">
                      Log Out
                    </button>
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
