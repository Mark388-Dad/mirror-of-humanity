import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Medal, Award, Crown, Target, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { READING_CATEGORIES } from '@/lib/constants';
import { format } from 'date-fns';
import EditSubmissionDialog from '@/components/EditSubmissionDialog';
import DeleteSubmissionDialog from '@/components/DeleteSubmissionDialog';
import AchievementBadges from '@/components/AchievementBadges';

interface BookSubmission {
  id: string;
  category_number: number;
  category_name: string;
  title: string;
  author: string;
  date_started: string;
  date_finished: string;
  reflection: string;
  points_earned: number;
  created_at: string;
}

const MyProgress = () => {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubmission, setEditingSubmission] = useState<BookSubmission | null>(null);
  const [deletingSubmission, setDeletingSubmission] = useState<BookSubmission | null>(null);

  const fetchSubmissions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('book_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const booksRead = submissions.length;
  const totalPoints = submissions.reduce((sum, s) => sum + s.points_earned, 0);
  const completedCategories = new Set(submissions.map(s => s.category_number));

  const getAchievementLevel = () => {
    if (booksRead >= 45) return { level: 'Gold', icon: Crown, color: 'text-gold bg-gold/10', next: null };
    if (booksRead >= 30) return { level: 'Silver', icon: Award, color: 'text-slate-400 bg-slate-400/10', next: { name: 'Gold', remaining: 45 - booksRead } };
    if (booksRead >= 15) return { level: 'Bronze', icon: Medal, color: 'text-amber-700 bg-amber-700/10', next: { name: 'Silver', remaining: 30 - booksRead } };
    return { level: 'Getting Started', icon: Target, color: 'text-muted-foreground bg-muted', next: { name: 'Bronze', remaining: 15 - booksRead } };
  };

  const achievement = getAchievementLevel();
  const AchievementIcon = achievement.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            My Reading Progress 📖
          </h1>
          <p className="text-muted-foreground">
            Track your journey through the 45-Book Reading Challenge.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Progress Overview */}
          <Card className="lg:col-span-2 card-elevated">
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Achievement Badge */}
              <div className="flex items-center gap-6 mb-8 p-6 rounded-2xl bg-secondary">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${achievement.color}`}>
                  <AchievementIcon className="w-12 h-12" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-display font-bold text-foreground mb-1">
                    {achievement.level} Reader
                  </h3>
                  {achievement.next ? (
                    <p className="text-muted-foreground">
                      {achievement.next.remaining} more books to reach <span className="font-semibold text-gold">{achievement.next.name}</span>
                    </p>
                  ) : (
                    <p className="text-gold font-medium">🎉 Congratulations! You've completed the challenge!</p>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{booksRead}/45 books</span>
                  </div>
                  <Progress value={(booksRead / 45) * 100} className="h-4" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border-2 ${booksRead >= 15 ? 'border-amber-700 bg-amber-700/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className={`w-5 h-5 ${booksRead >= 15 ? 'text-amber-700' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">Bronze</span>
                    </div>
                    <Progress value={Math.min((booksRead / 15) * 100, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.min(booksRead, 15)}/15</p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${booksRead >= 30 ? 'border-slate-400 bg-slate-400/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className={`w-5 h-5 ${booksRead >= 30 ? 'text-slate-400' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">Silver</span>
                    </div>
                    <Progress value={Math.min((booksRead / 30) * 100, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.min(booksRead, 30)}/30</p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${booksRead >= 45 ? 'border-gold bg-gold/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className={`w-5 h-5 ${booksRead >= 45 ? 'text-gold' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">Gold</span>
                    </div>
                    <Progress value={(booksRead / 45) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{booksRead}/45</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
                <div className="text-3xl font-display font-bold text-gold">{totalPoints}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="text-3xl font-display font-bold text-foreground">{booksRead}</div>
                <div className="text-sm text-muted-foreground">Books Read</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="text-3xl font-display font-bold text-foreground">{completedCategories.size}</div>
                <div className="text-sm text-muted-foreground">Categories Completed</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="text-3xl font-display font-bold text-foreground">{profile?.house || '-'}</div>
                <div className="text-sm text-muted-foreground">House</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Badges */}
        <div className="mt-6">
          <AchievementBadges />
        </div>

        {/* Categories Checklist */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Categories Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {READING_CATEGORIES.map((category) => {
                const isCompleted = completedCategories.has(category.id);
                const count = submissions.filter(s => s.category_number === category.id).length;
                return (
                  <div 
                    key={category.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isCompleted ? 'bg-green-500/5 border-green-500/30' : 'bg-secondary border-transparent'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        #{category.id} {category.name}
                      </p>
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submission History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              Submission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No books submitted yet. Start reading and submit your first book!
              </p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div 
                    key={submission.id}
                    className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{submission.title}</h4>
                        <p className="text-sm text-muted-foreground">by {submission.author}</p>
                        <Badge variant="outline" className="mt-2">
                          #{submission.category_number} - {submission.category_name}
                        </Badge>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="text-lg font-display font-bold text-gold">+{submission.points_earned}</div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(submission.date_finished), 'MMM d, yyyy')}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSubmission(submission)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeletingSubmission(submission)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      {editingSubmission && (
        <EditSubmissionDialog
          open={!!editingSubmission}
          onOpenChange={(open) => !open && setEditingSubmission(null)}
          submission={editingSubmission}
          onSuccess={fetchSubmissions}
        />
      )}

      {/* Delete Dialog */}
      {deletingSubmission && (
        <DeleteSubmissionDialog
          open={!!deletingSubmission}
          onOpenChange={(open) => !open && setDeletingSubmission(null)}
          submissionId={deletingSubmission.id}
          bookTitle={deletingSubmission.title}
          onSuccess={fetchSubmissions}
        />
      )}
    </div>
  );
};

export default MyProgress;
