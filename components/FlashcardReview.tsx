import React, { useState } from 'react';
import { Flashcard } from '../types';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  onUpdateCard: (id: string, quality: number) => void; // quality 0-5
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ flashcards, onUpdateCard }) => {
  // Filter for cards due today (mock logic: simply showing all for demo)
  const dueCards = flashcards;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 mt-20">
        <CheckCircle size={64} className="text-green-400 mb-4" />
        <h2 className="text-2xl font-semibold text-slate-700">All caught up!</h2>
        <p>You have no cards due for review today.</p>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  const handleGrade = (quality: number) => {
    onUpdateCard(currentCard.id, quality);
    setIsFlipped(false);
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete logic could go here
      alert("Review session complete!");
      setCurrentIndex(0); // Loop for demo
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 px-6">
      <div className="mb-6 flex justify-between items-center text-slate-500 text-sm">
        <span>Deck: Medical Anatomy</span>
        <span>{currentIndex + 1} / {dueCards.length}</span>
      </div>

      <div 
        className="relative min-h-[400px] cursor-pointer perspective-1000 group"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`relative w-full h-full duration-500 preserve-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT */}
          {!isFlipped && (
            <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-xl p-8 flex flex-col items-center justify-center text-center">
               <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Question</div>
               <h3 className="text-2xl font-medium text-slate-800 leading-relaxed">
                 {currentCard.front}
               </h3>
               <p className="absolute bottom-6 text-xs text-slate-400">Click to reveal answer</p>
            </div>
          )}

          {/* BACK */}
          {isFlipped && (
             <div className="absolute inset-0 backface-hidden bg-slate-50 border border-blue-100 shadow-lg rounded-xl p-8 flex flex-col items-center justify-center text-center">
               <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4">Answer</div>
               <div className="text-lg text-slate-700 leading-relaxed prose prose-sm">
                 {currentCard.back}
               </div>
             </div>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      {isFlipped && (
        <div className="flex justify-center gap-4 mt-8 animate-in slide-in-from-bottom-4 duration-300">
          <button onClick={(e) => { e.stopPropagation(); handleGrade(1); }} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-red-50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200">
              <XCircle size={24} />
            </div>
            <span className="text-xs font-semibold text-red-600">Again (1m)</span>
          </button>

          <button onClick={(e) => { e.stopPropagation(); handleGrade(3); }} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-yellow-50 transition-colors group">
             <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center group-hover:bg-yellow-200">
              <Clock size={24} />
            </div>
            <span className="text-xs font-semibold text-yellow-600">Hard (2d)</span>
          </button>

          <button onClick={(e) => { e.stopPropagation(); handleGrade(4); }} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-green-50 transition-colors group">
             <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-200">
              <CheckCircle size={24} />
            </div>
            <span className="text-xs font-semibold text-green-600">Good (4d)</span>
          </button>
        </div>
      )}
    </div>
  );
};