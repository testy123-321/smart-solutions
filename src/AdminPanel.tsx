import React, { useState } from 'react';
import { useGameContext } from '../context/GameContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Pause,
  Play,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const {
    globalSettings,
    teams,
    scenarios,
    updateGlobalSettings,
    refreshAll,
    seedDatabase,
  } = useGameContext();

  const [activeTab, setActiveTab] = useState<
    'leaderboard' | 'content' | 'settings'
  >('leaderboard');

  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamScenario, setNewTeamScenario] = useState('');

  const [newScenName, setNewScenName] = useState('');
  const [newScenScale, setNewScenScale] = useState('Small');
  const [newScenProp, setNewScenProp] = useState('Campsite');
  const [newScenBudget, setNewScenBudget] = useState(50000);
  const [newScenSat, setNewScenSat] = useState(50);
  const [newScenCo2, setNewScenCo2] = useState(50);
  const [newScenGk, setNewScenGk] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans text-white">
        <div className="bg-red-500 text-white rounded-xl p-8 max-w-lg text-center shadow-xl">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Supabase Not Configured</h1>
          <p className="mb-4">
            The application requires a Supabase connection to store and sync
            data. You are seeing this screen because the environment variables
            are missing.
          </p>
          <ul className="text-sm list-disc pl-5 text-left mb-6 space-y-2 font-mono bg-red-600/50 p-4 rounded text-red-50">
            <li>Go to the AI Studio Secrets panel.</li>
            <li>
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY OR
              VITE_SUPABASE_PUBLISHABLE_KEY.
            </li>
            <li>Restart the application.</li>
          </ul>
        </div>
      </div>
    );
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPass = globalSettings.instructor_password || 'instructor2026';
    if (password === correctPass || password === 'admin') {
      setIsAuthenticated(true);
    } else {
      showNotif('Incorrect Password');
    }
  };

  const togglePause = () => {
    updateGlobalSettings({ is_paused: !globalSettings.is_paused });
  };

  const updateTheme = (color: string) => {
    updateGlobalSettings({ theme_primary_color: color });
  };

  const updateFontFamily = (font: string) => {
    updateGlobalSettings({ ui_font_family: font });
  };

  const updateFontSize = (size: string) => {
    updateGlobalSettings({ ui_font_size: size });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword) {
      await updateGlobalSettings({ instructor_password: newPassword });
      setNewPassword('');
      showNotif('Admin password has been updated in database.');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const scenId = parseInt(newTeamScenario);
    if (!scenId || !newTeamName)
      return showNotif('Missing team name or scenario.');
    const scen = scenarios.find((s) => s.id === scenId);
    if (!scen) return;

    const { error } = await supabase.from('teams').insert({
      team_name: newTeamName,
      assigned_scenario_id: scen.id,
      current_round: 1,
      current_budget: scen.starting_budget,
      current_satisfaction: scen.starting_satisfaction,
      current_staff_satisfaction: scen.starting_staff_satisfaction || 60,
      current_co2: scen.starting_co2,
      current_greenkey: scen.starting_greenkey,
    });
    if (error) {
      showNotif('Error: ' + error.message);
    } else {
      setNewTeamName('');
      refreshAll();
      showNotif('Team Created successfully!');
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenName) return showNotif('Scenario name required.');
    const { error } = await supabase.from('scenarios').insert({
      name: newScenName,
      scale: newScenScale,
      property_type: newScenProp,
      starting_budget: newScenBudget,
      starting_satisfaction: newScenSat,
      starting_staff_satisfaction: 60,
      starting_co2: newScenCo2,
      starting_greenkey: newScenGk,
    });
    if (error) {
      showNotif('Error: ' + error.message);
    } else {
      setNewScenName('');
      refreshAll();
      showNotif('Scenario Template Created!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-5 w-5" />
            <span>{notification}</span>
          </div>
        )}
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full space-y-6"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gatekeeper Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter password (instructor2026 or admin)"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-xl font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5" />
          <span>{notification}</span>
        </div>
      )}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-4">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight">
            Instructor Dashboard
          </h1>
          <button
            onClick={refreshAll}
            className="ml-4 flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition text-xs font-bold text-slate-300"
          >
            <RefreshCw className="h-3 w-3" /> <span>Sync Data</span>
          </button>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              Simulation State
            </span>
            <button
              onClick={togglePause}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded text-sm font-bold transition ${
                globalSettings.is_paused
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {globalSettings.is_paused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              <span>{globalSettings.is_paused ? 'RESUME' : 'PAUSE'}</span>
            </button>
          </div>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="text-xs uppercase tracking-widest font-bold bg-white text-slate-900 px-4 py-2 rounded shadow hover:bg-slate-200 transition"
          >
            Exit Admin
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex space-x-4 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          {['leaderboard', 'content', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-bold text-gray-800">
                    Live Team Progress
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                      <tr>
                        <th className="px-6 py-4">Team</th>
                        <th className="px-6 py-4">Round</th>
                        <th className="px-6 py-4">Budget</th>
                        <th className="px-6 py-4">Satisfaction</th>
                        <th className="px-6 py-4">CO2</th>
                        <th className="px-6 py-4">Green Key</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teams.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-gray-400"
                          >
                            No teams active yet. Data syncs every 1 min.
                          </td>
                        </tr>
                      )}
                      {teams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-bold text-gray-800">
                            {team.team_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                              {team.current_round} / 20
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-emerald-600 font-medium">
                            €{team.current_budget.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {team.current_satisfaction}/100
                          </td>
                          <td className="px-6 py-4 text-orange-600">
                            {team.current_co2}
                          </td>
                          <td className="px-6 py-4">{team.current_greenkey}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Metric Overview
                </h2>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teams}
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="team_name"
                        type="category"
                        width={80}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="current_satisfaction"
                        name="Satisfaction"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="current_greenkey"
                        name="Green Key Pts"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex flex-col items-start space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  Here you can create new <strong>Teams</strong> and basic{' '}
                  <strong>Scenario Templates</strong>. Submitting will
                  immediately sync to Supabase. <br />
                  <em>
                    Note: Managing complex Question trees and Options logic
                    should be done directly in your Supabase Dashboard table
                    editor. Changes will automatically pull into the app every 1
                    minute.
                  </em>
                </p>
              </div>
              <div className="w-full">
                <p className="font-bold mb-2">
                  Need to set up your Database for the first time?
                </p>
                <details className="bg-white p-4 rounded border border-blue-200">
                  <summary className="font-bold cursor-pointer outline-none">
                    Show Supabase SQL Schema (Run in your Supabase SQL Editor)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto bg-gray-900 text-gray-100 p-4 rounded select-all font-mono">
                    {`CREATE TABLE global_settings (
  id integer PRIMARY KEY,
  is_paused boolean DEFAULT false,
  theme_primary_color text DEFAULT '#10b981',
  ui_font_family text DEFAULT 'Inter',
  ui_font_size text DEFAULT '16px',
  instructor_password text DEFAULT 'instructor2026'
);

CREATE TABLE scenarios (
  id serial PRIMARY KEY,
  name text,
  scale text,
  property_type text,
  starting_budget integer,
  starting_satisfaction integer,
  starting_staff_satisfaction integer,
  starting_co2 integer,
  starting_greenkey integer
);

CREATE TABLE teams (
  id serial PRIMARY KEY,
  team_name text,
  assigned_scenario_id integer REFERENCES scenarios(id),
  current_round integer,
  current_budget integer,
  current_satisfaction integer,
  current_staff_satisfaction integer,
  current_co2 integer,
  current_greenkey integer
);

CREATE TABLE questions (
  id serial PRIMARY KEY,
  scenario_id integer REFERENCES scenarios(id),
  round_number integer,
  title text,
  description text,
  minigame_type text
);

CREATE TABLE options (
  id serial PRIMARY KEY,
  question_id integer REFERENCES questions(id),
  text text,
  impact_budget integer,
  impact_satisfaction integer,
  impact_staff_satisfaction integer,
  impact_co2 integer,
  impact_greenkey integer,
  feedback_message text
);

-- Very important: Insert initial settings row!
INSERT INTO global_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE global_settings, scenarios, teams, questions, options;`}
                  </pre>
                </details>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mt-4">
              <h3 className="font-bold text-gray-800">Sample Setup</h3>
              <button
                onClick={() => seedDatabase()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition text-xs"
              >
                Insert Dummy Data
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Team Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5 text-emerald-600" />{' '}
                  Create Authorized Team
                </h2>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Team Designation
                    </label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g. Pine, Willow"
                      className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Assign to Scenario
                    </label>
                    <select
                      value={newTeamScenario}
                      onChange={(e) => setNewTeamScenario(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Select a scenario...</option>
                      {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.scale} {s.property_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded hover:bg-slate-800 transition"
                  >
                    Establish Team
                  </button>
                </form>
              </div>

              {/* Create Scenario Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5 text-emerald-600" />{' '}
                  Define New Scenario
                </h2>
                <form onSubmit={handleCreateScenario} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Scenario Name
                      </label>
                      <input
                        type="text"
                        value={newScenName}
                        onChange={(e) => setNewScenName(e.target.value)}
                        placeholder="e.g. Eco Lodge"
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Property Type
                      </label>
                      <select
                        value={newScenProp}
                        onChange={(e) => setNewScenProp(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                      >
                        <option value="Campsite">Campsite</option>
                        <option value="Bungalow Park">Bungalow Park</option>
                        <option value="Hotel">Hotel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Starting Budget (€)
                      </label>
                      <input
                        type="number"
                        value={newScenBudget}
                        onChange={(e) =>
                          setNewScenBudget(parseInt(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Base Satisfaction (%)
                      </label>
                      <input
                        type="number"
                        value={newScenSat}
                        onChange={(e) =>
                          setNewScenSat(parseInt(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Base CO2 Level
                      </label>
                      <input
                        type="number"
                        value={newScenCo2}
                        onChange={(e) =>
                          setNewScenCo2(parseInt(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Starting Green Key
                      </label>
                      <input
                        type="number"
                        value={newScenGk}
                        onChange={(e) => setNewScenGk(parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-100 text-slate-800 border border-slate-300 font-bold py-3 rounded hover:bg-slate-200 transition"
                  >
                    Save Scenario Template
                  </button>
                </form>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4 border-b border-gray-200 pb-2">
              Active Scenario Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{s.name}</h4>
                    <span className="text-xs font-bold text-gray-500 uppercase px-2 py-1 bg-gray-200 rounded">
                      {s.scale} {s.property_type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-4">
                    <div>
                      Budget:{' '}
                      <span className="font-mono text-emerald-600">
                        €{s.starting_budget.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      Satisfaction:{' '}
                      <span className="font-mono">
                        {s.starting_satisfaction}
                      </span>
                    </div>
                    <div>
                      CO2 Baseline:{' '}
                      <span className="font-mono text-orange-600">
                        {s.starting_co2}
                      </span>
                    </div>
                    <div>
                      Green Key:{' '}
                      <span className="font-mono">{s.starting_greenkey}</span>
                    </div>
                  </div>
                </div>
              ))}
              {scenarios.length === 0 && (
                <div className="col-span-full text-center p-12 text-gray-400 border border-dashed rounded-xl">
                  No scenarios found. Add one above.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Global Settings
            </h2>

            <div className="space-y-8 max-w-sm">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  UI Theme Color
                </label>
                <div className="flex space-x-3">
                  {[
                    {
                      name: 'Emerald',
                      value: '#10b981',
                      class: 'bg-emerald-500',
                    },
                    { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
                    {
                      name: 'Violet',
                      value: '#8b5cf6',
                      class: 'bg-violet-500',
                    },
                    { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
                    { name: 'Slate', value: '#1b2a24', class: 'bg-slate-900' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateTheme(color.value)}
                      className={`w-10 h-10 rounded-full ${color.class} ${
                        globalSettings.theme_primary_color === color.value
                          ? 'ring-4 ring-offset-2 ring-gray-400'
                          : ''
                      } transition hover:scale-110`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  UI Font Family (Google Fonts)
                </label>
                <select
                  value={globalSettings.ui_font_family || 'Inter'}
                  onChange={(e) => updateFontFamily(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Nunito">Nunito</option>
                  <option value="Ubuntu">Ubuntu</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Rubik">Rubik</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  UI Font Size Base
                </label>
                <select
                  value={globalSettings.ui_font_size || '16px'}
                  onChange={(e) => updateFontSize(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                >
                  <option value="12px">12px (Small)</option>
                  <option value="14px">14px (Medium)</option>
                  <option value="16px">16px (Default)</option>
                  <option value="18px">18px (Large)</option>
                  <option value="20px">20px (Extra Large)</option>
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700">
                  Change Admin Password
                </label>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password..."
                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white font-bold py-2 px-4 rounded hover:bg-slate-800 transition"
                  >
                    Update Password
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    If the `indicator_password` column doesn't exist on
                    Supabase, changing this might fail silently or error unless
                    you add it to the `global_settings` table.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
