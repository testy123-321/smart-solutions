import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Play, Pause } from 'lucide-react';

export default function AdminPanel() {
  const [teams, setTeams] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>({ is_paused: false });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: teamsData } = await supabase.from('teams').select('*').order('current_round', { ascending: false });
    if (teamsData) setTeams(teamsData);

    const { data: settingsData } = await supabase.from('global_settings').select('*').eq('id', 1).single();
    if (settingsData) setGlobalSettings(settingsData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const teamsSub = supabase.channel('admin_teams').on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchData).subscribe();
    const settingsSub = supabase.channel('admin_settings').on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, fetchData).subscribe();

    return () => {
      supabase.removeChannel(teamsSub);
      supabase.removeChannel(settingsSub);
    };
  }, []);

  const togglePause = async () => {
    await supabase.from('global_settings').update({ is_paused: !globalSettings.is_paused }).eq('id', 1);
  };

  const seedData = async () => {
    if (!window.confirm("Seed sample data? This might fail if data already exists.")) return;
    
    // Seed basic scenarios
    const { data: scenarios, error: scenError } = await supabase.from('scenarios').insert([
      { id: 1, name: "Large Bungalow Park", scale: "Large", property_type: "Bungalow Park", starting_budget: 100000, starting_satisfaction: 50, starting_co2: 50, starting_greenkey: 0 },
      { id: 2, name: "Small Campsite", scale: "Small", property_type: "Campsite", starting_budget: 20000, starting_satisfaction: 40, starting_co2: 30, starting_greenkey: 0 },
      { id: 3, name: "Small Bungalow Park", scale: "Small", property_type: "Bungalow Park", starting_budget: 50000, starting_satisfaction: 60, starting_co2: 60, starting_greenkey: 0 },
      { id: 4, name: "Large Campsite", scale: "Large", property_type: "Campsite", starting_budget: 80000, starting_satisfaction: 45, starting_co2: 40, starting_greenkey: 0 }
    ]).select();

    if (scenError) {
      alert("Error seeding scenarios: " + scenError.message);
      return;
    }

    // Seed test teams mapped to Scenarios
    await supabase.from('teams').insert([
      { team_name: "Apple", assigned_scenario_id: 1, current_round: 1, current_budget: 100000, current_satisfaction: 50, current_co2: 50, current_greenkey: 0 },
      { team_name: "Lilly", assigned_scenario_id: 2, current_round: 1, current_budget: 20000, current_satisfaction: 40, current_co2: 30, current_greenkey: 0 },
      { team_name: "Oak", assigned_scenario_id: 3, current_round: 1, current_budget: 50000, current_satisfaction: 60, current_co2: 60, current_greenkey: 0 },
      { team_name: "River", assigned_scenario_id: 4, current_round: 1, current_budget: 80000, current_satisfaction: 45, current_co2: 40, current_greenkey: 0 }
    ]);
    
    alert("Sample data seeded!");
    fetchData();
  };

  if (loading) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Teacher Control Panel</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={togglePause} 
              className={`flex items-center space-x-2 px-4 py-2 ${globalSettings.is_paused ? 'bg-orange-500' : 'bg-emerald-500'} text-white rounded font-bold hover:opacity-80`}
            >
              {globalSettings.is_paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              <span>{globalSettings.is_paused ? 'Game is Paused - Click to Resume' : 'Game is Running - Click to Pause'}</span>
            </button>
            <button onClick={seedData} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Seed Data</button>
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600">Back to Game</button>
          </div>
        </header>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50"><h2 className="font-bold text-gray-700">Live Team Progress</h2></div>
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="p-4">Team</th>
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
                  <td className="p-4 font-bold">{team.team_name}</td>
                  <td className="p-4">{team.current_round}</td>
                  <td className="p-4 font-mono text-emerald-600 text-sm">€{team.current_budget.toLocaleString()}</td>
                  <td className="p-4">{team.current_satisfaction}</td>
                  <td className="p-4">{team.current_co2}</td>
                  <td className="p-4 font-bold text-gray-800">{team.current_greenkey}</td>
                </tr>
              ))}
              {teams.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No teams found. Click Seed Data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
