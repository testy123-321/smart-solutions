import React, { createContext, useContext, useEffect, useState } from 'react';
import { GlobalSettings, Team, Scenario, Question, Option } from '../types';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

interface GameContextType {
  globalSettings: GlobalSettings;
  teams: Team[];
  scenarios: Scenario[];
  questions: Question[];
  options: Option[];
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => Promise<void>;
  updateTeam: (id: number, updates: Partial<Team>) => Promise<Team | undefined>;
  addTeam: (team: Omit<Team, 'id'>) => Promise<Team | undefined>;
  refreshTeams: () => void;
  refreshAll: () => void;
  seedDatabase: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const DEFAULT_SETTINGS: GlobalSettings = {
  id: 1,
  is_paused: false,
  theme_primary_color: '#10b981',
  ui_font_family: 'sans-serif'
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not fully configured, falling back to empty state.");
      return;
    }
    fetchData();

    const pollInterval = setInterval(() => {
      fetchData();
    }, 3000);

    // Setup realtime subscriptions
    const settingsSub = supabase
      .channel('global_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    const teamsSub = supabase
      .channel('teams_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(teamsSub);
    };
  }, []);

  useEffect(() => {
    if (globalSettings.theme_primary_color) {
      document.documentElement.style.setProperty('--color-primary', globalSettings.theme_primary_color);
    }
    if (globalSettings.ui_font_family) {
      const fontName = globalSettings.ui_font_family.replace(/ /g, '+');
      let link = document.getElementById('dynamic-font') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-font';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
      document.documentElement.style.setProperty('--dynamic-font-sans', `"${globalSettings.ui_font_family}"`);
    } else {
      document.documentElement.style.setProperty('--dynamic-font-sans', `"Inter"`);
    }
    if (globalSettings.ui_font_size) {
      document.documentElement.style.setProperty('font-size', globalSettings.ui_font_size);
    }
  }, [globalSettings]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('global_settings').select('*').single();
    if (data) setGlobalSettings(data);
  };

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('id');
    if (data) setTeams(data);
  };

  const fetchData = async () => {
    fetchSettings();
    fetchTeams();

    const [scenData, questData, optData] = await Promise.all([
      supabase.from('scenarios').select('*'),
      supabase.from('questions').select('*'),
      supabase.from('options').select('*')
    ]);

    if (scenData.data) setScenarios(scenData.data);
    if (questData.data) setQuestions(questData.data);
    if (optData.data) setOptions(optData.data);
  };

  const updateGlobalSettings = async (updates: Partial<GlobalSettings>) => {
    if (!isSupabaseConfigured()) { showToast('Supabase is not fully configured. Buttons will do nothing.'); return; }
    const { data, error } = await supabase
      .from('global_settings')
      .update(updates)
      .eq('id', globalSettings.id || 1)
      .select()
      .single();
    if (error) {
      console.error("Error updating settings:", error);
      showToast("Failed to update global settings: " + error.message);
    }
    if (data) {
      setGlobalSettings(data);
    }
  };

  const updateTeam = async (id: number, updates: Partial<Team>) => {
    if (!isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error("Error updating team:", error);
      showToast("Failed to update team: " + error.message);
    }
    if (data) {
      setTeams(prev => prev.map(t => (t.id === id ? data : t)));
      return data;
    }
  };

  const addTeam = async (teamData: Omit<Team, 'id'>) => {
    if (!isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select()
      .single();
      
    if (error) {
      console.error("Error creating team:", error);
      showToast("Failed to create team: " + error.message);
      return;
    }
    
    if (data) {
      setTeams(prev => [...prev, data]);
      return data;
    }
  };

  const refreshTeams = () => {
    fetchTeams();
  };

  const refreshAll = () => {
    fetchData();
  };

  const seedDatabase = async () => {
    if (!isSupabaseConfigured()) { showToast('Supabase is not fully configured. Buttons will do nothing.'); return; }
    
    // 1. Ensure global_settings exists (id: 1)
    const { error: settingsErr } = await supabase.from('global_settings').upsert({
      id: 1,
      is_paused: false,
      theme_primary_color: '#10b981',
      ui_font_family: 'Inter',
      ui_font_size: '16px',
      instructor_password: 'instructor2026'
    });

    if (settingsErr) {
       showToast("Failed to seed global_settings: " + settingsErr.message);
       return;
    }

    // 2. Create a Dummy Scenario
    const { data: scenData, error: scenErr } = await supabase.from('scenarios').insert({
      name: 'Sample Eco Resort',
      scale: 'Large',
      property_type: 'Bungalow Park',
      starting_budget: 100000,
      starting_satisfaction: 50,
      starting_staff_satisfaction: 60,
      starting_co2: 50,
      starting_greenkey: 0
    }).select().single();

    if (scenErr || !scenData) {
      showToast('Failed to insert scenario: ' + (scenErr?.message || ''));
      return;
    }

    // 3. Create a Dummy Team
    await supabase.from('teams').insert({
      team_name: 'SampleTeam',
      assigned_scenario_id: scenData.id,
      current_round: 1,
      current_budget: scenData.starting_budget,
      current_satisfaction: scenData.starting_satisfaction,
      current_staff_satisfaction: scenData.starting_staff_satisfaction,
      current_co2: scenData.starting_co2,
      current_greenkey: scenData.starting_greenkey
    });

    // 4. Create 1 Dummy Question
    const { data: qData, error: qErr } = await supabase.from('questions').insert({
      scenario_id: scenData.id,
      round_number: 1,
      title: 'The Breakfast Crisis',
      description: 'Morning, Director! Our chef wants to switch the breakfast buffet to 100% local, organic produce. It\'s expensive, but highly sustainable. What do we do?',
      minigame_type: null
    }).select().single();

    if (qData) {
      // 5. Create Options for that Question
      await supabase.from('options').insert([
        {
          question_id: qData.id,
          text: 'Make the switch. Sustainability first!',
          impact_budget: -15000,
          impact_satisfaction: 10,
          impact_staff_satisfaction: 15,
          impact_co2: -15,
          impact_greenkey: 2,
          feedback_message: 'Guests love the artisanal goat cheese, but the finance department is having a mild panic attack. The kitchen staff is thrilled to work with fresh ingredients!'
        },
        {
          question_id: qData.id,
          text: 'Keep the cheap bulk sausages.',
          impact_budget: 5000,
          impact_satisfaction: -5,
          impact_staff_satisfaction: -10,
          impact_co2: 10,
          impact_greenkey: 0,
          feedback_message: 'Chef Henk mumbles something about "industrial slop". Guests don\'t complain, but they don\'t praise it either. Staff morale takes a hit.'
        },
        {
          question_id: qData.id,
          text: 'Introduce "Meatless Mondays" only.',
          impact_budget: -5000,
          impact_satisfaction: 5,
          impact_staff_satisfaction: 5,
          impact_co2: -5,
          impact_greenkey: 1,
          feedback_message: 'A sensible compromise. Confused tourists demand their bratwurst, but mostly it\'s a hit.'
        }
      ]);
    }
    
    refreshAll();
    showToast('Dummy data inserted into Supabase successfully!');
  };

  return (
    <GameContext.Provider value={{
      globalSettings, teams, scenarios, questions, options,
      updateGlobalSettings, updateTeam, addTeam, refreshTeams, refreshAll, seedDatabase
    }}>
      {globalSettings?.is_paused && (
        <div className="fixed inset-0 bg-[#1b2a24]/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white p-12 max-w-lg text-center rounded-3xl border-4 border-[var(--color-primary)]">
            <div className="text-[var(--color-primary)] mb-6">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-serif mb-4">Simulation Paused</h2>
            <p className="text-[#1b2a24]/70 mb-8">Your instructor has paused the game for a group discussion. Please look at the main screen.</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <span>{toastMsg}</span>
        </div>
      )}
      {children}
    </GameContext.Provider>
  );
}

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
