
import React, { useRef, useEffect, useState } from 'react';
import { Stroke, StrokePoint, PatternType } from '../types';
import { Trash2, Pen, Undo, Eraser } from 'lucide-react';

interface DigitalInkCanvasProps {
  height?: number;
  backgroundPattern?: PatternType;
}

export const DigitalInkCanvas: React.FC<DigitalInkCanvasProps> = ({ 
  height = 400, 
  backgroundPattern = 'none' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // We use Refs for the rendering data to avoid React re-renders during the critical drawing path (pointermove)
  // This is essential for sub-16ms latency.
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  
  // We still keep state to trigger React updates when a stroke finishes (for Undo/Redo UI updates)
  const [version, setVersion] = useState(0); 

  // Tools
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#1e293b'); // Slate-800
  const [lineWidth, setLineWidth] = useState(2);

  // Helper: Draw a single stroke using Quadratic Bezier curves for smoothing
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) {
        // Draw a dot if it's just a single point
        if (stroke.points.length === 1) {
             ctx.fillStyle = stroke.color;
             ctx.beginPath();
             ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
             ctx.fill();
        }
        return;
    }

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;

    // Move to start
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    // Smooth Curve Algorithm (Midpoint/McMaster method)
    // We use the points as control points for quadratic curves between midpoints
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p0 = stroke.points[i];
      const p1 = stroke.points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      // Curve from previous midpoint (or start) to this midpoint, using p0 as control
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    
    // Connect to the very last point
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 'desynchronized: true' bypasses the compositor for lower latency on supported devices
    const ctx = canvas.getContext('2d', { desynchronized: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw committed strokes
    strokesRef.current.forEach(s => drawStroke(ctx, s));

    // Draw active stroke (live ink)
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current);
    }
  };

  // Optimized Render Loop
  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      redrawCanvas();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Empty dependency array: loop runs independently of React state

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Setting dimensions clears canvas, so we need the loop to redraw
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  // Coordinate helper
  const getPoint = (clientX: number, clientY: number, pressure: number): StrokePoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      p: pressure
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === 'eraser') return; // Eraser placeholder
    
    const point = getPoint(e.clientX, e.clientY, e.pressure || 0.5);
    currentStrokeRef.current = {
      points: [point],
      color: color,
      width: lineWidth
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!currentStrokeRef.current) return;
    
    // Use getCoalescedEvents if available to capture points between frames for smoother curves
    const events = e.nativeEvent.getCoalescedEvents 
      ? e.nativeEvent.getCoalescedEvents() 
      : [e.nativeEvent];
      
    const newPoints = events.map(ev => getPoint(ev.clientX, ev.clientY, ev.pressure || 0.5));
    
    currentStrokeRef.current.points.push(...newPoints);
    // No setState here - we rely on the rAF loop to draw the new points from the ref
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (currentStrokeRef.current) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
      setVersion(v => v + 1); // Trigger React update to save/sync state if needed
    }
  };

  return (
    <div ref={containerRef} className="relative w-full bg-white group select-none" style={{ height }}>
      {/* Background Pattern */}
      <div className={`absolute inset-0 pointer-events-none opacity-50 ${
        backgroundPattern === 'grid' ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]' :
        backgroundPattern === 'lines' ? 'bg-[linear-gradient(transparent_29px,#00000008_30px)] bg-[size:100%_30px]' :
        backgroundPattern === 'dots' ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]' : ''
      }`} />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
      />

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setTool('pen')}
          className={`p-1.5 rounded-full transition-colors ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Pen size={14} />
        </button>
        
        {/* Color Picker */}
        <div className="flex gap-1 border-l border-slate-100 pl-4">
           {['#1e293b', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
             <button
               key={c}
               onClick={() => { setColor(c); setTool('pen'); }}
               className={`w-4 h-4 rounded-full border border-slate-200 ${color === c && tool === 'pen' ? 'ring-2 ring-offset-1 ring-slate-300' : ''}`}
               style={{ backgroundColor: c }}
             />
           ))}
        </div>

        <div className="w-px h-4 bg-slate-200 mx-1"></div>

        <button 
          onClick={() => {
             strokesRef.current.pop();
             setVersion(v => v + 1);
          }}
          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          title="Undo"
        >
          <Undo size={14} />
        </button>

        <button 
          onClick={() => {
            strokesRef.current = [];
            setVersion(v => v + 1);
          }}
          className="p-1.5 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Clear All"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
