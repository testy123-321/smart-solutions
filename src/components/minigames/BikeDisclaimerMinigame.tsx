import React, { useState } from 'react';
import { Target } from 'lucide-react';

export default function BikeDisclaimerMinigame({ onComplete }: { onComplete: (result: 'success' | 'fail') => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  
  const clauses = [
    { id: '1', text: 'Helmets are mandatory for children.', correct: true },
    { id: '2', text: 'If of age, drinking and biking is fully encouraged!', correct: false },
    { id: '3', text: 'The resort is not liable for stolen bikes.', correct: true },
    { id: '4', text: 'All guests must bike at exactly 12 km/h.', correct: false },
    { id: '5', text: 'Damage costs will be applied to the room bill.', correct: true },
  ];

  const toggleClause = (id: string) => {
    if (selectedClauses.includes(id)) {
      setSelectedClauses(selectedClauses.filter(c => c !== id));
    } else {
      setSelectedClauses([...selectedClauses, id]);
    }
  };

  const submitDisclaimer = () => {
    let score = 0;
    clauses.forEach(c => {
       const isSelected = selectedClauses.includes(c.id);
       if (c.correct && isSelected) score++;
       if (!c.correct && isSelected) score--; // Penalty for bad legal advice
    });
    
    // Max score is 3. To pass need >= 2.
    if (score >= 2) {
       onComplete('success');
    } else {
       onComplete('fail');
    }
  };

  if (!isPlaying) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mt-4">
         <Target className="w-12 h-12 text-[#1b2a24] mx-auto mb-4" />
         <h3 className="text-xl font-bold mb-2">Legal CMS System</h3>
         <p className="text-gray-600 mb-6 text-sm">Select the appropriate legal clauses to add to our bike rental terms & conditions. Don't include weird stuff.</p>
         <button onClick={() => setIsPlaying(true)} className="bg-[#1b2a24] text-white px-6 py-2 rounded-full font-bold">Open CMS</button>
      </div>
    );
  }

  return (
     <div className="bg-white border-2 border-slate-800 rounded-xl p-6 text-left mt-4 shadow-lg">
        <div className="text-sm border-b pb-2 mb-4 font-mono font-bold">CMS Editor: /legal/bike-terms.html</div>
        
        <div className="space-y-3 mb-6">
           {clauses.map(c => (
              <label key={c.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200">
                 <input 
                   type="checkbox" 
                   checked={selectedClauses.includes(c.id)}
                   onChange={() => toggleClause(c.id)}
                   className="w-5 h-5 accent-slate-800"
                 />
                 <span className="text-sm">{c.text}</span>
              </label>
           ))}
        </div>

        <button onClick={submitDisclaimer} className="bg-slate-800 text-white w-full py-3 rounded-lg font-bold font-mono uppercase tracking-widest text-xs">
           Publish to Live Server
        </button>
     </div>
  );
}
