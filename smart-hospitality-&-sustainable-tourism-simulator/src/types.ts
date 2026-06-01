export type GlobalSettings = {
  id: number;
  is_paused: boolean;
  theme_primary_color: string;
  ui_font_family: string;
  ui_font_size?: string;
  instructor_password?: string;
};

export type Scenario = {
  id: number;
  name: string;
  scale: 'Small' | 'Large';
  property_type: 'Campsite' | 'Bungalow Park';
  starting_budget: number;
  starting_satisfaction: number;
  starting_staff_satisfaction: number;
  starting_co2: number;
  starting_greenkey: number;
};

export type Question = {
  id: number;
  scenario_id: number;
  round_number: number;
  title: string;
  description: string;
  minigame_type?: string | null;
};

export type Option = {
  id: number;
  question_id: number;
  text: string;
  impact_budget: number;
  impact_satisfaction: number;
  impact_staff_satisfaction: number;
  impact_co2: number;
  impact_greenkey: number;
  feedback_message: string;
};

export type Team = {
  id: number;
  team_name: string;
  assigned_scenario_id: number;
  current_round: number;
  current_budget: number;
  current_satisfaction: number;
  current_staff_satisfaction: number;
  current_co2: number;
  current_greenkey: number;
};

export type Database = {
  public: {
    Tables: {
      global_settings: {
        Row: GlobalSettings;
        Insert: Omit<GlobalSettings, 'id'>;
        Update: Partial<Omit<GlobalSettings, 'id'>>;
      };
      scenarios: {
        Row: Scenario;
        Insert: Omit<Scenario, 'id'>;
        Update: Partial<Omit<Scenario, 'id'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id'>;
        Update: Partial<Omit<Question, 'id'>>;
      };
      options: {
        Row: Option;
        Insert: Omit<Option, 'id'>;
        Update: Partial<Omit<Option, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
    };
  };
};
