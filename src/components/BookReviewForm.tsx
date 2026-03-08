import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BookReviewFormProps {
  bookSubmissionId: string;
  existingReview?: { rating: number; review_text: string } | null;
  onReviewSubmitted: () => void;
}

const BookReviewForm = ({ bookSubmissionId, existingReview, onReviewSubmitted }: BookReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (reviewText.trim().length > 500) {
      toast.error('Review must be 500 characters or less');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('book_reviews')
        .upsert({
          book_submission_id: bookSubmissionId,
          user_id: user.id,
          rating,
          review_text: reviewText.trim(),
        }, { onConflict: 'book_submission_id,user_id' });

      if (error) throw error;
      toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
      onReviewSubmitted();
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        {rating > 0 && <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>}
      </div>
      <Textarea
        placeholder="Write a short review (optional, max 500 chars)..."
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
        className="text-sm min-h-[60px]"
        rows={2}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{reviewText.length}/500</span>
        <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
          {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
};

export default BookReviewForm;
