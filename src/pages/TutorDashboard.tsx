import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, BookOpen, Trophy, TrendingUp, Medal, Award, Crown } from 'lucide-react';
import { CLASSES } from '@/lib/constants';

interface ClassStudent {
  user_id: string;
  full_name: string;
  books_read: number;
  total_points: number;
  achievement_level: string;
}

interface ClassStats {
  total_students: number;
  total_books: number;
  average_books: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
}

const TutorDashboard = () => {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>(profile?.class_name || '');
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (profile?.class_name) {
      setSelectedClass(profile.class_name);
    }
  }, [profile]);

  const fetchClassData = async () => {
    setLoading(true);

    // Fetch students in the selected class with their progress
    const { data: studentData, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('class_name', selectedClass)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching class data:', error);
      setLoading(false);
      return;
    }

    const studentsList = (studentData || []) as ClassStudent[];
    setStudents(studentsList);

    // Calculate stats
    const totalStudents = studentsList.length;
    const totalBooks = studentsList.reduce((sum, s) => sum + (s.books_read || 0), 0);
    const bronzeCount = studentsList.filter(s => s.achievement_level === 'bronze').length;
    const silverCount = studentsList.filter(s => s.achievement_level === 'silver').length;
    const goldCount = studentsList.filter(s => s.achievement_level === 'gold').length;

    setStats({
      total_students: totalStudents,
      total_books: totalBooks,
      average_books: totalStudents > 0 ? Math.round((totalBooks / totalStudents) * 10) / 10 : 0,
      bronze_count: bronzeCount,
      silver_count: silverCount,
      gold_count: goldCount,
    });

    setLoading(false);
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-5 h-5 text-amber-700" />;
      case 'silver': return <Award className="w-5 h-5 text-slate-400" />;
      case 'gold': return <Crown className="w-5 h-5 text-gold" />;
      default: return null;
    }
  };

  if (profile?.role !== 'homeroom_tutor' && profile?.role !== 'head_of_year') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">Only tutors can access this page.</p>
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
              Homeroom Dashboard 👩‍🏫
            </h1>
            <p className="text-muted-foreground">
              Track your class's reading progress and achievements.
            </p>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{stats.total_students}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{stats.total_books}</div>
                <div className="text-sm text-muted-foreground">Total Books</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{stats.average_books}</div>
                <div className="text-sm text-muted-foreground">Avg per Student</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
                <div className="flex justify-center gap-2 text-sm mt-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">{stats.bronze_count} 🥉</Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">{stats.silver_count} 🥈</Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{stats.gold_count} 🥇</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">Achievements</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle>Class {selectedClass} Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found in this class yet.
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div 
                    key={student.user_id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary"
                  >
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{student.full_name}</span>
                        {getAchievementIcon(student.achievement_level)}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <Progress 
                          value={(student.books_read / 45) * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {student.books_read}/45 books
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gold">{student.total_points}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TutorDashboard;
