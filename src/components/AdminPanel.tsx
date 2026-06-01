import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Play, Pause, Trash2, Edit2, Check, X, Plus } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [globalSettings, setGlobalSettings] = useState<any>({ is_paused: false });
  const [teams, setTeams] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  // Editing States
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editingScenario, setEditingScenario] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // New Entity States
  const [showNewTeam, setShowNewTeam] = useState(false);
  const defaultTeam = { team_name: '', assigned_scenario_id: 0, current_round: 1, current_budget: 50000, current_satisfaction: 50, current_co2: 50, current_greenkey: 0 };
  const [newTeam, setNewTeam] = useState(defaultTeam);

  const [showNewScenario, setShowNewScenario] = useState(false);
  const defaultScenario = { name: '', scale: 'Small', property_type: 'Hotel', starting_budget: 10000, starting_satisfaction: 50, starting_co2: 50, starting_greenkey: 0 };
  const [newScenario, setNewScenario] = useState(defaultScenario);

  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const defaultQuestion = { scenario_id: 0, round_number: 1, title: '', description: '' };
  const [newQuestion, setNewQuestion] = useState(defaultQuestion);

  const fetchData = async () => {
    setLoading(true);
    const [tRes, sRes, qRes, gsRes] = await Promise.all([
      supabase.from('teams').select('*').order('id', { ascending: true }),
      supabase.from('scenarios').select('*').order('id', { ascending: true }),
      supabase.from('questions').select('*').order('round_number', { ascending: true }),
      supabase.from('global_settings').select('*').eq('id', 1).single()
    ]);
    if (tRes.data) setTeams(tRes.data);
    if (sRes.data) setScenarios(sRes.data);
    if (qRes.data) setQuestions(qRes.data);
    if (gsRes.data) setGlobalSettings(gsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const sub = supabase.channel('admin_all_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scenarios' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, fetchData)
        .subscribe();
      return () => { supabase.removeChannel(sub); };
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'smartsolutions') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Password');
      setPassword('');
    }
  };

  const togglePause = async () => {
    await supabase.from('global_settings').update({ is_paused: !globalSettings.is_paused }).eq('id', 1);
  };

  // Team Actions
  const saveNewTeam = async () => {
    if (!newTeam.team_name || !newTeam.assigned_scenario_id) return alert('Name and scenario required');
    await supabase.from('teams').insert([newTeam]);
    setShowNewTeam(false);
    setNewTeam(defaultTeam);
    fetchData();
  };
  const saveEditTeam = async () => {
    await supabase.from('teams').update(editingTeam).eq('id', editingTeam.id);
    setEditingTeam(null);
    fetchData();
  };
  const deleteTeam = async (id: number) => {
    if (!window.confirm('Delete this team?')) return;
    await supabase.from('teams').delete().eq('id', id);
    fetchData();
  };

  // Scenario Actions
  const saveNewScenario = async () => {
    if (!newScenario.name) return alert('Name required');
    await supabase.from('scenarios').insert([newScenario]);
    setShowNewScenario(false);
    setNewScenario(defaultScenario);
    fetchData();
  };
  const saveEditScenario = async () => {
    await supabase.from('scenarios').update(editingScenario).eq('id', editingScenario.id);
    setEditingScenario(null);
    fetchData();
  };
  const deleteScenario = async (id: number) => {
    if (!window.confirm('Delete scenario?')) return;
    await supabase.from('scenarios').delete().eq('id', id);
    fetchData();
  };

  // Question Actions
  const saveNewQuestion = async () => {
    if (!newQuestion.title || !newQuestion.scenario_id) return alert('Title and Scenario required');
    await supabase.from('questions').insert([newQuestion]);
    setShowNewQuestion(false);
    setNewQuestion(defaultQuestion);
    fetchData();
  };
  const saveEditQuestion = async () => {
    await supabase.from('questions').update(editingQuestion).eq('id', editingQuestion.id);
    setEditingQuestion(null);
    fetchData();
  };
  const deleteQuestion = async (id: number) => {
    if (!window.confirm('Delete question?')) return;
    await supabase.from('questions').delete().eq('id', id);
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 mb-6 focus:border-blue-500 outline-none text-center tracking-widest text-lg"
          />
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition">
            Access System
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 text-xl font-bold border-b border-slate-800 tracking-tight">Admin Console</div>
        <div className="flex md:flex-col p-4 gap-2 overflow-x-auto md:overflow-visible flex-grow">
          <button onClick={() => setActiveTab('dashboard')} className={`text-left px-4 py-3 rounded font-medium transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Live Dashboard</button>
          <button onClick={() => setActiveTab('teams')} className={`text-left px-4 py-3 rounded font-medium transition whitespace-nowrap ${activeTab === 'teams' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Teams</button>
          <button onClick={() => setActiveTab('scenarios')} className={`text-left px-4 py-3 rounded font-medium transition whitespace-nowrap ${activeTab === 'scenarios' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Scenarios</button>
          <button onClick={() => setActiveTab('questions')} className={`text-left px-4 py-3 rounded font-medium transition whitespace-nowrap ${activeTab === 'questions' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Questions</button>
        </div>
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button onClick={() => window.location.href = '/'} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded font-bold text-sm">Return to Game</button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-6 md:p-10 overflow-auto h-screen w-full">
        {loading && <div className="text-gray-500 mb-4 animate-pulse">Syncing data...</div>}
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800">Global State</h1>
              <button 
                onClick={togglePause} 
                className={`flex items-center space-x-2 px-6 py-3 ${globalSettings.is_paused ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-lg font-bold transition`}
              >
                {globalSettings.is_paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                <span>{globalSettings.is_paused ? 'Game is Paused - Resume' : 'Game is Running - Pause'}</span>
              </button>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50"><h2 className="font-bold text-gray-700">Live Team Progress</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-sm text-gray-600">
                    <tr>
                      <th className="p-4">Team</th>
                      <th className="p-4">Scenario</th>
                      <th className="p-4">Round</th>
                      <th className="p-4">Budget</th>
                      <th className="p-4">Satisfaction</th>
                      <th className="p-4">CO2</th>
                      <th className="p-4">Green Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map(team => (
                      <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">{team.team_name}</td>
                        <td className="p-4 text-gray-500">{scenarios.find(s => s.id === team.assigned_scenario_id)?.name || 'Unknown'}</td>
                        <td className="p-4"><span className="bg-blue-100 text-blue-800 py-1 px-2 rounded font-bold text-sm">{team.current_round}</span></td>
                        <td className="p-4 font-mono text-emerald-600 font-medium">€{team.current_budget.toLocaleString()}</td>
                        <td className="p-4 font-mono">{team.current_satisfaction}</td>
                        <td className="p-4 font-mono text-orange-600">{team.current_co2}</td>
                        <td className="p-4 font-bold font-mono text-gray-600">{team.current_greenkey}</td>
                      </tr>
                    ))}
                    {teams.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No teams active.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TEAMS TAB --- */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
              <button onClick={() => setShowNewTeam(!showNewTeam)} className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-sm">
                <Plus className="w-5 h-5 mr-1"/> Create Team
              </button>
            </div>

            {showNewTeam && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Team Name</label>
                  <input type="text" value={newTeam.team_name} onChange={e => setNewTeam({...newTeam, team_name: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. Alpha" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Scenario Assignment</label>
                  <select value={newTeam.assigned_scenario_id} onChange={e => setNewTeam({...newTeam, assigned_scenario_id: parseInt(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 bg-white">
                    <option value={0}>Select...</option>
                    {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                 <div className="col-span-2 md:col-span-2">
                  <button onClick={saveNewTeam} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold w-full hover:bg-blue-700 transition shadow">Save New Team</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold font-sans">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Scenario ID</th>
                    <th className="p-4">Round</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Sat</th>
                    <th className="p-4">CO2</th>
                    <th className="p-4">GK</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teams.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      {editingTeam?.id === t.id ? (
                        <>
                          <td className="p-2"><input type="text" value={editingTeam.team_name} onChange={e => setEditingTeam({...editingTeam, team_name: e.target.value})} className="border border-blue-400 p-2 rounded-md w-full bg-blue-50"/></td>
                          <td className="p-2">
                            <select value={editingTeam.assigned_scenario_id} onChange={e => setEditingTeam({...editingTeam, assigned_scenario_id: parseInt(e.target.value)})} className="border border-blue-400 p-2 rounded-md w-full bg-blue-50">
                              {scenarios.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                            </select>
                          </td>
                          <td className="p-2"><input type="number" value={editingTeam.current_round} onChange={e => setEditingTeam({...editingTeam, current_round: parseInt(e.target.value)})} className="border border-blue-400 p-2 rounded-md w-full max-w-[80px] bg-blue-50"/></td>
                          <td className="p-2"><input type="number" value={editingTeam.current_budget} onChange={e => setEditingTeam({...editingTeam, current_budget: parseInt(e.target.value)})} className="border border-blue-400 p-2 rounded-md w-full max-w-[120px] bg-blue-50"/></td>
                          <td className="p-2"><input type="number" value={editingTeam.current_satisfaction} onChange={e => setEditingTeam({...editingTeam, current_satisfaction: parseInt(e.target.value)})} className="border border-blue-400 p-2 rounded-md w-full max-w-[80px] bg-blue-50"/></td>
                          <td className="p-2"><input type="number" value={editingTeam.current_co2} onChange={e => setEditingTeam({...editingTeam, current_co2: parseInt(e.target.value)})} className="border border-blue-400 p-2 rounded-md w-full max-w-[80px] bg-blue-50"/></td>
                          <td className="p-2"><input type="number" value={editingTeam.current_greenkey} onChange={e => setEditingTeam({...editingTeam, current_greenkey: parseInt(e.target.value)})} className="border border-blue-400 p-2 rounded-md w-full max-w-[80px] bg-blue-50"/></td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <button onClick={saveEditTeam} className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-md mr-1 shadow-sm"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingTeam(null)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-md"><X className="w-4 h-4"/></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-bold text-gray-800">{t.team_name}</td>
                          <td className="p-4 text-gray-600">{scenarios.find(s => s.id === t.assigned_scenario_id)?.name || 'Missing'}</td>
                          <td className="p-4">{t.current_round}</td>
                          <td className="p-4 text-emerald-600 font-mono">€{t.current_budget}</td>
                          <td className="p-4">{t.current_satisfaction}</td>
                          <td className="p-4">{t.current_co2}</td>
                          <td className="p-4 font-bold">{t.current_greenkey}</td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => setEditingTeam(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => deleteTeam(t.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition ml-1"><Trash2 className="w-4 h-4"/></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {teams.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No teams exist.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SCENARIOS TAB --- */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Scenario Management</h2>
              <button onClick={() => setShowNewScenario(!showNewScenario)} className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-sm">
                <Plus className="w-5 h-5 mr-1"/> Create Scenario
              </button>
            </div>

            {showNewScenario && (
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Scenario Name</label>
                    <input type="text" value={newScenario.name} onChange={e => setNewScenario({...newScenario, name: e.target.value})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500" placeholder="e.g. Hardcore Eco Lodge" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Scale</label>
                    <select value={newScenario.scale} onChange={e => setNewScenario({...newScenario, scale: e.target.value})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500 bg-white">
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Property Type</label>
                    <select value={newScenario.property_type} onChange={e => setNewScenario({...newScenario, property_type: e.target.value})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500 bg-white">
                      <option value="Campsite">Campsite</option>
                      <option value="Bungalow Park">Bungalow Park</option>
                      <option value="Hotel">Hotel</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Start Budget</label>
                    <input type="number" value={newScenario.starting_budget} onChange={e => setNewScenario({...newScenario, starting_budget: parseInt(e.target.value)})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Start Sat.</label>
                    <input type="number" value={newScenario.starting_satisfaction} onChange={e => setNewScenario({...newScenario, starting_satisfaction: parseInt(e.target.value)})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Start CO2</label>
                    <input type="number" value={newScenario.starting_co2} onChange={e => setNewScenario({...newScenario, starting_co2: parseInt(e.target.value)})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Start GK</label>
                    <input type="number" value={newScenario.starting_greenkey} onChange={e => setNewScenario({...newScenario, starting_greenkey: parseInt(e.target.value)})} className="w-full border border-emerald-200 p-2.5 rounded-lg outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={saveNewScenario} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition shadow">Save Scenario</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold font-sans">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Scale/Type</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Sat</th>
                    <th className="p-4">CO2</th>
                    <th className="p-4">GK</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scenarios.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      {editingScenario?.id === s.id ? (
                        <>
                          <td className="p-2 text-gray-400 font-mono text-center">{s.id}</td>
                          <td className="p-2"><input type="text" value={editingScenario.name} onChange={e => setEditingScenario({...editingScenario, name: e.target.value})} className="border border-emerald-400 p-2 rounded-md w-full bg-emerald-50" /></td>
                          <td className="p-2 flex flex-col space-y-1">
                            <select value={editingScenario.scale} onChange={e => setEditingScenario({...editingScenario, scale: e.target.value})} className="border border-emerald-400 p-1.5 rounded text-xs bg-emerald-50">
                              <option value="Small">Small</option><option value="Medium">Medium</option><option value="Large">Large</option>
                            </select>
                            <select value={editingScenario.property_type} onChange={e => setEditingScenario({...editingScenario, property_type: e.target.value})} className="border border-emerald-400 p-1.5 rounded text-xs bg-emerald-50">
                              <option value="Campsite">Campsite</option><option value="Bungalow Park">Bungalow Park</option><option value="Hotel">Hotel</option>
                            </select>
                          </td>
                          <td className="p-2"><input type="number" value={editingScenario.starting_budget} onChange={e => setEditingScenario({...editingScenario, starting_budget: parseInt(e.target.value)})} className="border border-emerald-400 p-2 rounded-md w-[80px] bg-emerald-50" /></td>
                          <td className="p-2"><input type="number" value={editingScenario.starting_satisfaction} onChange={e => setEditingScenario({...editingScenario, starting_satisfaction: parseInt(e.target.value)})} className="border border-emerald-400 p-2 rounded-md w-[60px] bg-emerald-50" /></td>
                          <td className="p-2"><input type="number" value={editingScenario.starting_co2} onChange={e => setEditingScenario({...editingScenario, starting_co2: parseInt(e.target.value)})} className="border border-emerald-400 p-2 rounded-md w-[60px] bg-emerald-50" /></td>
                          <td className="p-2"><input type="number" value={editingScenario.starting_greenkey} onChange={e => setEditingScenario({...editingScenario, starting_greenkey: parseInt(e.target.value)})} className="border border-emerald-400 p-2 rounded-md w-[60px] bg-emerald-50" /></td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <button onClick={saveEditScenario} className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-md mr-1 shadow-sm"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingScenario(null)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-md"><X className="w-4 h-4"/></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-mono text-gray-500">{s.id}</td>
                          <td className="p-4 font-bold text-gray-800">{s.name}</td>
                          <td className="p-4">
                            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs tracking-wide uppercase">{s.scale} {s.property_type}</span>
                          </td>
                          <td className="p-4 text-emerald-600 font-mono">€{s.starting_budget}</td>
                          <td className="p-4">{s.starting_satisfaction}</td>
                          <td className="p-4">{s.starting_co2}</td>
                          <td className="p-4">{s.starting_greenkey}</td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => setEditingScenario(s)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => deleteScenario(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition ml-1"><Trash2 className="w-4 h-4"/></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {scenarios.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No scenarios configured.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- QUESTIONS TAB --- */}
        {activeTab === 'questions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Questions Management</h2>
              <button onClick={() => setShowNewQuestion(!showNewQuestion)} className="bg-purple-600 hover:bg-purple-700 transition text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-sm">
                <Plus className="w-5 h-5 mr-1"/> Create Question
              </button>
            </div>

            {showNewQuestion && (
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Question Title</label>
                    <input type="text" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:border-purple-500" placeholder="e.g. Supplier Negotiation" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Scenario Assign</label>
                    <select value={newQuestion.scenario_id} onChange={e => setNewQuestion({...newQuestion, scenario_id: parseInt(e.target.value)})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:border-purple-500 bg-white">
                      <option value={0}>Select...</option>
                      {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Description (Event text)</label>
                    <textarea value={newQuestion.description} onChange={e => setNewQuestion({...newQuestion, description: e.target.value})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:border-purple-500" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-800 uppercase mb-1">Round Trigger</label>
                    <input type="number" value={newQuestion.round_number} onChange={e => setNewQuestion({...newQuestion, round_number: parseInt(e.target.value)})} className="w-full border border-purple-200 p-2.5 rounded-lg outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={saveNewQuestion} className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-purple-700 transition shadow">Save Question</button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
               <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold font-sans">
                  <tr>
                    <th className="p-4 w-16">Rnd</th>
                    <th className="p-4">Scenario</th>
                    <th className="p-4">Title & Context</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questions.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      {editingQuestion?.id === q.id ? (
                        <>
                          <td className="p-2"><input type="number" value={editingQuestion.round_number} onChange={e => setEditingQuestion({...editingQuestion, round_number: parseInt(e.target.value)})} className="border border-purple-400 p-2 rounded-md w-full max-w-[60px] bg-purple-50" /></td>
                          <td className="p-2">
                            <select value={editingQuestion.scenario_id} onChange={e => setEditingQuestion({...editingQuestion, scenario_id: parseInt(e.target.value)})} className="border border-purple-400 p-2 rounded-md w-full bg-purple-50">
                              {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </td>
                          <td className="p-2 space-y-2">
                            <input type="text" value={editingQuestion.title} onChange={e => setEditingQuestion({...editingQuestion, title: e.target.value})} className="border border-purple-400 p-2 rounded-md w-full bg-purple-50 font-bold" />
                            <textarea value={editingQuestion.description} onChange={e => setEditingQuestion({...editingQuestion, description: e.target.value})} className="border border-purple-400 p-2 rounded-md w-full bg-purple-50 text-sm" rows={2} />
                          </td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <button onClick={saveEditQuestion} className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-md mr-1 shadow-sm"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingQuestion(null)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-md"><X className="w-4 h-4"/></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-mono font-bold text-gray-500">R{q.round_number}</td>
                          <td className="p-4 text-gray-600">{scenarios.find(s => s.id === q.scenario_id)?.name || 'Missing Scenario'}</td>
                          <td className="p-4">
                            <div className="font-bold text-gray-800">{q.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-lg">{q.description}</div>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => setEditingQuestion(q)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition ml-1"><Trash2 className="w-4 h-4"/></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {questions.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No questions mapped to rounds.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
