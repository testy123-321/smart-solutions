import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';

export default function WasteSortingMinigame({ onComplete }: { onComplete: (result: 'success' | 'fail') => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  
  const items = [
    { id: '1', name: 'Banana Peel', bin: 'COMPOST' },
    { id: '2', name: 'Plastic Bottle', bin: 'PLASTIC' },
    { id: '3', name: 'Glass Jar', bin: 'GLASS' },
    { id: '4', name: 'Apple Core', bin: 'COMPOST' },
  ];
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isPlaying && timeLeft === 0) {
      onComplete(score >= 3 ? 'success' : 'fail');
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(10);
    setScore(0);
    setCurrentItemIndex(0);
  };

  const handleSort = (bin: string) => {
    if (items[currentItemIndex].bin === bin) {
      setScore(s => s + 1);
    }
    
    if (currentItemIndex + 1 < items.length) {
      setCurrentItemIndex(i => i + 1);
    } else {
      setTimeout(() => {
         onComplete(score + (items[currentItemIndex].bin === bin ? 1 : 0) >= 3 ? 'success' : 'fail');
      }, 500);
    }
  };

  if (!isPlaying) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mt-4">
         <Target className="w-12 h-12 text-[#10b981] mx-auto mb-4" />
         <h3 className="text-xl font-bold mb-2">Waste Sorting Drill</h3>
         <p className="text-gray-600 mb-6 text-sm">You have 10 seconds to sort 4 items correctly into their respective bins. Needs 3 correct to pass.</p>
         <button onClick={startGame} className="bg-[#10b981] text-white px-6 py-2 rounded-full font-bold">Start Drill</button>
      </div>
    );
  }

  const currentItem = items[currentItemIndex];

  return (
     <div className="bg-white border-2 border-[#10b981] rounded-xl p-8 text-center mt-4 shadow-lg relative">
        <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-3 py-1 rounded-full font-mono text-sm font-bold flex items-center">
           Time: {timeLeft}s
        </div>
        <div className="text-sm text-gray-500 font-bold uppercase mb-4 tracking-widest">Item {currentItemIndex + 1} of {items.length}</div>
        
        <div className="text-3xl font-serif mb-8 border-b pb-8 max-w-sm mx-auto">{currentItem.name}</div>
        
        <div className="grid grid-cols-3 gap-4">
           <button onClick={() => handleSort('COMPOST')} className="p-4 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition">COMPOST</button>
           <button onClick={() => handleSort('PLASTIC')} className="p-4 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition">PLASTIC</button>
           <button onClick={() => handleSort('GLASS')} className="p-4 bg-teal-100 text-teal-700 rounded-xl font-bold hover:bg-teal-200 transition">GLASS</button>
        </div>
     </div>
  );
}
