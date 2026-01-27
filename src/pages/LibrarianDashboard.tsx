import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, Loader2, Sparkles, Trophy, Calendar, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_books: number;
  points_reward: number;
  is_active: boolean;
  created_at: string;
}

interface FlaggedSubmission {
  id: string;
  title: string;
  author: string;
  reflection: string;
  approval_status: string;
  ai_feedback: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    year_group: string | null;
    class_name: string | null;
  } | null;
}

const LibrarianDashboard = () => {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [flaggedSubmissions, setFlaggedSubmissions] = useState<FlaggedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    challenge_type: 'timed_sprint',
    start_date: '',
    end_date: '',
    target_books: 3,
    points_reward: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all challenges
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    setChallenges((challengeData as Challenge[]) || []);

    // Fetch flagged submissions
    const { data: flaggedData } = await supabase
      .from('book_submissions')
      .select(`
        id, title, author, reflection, approval_status, ai_feedback, created_at,
        profiles!book_submissions_user_id_fkey (full_name, year_group, class_name)
      `)
      .eq('approval_status', 'flagged')
      .order('created_at', { ascending: false });

    setFlaggedSubmissions((flaggedData as unknown as FlaggedSubmission[]) || []);
    setLoading(false);
  };

  const generateChallenge = async () => {
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-challenge', {
        body: {
          challenge_type: newChallenge.challenge_type,
          description: newChallenge.description || undefined,
        },
      });

      if (response.error) throw response.error;

      const { challenge } = response.data;
      
      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (challenge.suggested_duration_days || 14));

      setNewChallenge({
        ...newChallenge,
        title: challenge.title,
        description: challenge.description,
        target_books: challenge.target_books,
        points_reward: challenge.points_reward,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      toast.success('Challenge generated! Review and save.');
    } catch (error: any) {
      console.error('Error generating challenge:', error);
      toast.error(error.message || 'Failed to generate challenge');
    }
    setGenerating(false);
  };

  const saveChallenge = async () => {
    if (!profile?.user_id) return;

    if (!newChallenge.title || !newChallenge.start_date || !newChallenge.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('challenges').insert({
        ...newChallenge,
        created_by: profile.user_id,
        is_active: true,
      });

      if (error) throw error;

      toast.success('Challenge created successfully!');
      setCreateDialogOpen(false);
      setNewChallenge({
        title: '',
        description: '',
        challenge_type: 'timed_sprint',
        start_date: '',
        end_date: '',
        target_books: 3,
        points_reward: 10,
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving challenge:', error);
      toast.error('Failed to create challenge');
    }
    setSaving(false);
  };

  const handleSubmissionAction = async (submissionId: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('book_submissions')
      .update({ 
        approval_status: action,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (error) {
      toast.error('Failed to update submission');
    } else {
      toast.success(`Submission ${action}`);
      fetchData();
    }
  };

  const toggleChallengeStatus = async (challengeId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('challenges')
      .update({ is_active: !isActive })
      .eq('id', challengeId);

    if (error) {
      toast.error('Failed to update challenge');
    } else {
      toast.success(isActive ? 'Challenge deactivated' : 'Challenge activated');
      fetchData();
    }
  };

  if (profile?.role !== 'librarian') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">Only librarians can access this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Librarian Dashboard 📚
            </h1>
            <p className="text-muted-foreground">
              Create challenges, review flagged submissions, and manage the reading program.
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-navy hover:bg-gold-light">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Challenge Type</Label>
                  <Select 
                    value={newChallenge.challenge_type} 
                    onValueChange={(v) => setNewChallenge({ ...newChallenge, challenge_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timed_sprint">Reading Sprint</SelectItem>
                      <SelectItem value="category">Category Challenge</SelectItem>
                      <SelectItem value="house_competition">House Competition</SelectItem>
                      <SelectItem value="custom">Custom Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={generateChallenge}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate with AI
                </Button>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="Challenge title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    placeholder="Describe the challenge..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) => setNewChallenge({ ...newChallenge, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={newChallenge.end_date}
                      onChange={(e) => setNewChallenge({ ...newChallenge, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Books</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={newChallenge.target_books}
                      onChange={(e) => setNewChallenge({ ...newChallenge, target_books: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points Reward</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={newChallenge.points_reward}
                      onChange={(e) => setNewChallenge({ ...newChallenge, points_reward: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full bg-gold text-navy hover:bg-gold-light"
                  onClick={saveChallenge}
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList>
            <TabsTrigger value="challenges">
              <Trophy className="w-4 h-4 mr-2" />
              Challenges ({challenges.length})
            </TabsTrigger>
            <TabsTrigger value="flagged">
              <AlertCircle className="w-4 h-4 mr-2" />
              Flagged ({flaggedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
              </div>
            ) : challenges.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No challenges created yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.map(challenge => (
                  <Card key={challenge.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <Badge variant={challenge.is_active ? 'default' : 'secondary'}>
                          {challenge.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{challenge.target_books} books • +{challenge.points_reward} pts</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => toggleChallengeStatus(challenge.id, challenge.is_active)}
                      >
                        {challenge.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flagged">
            {flaggedSubmissions.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No flagged submissions to review.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {flaggedSubmissions.map(submission => (
                  <Card key={submission.id} className="border-orange-200 bg-orange-50/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{submission.title}</h3>
                            <span className="text-muted-foreground">by {submission.author}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Submitted by: {submission.profiles?.full_name} ({submission.profiles?.year_group})
                          </p>
                          <div className="bg-white p-3 rounded-lg border">
                            <p className="text-sm font-medium text-orange-700 mb-2">AI Feedback:</p>
                            <p className="text-sm text-muted-foreground">{submission.ai_feedback}</p>
                          </div>
                          <div className="bg-secondary p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Reflection:</p>
                            <p className="text-sm text-muted-foreground">{submission.reflection}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSubmissionAction(submission.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSubmissionAction(submission.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LibrarianDashboard;
