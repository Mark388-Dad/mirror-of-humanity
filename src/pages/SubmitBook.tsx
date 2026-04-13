import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenge } from '@/contexts/ChallengeContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_BOOKS, MAX_BOOKS_PER_CATEGORY } from '@/lib/constants';
import { calculateTotalPoints, calculateBonusPoints, getNextMilestone, POINTS_PER_BOOK, MAX_TOTAL_POINTS } from '@/lib/milestonePoints';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { z } from 'zod';
import BookSearch from '@/components/BookSearch';

const submissionSchema = z.object({
  categoryNumber: z.number().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author is required').max(100),
  dateStarted: z.string().min(1, 'Start date is required'),
  dateFinished: z.string().min(1, 'Finish date is required'),
  reflection: z.string().min(500, 'Reflection must be at least 500 characters').max(2000),
});

const SubmitBook = () => {
  const { user } = useAuth();
  const { activeChallenge } = useChallenge();
  const navigate = useNavigate();
  const { allCategories, loading: categoriesLoading } = useCustomCategories();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dateStarted: '',
    dateFinished: '',
    reflection: '',
  });

  // Submission limits
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  const [limitsLoading, setLimitsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchLimits();
  }, [user]);

  const fetchLimits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('book_submissions')
      .select('category_number')
      .eq('user_id', user.id);

    if (data) {
      setTotalSubmissions(data.length);
      const counts: Record<number, number> = {};
      data.forEach(s => { counts[s.category_number] = (counts[s.category_number] || 0) + 1; });
      setCategoryCounts(counts);
    }
    setLimitsLoading(false);
  };

  const currentCategory = allCategories.find(c => c.id === selectedCategory);
  const categoryCount = selectedCategory ? (categoryCounts[selectedCategory] || 0) : 0;
  const categoryFull = categoryCount >= MAX_BOOKS_PER_CATEGORY;
  const challengeComplete = totalSubmissions >= MAX_BOOKS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    if (challengeComplete) {
      toast.error("You've completed the 45-Book Challenge! No more submissions.");
      return;
    }

    if (categoryFull) {
      toast.error(`You've already submitted ${MAX_BOOKS_PER_CATEGORY} books in this category.`);
      return;
    }

    try {
      const validatedData = submissionSchema.parse({
        categoryNumber: selectedCategory,
        ...formData,
      });

      if (new Date(validatedData.dateFinished) < new Date(validatedData.dateStarted)) {
        toast.error('Finish date cannot be before start date');
        return;
      }

      setLoading(true);

      const { data: submissionData, error } = await supabase.from('book_submissions').insert({
        user_id: user.id,
        category_number: validatedData.categoryNumber,
        category_name: currentCategory?.name || '',
        title: validatedData.title.trim(),
        author: validatedData.author.trim(),
        date_started: validatedData.dateStarted,
        date_finished: validatedData.dateFinished,
        reflection: validatedData.reflection.trim(),
        points_earned: 3,
        approval_status: 'pending',
      }).select().single();

      if (error) throw error;

      // Also save to challenge_submissions if inside a challenge
      if (activeChallenge) {
        await supabase.from('challenge_submissions').insert({
          challenge_id: activeChallenge.id,
          user_id: user.id,
          title: validatedData.title.trim(),
          author: validatedData.author.trim(),
          category_name: currentCategory?.name || '',
          category_number: validatedData.categoryNumber,
          reflection: validatedData.reflection.trim(),
          points_earned: 3,
        });

        // Update participant books_completed count
        const { data: participant } = await supabase
          .from('challenge_participants')
          .select('id, books_completed')
          .eq('challenge_id', activeChallenge.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (participant) {
          await supabase
            .from('challenge_participants')
            .update({ books_completed: (participant.books_completed || 0) + 1 })
            .eq('id', participant.id);
        }
      }

      // Trigger AI review in background
      supabase.functions.invoke('review-submission', {
        body: {
          submission_id: submissionData.id,
          title: validatedData.title.trim(),
          author: validatedData.author.trim(),
          category_name: currentCategory?.name || '',
          reflection: validatedData.reflection.trim(),
        },
      }).catch((err) => console.error('AI review error:', err));

      // Send notification
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      if (profileData?.email) {
        supabase.functions.invoke('send-notification', {
          body: {
            user_id: user.id,
            email: profileData.email,
            type: 'submission',
            title: 'Book Submitted Successfully!',
            message: `Great job, ${profileData.full_name?.split(' ')[0]}! You've submitted "${validatedData.title}" by ${validatedData.author}. Your reflection is being reviewed.`,
          },
        }).catch((err) => console.error('Notification error:', err));

        const { data: progressData } = await supabase
          .from('student_progress')
          .select('books_read')
          .eq('user_id', user.id)
          .single();

        const booksRead = (progressData?.books_read || 0) + 1;
        let achievementLevel = null;
        
        if (booksRead === 1) achievementLevel = 'beginner';
        else if (booksRead === 15) achievementLevel = 'bronze';
        else if (booksRead === 30) achievementLevel = 'silver';
        else if (booksRead === 45) achievementLevel = 'gold';

        if (achievementLevel) {
          supabase.functions.invoke('send-notification', {
            body: {
              user_id: user.id,
              email: profileData.email,
              type: 'achievement',
              title: `${achievementLevel.toUpperCase()} Level Achieved!`,
              message: `Incredible! You've read ${booksRead} books and earned the ${achievementLevel} achievement!`,
              achievement_level: achievementLevel,
            },
          }).catch((err) => console.error('Achievement notification error:', err));
        }
      }

      toast.success('Book submitted successfully! +3 points earned!');
      navigate('/progress');
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const message = error instanceof Error ? error.message : 'Failed to submit book';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (challengeComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
          <Card className="card-elevated py-12">
            <CardContent>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-display font-bold mb-2">You've Completed the 45-Book Challenge!</h2>
              <p className="text-muted-foreground mb-4">Congratulations! You've submitted {totalSubmissions} books. Amazing work!</p>
              <Button onClick={() => navigate('/progress')}>View Your Progress</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Submit a Book" description="Submit your completed book with a reflection for the 45-Book Reading Challenge." path="/submit" />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Submit a Book 📚
          </h1>
          <p className="text-muted-foreground">
            Record your reading journey and earn points for the challenge.
          </p>
          {!limitsLoading && (
            <div className="flex gap-3 mt-3 flex-wrap">
              <Badge variant="outline" className="text-sm">
                📚 {totalSubmissions}/{MAX_BOOKS} books submitted
              </Badge>
              <Badge variant="outline" className="text-sm">
                ⭐ {calculateTotalPoints(totalSubmissions)} / {MAX_TOTAL_POINTS} total points
              </Badge>
              {getNextMilestone(totalSubmissions) && (
                <Badge className="text-sm bg-primary/10 text-primary border-primary/20">
                  🎁 {getNextMilestone(totalSubmissions)!.remaining} books to next bonus (+{getNextMilestone(totalSubmissions)!.bonus} pts)
                </Badge>
              )}
            </div>
          )}
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              Book Submission Form
            </CardTitle>
            <CardDescription>
              Fill in the details of the book you've completed reading. You can submit any book.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Reading Category *
                </Label>
                <Select 
                  value={selectedCategory?.toString() || ''} 
                  onValueChange={(value) => setSelectedCategory(parseInt(value))}
                >
                  <SelectTrigger className="h-auto py-3">
                    <SelectValue placeholder="Select a category for your book" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {allCategories.map((category) => {
                      const count = categoryCounts[category.id] || 0;
                      const full = count >= MAX_BOOKS_PER_CATEGORY;
                      return (
                        <SelectItem key={category.id} value={category.id.toString()} disabled={full}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium">#{category.id}</span> - {category.name}
                            {count > 0 && (
                              <Badge variant={full ? 'destructive' : 'secondary'} className="ml-1 text-xs">
                                {count}/{MAX_BOOKS_PER_CATEGORY}
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {currentCategory && (
                  <div className="rounded-xl overflow-hidden border border-primary/20 mt-2">
                    <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        #{currentCategory.id} — {currentCategory.name}
                      </span>
                      {categoryFull && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />Full
                        </Badge>
                      )}
                    </div>
                    <div className="bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Reflection Prompt — follow this when writing your reflection:</p>
                      <p className="text-sm text-foreground leading-relaxed italic">
                        "{currentCategory.prompt}"
                      </p>
                    </div>
                    {categoryFull && (
                      <div className="bg-destructive/10 px-4 py-2">
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          You've reached the maximum of {MAX_BOOKS_PER_CATEGORY} books in this category.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Book Details with Search */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Book Title *
                  </Label>
                  <BookSearch
                    value={formData.title}
                    onChange={(title, author) => {
                      setFormData(prev => ({
                        ...prev,
                        title,
                        author: author || prev.author,
                      }));
                    }}
                    categoryName={currentCategory?.name}
                    placeholder="Search for a book..."
                  />
                  <p className="text-xs text-muted-foreground">
                    You can submit any book — it doesn't need to be from the school library.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Author *
                  </Label>
                  <Input
                    id="author"
                    placeholder="Enter the author's name"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateStarted" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Started *
                  </Label>
                  <Input
                    id="dateStarted"
                    type="date"
                    value={formData.dateStarted}
                    onChange={(e) => setFormData({ ...formData, dateStarted: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFinished" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Finished *
                  </Label>
                  <Input
                    id="dateFinished"
                    type="date"
                    value={formData.dateFinished}
                    onChange={(e) => setFormData({ ...formData, dateFinished: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Reflection */}
              <div className="space-y-2">
                <Label htmlFor="reflection">
                  Reflection * <span className="text-muted-foreground font-normal">(min 500 characters)</span>
                </Label>
                {currentCategory && (
                  <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
                    💡 <strong>Remember:</strong> {currentCategory.prompt}
                  </p>
                )}
                <Textarea
                  id="reflection"
                  placeholder={currentCategory ? `Following the prompt: "${currentCategory.prompt.substring(0, 80)}..."` : "Share your thoughts, insights, and reflections on the book..."}
                  value={formData.reflection}
                  onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                  className="min-h-[150px]"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.reflection.length}/2000 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gold text-navy hover:bg-gold-light h-12 text-lg"
                disabled={loading || !selectedCategory || categoryFull}
              >
                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Submit Book (+3 points)
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmitBook;
