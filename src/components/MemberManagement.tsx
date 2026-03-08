import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, GraduationCap, BookOpen, Home, UserCircle, Search, Loader2, Star, Trophy, BarChart3, Pencil, Download, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HOUSES, YEAR_GROUPS, CLASSES, HOUSE_COLORS, MAX_BOOKS } from '@/lib/constants';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  year_group: string | null;
  class_name: string | null;
  house: string | null;
  created_at: string;
}

interface StudentProgress {
  user_id: string;
  full_name: string;
  email?: string;
  house: string | null;
  year_group: string | null;
  class_name: string | null;
  books_read: number;
  total_points: number;
  achievement_level: string | null;
}

const roleLabels: Record<string, string> = {
  student: 'Student',
  homeroom_tutor: 'Homeroom Tutor',
  head_of_year: 'Head of Year',
  house_patron: 'House Patron',
  librarian: 'Librarian',
  staff: 'Staff',
};

const houseColors: Record<string, string> = {
  Kenya: 'bg-blue-500',
  Longonot: 'bg-yellow-500',
  Kilimanjaro: 'bg-red-500',
  Elgon: 'bg-green-500',
};

const achievementColors: Record<string, string> = {
  gold: 'bg-yellow-500 text-white',
  silver: 'bg-gray-400 text-white',
  bronze: 'bg-amber-700 text-white',
  none: 'bg-muted text-muted-foreground',
};

const MAX_POINTS = MAX_BOOKS * 3;

const MemberManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('progress');
  const [editingStudent, setEditingStudent] = useState<StudentProgress | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editProfileData, setEditProfileData] = useState({ house: '', year_group: '', class_name: '', full_name: '', email: '', role: '' });
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [filterHouse, setFilterHouse] = useState('all');
  const [filterYearGroup, setFilterYearGroup] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: profileData }, { data: progressData }] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('student_progress').select('*'),
    ]);
    setProfiles(profileData || []);
    setStudentProgress((progressData as unknown as StudentProgress[]) || []);
    setLoading(false);
  };

  const handleEditPoints = async () => {
    if (!editingStudent || !editPoints) return;
    setEditLoading(true);
    
    const targetPoints = parseInt(editPoints);
    const { data: subs } = await supabase
      .from('book_submissions')
      .select('id, points_earned')
      .eq('user_id', editingStudent.user_id)
      .order('created_at', { ascending: true });
    
    if (subs && subs.length > 0) {
      const cappedPoints = Math.min(targetPoints, MAX_POINTS);
      const pointsPerSub = Math.floor(cappedPoints / subs.length);
      const remainder = cappedPoints - (pointsPerSub * subs.length);
      
      for (let i = 0; i < subs.length; i++) {
        const pts = i === subs.length - 1 ? pointsPerSub + remainder : pointsPerSub;
        await supabase.from('book_submissions').update({ points_earned: pts }).eq('id', subs[i].id);
      }
      
      toast.success(`Points updated to ${cappedPoints} for ${editingStudent.full_name}`);
    } else {
      toast.error('No submissions found for this student');
    }
    
    setEditingStudent(null);
    setEditLoading(false);
    fetchAll();
  };

  const handleEditProfile = async () => {
    if (!editingProfile) return;
    setEditProfileLoading(true);

    const updateData: Record<string, unknown> = {
      full_name: editProfileData.full_name,
      email: editProfileData.email,
    };
    if (editProfileData.role) {
      updateData.role = editProfileData.role;
    }
    if (editProfileData.house && editProfileData.house !== 'none') {
      updateData.house = editProfileData.house;
    } else {
      updateData.house = null;
    }
    if (editProfileData.year_group && editProfileData.year_group !== 'none') {
      updateData.year_group = editProfileData.year_group;
    } else {
      updateData.year_group = null;
    }
    if (editProfileData.class_name && editProfileData.class_name !== 'none') {
      updateData.class_name = editProfileData.class_name;
    } else {
      updateData.class_name = null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', editingProfile.id);

    if (error) {
      toast.error('Failed to update profile: ' + error.message);
    } else {
      toast.success(`✅ Profile updated for ${editProfileData.full_name}`);
    }

    setEditingProfile(null);
    setEditProfileLoading(false);
    fetchAll();
  };

  const openEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setEditProfileData({
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      house: profile.house || '',
      year_group: profile.year_group || '',
      class_name: profile.class_name || '',
    });
  };

  const filterProfiles = (roleFilter?: string) => {
    return profiles
      .filter(p => roleFilter ? p.role === roleFilter : true)
      .filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const filteredProgress = studentProgress.filter(s =>
    (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const students = filterProfiles('student');
  const librarians = filterProfiles('librarian');
  const housePatrons = filterProfiles('house_patron');
  const headsOfYear = filterProfiles('head_of_year');
  const homeroomTutors = filterProfiles('homeroom_tutor');
  const allStaff = profiles.filter(p => p.role !== 'student');

  const MemberCard = ({ profile }: { profile: Profile }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            profile.house ? houseColors[profile.house] : 'bg-primary'
          } text-white font-bold`}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{roleLabels[profile.role] || profile.role}</Badge>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditProfile(profile)}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {profile.house && <Badge className={`${houseColors[profile.house]} text-white`}>{profile.house}</Badge>}
        {profile.year_group && <Badge variant="secondary">{profile.year_group}</Badge>}
        {profile.class_name && <Badge variant="outline">{profile.class_name}</Badge>}
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}
        </Badge>
      </div>
    </motion.div>
  );

  const filteredMembers = profiles
    .filter(p => filterRole === 'all' || p.role === filterRole)
    .filter(p => filterHouse === 'all' || p.house === filterHouse)
    .filter(p => filterYearGroup === 'all' || p.year_group === filterYearGroup)
    .filter(p => filterClass === 'all' || p.class_name === filterClass)
    .filter(p =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Member Management
            </h2>
            <p className="text-muted-foreground">View all members, edit profiles, track progress & manage points</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={activeView === 'progress' ? 'default' : 'outline'} size="sm"
            onClick={() => setActiveView('progress')}>
            <BarChart3 className="h-4 w-4 mr-1" />Student Progress
          </Button>
          <Button variant={activeView === 'members' ? 'default' : 'outline'} size="sm"
            onClick={() => setActiveView('members')}>
            <Users className="h-4 w-4 mr-1" />All Members
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardContent className="pt-4 text-center">
            <GraduationCap className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-700">{students.length}</div>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
          <CardContent className="pt-4 text-center">
            <BookOpen className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-purple-700">{librarians.length}</div>
            <p className="text-xs text-muted-foreground">Librarians</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
          <CardContent className="pt-4 text-center">
            <Home className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-700">{housePatrons.length}</div>
            <p className="text-xs text-muted-foreground">House Patrons</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-700">{headsOfYear.length}</div>
            <p className="text-xs text-muted-foreground">Heads of Year</p>
          </CardContent>
        </Card>
        <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-rose-500/5">
          <CardContent className="pt-4 text-center">
            <UserCircle className="h-5 w-5 text-pink-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-pink-700">{homeroomTutors.length}</div>
            <p className="text-xs text-muted-foreground">Tutors</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress View */}
      {activeView === 'progress' && (
        <div className="space-y-4">
          <Card className="border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Student Progress & Points ({filteredProgress.length} students)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Points auto-calculated: Books × 3 = Total Points (max {MAX_POINTS})</p>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredProgress.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground col-span-full">No student progress data found.</p>
            ) : (
              filteredProgress.map((student, index) => {
                const booksRead = student.books_read || 0;
                const autoCalcPoints = booksRead * 3;
                const displayPoints = student.total_points || 0;
                const pointsMismatch = displayPoints !== autoCalcPoints;
                const booksPercent = Math.min((booksRead / MAX_BOOKS) * 100, 100);
                const pointsPercent = Math.min((displayPoints / MAX_POINTS) * 100, 100);
                const level = student.achievement_level || 'none';

                return (
                  <motion.div key={student.user_id || index} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.5) }}>
                    <Card className="hover:shadow-md transition-shadow border-border/60">
                      <CardContent className="p-4 space-y-3">
                        {/* Header: Avatar + Name + Edit */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                              student.house ? houseColors[student.house] || 'bg-primary' : 'bg-primary'
                            }`}>
                              {(student.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{student.full_name}</p>
                              <Badge className={`text-xs ${achievementColors[level]}`}>
                                {level === 'gold' ? '🥇 Gold' : level === 'silver' ? '🥈 Silver' : level === 'bronze' ? '🥉 Bronze' : '📖 Starter'}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0"
                            onClick={() => {
                              setEditingStudent(student);
                              setEditPoints((student.total_points || 0).toString());
                            }}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {student.year_group && <Badge variant="outline" className="text-xs">{student.year_group}</Badge>}
                          {student.class_name && <Badge variant="outline" className="text-xs">{student.class_name}</Badge>}
                          {student.house && <Badge className={`${houseColors[student.house] || ''} text-white text-xs`}>{student.house}</Badge>}
                          {pointsMismatch && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">⚠️ Mismatch</Badge>
                          )}
                        </div>

                        {/* Books Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">📚 Books Read</span>
                            <span className="font-medium">{booksRead}/{MAX_BOOKS}</span>
                          </div>
                          <Progress value={booksPercent} className="h-2" />
                        </div>

                        {/* Points Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">⭐ Points</span>
                            <span className="font-medium">{displayPoints}/{MAX_POINTS}</span>
                          </div>
                          <Progress value={pointsPercent} className="h-2" />
                        </div>

                        {/* Points Badge */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground">
                            ({booksRead} × 3 = {autoCalcPoints})
                          </span>
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-3">
                            {displayPoints} pts
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Members View */}
      {activeView === 'members' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Role</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                      <SelectItem value="homeroom_tutor">Tutor</SelectItem>
                      <SelectItem value="head_of_year">Head of Year</SelectItem>
                      <SelectItem value="house_patron">House Patron</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">House</Label>
                  <Select value={filterHouse} onValueChange={setFilterHouse}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Houses</SelectItem>
                      {HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Year Group</Label>
                  <Select value={filterYearGroup} onValueChange={setFilterYearGroup}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Year Groups</SelectItem>
                      {YEAR_GROUPS.map(yg => <SelectItem key={yg} value={yg}>{yg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">{filteredMembers.length} members found</p>

          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {filteredMembers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground col-span-full">No members match your filters.</p>
            ) : (
              filteredMembers.map(profile => <MemberCard key={profile.id} profile={profile} />)
            )}
          </div>
        </div>
      )}

      {/* Edit Points Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />Edit Total Points
            </DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold">{editingStudent.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {editingStudent.year_group} • {editingStudent.class_name} • {editingStudent.house}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span>📚 Books: {editingStudent.books_read || 0}/{MAX_BOOKS}</span>
                  <span>⭐ Points: {editingStudent.total_points || 0}/{MAX_POINTS}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-calc: {editingStudent.books_read || 0} books × 3 = {(editingStudent.books_read || 0) * 3} points
                </p>
              </div>
              <div>
                <Label htmlFor="edit-points">New Total Points (max {MAX_POINTS})</Label>
                <Input id="edit-points" type="number" value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)} min={0} max={MAX_POINTS} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button onClick={handleEditPoints} disabled={editLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
              Update Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />Edit Member Profile
            </DialogTitle>
          </DialogHeader>
          {editingProfile && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">User ID: {editingProfile.user_id}</p>
              </div>
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" value={editProfileData.full_name}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, full_name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editProfileData.email}
                  onChange={(e) => setEditProfileData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editProfileData.role} onValueChange={(v) => setEditProfileData(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="homeroom_tutor">Homeroom Tutor</SelectItem>
                    <SelectItem value="head_of_year">Head of Year</SelectItem>
                    <SelectItem value="house_patron">House Patron</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>House</Label>
                <Select value={editProfileData.house} onValueChange={(v) => setEditProfileData(prev => ({ ...prev, house: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No House —</SelectItem>
                    {HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year Group</Label>
                <Select value={editProfileData.year_group} onValueChange={(v) => setEditProfileData(prev => ({ ...prev, year_group: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select year group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Year Group —</SelectItem>
                    {YEAR_GROUPS.map(yg => <SelectItem key={yg} value={yg}>{yg}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={editProfileData.class_name} onValueChange={(v) => setEditProfileData(prev => ({ ...prev, class_name: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Class —</SelectItem>
                    {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
            <Button onClick={handleEditProfile} disabled={editProfileLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {editProfileLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagement;
