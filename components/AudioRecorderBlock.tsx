
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

interface AudioRecorderBlockProps {
  onTranscribe: (text: string) => void;
}

export const AudioRecorderBlock: React.FC<AudioRecorderBlockProps> = ({ onTranscribe }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    
    // Check for previously persisted permission
    // Note: getUserMedia triggers the browser prompt. If the browser remembers the permission (HTTPS),
    // it resolves immediately. We mirror this status in localStorage as requested.
    const storedPermission = localStorage.getItem('cortex_mic_permission');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Persist the 'Allow' decision if not already saved
      if (storedPermission !== 'granted') {
        localStorage.setItem('cortex_mic_permission', 'granted');
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Default for Chrome/Firefox
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());

        setIsRecording(false);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        handleTranscription(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      // If the user denies, we could optionally store 'denied', but typically we want to let them try again.
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    // Convert Blob to Base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Data = reader.result?.toString().split(',')[1];
      if (base64Data) {
        const transcript = await transcribeAudio(base64Data, audioBlob.type || 'audio/webm');
        onTranscribe(transcript);
      } else {
        setError("Failed to process audio data.");
      }
      setIsTranscribing(false);
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="my-4 p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between select-none">
      <div className="flex items-center gap-4">
        {isTranscribing ? (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : isRecording ? (
          <button 
            onClick={stopRecording}
            className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors animate-pulse"
          >
            <Square size={18} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={startRecording}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-md"
          >
            <Mic size={20} />
          </button>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">
            {isTranscribing ? "Transcribing Audio..." : isRecording ? "Recording..." : "Transcribe Audio"}
          </span>
          <span className="text-xs text-slate-500">
            {isTranscribing 
              ? "Cortexia is processing your notes" 
              : isRecording 
                ? formatTime(duration)
                : "Click microphone to start"}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs px-3 py-1 bg-red-50 rounded border border-red-100">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};
