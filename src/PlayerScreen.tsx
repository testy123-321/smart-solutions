import React, { useState, useEffect } from 'react';
import { useGameContext } from '../context/GameContext';
import { Team, Scenario, Question, Option } from '../types';
import {
  Leaf,
  Plane,
  Users,
  Coins,
  ArrowRight,
  Zap,
  CheckCircle2,
  ChevronRight,
  Pause,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isSupabaseConfigured } from '../utils/supabase';
import WasteSortingMinigame from './minigames/WasteSortingMinigame';
import BikeDisclaimerMinigame from './minigames/BikeDisclaimerMinigame';
import EmergencyClickerMinigame from './minigames/EmergencyClickerMinigame';
import BungalowAssignmentMinigame from './minigames/BungalowAssignmentMinigame';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PlayerScreen() {
  const {
    globalSettings,
    teams,
    scenarios,
    questions,
    options: allOptions,
    addTeam,
    updateTeam,
  } = useGameContext();

  // Login Phase A states
  const [teamNameInput, setTeamNameInput] = useState('');
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);

  // Engine Phase B states
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center p-6 font-sans">
        <div className="bg-red-50 text-red-900 border-2 border-red-500 rounded-3xl p-12 max-w-xl text-center shadow-xl">
          <h1 className="text-3xl font-serif mb-4 text-red-600">
            Application Error
          </h1>
          <p className="mb-6">
            The database connection is not configured. The simulation requires
            real-time synchronization to function properly.
          </p>
          <div className="bg-white p-6 rounded-xl border border-red-200 text-left">
            <p className="font-bold text-sm mb-2">
              Instructions for Developer:
            </p>
            <ol className="text-sm list-decimal pl-4 space-y-2 text-red-800">
              <li>Open the standard AI Studio settings/secrets panel.</li>
              <li>
                Add <code>VITE_SUPABASE_URL</code> and{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> to the secrets list.
              </li>
              <li>Restart the development server.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = teamNameInput.trim();

    const existingTeam = teams.find(
      (t) => t.team_name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existingTeam) {
      const scenarioData = scenarios.find(
        (s) => s.id === existingTeam.assigned_scenario_id
      );
      setActiveTeam(existingTeam);
      if (scenarioData) {
        setActiveScenario(scenarioData);
      }
    } else {
      showNotif(
        'Team not found. Have the instructor create it in the Admin Dashboard.'
      );
    }
  };

  useEffect(() => {
    if (!activeTeam || !activeScenario) return;
    if (activeTeam.current_round > 20) return;
    if (activeTeam.current_round === 11) return; // intermission state

    const qData = questions.find(
      (q) =>
        q.scenario_id === activeScenario.id &&
        q.round_number === activeTeam.current_round
    );

    if (qData) {
      setCurrentQuestion(qData);
      setOptions(allOptions.filter((o) => o.question_id === qData.id));
    } else {
      setCurrentQuestion(null);
      setOptions([]);
    }
  }, [activeTeam, activeScenario, questions, allOptions]);

  // Handle activeTeam updates when they change globally (pseudo live sync since it's same browser, normally websockets)
  useEffect(() => {
    if (activeTeam) {
      const latest = teams.find((t) => t.id === activeTeam.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(activeTeam)) {
        setActiveTeam(latest);
      }
    }
  }, [teams, activeTeam]);

  const handleOptionSelect = async (opt: Option) => {
    if (!activeTeam) return;

    const newRound = activeTeam.current_round + 1;
    const updates = {
      current_budget: activeTeam.current_budget + opt.impact_budget,
      current_satisfaction: Math.max(
        0,
        Math.min(100, activeTeam.current_satisfaction + opt.impact_satisfaction)
      ),
      current_staff_satisfaction: Math.max(
        0,
        Math.min(
          100,
          activeTeam.current_staff_satisfaction +
            (opt.impact_staff_satisfaction || 0)
        )
      ),
      current_co2: Math.max(0, activeTeam.current_co2 + opt.impact_co2),
      current_greenkey: activeTeam.current_greenkey + opt.impact_greenkey,
      current_round: newRound,
    };

    const updated = await updateTeam(activeTeam.id, updates);
    if (updated) {
      setActiveTeam(updated);
      setFeedback(opt.feedback_message);
    }
  };

  const handleMinigameComplete = async (
    result: 'success' | 'fail',
    evType: string
  ) => {
    if (!activeTeam) return;

    let updates = { ...activeTeam };
    if (evType === 'waste-sorting') {
      if (result === 'success') {
        updates.current_staff_satisfaction = Math.min(
          100,
          activeTeam.current_staff_satisfaction + 10
        );
        updates.current_co2 = Math.max(0, activeTeam.current_co2 - 5);
        updates.current_greenkey += 1;
        setFeedback(
          'Excellent sort! The staff is trained and CO2 emissions dropped.'
        );
      } else {
        updates.current_staff_satisfaction -= 5;
        updates.current_satisfaction -= 5;
        setFeedback(
          'Waste sorting failed. Guests complained about the smell and staff are frustrated.'
        );
      }
    } else if (evType === 'bike-disclaimer') {
      if (result === 'success') {
        updates.current_budget += 5000;
        updates.current_staff_satisfaction = Math.min(
          100,
          activeTeam.current_staff_satisfaction + 5
        );
        setFeedback('Disclaimer published successfully! Legal risks avoided.');
      } else {
        updates.current_budget -= 10000;
        updates.current_satisfaction -= 5;
        setFeedback('Disclaimer failed. You were sued for a bike accident.');
      }
    } else if (evType === 'emergency-clicker') {
      if (result === 'success') {
        updates.current_satisfaction = Math.min(
          100,
          activeTeam.current_satisfaction + 10
        );
        updates.current_budget -= 2000;
        setFeedback(
          'Storm survived! You fixed all the leaks. Guests are impressed by your swift response, though maintenance cost some money.'
        );
      } else {
        updates.current_satisfaction -= 20;
        updates.current_budget -= 15000;
        setFeedback(
          'Disaster! The park flooded, bungalows were damaged, and guests left angry.'
        );
      }
    } else if (evType === 'bungalow-assignment') {
      if (result === 'success') {
        updates.current_satisfaction = Math.min(
          100,
          activeTeam.current_satisfaction + 5
        );
        updates.current_staff_satisfaction = Math.min(
          100,
          activeTeam.current_staff_satisfaction + 5
        );
        setFeedback(
          'Perfect check-ins! Guests love their accommodations and staff are relieved there were no mix-ups.'
        );
      } else {
        updates.current_satisfaction -= 10;
        setFeedback(
          'Terrible assignments. The VIPs got a tent, the family crammed into a 2-person cabin, and the backpackers are confused in the luxury lodge. Complaints are rolling in.'
        );
      }
    }

    updates.current_round += 1;

    // omit non-update properties
    const { id, assigned_scenario_id, team_name, ...cleanUpdates } = updates;
    const updated = await updateTeam(activeTeam.id, cleanUpdates);
    if (updated) {
      setActiveTeam(updated);
    }
  };

  const skipPlaceholderRound = async () => {
    if (!activeTeam) return;
    const updated = await updateTeam(activeTeam.id, {
      current_round: activeTeam.current_round + 1,
    });
    if (updated) setActiveTeam(updated);
  };

  const closeFeedback = () => setFeedback(null);

  const primaryColor = globalSettings?.theme_primary_color || '#10b981';

  // --- RENDERS ---

  if (
    activeTeam &&
    activeTeam.current_round === 11 &&
    !globalSettings?.is_paused &&
    !feedback
  ) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] text-[#1b2a24] flex items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full text-center relative p-12">
          <div className="w-20 h-20 bg-[#1b2a24]/5 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[#1b2a24]/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-6xl font-light font-serif mb-6 tracking-tight leading-none">
            <span className="italic">Milestone</span>
            <br />
            Achieved
          </h2>
          <p className="text-xl text-[#1b2a24]/60 mb-12 leading-relaxed">
            You have reached the Phase 2 transition point. Please wait for your
            instructor to initiate presentation check-ins before proceeding.
          </p>
          <button
            onClick={skipPlaceholderRound}
            className="bg-[#1b2a24] text-white px-8 py-4 rounded-full text-sm uppercase font-bold tracking-widest hover:bg-[#1b2a24]/80 transition-all shadow-lg flex items-center mx-auto space-x-3"
          >
            <span>Begin Phase 2</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Phase A: Login Screen
  if (!activeTeam) {
    return (
      <div
        className="min-h-screen bg-[#f4f7f5] flex flex-col items-center justify-center p-6 text-[#1b2a24] font-sans"
        style={{ '--color-primary': primaryColor } as React.CSSProperties}
      >
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4">
            <span>{notification}</span>
          </div>
        )}
        <div className="text-center mb-10 w-full max-w-md">
          <h1 className="text-5xl font-serif tracking-tight mb-4 leading-none text-[#10b981]">
            <span className="italic">Green Key</span>
            <br />
            Resort
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1b2a24]/50">
            Management Simulator
          </p>
        </div>

        <div className="max-w-md w-full bg-white border-t-4 border-[#10b981] p-12 rounded-3xl shadow-xl shadow-[#1b2a24]/5">
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-[10px] font-bold text-[#1b2a24]/60 mb-3 uppercase tracking-widest">
                Enter Assigned Team Name
              </label>
              <input
                type="text"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                className="w-full border-b-2 border-[#1b2a24]/10 px-0 py-3 focus:border-[#10b981] outline-none transition text-2xl font-serif text-[#1b2a24] placeholder:text-[#1b2a24]/20 bg-transparent"
                placeholder="e.g. Apple"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1b2a24] text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition flex justify-center items-center h-14 uppercase tracking-widest text-xs shadow-md"
            >
              Access Director Dashboard
            </button>
          </form>
          <div className="mt-10 text-center flex flex-col items-center space-y-4">
            <p className="text-[10px] text-[#1b2a24]/40 font-bold uppercase tracking-widest">
              Enter the team name assigned by instructor
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/admin';
              }}
              className="text-[10px] text-[#1b2a24]/20 hover:text-[#1b2a24]/60 font-bold uppercase tracking-widest transition-colors"
            >
              Instructor Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase D: Final Score or Game Over
  const isGameOver =
    activeTeam.current_budget <= 0 ||
    activeTeam.current_satisfaction <= 0 ||
    activeTeam.current_co2 >= 100 ||
    activeTeam.current_staff_satisfaction <= 0;

  if (activeTeam.current_round > 20 || isGameOver) {
    const isSuccess =
      !isGameOver &&
      activeTeam.current_greenkey >= 5 &&
      activeTeam.current_budget > 0;
    return (
      <div className="min-h-screen bg-[#f4f7f5] text-[#1b2a24] font-sans flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in duration-500">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/40 mb-4">
            {isGameOver ? 'Management Failure' : 'Simulation Complete'}
          </div>
          <h1 className="text-7xl font-serif font-light tracking-tight leading-none mb-6">
            <span className="italic">
              {isGameOver ? 'You Were' : 'Performance'}
            </span>
            <br />
            {isGameOver ? 'Fired' : 'Review'}
          </h1>
          <p className="text-lg text-[#1b2a24]/60 max-w-2xl mx-auto mb-16">
            {activeTeam.current_budget <= 0 &&
              'BANKRUPTCY: The budget hit zero. The bank seized the park.'}
            {activeTeam.current_satisfaction <= 0 &&
              'REVIEW BOMB: Guest satisfaction hit zero. A viral TikTok exposed your terrible management.'}
            {activeTeam.current_staff_satisfaction <= 0 &&
              'STAFF STRIKE: Staff morale hit zero. They formed a union, walked out, and locked you in the sauna.'}
            {activeTeam.current_co2 >= 100 &&
              'ENVIRONMENTAL HAZARD: CO2 hit 100%. The government revoked your license.'}
            {!isGameOver &&
              'Keep this screen visible for the classroom debrief.'}
          </p>

          <div className="bg-white rounded-3xl p-12 grid grid-cols-2 md:grid-cols-4 gap-8 border border-[#1b2a24]/10 shadow-xl shadow-[#1b2a24]/5">
            <div className="group text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/40 block mb-2 font-serif italic">
                Final Budget
              </span>
              <div
                className={cn(
                  'text-4xl font-light tracking-tight',
                  activeTeam.current_budget <= 0
                    ? 'text-red-400'
                    : 'text-[#10b981]'
                )}
              >
                €{activeTeam.current_budget.toLocaleString()}
              </div>
            </div>
            <div className="group text-left border-l border-[#1b2a24]/10 pl-8">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/40 block mb-2 font-serif italic">
                Satisfaction
              </span>
              <div
                className={cn(
                  'text-4xl font-light tracking-tight',
                  activeTeam.current_satisfaction <= 0
                    ? 'text-red-400'
                    : 'text-[#1b2a24]'
                )}
              >
                {activeTeam.current_satisfaction}%
              </div>
            </div>
            <div className="group text-left border-l border-[#1b2a24]/10 pl-8">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/40 block mb-2 font-serif italic">
                CO₂ Level
              </span>
              <div
                className={cn(
                  'text-4xl font-light tracking-tight',
                  activeTeam.current_co2 >= 100
                    ? 'text-red-400'
                    : 'text-red-400'
                )}
              >
                {activeTeam.current_co2}
                <span className="text-lg">t</span>
              </div>
            </div>
            <div className="group text-left border-l border-[#1b2a24]/10 pl-8">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/40 block mb-2 font-serif italic">
                Green Key
              </span>
              <div className="text-4xl font-light tracking-tight text-[#10b981]">
                {activeTeam.current_greenkey}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto bg-white border border-[#1b2a24]/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Leaf
                className={cn(
                  'w-6 h-6',
                  isSuccess ? 'text-[#10b981]' : 'text-gray-400'
                )}
              />
            </div>
            <h3 className="text-3xl font-serif mb-4">
              {isSuccess ? (
                <span>
                  <span className="italic">Green Key</span> Certified
                </span>
              ) : (
                <span>
                  Requirements <span className="italic">Not Met</span>
                </span>
              )}
            </h3>
            <p className="text-[#1b2a24]/60 leading-relaxed text-sm">
              {isSuccess
                ? 'Excellent management. You maintained profitability while achieving strict sustainability guidelines.'
                : 'Your balance between guest satisfaction, financial stability, and environmental impact was not sufficient.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Helper for metrics visualization
  const MetricGauge = ({
    label,
    value,
    max,
    colorClass,
    isCurrency = false,
  }: any) => {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div className="group">
        <label className="text-[10px] font-bold uppercase text-[#1b2a24]/60">
          {label}
        </label>
        <div className={cn('text-3xl font-light tracking-tight', colorClass)}>
          {isCurrency ? `€${value.toLocaleString()}` : value}
        </div>
        <div className="w-full h-1 bg-[#1b2a24]/5 mt-2">
          <div
            className={cn('h-full', colorClass.replace('text-', 'bg-'))}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Phase B: Game Loop UI
  return (
    <div
      className="flex flex-col h-screen w-full bg-[#f4f7f5] text-[#1b2a24] font-sans overflow-hidden"
      style={{ '--color-primary': primaryColor } as React.CSSProperties}
    >
      {/* Top HUD */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-[#1b2a24]/10 bg-white">
        <div className="flex items-center space-x-8">
          <div className="text-2xl font-serif italic text-[#10b981] font-bold tracking-tight">
            Green Key Resort
          </div>
          <div className="h-8 w-px bg-[#1b2a24]/10"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/50 italic">
              Scenario
            </span>
            <span className="text-sm font-semibold">
              {activeScenario?.name || 'Standard Setup'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-12">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/50">
              Director
            </span>
            <div className="text-lg font-bold italic font-serif tracking-tight text-[#10b981]">
              {activeTeam.team_name}
            </div>
          </div>
          <div className="bg-white border border-[#10b981] text-[#10b981] px-6 py-2 rounded-full shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest">
              Event {String(activeTeam.current_round).padStart(2, '0')} / 20
            </span>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Metrics */}
        <aside className="w-80 border-r border-[#1b2a24]/10 p-10 flex flex-col justify-between overflow-y-auto bg-white">
          <div className="space-y-12">
            <section>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1b2a24]/40 block mb-6">
                Park Status
              </span>
              <div className="space-y-8">
                <MetricGauge
                  label="Finances"
                  value={activeTeam.current_budget}
                  max={activeScenario?.starting_budget || 100000}
                  colorClass="text-[#10b981]"
                  isCurrency
                />
                <MetricGauge
                  label="Guest Satisfaction"
                  value={activeTeam.current_satisfaction}
                  max={100}
                  colorClass="text-[#10b981]"
                />
                <MetricGauge
                  label="Staff Satisfaction"
                  value={activeTeam.current_staff_satisfaction}
                  max={100}
                  colorClass="text-blue-500"
                />
                <MetricGauge
                  label="CO₂ Output"
                  value={activeTeam.current_co2}
                  max={100}
                  colorClass="text-red-500"
                />
              </div>
            </section>

            <section>
              <div className="bg-[#10b981]/10 border border-[#10b981]/20 p-6 rounded-2xl">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#10b981] block mb-2">
                  Green Key Certification
                </span>
                <div className="flex items-end space-x-1">
                  <div className="text-4xl font-black italic text-[#10b981] leading-none">
                    {activeTeam.current_greenkey}
                  </div>
                  <div className="text-[10px] font-bold text-[#10b981]/60 pb-1 uppercase tracking-widest">
                    / 50 PTS
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* Center Main Execution Board */}
        <section className="flex-1 bg-[#f4f7f5] p-16 flex flex-col overflow-y-auto relative">
          {currentQuestion ? (
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative z-10 animate-in fade-in duration-500">
              <div className="bg-white p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex-1">
                <h1 className="text-4xl font-serif mb-6 leading-tight">
                  {currentQuestion.title}
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed mb-10">
                  {currentQuestion.description}
                </p>
                <div className="space-y-4">
                  {currentQuestion.minigame_type === 'waste-sorting' ||
                  currentQuestion.title
                    .toLowerCase()
                    .includes('waste sorting') ? (
                    <div className="mt-8 border-t pt-8 border-gray-100">
                      <p className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">
                        Interactive Challenge
                      </p>
                      <WasteSortingMinigame
                        onComplete={(res) =>
                          handleMinigameComplete(res, 'waste-sorting')
                        }
                      />
                    </div>
                  ) : currentQuestion.minigame_type === 'bike-disclaimer' ||
                    currentQuestion.title
                      .toLowerCase()
                      .includes('bike disclaimer') ||
                    currentQuestion.title
                      .toLowerCase()
                      .includes('legal disclaimer') ? (
                    <div className="mt-8 border-t pt-8 border-gray-100">
                      <p className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">
                        Interactive Challenge
                      </p>
                      <BikeDisclaimerMinigame
                        onComplete={(res) =>
                          handleMinigameComplete(res, 'bike-disclaimer')
                        }
                      />
                    </div>
                  ) : currentQuestion.minigame_type === 'emergency-clicker' ||
                    currentQuestion.title.toLowerCase().includes('emergency') ||
                    currentQuestion.title.toLowerCase().includes('storm') ? (
                    <div className="mt-8 border-t pt-8 border-gray-100">
                      <p className="font-bold text-red-500 uppercase tracking-widest text-xs mb-4">
                        Emergency Incident
                      </p>
                      <EmergencyClickerMinigame
                        onComplete={(res) =>
                          handleMinigameComplete(res, 'emergency-clicker')
                        }
                      />
                    </div>
                  ) : currentQuestion.minigame_type === 'bungalow-assignment' ||
                    currentQuestion.title
                      .toLowerCase()
                      .includes('bungalow assignment') ||
                    currentQuestion.title.toLowerCase().includes('check-in') ? (
                    <div className="mt-8 border-t pt-8 border-gray-100">
                      <p className="font-bold text-blue-500 uppercase tracking-widest text-xs mb-4">
                        Front Desk Event
                      </p>
                      <BungalowAssignmentMinigame
                        onComplete={(res) =>
                          handleMinigameComplete(res, 'bungalow-assignment')
                        }
                      />
                    </div>
                  ) : (
                    options.map((option, idx) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option)}
                        className="w-full text-left p-6 border-2 border-gray-100 hover:border-[#10b981] group rounded-2xl transition-all hover:bg-[#10b981]/5 relative overflow-hidden"
                      >
                        <h4 className="text-lg font-bold text-gray-800 group-hover:text-[#10b981] transition mb-3 pr-20">
                          {option.text}
                        </h4>
                        <div className="text-xs text-gray-400 flex font-mono gap-4 uppercase font-bold flex-wrap">
                          {option.impact_budget !== 0 && (
                            <span
                              className={
                                option.impact_budget > 0
                                  ? 'text-[#10b981]'
                                  : 'text-red-400'
                              }
                            >
                              € {option.impact_budget > 0 ? '+' : ''}
                              {option.impact_budget.toLocaleString()}
                            </span>
                          )}
                          {option.impact_co2 !== 0 && (
                            <span
                              className={
                                option.impact_co2 < 0
                                  ? 'text-[#10b981]'
                                  : 'text-red-400'
                              }
                            >
                              CO2 {option.impact_co2 > 0 ? '+' : ''}
                              {option.impact_co2}t
                            </span>
                          )}
                          {option.impact_satisfaction !== 0 && (
                            <span
                              className={
                                option.impact_satisfaction > 0
                                  ? 'text-[#10b981]'
                                  : 'text-red-400'
                              }
                            >
                              Smile {option.impact_satisfaction > 0 ? '+' : ''}
                              {option.impact_satisfaction}%
                            </span>
                          )}
                          {option.impact_greenkey !== 0 && (
                            <span
                              className={
                                option.impact_greenkey > 0
                                  ? 'text-[#10b981]'
                                  : 'text-red-400'
                              }
                            >
                              Key {option.impact_greenkey > 0 ? '+' : ''}
                              {option.impact_greenkey}
                            </span>
                          )}
                          {option.impact_staff_satisfaction !== 0 && (
                            <span
                              className={
                                option.impact_staff_satisfaction > 0
                                  ? 'text-[#10b981]'
                                  : 'text-red-400'
                              }
                            >
                              Staff{' '}
                              {option.impact_staff_satisfaction > 0 ? '+' : ''}
                              {option.impact_staff_satisfaction}%
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-between items-center w-full text-sm font-serif italic text-gray-400">
                <span>Director's Decision Required</span>
                <span>Event {activeTeam.current_round}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-32 opacity-70">
              <h2 className="text-4xl font-serif italic tracking-tight mb-4 text-[#10b981]">
                Enjoying the Quiet
              </h2>
              <p className="text-lg text-[#1b2a24]/60 max-w-md mx-auto mb-10">
                The park is quiet right now. Wait for your instructor to push
                the next event or manually advance the timeline.
              </p>
              <button
                onClick={skipPlaceholderRound}
                className="bg-[#1b2a24] text-white px-8 py-3 rounded-full text-sm uppercase font-bold tracking-widest hover:bg-gray-800 transition-all shadow-md"
              >
                Advance Timeline
              </button>
            </div>
          )}
        </section>

        {/* Right Sidebar - Active Tracker */}
        <aside className="w-16 border-l border-[#1b2a24]/10 flex flex-col items-center py-8 space-y-12 bg-white">
          <div className="rotate-90 origin-center whitespace-nowrap text-[10px] uppercase font-bold tracking-[0.3em] text-[#1b2a24]/40">
            Resort Competitors
          </div>
          <div className="flex flex-col space-y-4">
            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-[10px] font-bold shadow-md">
              1st
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1b2a24]/5 flex items-center justify-center text-[#1b2a24]/40 text-[10px] font-bold">
              2nd
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1b2a24]/5 flex items-center justify-center text-[#1b2a24]/40 text-[10px] font-bold">
              3rd
            </div>
          </div>
        </aside>
      </main>

      {/* Paused Overlay Modal */}
      {globalSettings?.is_paused && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-12 max-w-lg w-full text-center rounded-3xl border-2 border-orange-500 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="text-orange-500 mb-6 font-bold flex items-center justify-center space-x-3 w-16 h-16 mx-auto bg-orange-100 rounded-full">
              <Pause className="w-8 h-8 fill-current" />
            </div>
            <h2 className="text-3xl font-serif tracking-tight mb-4 text-[#1b2a24]">
              Simulation Paused
            </h2>
            <p className="text-[#1b2a24]/70 leading-relaxed font-sans text-lg">
              The instructor has temporarily paused the simulation. Please stand
              by, the game will resume shortly.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Overlay Modal */}
      {feedback && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-12 max-w-lg w-full text-center rounded-3xl border-2 border-[#10b981] shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-[#10b981] mb-6">
              <Leaf className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-3xl font-serif tracking-tight mb-4 text-[#1b2a24]">
              Outcome
            </h2>
            <p className="text-[#1b2a24]/70 mb-10 leading-relaxed font-sans text-lg">
              {feedback}
            </p>
            <button
              onClick={closeFeedback}
              className="bg-[#1b2a24] text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center mx-auto space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
