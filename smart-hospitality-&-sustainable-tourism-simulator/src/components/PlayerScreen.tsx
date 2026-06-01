import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowRight, Zap, Leaf, Users, Coins, AlertCircle, Pause } from 'lucide-react';

export default function PlayerScreen() {
  const [teamName, setTeamName] = useState('');
  const [activeTeam, setActiveTeam] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>({ is_paused: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('global_settings').select('*').eq('id', 1).single();
      if (data) setGlobalSettings(data);
    };
    
    fetchSettings();
    const settingsSub = supabase.channel('player_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, fetchSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: teamData, error } = await supabase.from('teams').select('*').ilike('team_name', teamName).single();
    if (teamData) {
      setActiveTeam(teamData);
      supabase.channel(`team_${teamData.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${teamData.id}` }, (payload) => {
          setActiveTeam(payload.new);
        })
        .subscribe();
    } else {
      alert("Team not found or multiple teams matched.");
    }
    setLoading(false);
  };

  const advanceRound = async () => {
    if (!activeTeam || activeTeam.current_round >= 20 || globalSettings.is_paused) return;
    
    const newRound = activeTeam.current_round + 1;

    setLoading(true);
    await supabase.from('teams').update({
      current_round: newRound
    }).eq('id', activeTeam.id);
    setLoading(false);
  };

  if (!activeTeam) {
    return (
      <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white p-12 rounded-3xl max-w-md w-full text-center shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Simulation Login</h1>
          <p className="text-gray-500 mb-8">Enter your team name (e.g., Apple, Lilly, Oak, River)</p>
          <input 
            type="text" 
            value={teamName} 
            onChange={e => setTeamName(e.target.value)} 
            placeholder="Team Name" 
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 text-center font-bold outline-none focus:border-emerald-500" 
            required 
          />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-lg flex justify-center items-center">
             {loading ? 'Entering...' : 'Enter Simulation'} <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  const isComplete = activeTeam.current_round > 20 || (activeTeam.current_round === 20 && !loading);
  const isHardStop = activeTeam.current_round === 10;

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col transition-all duration-700 ${globalSettings.is_paused ? 'blur-md pointer-events-none' : ''}`}>
      
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded capitalize">{activeTeam.team_name}</div>
          <div className="text-sm text-gray-500 font-medium">Round {Math.min(activeTeam.current_round, 20)} / 20</div>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <div className="flex items-center text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded"><Coins className="w-4 h-4 mr-1"/> €{activeTeam.current_budget.toLocaleString()}</div>
          <div className="flex items-center text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded"><Users className="w-4 h-4 mr-1"/> {activeTeam.current_satisfaction}/100</div>
          <div className="flex items-center text-orange-700 font-bold bg-orange-50 px-3 py-1 rounded"><Zap className="w-4 h-4 mr-1"/> {activeTeam.current_co2}</div>
          <div className="flex items-center text-green-700 font-bold bg-green-50 px-3 py-1 rounded"><Leaf className="w-4 h-4 mr-1"/> {activeTeam.current_greenkey}</div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        
        {isComplete ? (
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow text-center w-full">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simulation Complete</h2>
            <p className="text-gray-500 mb-8 text-lg">Your team successfully navigated the 20 rounds of the hospitality simulation. Await final analysis.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
               <div className="p-4 bg-gray-50 rounded-xl"><span className="block text-xs uppercase text-gray-400 font-bold">Final Budget</span><span className="text-xl font-bold text-emerald-700">€{activeTeam.current_budget.toLocaleString()}</span></div>
               <div className="p-4 bg-gray-50 rounded-xl"><span className="block text-xs uppercase text-gray-400 font-bold">Satisfaction</span><span className="text-xl font-bold text-blue-700">{activeTeam.current_satisfaction}</span></div>
               <div className="p-4 bg-gray-50 rounded-xl"><span className="block text-xs uppercase text-gray-400 font-bold">CO2 Emission</span><span className="text-xl font-bold text-orange-700">{activeTeam.current_co2}</span></div>
               <div className="p-4 bg-gray-50 rounded-xl"><span className="block text-xs uppercase text-gray-400 font-bold">Green Key</span><span className="text-xl font-bold text-green-700">{activeTeam.current_greenkey}</span></div>
            </div>
          </div>
        ) : isHardStop ? (
          <div className="bg-orange-50 border-2 border-orange-200 p-8 md:p-12 rounded-3xl text-center w-full max-w-2xl">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-orange-900 mb-4">Midterm Review</h2>
            <p className="text-orange-800 text-lg">The simulation is paused for class discussion. Await instructor permission to continue.</p>
            <button onClick={advanceRound} disabled={globalSettings.is_paused} className={`mt-8 px-8 py-3 rounded font-bold text-white transition ${globalSettings.is_paused ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'}`}>
              {globalSettings.is_paused ? 'Waiting for Instructor...' : 'Continue to Round 11'}
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow max-w-2xl w-full text-center">
            <div className="text-sm font-bold text-emerald-600 tracking-widest uppercase mb-2">Round {activeTeam.current_round} Dashboard</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Operations Panel</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Review your KPIs and proceed to the next quarter when your team is ready.</p>
            
            <button 
              onClick={advanceRound} 
              disabled={loading || globalSettings.is_paused}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-12 rounded-xl text-lg flex items-center justify-center mx-auto transition shadow-lg hover:shadow-xl"
            >
               {loading ? 'Processing...' : 'Advance Quarter'} <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {globalSettings.is_paused && !isComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
           <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm animate-in zoom-in duration-300">
             <Pause className="w-12 h-12 text-slate-800 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-slate-900 mb-2">Simulation Paused</h2>
             <p className="text-slate-500">The instructor has halted the simulation. Please pay attention to the front of the class.</p>
           </div>
        </div>
      )}
    </div>
  );
}
