import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CountdownData {
  endDate: string | null;
  startDate: string | null;
  title: string | null;
  sessionName: string | null;
  description: string | null;
  isVisible: boolean;
}

export const useSessionCountdown = () => {
  const [data, setData] = useState<CountdownData>({
    endDate: null, title: null, sessionName: null, description: null, isVisible: false,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase
        .from('homepage_content')
        .select('*')
        .eq('section_key', 'session_countdown')
        .maybeSingle();

      if (row) {
        let extra: { sessionName?: string; description?: string } = {};
        try { extra = JSON.parse(row.image_url || '{}'); } catch {}
        setData({
          endDate: row.content,
          title: row.title,
          sessionName: extra.sessionName || null,
          description: extra.description || null,
          isVisible: row.is_visible ?? false,
        });
      }
    };
    fetch();
  }, []);

  return data;
};
