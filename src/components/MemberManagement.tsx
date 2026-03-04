import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, GraduationCap, BookOpen, Home, UserCircle, Search, Loader2, Star, Trophy, BarChart3, Pencil } from 'lucide-react';
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
  email: string;
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
    // Get all submissions for this student
    const { data: subs } = await supabase
      .from('book_submissions')
      .select('id, points_earned')
      .eq('user_id', editingStudent.user_id)
      .order('created_at', { ascending: true });
    
    if (subs && subs.length > 0) {
      // Distribute points evenly across submissions (3 pts each, adjust last one)
      const perBook = 3;
      const totalBooks = subs.length;
      const cappedPoints = Math.min(targetPoints, MAX_POINTS);
      
      // Set each submission to the correct per-book value
      const pointsPerSub = Math.floor(cappedPoints / totalBooks);
      const remainder = cappedPoints - (pointsPerSub * totalBooks);
      
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
        <Badge variant="outline">{roleLabels[profile.role] || profile.role}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {profile.house && <Badge className={`${houseColors[profile.house]} text-white`}>{profile.house}</Badge>}
        {profile.year_group && <Badge variant="secondary">{profile.year_group}</Badge>}
        {profile.class_name && <Badge variant="outline">{profile.class_name}</Badge>}
      </div>
    </motion.div>
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
            <p className="text-muted-foreground">View all members, track student progress & edit points</p>
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
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Student Progress & Points ({filteredProgress.length} students)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredProgress.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No student progress data found.</p>
              ) : (
                filteredProgress.map((student, index) => {
                  const booksPercent = Math.min(((student.books_read || 0) / MAX_BOOKS) * 100, 100);
                  const pointsPercent = Math.min(((student.total_points || 0) / MAX_POINTS) * 100, 100);
                  const level = student.achievement_level || 'none';
                  
                  return (
                    <motion.div key={student.user_id || index} initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        student.house ? houseColors[student.house] || 'bg-primary' : 'bg-primary'
                      }`}>
                        {(student.full_name || '?').charAt(0).toUpperCase()}
                      </div>

                      {/* Name & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{student.full_name}</span>
                          {student.year_group && <Badge variant="outline" className="text-xs">{student.year_group}</Badge>}
                          {student.class_name && <Badge variant="outline" className="text-xs">{student.class_name}</Badge>}
                          {student.house && <Badge className={`${houseColors[student.house] || ''} text-white text-xs`}>{student.house}</Badge>}
                          <Badge className={`text-xs ${achievementColors[level]}`}>
                            {level === 'gold' ? '🥇 Gold' : level === 'silver' ? '🥈 Silver' : level === 'bronze' ? '🥉 Bronze' : '📖 Starter'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>📚 {student.books_read || 0}/{MAX_BOOKS}</span>
                            <Progress value={booksPercent} className="h-1.5 w-16" />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>⭐ {student.total_points || 0}/{MAX_POINTS}</span>
                            <Progress value={pointsPercent} className="h-1.5 w-16" />
                          </div>
                        </div>
                      </div>

                      {/* Points Display & Edit */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-3 py-1">
                          {student.total_points || 0} pts
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingStudent(student);
                            setEditPoints((student.total_points || 0).toString());
                          }}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members View */}
      {activeView === 'members' && (
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="librarians">Librarians ({librarians.length})</TabsTrigger>
            <TabsTrigger value="house_patrons">House Patrons ({housePatrons.length})</TabsTrigger>
            <TabsTrigger value="heads_of_year">Heads of Year ({headsOfYear.length})</TabsTrigger>
            <TabsTrigger value="tutors">Tutors ({homeroomTutors.length})</TabsTrigger>
            <TabsTrigger value="all_staff">All Staff ({allStaff.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />Students by House & Year Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList className="flex flex-wrap gap-1 h-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    {HOUSES.map(house => (
                      <TabsTrigger key={house} value={house}>{house}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="all">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {students.map(profile => <MemberCard key={profile.id} profile={profile} />)}
                    </div>
                  </TabsContent>
                  {HOUSES.map(house => (
                    <TabsContent key={house} value={house}>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {students.filter(p => p.house === house).map(profile => (
                          <MemberCard key={profile.id} profile={profile} />
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="librarians">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Librarians</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {librarians.map(profile => <MemberCard key={profile.id} profile={profile} />)}
                  {librarians.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No librarians registered yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="house_patrons">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />House Patrons</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {HOUSES.map(house => {
                    const patron = housePatrons.find(p => p.house === house);
                    return (
                      <Card key={house} className={`border-2 ${patron ? 'border-green-500/30' : 'border-dashed border-muted'}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${houseColors[house]} flex items-center justify-center text-white font-bold text-lg`}>
                              {house.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold">{house} House</p>
                              {patron ? (<><p className="text-sm">{patron.full_name}</p><p className="text-xs text-muted-foreground">{patron.email}</p></>)
                                : (<p className="text-sm text-muted-foreground">No patron assigned</p>)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heads_of_year">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Heads of Year</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {YEAR_GROUPS.map(yearGroup => {
                    const head = headsOfYear.find(p => p.year_group === yearGroup);
                    return (
                      <Card key={yearGroup} className={`border-2 ${head ? 'border-green-500/30' : 'border-dashed border-muted'}`}>
                        <CardContent className="pt-4">
                          <Badge variant="secondary" className="mb-2">{yearGroup}</Badge>
                          {head ? (<><p className="font-medium">{head.full_name}</p><p className="text-sm text-muted-foreground">{head.email}</p></>)
                            : (<p className="text-sm text-muted-foreground">No head assigned</p>)}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutors">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />Homeroom Tutors & Their Classes</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {CLASSES.map(className => {
                    const tutors = homeroomTutors.filter(p => p.class_name === className);
                    const classStudents = students.filter(s => s.class_name === className);
                    return (
                      <Card key={className}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-lg font-bold">{className}</Badge>
                            <span className="text-sm text-muted-foreground">{classStudents.length} students</span>
                          </div>
                          {tutors.length > 0 ? tutors.map(tutor => (
                            <div key={tutor.id} className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {tutor.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{tutor.full_name}</p>
                                <p className="text-xs text-muted-foreground">{tutor.year_group}</p>
                              </div>
                            </div>
                          )) : <p className="text-sm text-muted-foreground">No tutor assigned</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all_staff">
            <Card><CardHeader><CardTitle>All Staff Members</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {allStaff.map(profile => <MemberCard key={profile.id} profile={profile} />)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
    </div>
  );
};

export default MemberManagement;
