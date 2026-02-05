import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Loader2, Trophy, Users, BookOpen, Sparkles } from 'lucide-react';

const CHALLENGE_CATEGORIES = [
  { value: 'reading', label: '📚 Reading Challenge' },
  { value: 'genre_explorer', label: '🗺️ Genre Explorer' },
  { value: 'reflection', label: '✍️ Read & Reflect' },
  { value: 'performance', label: '🎭 Read Aloud & Perform' },
  { value: 'house_competition', label: '🏠 House Competition' },
  { value: 'ai_buddy', label: '🤖 AI Reading Buddy' },
  { value: 'creative_response', label: '🎨 Creative Response' },
  { value: 'daily_streak', label: '🔥 Daily Reading Streak' },
  { value: 'classic_modern', label: '📖 Classic vs Modern' },
  { value: 'book_to_life', label: '🌍 Book-to-Life Connection' },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '🟢 Beginner' },
  { value: 'intermediate', label: '🔵 Intermediate' },
  { value: 'advanced', label: '🔴 Advanced' },
];

const EVIDENCE_TYPES = [
  { value: 'reflection', label: 'Written Reflection' },
  { value: 'quiz', label: 'Quiz Completion' },
  { value: 'file', label: 'File Upload' },
  { value: 'link', label: 'External Link' },
  { value: 'ai_reflection', label: 'AI-Assisted Reflection' },
  { value: 'audio', label: 'Audio Recording' },
  { value: 'video', label: 'Video Recording' },
  { value: 'none', label: 'No Evidence Required' },
];

const YEAR_GROUPS = ['MYP5', 'G10', 'G11', 'G12', 'DP1', 'DP2'];
const HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'];
const CLASSES = ['Swara', 'Chui', 'Duma', 'Nyati', 'Twiga', 'Kifaru'];

const EnhancedChallengeCreator = () => {
  const { user } = useAuth();

  // States
  const [creating, setCreating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('reading');
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [targetBooks, setTargetBooks] = useState('5');
  const [pointsReward, setPointsReward] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participationType, setParticipationType] = useState('all');
  const [allowedYearGroups, setAllowedYearGroups] = useState<string[]>([]);
  const [allowedHouses, setAllowedHouses] = useState<string[]>([]);
  const [allowedClasses, setAllowedClasses] = useState<string[]>([]);
  const [requiresSubmission, setRequiresSubmission] = useState(true);
  const [evidenceType, setEvidenceType] = useState('reflection');
  const [leaderboardType, setLeaderboardType] = useState('individual');
  const [isFeatured, setIsFeatured] = useState(false);
  const [badgeName, setBadgeName] = useState('');

  // Helper: toggle array items
  const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  // AI Generation (Optional)
  const generateWithAI = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-challenge', {
        body: { challenge_type: category },
      });
      if (error) throw error;
      if (data?.challenge) {
        setTitle(data.challenge.title || '');
        setDescription(data.challenge.description || '');
        setTargetBooks(String(data.challenge.target_books || 5));
        setPointsReward(String(data.challenge.points_reward || 10));
        toast({ title: 'AI Generated!', description: 'Challenge populated' });
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast({ title: 'AI generation failed', variant: 'destructive' });
    } finally {
      setAiGenerating(false);
    }
  };

  // Create challenge
  const createChallenge = async () => {
    if (!user?.id) {
      toast({ title: 'You must be logged in', variant: 'destructive' });
      return;
    }

    if (!title || !description || !startDate || !endDate) {
      toast({ title: 'Fill all required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);

    const payload = {
      title,
      description,
      challenge_type: category,
      category,
      difficulty_level: difficultyLevel,
      target_books: parseInt(targetBooks) || 5,
      points_reward: parseInt(pointsReward) || 10,
      start_date: startDate,
      end_date: endDate,
      participation_type: participationType,
      allowed_year_groups: allowedYearGroups.length ? allowedYearGroups : null,
      allowed_houses: allowedHouses.length ? allowedHouses : null,
      allowed_classes: allowedClasses.length ? allowedClasses : null,
      requires_submission: requiresSubmission,
      evidence_type: evidenceType,
      leaderboard_type: leaderboardType,
      is_featured: isFeatured,
      badge_name: badgeName || null,
      created_by: user.id,
      is_active: true,
    };

    console.log('Creating challenge with payload:', payload);

    try {
      const { error } = await supabase.from('challenges').insert(payload);
      if (error) throw error;

      toast({ title: 'Challenge Created! 🎉', description: title });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('reading');
      setDifficultyLevel('intermediate');
      setTargetBooks('5');
      setPointsReward('10');
      setStartDate('');
      setEndDate('');
      setParticipationType('all');
      setAllowedYearGroups([]);
      setAllowedHouses([]);
      setAllowedClasses([]);
      setRequiresSubmission(true);
      setEvidenceType('reflection');
      setLeaderboardType('individual');
      setIsFeatured(false);
      setBadgeName('');
    } catch (err) {
      console.error('Create challenge error:', err);
      toast({ title: 'Failed to create challenge', description: err?.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-gold" />
          <div>
            <h2 className="text-2xl font-bold">Create Challenge</h2>
            <p className="text-muted-foreground">Design engaging reading challenges</p>
          </div>
        </div>

        <Button variant="outline" onClick={generateWithAI} disabled={aiGenerating}>
          {aiGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate with AI
        </Button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Challenge Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Challenge title..." />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Challenge description..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CHALLENGE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTY_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Books</Label>
                <Input type="number" value={targetBooks} onChange={(e) => setTargetBooks(e.target.value)} min={1} />
              </div>
              <div>
                <Label>Points Reward</Label>
                <Input type="number" value={pointsReward} onChange={(e) => setPointsReward(e.target.value)} min={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Participation & rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Who Can Participate</Label>
              <Select value={participationType} onValueChange={setParticipationType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="year_group">Specific Year Groups</SelectItem>
                  <SelectItem value="house">Specific Houses</SelectItem>
                  <SelectItem value="class">Specific Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {participationType === 'year_group' && (
              <div className="flex flex-wrap gap-2">
                {YEAR_GROUPS.map(yg => (
                  <Badge key={yg} variant={allowedYearGroups.includes(yg) ? 'default' : 'outline'} onClick={() => toggleArrayItem(allowedYearGroups, yg, setAllowedYearGroups)}>
                    {yg}
                  </Badge>
                ))}
              </div>
            )}

            {participationType === 'house' && (
              <div className="flex flex-wrap gap-2">
                {HOUSES.map(h => (
                  <Badge key={h} variant={allowedHouses.includes(h) ? 'default' : 'outline'} onClick={() => toggleArrayItem(allowedHouses, h, setAllowedHouses)}>
                    {h}
                  </Badge>
                ))}
              </div>
            )}

            {participationType === 'class' && (
              <div className="flex flex-wrap gap-2">
                {CLASSES.map(c => (
                  <Badge key={c} variant={allowedClasses.includes(c) ? 'default' : 'outline'} onClick={() => toggleArrayItem(allowedClasses, c, setAllowedClasses)}>
                    {c}
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Evidence Type</Label>
                <Select value={evidenceType} onValueChange={setEvidenceType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVIDENCE_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Leaderboard Type</Label>
                <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="year_group">Year Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Badge Name (optional)</Label>
              <Input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} placeholder="e.g., Genre Master" />
            </div>

            <div className="flex justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={requiresSubmission} onCheckedChange={setRequiresSubmission} />
                <Label>Requires Submission</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label>Featured Challenge</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button size="lg" className="w-full" onClick={createChallenge} disabled={creating || aiGenerating}>
        {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
        Create Challenge
      </Button>
    </div>
  );
};

export default EnhancedChallengeCreator;
