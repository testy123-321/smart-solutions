import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';

export default function EmergencyClickerMinigame({ onComplete }: { onComplete: (result: 'success' | 'fail') => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [clicks, setClicks] = useState(0);
  
  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isPlaying && timeLeft === 0) {
      onComplete(clicks >= 20 ? 'success' : 'fail');
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, clicks]);

  if (!isPlaying) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-red-300 rounded-xl p-8 text-center mt-4">
         <Target className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
         <h3 className="text-xl font-bold mb-2 text-red-600">STORM EMERGENCY!</h3>
         <p className="text-gray-600 mb-6 text-sm">A severe storm is damaging the park! Rapidly click to deploy maintenance teams and patch leaks. Need 20 actions in 10 seconds to save the park!</p>
         <button onClick={() => { setIsPlaying(true); setTimeLeft(10); setClicks(0); }} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-red-200 hover:bg-red-700">Deploy Maintence Teams</button>
      </div>
    );
  }

  return (
     <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 text-center mt-4 shadow-lg shadow-red-100 flex flex-col items-center">
        <div className="text-sm font-bold text-red-700 animate-pulse mb-2">Time Remaining: {timeLeft}s</div>
        <div className="text-4xl font-mono font-black text-red-800 mb-8">{clicks} / 20</div>
        
        <button 
           onClick={() => setClicks(c => c + 1)}
           className="w-32 h-32 bg-red-600 hover:bg-red-500 hover:scale-95 active:scale-90 transition-all rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-red-200 uppercase tracking-widest text-center leading-none"
        >
           Fix<br/>Leak
        </button>
     </div>
  );
}
