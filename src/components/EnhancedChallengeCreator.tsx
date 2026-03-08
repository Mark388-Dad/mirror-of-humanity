import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Loader2, Trophy, Users, BookOpen, Sparkles, Eye, Save, Copy, Calendar, Target, Zap, Clock, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';

const CHALLENGE_CATEGORIES = [
  { value: 'reading', label: '📚 Reading Challenge', color: 'from-blue-500 to-cyan-500' },
  { value: 'genre_explorer', label: '🗺️ Genre Explorer', color: 'from-emerald-500 to-teal-500' },
  { value: 'reflection', label: '✍️ Read & Reflect', color: 'from-violet-500 to-purple-500' },
  { value: 'performance', label: '🎭 Read Aloud & Perform', color: 'from-pink-500 to-rose-500' },
  { value: 'house_competition', label: '🏠 House Competition', color: 'from-amber-500 to-orange-500' },
  { value: 'ai_buddy', label: '🤖 AI Reading Buddy', color: 'from-indigo-500 to-blue-500' },
  { value: 'creative_response', label: '🎨 Creative Response', color: 'from-fuchsia-500 to-pink-500' },
  { value: 'daily_streak', label: '🔥 Daily Reading Streak', color: 'from-red-500 to-orange-500' },
  { value: 'classic_modern', label: '📖 Classic vs Modern', color: 'from-slate-500 to-zinc-500' },
  { value: 'book_to_life', label: '🌍 Book-to-Life Connection', color: 'from-green-500 to-lime-500' },
  { value: 'timed_sprint', label: '⏱️ Timed Sprint', color: 'from-yellow-500 to-amber-500' },
  { value: 'category', label: '🏷️ Category Challenge', color: 'from-sky-500 to-blue-500' },
  { value: 'custom', label: '⚡ Custom Challenge', color: 'from-purple-500 to-indigo-500' },
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

const YEAR_GROUPS = ['MYP5', 'G10', 'G11', 'G12', 'DP1', 'DP2'];
const HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'];
const CLASSES = ['Swara', 'Chui', 'Duma', 'Nyati', 'Twiga', 'Kifaru'];

interface EditingChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  category: string | null;
  difficulty_level: string | null;
  target_books: number | null;
  points_reward: number | null;
  start_date: string;
  end_date: string;
  participation_type: string | null;
  allowed_year_groups: string[] | null;
  allowed_houses: string[] | null;
  allowed_classes: string[] | null;
  requires_submission: boolean | null;
  evidence_type: string | null;
  leaderboard_type: string | null;
  is_featured: boolean | null;
  is_independent: boolean;
  badge_name: string | null;
  is_active: boolean | null;
}

interface EnhancedChallengeCreatorProps {
  editingChallenge?: EditingChallenge | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

const EnhancedChallengeCreator = ({ editingChallenge, onSaved, onCancel }: EnhancedChallengeCreatorProps) => {
  const { user } = useAuth();
  const isEditing = !!editingChallenge;

  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
  const [isIndependent, setIsIndependent] = useState(false);
  const [badgeName, setBadgeName] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingChallenge) {
      setTitle(editingChallenge.title);
      setDescription(editingChallenge.description);
      setCategory(editingChallenge.category || 'reading');
      setDifficultyLevel(editingChallenge.difficulty_level || 'intermediate');
      setTargetBooks(String(editingChallenge.target_books || 5));
      setPointsReward(String(editingChallenge.points_reward || 10));
      setStartDate(editingChallenge.start_date);
      setEndDate(editingChallenge.end_date);
      setParticipationType(editingChallenge.participation_type || 'all');
      setAllowedYearGroups(editingChallenge.allowed_year_groups || []);
      setAllowedHouses(editingChallenge.allowed_houses || []);
      setAllowedClasses(editingChallenge.allowed_classes || []);
      setRequiresSubmission(editingChallenge.requires_submission ?? true);
      setEvidenceType(editingChallenge.evidence_type || 'reflection');
      setLeaderboardType(editingChallenge.leaderboard_type || 'individual');
      setIsFeatured(editingChallenge.is_featured ?? false);
      setIsIndependent(editingChallenge.is_independent);
      setBadgeName(editingChallenge.badge_name || '');
    }
  }, [editingChallenge]);

  const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

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
        toast.success('AI Generated! ✨ Challenge populated');
      }
    } catch {
      toast.error('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const saveChallenge = async () => {
    if (!user?.id) { toast.error('You must be logged in'); return; }
    if (!title || !description || !startDate || !endDate) { toast.error('Fill all required fields'); return; }

    setSaving(true);
    const payload = {
      title, description,
      challenge_type: category, category,
      difficulty_level: difficultyLevel,
      target_books: parseInt(targetBooks) || 5,
      points_reward: parseInt(pointsReward) || 10,
      start_date: startDate, end_date: endDate,
      participation_type: participationType,
      allowed_year_groups: allowedYearGroups.length ? allowedYearGroups : null,
      allowed_houses: allowedHouses.length ? allowedHouses : null,
      allowed_classes: allowedClasses.length ? allowedClasses : null,
      requires_submission: requiresSubmission,
      evidence_type: evidenceType,
      leaderboard_type: leaderboardType,
      is_featured: isFeatured,
      is_independent: isIndependent,
      badge_name: badgeName || null,
    };

    try {
      if (isEditing) {
        const { error } = await supabase.from('challenges').update(payload).eq('id', editingChallenge!.id);
        if (error) throw error;
        toast.success('Challenge updated! 🎉');
      } else {
        const { error } = await supabase.from('challenges').insert({ ...payload, created_by: user.id, is_active: true });
        if (error) throw error;
        toast.success('Challenge created! 🎉');
        // Reset form
        setTitle(''); setDescription(''); setCategory('reading'); setDifficultyLevel('intermediate');
        setTargetBooks('5'); setPointsReward('10'); setStartDate(''); setEndDate('');
        setParticipationType('all'); setAllowedYearGroups([]); setAllowedHouses([]); setAllowedClasses([]);
        setRequiresSubmission(true); setEvidenceType('reflection'); setLeaderboardType('individual');
        setIsFeatured(false); setIsIndependent(false); setBadgeName('');
      }
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save challenge');
    } finally {
      setSaving(false);
    }
  };

  const categoryMeta = CHALLENGE_CATEGORIES.find(c => c.value === category);
  const daysLeft = endDate ? differenceInDays(new Date(endDate), new Date()) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {isEditing ? '✏️ Edit Challenge' : '🚀 Create Challenge'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Update this challenge — changes sync instantly' : 'Design an engaging, AI-powered reading challenge'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            )}
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}
              className="border-primary/30 hover:bg-primary/5">
              <Eye className="h-4 w-4 mr-2" />{showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button variant="outline" onClick={generateWithAI} disabled={aiGenerating}
              className="border-purple-500/30 hover:bg-purple-500/5 text-purple-600">
              {aiGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              AI Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Details — broken into separate cards */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {/* Title & Category Card */}
          <Card className="border-2 border-primary/10 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />Title & Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <Label className="text-sm font-semibold">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Genre Explorer Sprint 🌟"
                  className="mt-1 border-primary/20 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CHALLENGE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Difficulty</Label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DIFFICULTY_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="border-2 border-primary/10 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Describe the challenge, rules, and what makes it exciting..."
                className="border-primary/20 focus:border-primary" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">{description.length} characters</p>
                {description.length > 20 && <Badge variant="secondary" className="text-xs">✨ Great description!</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Goals & Timeline Card */}
          <Card className="border-2 border-primary/10 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />Goals & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">📚 Target Books</Label>
                  <Input type="number" value={targetBooks} onChange={e => setTargetBooks(e.target.value)} min={1} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">⭐ Points Reward</Label>
                  <Input type="number" value={pointsReward} onChange={e => setPointsReward(e.target.value)} min={1} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">📅 Start Date *</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">🏁 End Date *</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
                </div>
              </div>
              {/* Independent Toggle */}
              <motion.div whileHover={{ scale: 1.01 }}
                className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Switch checked={isIndependent} onCheckedChange={setIsIndependent} />
                  <div>
                    <Label className="font-semibold">🔓 Independent Challenge</Label>
                    <p className="text-xs text-muted-foreground">Submissions won't count toward the 45-book main challenge</p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Rules + Preview */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-purple-500/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />Participation & Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label className="text-sm font-semibold">Who Can Participate</Label>
                  <Select value={participationType} onValueChange={setParticipationType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🌍 All Students</SelectItem>
                      <SelectItem value="year_group">🎓 Specific Year Groups</SelectItem>
                      <SelectItem value="house">🏠 Specific Houses</SelectItem>
                      <SelectItem value="class">📝 Specific Classes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence>
                  {participationType === 'year_group' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="flex flex-wrap gap-2 overflow-hidden">
                      {YEAR_GROUPS.map(yg => (
                        <Badge key={yg} variant={allowedYearGroups.includes(yg) ? 'default' : 'outline'}
                          className="cursor-pointer transition-all hover:scale-105" onClick={() => toggleArrayItem(allowedYearGroups, yg, setAllowedYearGroups)}>{yg}</Badge>
                      ))}
                    </motion.div>
                  )}
                  {participationType === 'house' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="flex flex-wrap gap-2 overflow-hidden">
                      {HOUSES.map(h => (
                        <Badge key={h} variant={allowedHouses.includes(h) ? 'default' : 'outline'}
                          className="cursor-pointer transition-all hover:scale-105" onClick={() => toggleArrayItem(allowedHouses, h, setAllowedHouses)}>{h}</Badge>
                      ))}
                    </motion.div>
                  )}
                  {participationType === 'class' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="flex flex-wrap gap-2 overflow-hidden">
                      {CLASSES.map(c => (
                        <Badge key={c} variant={allowedClasses.includes(c) ? 'default' : 'outline'}
                          className="cursor-pointer transition-all hover:scale-105" onClick={() => toggleArrayItem(allowedClasses, c, setAllowedClasses)}>{c}</Badge>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Evidence Type</Label>
                    <Select value={evidenceType} onValueChange={setEvidenceType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{EVIDENCE_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Leaderboard</Label>
                    <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">👤 Individual</SelectItem>
                        <SelectItem value="house">🏠 House</SelectItem>
                        <SelectItem value="class">📝 Class</SelectItem>
                        <SelectItem value="year_group">🎓 Year Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">🏅 Badge Name (optional)</Label>
                  <Input value={badgeName} onChange={e => setBadgeName(e.target.value)} placeholder="e.g., Genre Master" className="mt-1" />
                </div>

                <div className="flex justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={requiresSubmission} onCheckedChange={setRequiresSubmission} />
                    <Label>📄 Requires Submission</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <Label>⭐ Featured</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Preview — Enhanced Full Card */}
          <AnimatePresence>
            {showPreview && title && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
                <Card className="border-2 border-dashed border-primary/30 overflow-hidden">
                  <div className={`h-3 bg-gradient-to-r ${categoryMeta?.color || 'from-primary to-purple-500'}`} />
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">👁️ Student Preview</Badge>
                      <div className="flex items-center gap-2">
                        {isFeatured && <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs">⭐ Featured</Badge>}
                        {isIndependent && <Badge variant="secondary" className="text-xs">🔓 Independent</Badge>}
                        {daysLeft !== null && daysLeft > 0 && (
                          <Badge variant="outline" className="text-xs animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />{daysLeft}d left
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Preview: Title Card */}
                    <Card className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryMeta?.color || 'from-primary to-purple-500'} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                            {categoryMeta?.label.split(' ')[0] || '📚'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className="text-xs">{categoryMeta?.label}</Badge>
                              <Badge className={`${DIFFICULTY_LEVELS.find(d => d.value === difficultyLevel)?.color} text-white text-xs`}>
                                {difficultyLevel}
                              </Badge>
                            </div>
                            <h3 className="text-xl font-display font-bold truncate">{title}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preview: Description Card */}
                    {description && (
                      <Card className="border border-border/50">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap break-words">{description}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Preview: Stats Card */}
                    <Card className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl p-3 text-center border border-blue-500/10">
                            <Target className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                            <div className="text-lg font-bold">{targetBooks || '?'}</div>
                            <div className="text-xs text-muted-foreground">Books</div>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-xl p-3 text-center border border-yellow-500/10">
                            <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-600" />
                            <div className="text-lg font-bold text-yellow-700">+{pointsReward || '?'}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-xl p-3 text-center border border-purple-500/10">
                            <Users className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                            <div className="text-lg font-bold">0</div>
                            <div className="text-xs text-muted-foreground">Joined</div>
                          </div>
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl p-3 text-center border border-green-500/10">
                            <Calendar className="w-4 h-4 mx-auto mb-1 text-green-600" />
                            <div className="text-xs font-bold">{startDate ? format(new Date(startDate), 'MMM d') : '?'}</div>
                            <div className="text-xs text-muted-foreground">→ {endDate ? format(new Date(endDate), 'MMM d') : '?'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preview: Actions Card */}
                    <Card className="border border-border/50">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {badgeName && <Badge variant="secondary" className="text-xs">🏅 Earn: {badgeName}</Badge>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white" disabled>
                            <Zap className="w-3 h-3 mr-1" />Join
                          </Button>
                          <Button size="sm" variant="outline" disabled>Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Save Button */}
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button size="lg" onClick={saveChallenge} disabled={saving || aiGenerating}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 shadow-lg">
          {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : isEditing ? <Save className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
          {isEditing ? 'Save Changes' : 'Create Challenge'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedChallengeCreator;
