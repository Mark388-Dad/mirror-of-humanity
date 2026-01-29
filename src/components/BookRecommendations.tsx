import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Recommendation {
  title: string;
  author: string;
  category_number: number;
  category_name: string;
  reason: string;
  reading_level: string;
}

const BookRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's completed categories
      const { data: submissions } = await supabase
        .from('book_submissions')
        .select('category_number, category_name')
        .eq('user_id', user.id);

      const completedCategories = submissions?.map(s => s.category_name) || [];

      const { data, error } = await supabase.functions.invoke('recommend-books', {
        body: {
          completed_categories: completedCategories,
          interests: ['adventure', 'mystery', 'fantasy'],
        },
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'challenging':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Book Recommendations
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!hasLoaded && !loading ? (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Get personalized book recommendations based on your reading history
            </p>
            <Button onClick={fetchRecommendations} variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Get Recommendations
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Finding perfect books for you...
            </span>
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recommendations available. Try again later.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="font-medium text-sm">{rec.title}</span>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${getLevelColor(rec.reading_level)}`}>
                    {rec.reading_level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground ml-6">by {rec.author}</p>
                <p className="text-xs text-muted-foreground ml-6 mt-1">{rec.reason}</p>
                <Badge variant="outline" className="ml-6 mt-2 text-xs">
                  #{rec.category_number} {rec.category_name}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookRecommendations;
