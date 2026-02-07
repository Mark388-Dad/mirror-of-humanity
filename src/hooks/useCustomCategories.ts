import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { READING_CATEGORIES } from '@/lib/constants';

export interface Category {
  id: number;
  name: string;
  prompt: string;
}

export const useCustomCategories = () => {
  const [allCategories, setAllCategories] = useState<Category[]>(READING_CATEGORIES);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustom = async () => {
      const { data } = await supabase
        .from('custom_categories')
        .select('id, name, prompt')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (data) {
        const custom = data as Category[];
        setCustomCategories(custom);
        setAllCategories([...READING_CATEGORIES, ...custom]);
      }
      setLoading(false);
    };
    fetchCustom();
  }, []);

  return { allCategories, customCategories, loading };
};
