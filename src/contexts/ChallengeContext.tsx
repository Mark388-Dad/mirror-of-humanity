import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChallengeConfig {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_books: number | null;
  points_reward: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  is_independent: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  layout_config: LayoutConfig | null;
  custom_css: string | null;
  welcome_message: string | null;
  category: string | null;
  difficulty_level: string | null;
  badge_name: string | null;
  participation_type: string | null;
  allowed_year_groups: string[] | null;
  allowed_houses: string[] | null;
  allowed_classes: string[] | null;
}

export interface LayoutConfig {
  sections: string[];
  show_streak: boolean;
  show_xp: boolean;
  show_recommendations: boolean;
  hero_style: 'full' | 'compact' | 'minimal';
}

const DEFAULT_LAYOUT: LayoutConfig = {
  sections: ['hero', 'leaderboard', 'submissions', 'progress', 'gallery'],
  show_streak: true,
  show_xp: true,
  show_recommendations: true,
  hero_style: 'full',
};

interface ChallengeContextType {
  activeChallenge: ChallengeConfig | null;
  loading: boolean;
  selectChallenge: (id: string) => Promise<void>;
  clearChallenge: () => void;
  layoutConfig: LayoutConfig;
  refreshChallenge: () => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType>({
  activeChallenge: null,
  loading: false,
  selectChallenge: async () => {},
  clearChallenge: () => {},
  layoutConfig: DEFAULT_LAYOUT,
  refreshChallenge: async () => {},
});

export const useChallenge = () => useContext(ChallengeContext);

export const ChallengeProvider = ({ children }: { children: ReactNode }) => {
  const [activeChallenge, setActiveChallenge] = useState<ChallengeConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('active_challenge_id');
    if (savedId) {
      selectChallenge(savedId);
    }
  }, []);

  const selectChallenge = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        const challenge = data as unknown as ChallengeConfig;
        setActiveChallenge(challenge);
        localStorage.setItem('active_challenge_id', id);
      }
    } catch (err) {
      console.error('Failed to load challenge:', err);
      localStorage.removeItem('active_challenge_id');
    } finally {
      setLoading(false);
    }
  };

  const clearChallenge = () => {
    setActiveChallenge(null);
    localStorage.removeItem('active_challenge_id');
  };

  const refreshChallenge = async () => {
    if (activeChallenge?.id) {
      await selectChallenge(activeChallenge.id);
    }
  };

  const layoutConfig: LayoutConfig = activeChallenge?.layout_config
    ? { ...DEFAULT_LAYOUT, ...(typeof activeChallenge.layout_config === 'string' ? JSON.parse(activeChallenge.layout_config) : activeChallenge.layout_config) }
    : DEFAULT_LAYOUT;

  return (
    <ChallengeContext.Provider value={{ activeChallenge, loading, selectChallenge, clearChallenge, layoutConfig, refreshChallenge }}>
      {children}
    </ChallengeContext.Provider>
  );
};
