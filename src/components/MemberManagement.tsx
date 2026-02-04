import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, BookOpen, Home, UserCircle, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { HOUSES, YEAR_GROUPS, CLASSES } from '@/lib/constants';

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

const roleLabels: Record<string, string> = {
  student: 'Student',
  homeroom_tutor: 'Homeroom Tutor',
  head_of_year: 'Head of Year',
  house_patron: 'House Patron',
  librarian: 'Librarian',
  staff: 'Staff',
};

const houseColors: Record<string, string> = {
  Kenya: 'bg-red-500',
  Longonot: 'bg-blue-500',
  Kilimanjaro: 'bg-green-500',
  Elgon: 'bg-amber-500',
};

const MemberManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const filterProfiles = (roleFilter?: string, additionalFilter?: (p: Profile) => boolean) => {
    return profiles
      .filter(p => roleFilter ? p.role === roleFilter : true)
      .filter(p => additionalFilter ? additionalFilter(p) : true)
      .filter(p => 
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const students = filterProfiles('student');
  const librarians = filterProfiles('librarian');
  const housePatrons = filterProfiles('house_patron');
  const headsOfYear = filterProfiles('head_of_year');
  const homeroomTutors = filterProfiles('homeroom_tutor');
  const allStaff = profiles.filter(p => p.role !== 'student');

  const MemberCard = ({ profile }: { profile: Profile }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
    >
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
        {profile.house && (
          <Badge className={`${houseColors[profile.house]} text-white`}>
            {profile.house}
          </Badge>
        )}
        {profile.year_group && (
          <Badge variant="secondary">{profile.year_group}</Badge>
        )}
        {profile.class_name && (
          <Badge variant="outline">{profile.class_name}</Badge>
        )}
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
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-gold" />
        <div>
          <h2 className="text-2xl font-bold">Member Management</h2>
          <p className="text-muted-foreground">View all platform members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{students.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{librarians.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Librarians</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{housePatrons.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">House Patrons</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{headsOfYear.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Heads of Year</p>
          </CardContent>
        </Card>
        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-pink-500" />
              <span className="text-2xl font-bold">{homeroomTutors.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Tutors</p>
          </CardContent>
        </Card>
      </div>

      {/* Member Tabs */}
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
                <GraduationCap className="h-5 w-5" />
                Students by House & Year Group
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
                    {students.map(profile => (
                      <MemberCard key={profile.id} profile={profile} />
                    ))}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Librarians
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {librarians.map(profile => (
                  <MemberCard key={profile.id} profile={profile} />
                ))}
                {librarians.length === 0 && (
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No librarians registered yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="house_patrons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                House Patrons
              </CardTitle>
            </CardHeader>
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
                            {patron ? (
                              <>
                                <p className="text-sm">{patron.full_name}</p>
                                <p className="text-xs text-muted-foreground">{patron.email}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">No patron assigned</p>
                            )}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Heads of Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {YEAR_GROUPS.map(yearGroup => {
                  const head = headsOfYear.find(p => p.year_group === yearGroup);
                  return (
                    <Card key={yearGroup} className={`border-2 ${head ? 'border-green-500/30' : 'border-dashed border-muted'}`}>
                      <CardContent className="pt-4">
                        <Badge variant="secondary" className="mb-2">{yearGroup}</Badge>
                        {head ? (
                          <>
                            <p className="font-medium">{head.full_name}</p>
                            <p className="text-sm text-muted-foreground">{head.email}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No head assigned</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Homeroom Tutors & Their Classes
              </CardTitle>
            </CardHeader>
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
                        {tutors.length > 0 ? (
                          tutors.map(tutor => (
                            <div key={tutor.id} className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {tutor.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{tutor.full_name}</p>
                                <p className="text-xs text-muted-foreground">{tutor.year_group}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No tutor assigned</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all_staff">
          <Card>
            <CardHeader>
              <CardTitle>All Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {allStaff.map(profile => (
                  <MemberCard key={profile.id} profile={profile} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberManagement;
