import React, { useState } from 'react';
import { Target, Home, Tent, Hotel } from 'lucide-react';

export default function BungalowAssignmentMinigame({ onComplete }: { onComplete: (result: 'success' | 'fail') => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [assignments, setAssignments] = useState({
    family: '',
    couple: '',
    luxury: ''
  });

  const handleSubmit = () => {
    // Basic logic: family -> Bungalow, couple -> Tent, luxury -> Lodge
    if (assignments.family === 'bungalow' && assignments.couple === 'tent' && assignments.luxury === 'lodge') {
      onComplete('success');
    } else {
      onComplete('fail');
    }
  };

  if (!isPlaying) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center mt-4">
         <Target className="w-12 h-12 text-blue-500 mx-auto mb-4" />
         <h3 className="text-xl font-bold mb-2">Check-in Rush!</h3>
         <p className="text-gray-600 mb-6 text-sm">Assign the arriving guests to the appropriate accommodations. Think about their needs!</p>
         <button onClick={() => setIsPlaying(true)} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">Start Desk Shift</button>
      </div>
    );
  }

  return (
     <div className="bg-white border-2 border-blue-500 rounded-xl p-6 text-left mt-4 shadow-lg shadow-blue-100">
        <h4 className="text-lg font-bold mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-blue-500" /> Guest Assignments</h4>
        
        <div className="space-y-6 mb-8">
           <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
              <div>
                 <p className="font-bold">The Visser Family</p>
                 <p className="text-xs text-gray-500">2 adults, 3 kids. Need space and standard amenities.</p>
              </div>
              <select className="border-gray-300 rounded p-2 text-sm font-bold" value={assignments.family} onChange={e => setAssignments({...assignments, family: e.target.value})}>
                 <option value="">Select...</option>
                 <option value="tent">Eco Tent</option>
                 <option value="bungalow">Standard Bungalow</option>
                 <option value="lodge">Luxury Lodge</option>
              </select>
           </div>
           
           <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
              <div>
                 <p className="font-bold">A young couple</p>
                 <p className="text-xs text-gray-500">Backpacking, low budget, want to be close to nature.</p>
              </div>
              <select className="border-gray-300 rounded p-2 text-sm font-bold" value={assignments.couple} onChange={e => setAssignments({...assignments, couple: e.target.value})}>
                 <option value="">Select...</option>
                 <option value="tent">Eco Tent</option>
                 <option value="bungalow">Standard Bungalow</option>
                 <option value="lodge">Luxury Lodge</option>
              </select>
           </div>

           <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
              <div>
                 <p className="font-bold">CEO & Spouse</p>
                 <p className="text-xs text-gray-500">High expectations. Requires room service and hot tub.</p>
              </div>
              <select className="border-gray-300 rounded p-2 text-sm font-bold" value={assignments.luxury} onChange={e => setAssignments({...assignments, luxury: e.target.value})}>
                 <option value="">Select...</option>
                 <option value="tent">Eco Tent</option>
                 <option value="bungalow">Standard Bungalow</option>
                 <option value="lodge">Luxury Lodge</option>
              </select>
           </div>
        </div>

        <button 
           onClick={handleSubmit}
           disabled={!assignments.family || !assignments.couple || !assignments.luxury}
           className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
           Confirm Assignments
        </button>
     </div>
  );
}
