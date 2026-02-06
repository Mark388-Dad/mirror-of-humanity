import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Edit, Trash2, Search, BookOpen, Star, CheckCircle, XCircle,
  AlertCircle, Loader2, RefreshCw, Flag
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Submission {
  id: string;
  title: string;
  author: string;
  points_earned: number;
  approval_status: string | null;
  created_at: string;
  category_name: string;
  category_number: number;
  reflection: string;
  user_id: string;
  profiles: {
    full_name: string;
    house: string | null;
    year_group: string | null;
    class_name: string | null;
  } | null;
}

const LibrarianUserManager = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [newPoints, setNewPoints] = useState('');

  useEffect(() => {
    fetchData();
    
    // Realtime subscription for instant updates
    const channel = supabase
      .channel('librarian-submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_submissions' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: submissionData } = await supabase
      .from('book_submissions')
      .select(`
        id, title, author, points_earned, approval_status, created_at, category_name, category_number, reflection, user_id,
        profiles!book_submissions_user_id_fkey (full_name, house, year_group, class_name)
      `)
      .order('created_at', { ascending: false })
      .limit(500);
    
    setSubmissions((submissionData as unknown as Submission[]) || []);
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
    }
  };

  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected' | 'flagged') => {
    const { error } = await supabase
      .from('book_submissions')
      .update({ approval_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Submission ${status}`);
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
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const flaggedCount = submissions.filter(s => s.approval_status === 'flagged').length;
  const pendingCount = submissions.filter(s => s.approval_status === 'pending' || !s.approval_status).length;

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
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Quick filter shortcuts */}
      <div className="flex flex-wrap gap-2">
        <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>
          All ({submissions.length})
        </Button>
        <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('pending')}>
          ⏳ Pending ({pendingCount})
        </Button>
        <Button variant={statusFilter === 'flagged' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('flagged')}
          className={flaggedCount > 0 ? 'border-orange-500 text-orange-600' : ''}>
          <Flag className="h-3 w-3 mr-1" />Flagged ({flaggedCount})
        </Button>
        <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('approved')}>
          ✓ Approved ({submissions.filter(s => s.approval_status === 'approved').length})
        </Button>
        <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('rejected')}>
          ✗ Rejected ({submissions.filter(s => s.approval_status === 'rejected').length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by title, author, student, or category..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{submissions.length}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{pendingCount}</div>
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
            <div className="text-3xl font-bold">{flaggedCount}</div>
            <p className="text-sm text-muted-foreground">Flagged</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.map((submission, index) => (
          <motion.div key={submission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.3) }}>
            <Card className={submission.approval_status === 'flagged' ? 'border-orange-500/50 bg-orange-500/5' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">{submission.title}</h3>
                      <span className="text-muted-foreground text-sm">by {submission.author}</span>
                      {getStatusBadge(submission.approval_status)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className="text-xs">#{submission.category_number} {submission.category_name}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted by: <span className="font-medium">{submission.profiles?.full_name || 'Unknown'}</span>
                      {submission.profiles?.year_group && <Badge variant="outline" className="ml-1 text-xs">{submission.profiles.year_group}</Badge>}
                      {submission.profiles?.class_name && <Badge variant="outline" className="ml-1 text-xs">{submission.profiles.class_name}</Badge>}
                      {submission.profiles?.house && <Badge variant="outline" className="ml-1 text-xs">{submission.profiles.house}</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => { setEditingSubmission(submission); setNewPoints(submission.points_earned.toString()); }}>
                          <Star className="h-4 w-4 mr-1 text-gold" />{submission.points_earned} pts
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Points</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Book: {submission.title}</Label>
                            <p className="text-sm text-muted-foreground">by {submission.profiles?.full_name}</p>
                          </div>
                          <div>
                            <Label htmlFor="points">Points Earned</Label>
                            <Input id="points" type="number" value={newPoints} onChange={(e) => setNewPoints(e.target.value)} min={0} max={10} />
                          </div>
                        </div>
                        <DialogFooter><Button onClick={updateSubmissionPoints}>Save Changes</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {submission.approval_status !== 'approved' && (
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateSubmissionStatus(submission.id, 'approved')}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {submission.approval_status !== 'rejected' && (
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateSubmissionStatus(submission.id, 'rejected')}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {submission.approval_status !== 'flagged' && (
                      <Button variant="ghost" size="sm" className="text-orange-600" onClick={() => updateSubmissionStatus(submission.id, 'flagged')}>
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive"
                      onClick={() => { if (confirm('Delete this submission permanently?')) deleteSubmission(submission.id); }}>
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
