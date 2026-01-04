import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Save, Image as ImageIcon, Maximize2, Minimize2, Paperclip, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface DrawingImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingStroke {
  id: string;
  type: 'arrow' | 'marker' | 'square';
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness?: number;
  points?: Array<{x: number, y: number}>;
}

interface NotepadProps {
  title: string;
  content?: string;
  onClose: () => void;
  mode: 'read' | 'write';
  onSubmit?: (text: string, file?: File) => void;
}

export function Notepad({ title, content, onClose, mode, onSubmit }: NotepadProps) {
  const [text, setText] = React.useState('');
  const [images, setImages] = useState<DrawingImage[]>([]);
  const [drawings, setDrawings] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'arrow' | 'marker' | 'square' | null>(null);
  const [drawColor, setDrawColor] = useState('black');
  const [drawThickness, setDrawThickness] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [showDrawing, setShowDrawing] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const markerPointsRef = useRef<Array<{x: number, y: number}>>([]);

  // Auto-save to localStorage
  useEffect(() => {
    const saveData = { text, drawings, images };
    localStorage.setItem(`notepad_${title}`, JSON.stringify(saveData));
  }, [text, drawings, images, title]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`notepad_${title}`);
    if (saved) {
      try {
        const { text: savedText, drawings: savedDrawings, images: savedImages } = JSON.parse(saved);
        setText(savedText);
        setDrawings(savedDrawings);
        setImages(savedImages);
      } catch (e) {
        console.log('Could not load saved data');
      }
    }
  }, [title]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newImage: DrawingImage = {
            id: Math.random().toString(36).substr(2, 9),
            src: event.target?.result as string,
            x: 10,
            y: 10,
            width: 120,
            height: 120,
          };
          setImages([...images, newImage]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const redrawCanvas = (additionalStroke?: Partial<DrawingStroke>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    
    drawings.forEach(stroke => {
      drawStrokeOnCanvas(ctx, stroke);
    });

    if (additionalStroke) {
      drawStrokeOnCanvas(ctx, additionalStroke as DrawingStroke);
    }
    
    ctx.restore();
  };

  const drawStrokeOnCanvas = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke | Partial<DrawingStroke>) => {
    if (!stroke.startX || stroke.startY === undefined || !stroke.endX || stroke.endY === undefined) return;

    ctx.strokeStyle = stroke.color || 'black';
    ctx.lineWidth = (stroke.thickness || 2) / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'marker' && stroke.points) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (stroke.type === 'arrow') {
      drawArrow(ctx, stroke.startX, stroke.startY, stroke.endX, stroke.endY, stroke.thickness || 2);
    } else if (stroke.type === 'square') {
      const width = stroke.endX - stroke.startX;
      const height = stroke.endY - stroke.startY;
      ctx.strokeRect(stroke.startX, stroke.startY, width, height);
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, thickness: number) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawMode || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (drawMode === 'marker') {
      markerPointsRef.current = [{x, y}];
      setIsDrawing(true);
    } else {
      startPointRef.current = { x, y };
      setIsDrawing(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (drawMode === 'marker') {
      markerPointsRef.current.push({x, y});
      redrawCanvas({
        type: 'marker',
        color: drawColor,
        startX: markerPointsRef.current[0].x,
        startY: markerPointsRef.current[0].y,
        endX: x,
        endY: y,
        thickness: drawThickness,
        points: markerPointsRef.current,
      });
    } else {
      redrawCanvas({
        type: drawMode,
        color: drawColor,
        startX: startPointRef.current.x,
        startY: startPointRef.current.y,
        endX: x,
        endY: y,
        thickness: drawThickness,
        points: startPointRef.current,
      });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (drawMode === 'marker' && markerPointsRef.current.length > 2) {
      const newStroke: DrawingStroke = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'marker',
        color: drawColor,
        startX: markerPointsRef.current[0].x,
        startY: markerPointsRef.current[0].y,
        endX: markerPointsRef.current[markerPointsRef.current.length - 1].x,
        endY: markerPointsRef.current[markerPointsRef.current.length - 1].y,
        thickness: drawThickness,
        points: markerPointsRef.current,
      };
      setDrawings([...drawings, newStroke]);
      markerPointsRef.current = [];
    } else if ((drawMode === 'arrow' || drawMode === 'square') && (Math.abs(x - startPointRef.current.x) > 3 || Math.abs(y - startPointRef.current.y) > 3)) {
      const newStroke: DrawingStroke = {
        id: Math.random().toString(36).substr(2, 9),
        type: drawMode,
        color: drawColor,
        startX: startPointRef.current.x,
        startY: startPointRef.current.y,
        endX: x,
        endY: y,
        thickness: drawThickness,
        points: startPointRef.current,
      };
      setDrawings([...drawings, newStroke]);
    }

    setIsDrawing(false);
    redrawCanvas();
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const newZoom = e.deltaY > 0 ? Math.max(0.5, zoom - 0.1) : Math.min(2, zoom + 0.1);
    setZoom(newZoom);
  };

  const handleImageMouseDown = (e: React.MouseEvent<HTMLImageElement>, imageId: string) => {
    e.preventDefault();
    setDraggedImageId(imageId);
    const img = images.find(i => i.id === imageId);
    if (img && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - img.x,
        y: e.clientY - rect.top - img.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedImageId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      setImages(images.map(img => 
        img.id === draggedImageId 
          ? { ...img, x: Math.max(0, Math.min(newX, rect.width - img.width)), y: Math.max(0, Math.min(newY, rect.height - img.height)) }
          : img
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggedImageId(null);
  };

  const handleSubmit = () => {
    if (onSubmit && (text.trim() || attachment)) {
      onSubmit(text, attachment || undefined);
      setText('');
      setImages([]);
      setDrawings([]);
      setAttachment(null);
      localStorage.removeItem(`notepad_${title}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col">
        
        {/* Header Tape Effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/80 rotate-[-2deg] shadow-sm z-10 border border-yellow-200/50" />

        {/* Notepad Header */}
        <div className="bg-red-100/50 p-4 border-b border-red-200 flex justify-between items-center">
          <h2 className="font-hand text-2xl font-bold text-red-900/80">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-200/50 rounded-full">
            <X className="w-6 h-6 text-red-800" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-6 notepad-paper" ref={contentRef}>
          {mode === 'read' ? (
            <div className="prose prose-sm max-w-none font-hand">
              {content?.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('#') ? "font-bold text-base text-primary" : "text-black"}>
                  {line.replace('#', '')}
                </p>
              ))}
            </div>
          ) : (
            <>
              {/* TEXT SECTION - Always visible */}
              <div className="flex-1 flex flex-col">
                <Textarea 
                  placeholder="Type your notes, observations, and reflections..." 
                  className="flex-1 bg-transparent border-none shadow-none resize-none focus-visible:ring-0 p-0 text-lg font-hand leading-loose placeholder:text-slate-400 text-black"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              
              {/* Attachment Preview */}
              {attachment && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded mt-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700 truncate">{attachment.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setAttachment(null)} className="h-6 w-6 ml-auto">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* DRAWING SECTION - Collapsible */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setShowDrawing(!showDrawing)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                  >
                    {showDrawing ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    {showDrawing ? 'Hide' : 'Show'} Drawing Tools
                  </button>
                </div>

                {showDrawing && (
                  <div className="space-y-3">
                    {/* Canvas */}
                    <div className="relative bg-white border border-dashed border-slate-300 rounded overflow-hidden" style={{ height: '280px', width: '100%' }}>
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={280}
                        className="w-full h-full block"
                        style={{
                          cursor: drawMode === 'marker' ? 'crosshair' : drawMode ? 'crosshair' : 'default',
                        }}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        onWheel={handleCanvasWheel}
                      />
                      {/* Images on canvas */}
                      {images.map(img => (
                        <img
                          key={img.id}
                          src={img.src}
                          alt="Note"
                          className="absolute cursor-move z-10"
                          style={{
                            left: `${img.x * zoom}px`,
                            top: `${img.y * zoom}px`,
                            width: `${img.width * zoom}px`,
                            height: `${img.height * zoom}px`,
                            border: draggedImageId === img.id ? '2px solid #49A7FF' : '1px solid #CBD5E1',
                          }}
                          onMouseDown={(e) => handleImageMouseDown(e, img.id)}
                        />
                      ))}
                    </div>

                    {/* Drawing Tools */}
                    <div className="flex flex-wrap gap-2 items-center border-t border-slate-200 pt-3">
                      <select
                        value={drawMode || ''}
                        onChange={(e) => setDrawMode(e.target.value as any || null)}
                        className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                      >
                        <option value="">Draw Tool</option>
                        <option value="arrow">Arrow</option>
                        <option value="marker">Marker</option>
                        <option value="square">Square</option>
                      </select>

                      {drawMode && (
                        <>
                          <select
                            value={drawColor}
                            onChange={(e) => setDrawColor(e.target.value)}
                            className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                          >
                            {drawMode === 'arrow' && (
                              <>
                                <option value="black">Black</option>
                                <option value="red">Red</option>
                              </>
                            )}
                            {drawMode === 'marker' && (
                              <>
                                <option value="green">Green</option>
                                <option value="blue">Blue</option>
                                <option value="yellow">Yellow</option>
                                <option value="red">Red</option>
                                <option value="#ff69b4">Pink</option>
                                <option value="orange">Orange</option>
                              </>
                            )}
                            {drawMode === 'square' && (
                              <>
                                <option value="black">Black</option>
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                              </>
                            )}
                          </select>

                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={drawThickness}
                            onChange={(e) => setDrawThickness(parseInt(e.target.value))}
                            className="w-20"
                            title="Thickness"
                          />
                          <span className="text-xs text-slate-500">{drawThickness}px</span>
                        </>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 text-xs" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="w-3 h-3" /> Add Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <span className="text-xs text-slate-500 border-l border-slate-200 pl-2 ml-2">{Math.round(zoom * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {mode === 'write' && (
          <div className="bg-red-50/30 border-t border-red-200 p-4 flex justify-end gap-2">
            {/* Attachment Button */}
            <input 
              type="file" 
              ref={attachmentInputRef} 
              className="hidden" 
              onChange={(e) => setAttachment(e.target.files?.[0] || null)} 
            />
            <Button variant="ghost" size="sm" onClick={() => attachmentInputRef.current?.click()}>
              <Paperclip className="w-4 h-4 mr-2" /> {attachment ? "Replace File" : "Attach File"}
            </Button>
            
            <div className="flex-1"></div>

            <Button variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="gap-2 bg-black text-white hover:bg-[#7acc00] text-xs">
              <Save className="w-4 h-4" /> Save Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
