import { Star, User } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface BookReviewDisplayProps {
  reviews: Review[];
  averageRating: number;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3.5 h-3.5 ${
          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
        }`}
      />
    ))}
  </div>
);

const BookReviewDisplay = ({ reviews, averageRating }: BookReviewDisplayProps) => {
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <StarRating rating={Math.round(averageRating)} />
        <span className="text-xs text-muted-foreground">
          {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
        </span>
      </div>
      {reviews.slice(0, 3).map((review) => (
        <div key={review.id} className="text-xs bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <StarRating rating={review.rating} />
            <span className="text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {review.profiles?.full_name || 'Anonymous'}
            </span>
          </div>
          {review.review_text && (
            <p className="text-muted-foreground line-clamp-2">{review.review_text}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export { StarRating };
export default BookReviewDisplay;
