 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { toast } from 'sonner';
 import { 
   UserPlus, Edit, Trash2, Search, BookOpen, Star, CheckCircle, XCircle,
   AlertCircle, Loader2, RefreshCw, Eye
 } from 'lucide-react';
 import { motion } from 'framer-motion';
 import { HOUSES, YEAR_GROUPS, CLASSES, HOUSE_COLORS } from '@/lib/constants';
 
 interface Submission {
   id: string;
   title: string;
   author: string;
   points_earned: number;
   approval_status: string | null;
   created_at: string;
   category_name: string;
   reflection: string;
   profiles: {
     full_name: string;
     house: string | null;
     year_group: string | null;
   } | null;
 }
 
 interface Profile {
   id: string;
   user_id: string;
   full_name: string;
   email: string;
   role: string;
   year_group: string | null;
   class_name: string | null;
   house: string | null;
 }
 
 const LibrarianUserManager = () => {
   const { user } = useAuth();
   const [submissions, setSubmissions] = useState<Submission[]>([]);
   const [profiles, setProfiles] = useState<Profile[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   
   // Edit points dialog
   const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
   const [newPoints, setNewPoints] = useState('');
   
   // Add user dialog
   const [showAddUser, setShowAddUser] = useState(false);
   const [newUserName, setNewUserName] = useState('');
   const [newUserEmail, setNewUserEmail] = useState('');
   const [newUserRole, setNewUserRole] = useState<string>('student');
   const [newUserHouse, setNewUserHouse] = useState<string>('');
   const [newUserYear, setNewUserYear] = useState<string>('');
   const [newUserClass, setNewUserClass] = useState<string>('');
 
   useEffect(() => {
     fetchData();
   }, []);
 
   const fetchData = async () => {
     setLoading(true);
     
     // Fetch all submissions with profile info
     const { data: submissionData } = await supabase
       .from('book_submissions')
       .select(`
         id, title, author, points_earned, approval_status, created_at, category_name, reflection,
         profiles!book_submissions_user_id_fkey (full_name, house, year_group)
       `)
       .order('created_at', { ascending: false })
       .limit(100);
     
     setSubmissions((submissionData as unknown as Submission[]) || []);
     
     // Fetch profiles
     const { data: profileData } = await supabase
       .from('profiles')
       .select('*')
       .order('full_name');
     
     setProfiles(profileData || []);
     setLoading(false);
   };
 
   const updateSubmissionPoints = async () => {
     if (!editingSubmission || !newPoints) return;
     
     const { error } = await supabase
       .from('book_submissions')
       .update({ points_earned: parseInt(newPoints) })
       .eq('id', editingSubmission.id);
     
     if (error) {
       toast.error('Failed to update points');
     } else {
       toast.success('Points updated!');
       setEditingSubmission(null);
       fetchData();
     }
   };
 
   const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
     const { error } = await supabase
       .from('book_submissions')
       .update({ 
         approval_status: status,
         reviewed_at: new Date().toISOString()
       })
       .eq('id', id);
     
     if (error) {
       toast.error('Failed to update status');
     } else {
       toast.success(`Submission ${status}`);
       fetchData();
     }
   };
 
   const deleteSubmission = async (id: string) => {
     const { error } = await supabase
       .from('book_submissions')
       .delete()
       .eq('id', id);
     
     if (error) {
       toast.error('Failed to delete submission');
     } else {
       toast.success('Submission deleted');
       fetchData();
     }
   };
 
   const filteredSubmissions = submissions.filter(sub => {
     const matchesSearch = 
       sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = statusFilter === 'all' || sub.approval_status === statusFilter;
     return matchesSearch && matchesStatus;
   });
 
   const getStatusBadge = (status: string | null) => {
     switch (status) {
       case 'approved': return <Badge className="bg-green-500">✓ Approved</Badge>;
       case 'rejected': return <Badge variant="destructive">✗ Rejected</Badge>;
       case 'flagged': return <Badge className="bg-orange-500">⚠ Flagged</Badge>;
       default: return <Badge variant="secondary">⏳ Pending</Badge>;
     }
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <BookOpen className="h-6 w-6 text-gold" />
           <div>
             <h2 className="text-2xl font-bold">Submission Manager</h2>
             <p className="text-muted-foreground">Review, edit points, and manage all book submissions</p>
           </div>
         </div>
         <Button onClick={fetchData} variant="outline" size="sm">
           <RefreshCw className="h-4 w-4 mr-2" />
           Refresh
         </Button>
       </div>
 
       {/* Filters */}
       <div className="flex flex-wrap gap-4">
         <div className="relative flex-1 min-w-[200px]">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search by title or student..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10"
           />
         </div>
         <Select value={statusFilter} onValueChange={setStatusFilter}>
           <SelectTrigger className="w-40">
             <SelectValue placeholder="Status" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">All Status</SelectItem>
             <SelectItem value="pending">Pending</SelectItem>
             <SelectItem value="approved">Approved</SelectItem>
             <SelectItem value="rejected">Rejected</SelectItem>
             <SelectItem value="flagged">Flagged</SelectItem>
           </SelectContent>
         </Select>
       </div>
 
       {/* Stats */}
       <div className="grid grid-cols-4 gap-4">
         <Card className="border-blue-500/20 bg-blue-500/5">
           <CardContent className="pt-4 text-center">
             <div className="text-3xl font-bold">{submissions.length}</div>
             <p className="text-sm text-muted-foreground">Total</p>
           </CardContent>
         </Card>
         <Card className="border-yellow-500/20 bg-yellow-500/5">
           <CardContent className="pt-4 text-center">
             <div className="text-3xl font-bold">{submissions.filter(s => s.approval_status === 'pending' || !s.approval_status).length}</div>
             <p className="text-sm text-muted-foreground">Pending</p>
           </CardContent>
         </Card>
         <Card className="border-green-500/20 bg-green-500/5">
           <CardContent className="pt-4 text-center">
             <div className="text-3xl font-bold">{submissions.filter(s => s.approval_status === 'approved').length}</div>
             <p className="text-sm text-muted-foreground">Approved</p>
           </CardContent>
         </Card>
         <Card className="border-orange-500/20 bg-orange-500/5">
           <CardContent className="pt-4 text-center">
             <div className="text-3xl font-bold">{submissions.filter(s => s.approval_status === 'flagged').length}</div>
             <p className="text-sm text-muted-foreground">Flagged</p>
           </CardContent>
         </Card>
       </div>
 
       {/* Submissions List */}
       <div className="space-y-3">
         {filteredSubmissions.map((submission, index) => (
           <motion.div
             key={submission.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: index * 0.02 }}
           >
             <Card>
               <CardContent className="pt-4">
                 <div className="flex items-start justify-between gap-4">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                       <h3 className="font-semibold">{submission.title}</h3>
                       <span className="text-muted-foreground">by {submission.author}</span>
                       {getStatusBadge(submission.approval_status)}
                     </div>
                     <p className="text-sm text-muted-foreground mb-2">
                       Submitted by: <span className="font-medium">{submission.profiles?.full_name || 'Unknown'}</span>
                       {submission.profiles?.house && (
                         <Badge variant="outline" className="ml-2">{submission.profiles.house}</Badge>
                       )}
                       {submission.profiles?.year_group && (
                         <Badge variant="outline" className="ml-1">{submission.profiles.year_group}</Badge>
                       )}
                     </p>
                     <p className="text-sm text-muted-foreground line-clamp-2">
                       <strong>Category:</strong> {submission.category_name}
                     </p>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     {/* Points display and edit */}
                     <Dialog>
                       <DialogTrigger asChild>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => {
                             setEditingSubmission(submission);
                             setNewPoints(submission.points_earned.toString());
                           }}
                         >
                           <Star className="h-4 w-4 mr-1 text-gold" />
                           {submission.points_earned} pts
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Edit Points</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-4">
                           <div>
                             <Label>Book: {submission.title}</Label>
                             <p className="text-sm text-muted-foreground">by {submission.profiles?.full_name}</p>
                           </div>
                           <div>
                             <Label htmlFor="points">Points Earned</Label>
                             <Input
                               id="points"
                               type="number"
                               value={newPoints}
                               onChange={(e) => setNewPoints(e.target.value)}
                               min={0}
                               max={100}
                             />
                           </div>
                         </div>
                         <DialogFooter>
                           <Button onClick={updateSubmissionPoints}>Save Changes</Button>
                         </DialogFooter>
                       </DialogContent>
                     </Dialog>
                     
                     {/* Approve/Reject */}
                     {submission.approval_status !== 'approved' && (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="text-green-600"
                         onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                       >
                         <CheckCircle className="h-4 w-4" />
                       </Button>
                     )}
                     {submission.approval_status !== 'rejected' && (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="text-red-600"
                         onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                       >
                         <XCircle className="h-4 w-4" />
                       </Button>
                     )}
                     
                     {/* Delete */}
                     <Button
                       variant="ghost"
                       size="sm"
                       className="text-destructive"
                       onClick={() => {
                         if (confirm('Are you sure you want to delete this submission?')) {
                           deleteSubmission(submission.id);
                         }
                       }}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </motion.div>
         ))}
         
         {filteredSubmissions.length === 0 && (
           <div className="text-center py-12 text-muted-foreground">
             <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
             <p>No submissions found matching your filters.</p>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default LibrarianUserManager;