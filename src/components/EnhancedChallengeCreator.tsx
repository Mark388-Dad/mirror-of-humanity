import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Plus, Save, Sparkles, Target, Trophy, Users, Zap, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CHALLENGE_CATEGORIES = [
  { value: 'reading', label: '📚 Reading Challenge', icon: BookOpen },
  { value: 'genre_explorer', label: '🗺️ Genre Explorer', icon: Target },
  { value: 'reflection', label: '✍️ Read & Reflect', icon: Sparkles },
  { value: 'performance', label: '🎭 Read Aloud & Perform', icon: Users },
  { value: 'house_competition', label: '🏠 House Competition', icon: Trophy },
  { value: 'ai_buddy', label: '🤖 AI Reading Buddy', icon: Zap },
  { value: 'creative_response', label: '🎨 Creative Response', icon: Sparkles },
  { value: 'daily_streak', label: '🔥 Daily Reading Streak', icon: Zap },
  { value: 'classic_modern', label: '📖 Classic vs Modern', icon: BookOpen },
  { value: 'book_to_life', label: '🌍 Book-to-Life Connection', icon: Target },
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '🟢 Beginner', color: 'bg-green-500' },
  { value: 'intermediate', label: '🔵 Intermediate', color: 'bg-blue-500' },
  { value: 'advanced', label: '🔴 Advanced', color: 'bg-red-500' },
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

const YEAR_GROUPS = ['MYP5', 'DP1', 'DP2', 'G10'];
const HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'];
const CLASSES = ['Swara', 'Chui', 'Duma', 'Nyati', 'Twiga', 'Kifaru'];

const EnhancedChallengeCreator = () => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Form state
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

  const generateWithAI = async () => {
    setAiGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-challenge', {
        body: { 
          challenge_type: category,
          description: `Create a ${DIFFICULTY_LEVELS.find(d => d.value === difficultyLevel)?.label || 'intermediate'} ${category} challenge`
        },
      });

      if (error) throw error;

      if (data?.challenge) {
        const challenge = data.challenge;
        setTitle(challenge.title || '');
        setDescription(challenge.description || '');
        setTargetBooks(String(challenge.target_books || 5));
        setPointsReward(String(challenge.points_reward || 10));
        
        toast({ title: 'AI Generated!', description: 'Challenge details populated' });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ title: 'Generation failed', variant: 'destructive' });
    } finally {
      setAiGenerating(false);
    }
  };

  const createChallenge = async () => {
    if (!title || !description || !startDate || !endDate) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase.from('challenges').insert({
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
        allowed_year_groups: allowedYearGroups.length > 0 ? allowedYearGroups : null,
        allowed_houses: allowedHouses.length > 0 ? allowedHouses : null,
        allowed_classes: allowedClasses.length > 0 ? allowedClasses : null,
        requires_submission: requiresSubmission,
        evidence_type: evidenceType,
        leaderboard_type: leaderboardType,
        is_featured: isFeatured,
        badge_name: badgeName || null,
        created_by: user?.id,
        is_active: true,
      });

      if (error) throw error;

      toast({ title: 'Challenge Created! 🎉', description: title });
      
      // Reset form
      setTitle('');
      setDescription('');
      setTargetBooks('5');
      setPointsReward('10');
      setStartDate('');
      setEndDate('');
      setAllowedYearGroups([]);
      setAllowedHouses([]);
      setAllowedClasses([]);
      setBadgeName('');
    } catch (error) {
      console.error('Create error:', error);
      toast({ title: 'Failed to create challenge', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-gold" />
          <div>
            <h2 className="text-2xl font-bold">Create Challenge</h2>
            <p className="text-muted-foreground">Design engaging reading challenges</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={generateWithAI}
          disabled={aiGenerating}
        >
          {aiGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate with AI
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Challenge Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Challenge Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Genre Explorer Challenge"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the challenge..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHALLENGE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Books</Label>
                <Input
                  type="number"
                  value={targetBooks}
                  onChange={(e) => setTargetBooks(e.target.value)}
                  min="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Points Reward</Label>
                <Input
                  type="number"
                  value={pointsReward}
                  onChange={(e) => setPointsReward(e.target.value)}
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Participation & Rules */}
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
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="year_group">Specific Year Groups</SelectItem>
                  <SelectItem value="house">Specific Houses</SelectItem>
                  <SelectItem value="class">Specific Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {participationType === 'year_group' && (
              <div>
                <Label className="mb-2 block">Select Year Groups</Label>
                <div className="flex flex-wrap gap-2">
                  {YEAR_GROUPS.map(yg => (
                    <Badge
                      key={yg}
                      variant={allowedYearGroups.includes(yg) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(allowedYearGroups, yg, setAllowedYearGroups)}
                    >
                      {yg}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {participationType === 'house' && (
              <div>
                <Label className="mb-2 block">Select Houses</Label>
                <div className="flex flex-wrap gap-2">
                  {HOUSES.map(house => (
                    <Badge
                      key={house}
                      variant={allowedHouses.includes(house) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(allowedHouses, house, setAllowedHouses)}
                    >
                      {house}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {participationType === 'class' && (
              <div>
                <Label className="mb-2 block">Select Classes</Label>
                <div className="flex flex-wrap gap-2">
                  {CLASSES.map(cls => (
                    <Badge
                      key={cls}
                      variant={allowedClasses.includes(cls) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(allowedClasses, cls, setAllowedClasses)}
                    >
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Evidence Type</Label>
                <Select value={evidenceType} onValueChange={setEvidenceType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Leaderboard Type</Label>
                <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
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
              <Input
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="e.g., Genre Master"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="requires-submission"
                  checked={requiresSubmission}
                  onCheckedChange={setRequiresSubmission}
                />
                <Label htmlFor="requires-submission">Requires Submission</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is-featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
                <Label htmlFor="is-featured">Featured Challenge</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={createChallenge}
        disabled={creating}
      >
        {creating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Create Challenge
      </Button>
    </div>
  );
};

export default EnhancedChallengeCreator;
