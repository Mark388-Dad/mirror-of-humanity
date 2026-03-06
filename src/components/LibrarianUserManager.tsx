import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Trash2, Search, BookOpen, Star, CheckCircle, XCircle,
  AlertCircle, Loader2, RefreshCw, Flag, Bell, Eye,
  AlertTriangle, Lock, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MAX_BOOKS } from '@/lib/constants';

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
  ai_feedback: string | null;
  user_id: string;
  date_started: string;
  date_finished: string;
  reviewed_at: string | null;
  profiles: {
    full_name: string;
    house: string | null;
    year_group: string | null;
    class_name: string | null;
    email: string;
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
  const [reviewSubmission, setReviewSubmission] = useState<Submission | null>(null);
  const [rejectSubmission, setRejectSubmission] = useState<Submission | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [incompleteSubmission, setIncompleteSubmission] = useState<Submission | null>(null);
  const [incompleteFeedback, setIncompleteFeedback] = useState('');
  const [notifySubmission, setNotifySubmission] = useState<Submission | null>(null);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Submission | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('librarian-submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'book_submissions' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAllSubmissions = async () => {
    const allData: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('book_submissions')
        .select('id, title, author, points_earned, approval_status, created_at, category_name, category_number, reflection, ai_feedback, user_id, date_started, date_finished, reviewed_at')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) { hasMore = false; break; }
      allData.push(...data);
      if (data.length < pageSize) { hasMore = false; } else { from += pageSize; }
    }
    return allData;
  };

  const fetchData = async () => {
    setLoading(true);
    const [submissionData, { data: profileData }] = await Promise.all([
      fetchAllSubmissions(),
      supabase.from('profiles').select('user_id, full_name, house, year_group, class_name, email'),
    ]);

    const profileMap = new Map<string, { full_name: string; house: string | null; year_group: string | null; class_name: string | null; email: string }>();
    (profileData || []).forEach((p: any) => {
      profileMap.set(p.user_id, { full_name: p.full_name, house: p.house, year_group: p.year_group, class_name: p.class_name, email: p.email });
    });

    const merged = (submissionData || []).map((s: any) => ({
      ...s,
      profiles: profileMap.get(s.user_id) || null,
    }));

    setSubmissions(merged as Submission[]);
    setLoading(false);
  };

  const sendNotification = async (userId: string, email: string, type: string, title: string, message: string) => {
    try {
      // In-app notification
      await supabase.from('notifications').insert({
        user_id: userId, type, title, message
      });
      // Email notification
      await supabase.functions.invoke('send-notification', {
        body: { user_id: userId, email, type, title, message }
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const updateSubmissionPoints = async () => {
    if (!editingSubmission || !newPoints) return;
    setActionLoading('points');
    const { error } = await supabase
      .from('book_submissions')
      .update({ points_earned: parseInt(newPoints) })
      .eq('id', editingSubmission.id);
    if (error) {
      toast.error('Failed to update points');
    } else {
      toast.success('Points updated!');
      if (editingSubmission.profiles) {
        sendNotification(editingSubmission.user_id, editingSubmission.profiles.email,
          'approval', '⭐ Points Updated',
          `Your submission "${editingSubmission.title}" now has ${newPoints} points.`);
      }
      setEditingSubmission(null);
    }
    setActionLoading(null);
  };

  const approveSubmission = async (sub: Submission) => {
    setActionLoading(sub.id);
    const { error } = await supabase
      .from('book_submissions')
      .update({ approval_status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', sub.id);
    if (error) {
      toast.error('Failed to approve');
    } else {
      toast.success('✅ Submission approved!');
      if (sub.profiles) {
        sendNotification(sub.user_id, sub.profiles.email, 'approval',
          '✅ Book Approved!',
          `Your submission "${sub.title}" has been approved! +${sub.points_earned} points earned.`);
      }
    }
    setActionLoading(null);
  };

  const rejectSubmissionAction = async () => {
    if (!rejectSubmission || !rejectFeedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }
    setActionLoading('reject');
    const { error } = await supabase
      .from('book_submissions')
      .update({
        approval_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        ai_feedback: rejectFeedback,
      })
      .eq('id', rejectSubmission.id);
    if (error) {
      toast.error('Failed to reject');
    } else {
      toast.success('❌ Submission rejected');
      if (rejectSubmission.profiles) {
        sendNotification(rejectSubmission.user_id, rejectSubmission.profiles.email, 'approval',
          '❌ Submission Rejected',
          `Your submission "${rejectSubmission.title}" was rejected. Feedback: ${rejectFeedback}`);
      }
      setRejectSubmission(null);
      setRejectFeedback('');
    }
    setActionLoading(null);
  };

  const flagSubmission = async (sub: Submission) => {
    setActionLoading(sub.id + '-flag');
    const { error } = await supabase
      .from('book_submissions')
      .update({ approval_status: 'flagged', reviewed_at: new Date().toISOString() })
      .eq('id', sub.id);
    if (error) {
      toast.error('Failed to flag');
    } else {
      toast.success('🚩 Submission flagged for review');
      if (sub.profiles) {
        sendNotification(sub.user_id, sub.profiles.email, 'submission',
          '⚠️ Submission Under Review',
          `Your submission "${sub.title}" has been flagged for additional review.`);
      }
    }
    setActionLoading(null);
  };

  const markIncompleteAction = async () => {
    if (!incompleteSubmission) return;
    setActionLoading('incomplete');
    const feedback = incompleteFeedback.trim() || 'Your submission needs additional information. Please update and resubmit.';
    const { error } = await supabase
      .from('book_submissions')
      .update({
        approval_status: 'pending',
        ai_feedback: `⚠️ Marked Incomplete: ${feedback}`,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', incompleteSubmission.id);
    if (error) {
      toast.error('Failed to mark incomplete');
    } else {
      toast.success('⚠️ Marked as incomplete');
      if (incompleteSubmission.profiles) {
        sendNotification(incompleteSubmission.user_id, incompleteSubmission.profiles.email, 'submission',
          '⚠️ Submission Incomplete',
          `Your submission "${incompleteSubmission.title}" needs revision: ${feedback}`);
      }
      setIncompleteSubmission(null);
      setIncompleteFeedback('');
    }
    setActionLoading(null);
  };

  const deleteSubmission = async () => {
    if (!deleteConfirm) return;
    setActionLoading('delete');
    const { error } = await supabase
      .from('book_submissions')
      .delete()
      .eq('id', deleteConfirm.id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('🗑️ Submission deleted');
      if (deleteConfirm.profiles) {
        sendNotification(deleteConfirm.user_id, deleteConfirm.profiles.email, 'submission',
          '🗑️ Submission Removed',
          `Your submission "${deleteConfirm.title}" has been removed by a librarian.`);
      }
      setDeleteConfirm(null);
    }
    setActionLoading(null);
  };

  const sendManualNotification = async () => {
    if (!notifySubmission || !notifyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setActionLoading('notify');
    if (notifySubmission.profiles) {
      await sendNotification(notifySubmission.user_id, notifySubmission.profiles.email,
        'submission', '📢 Message from Librarian', notifyMessage);
      toast.success('🔔 Notification sent!');
    }
    setNotifySubmission(null);
    setNotifyMessage('');
    setActionLoading(null);
  };

  const exportCSV = () => {
    const csvRows = ['Student,Email,Title,Author,Category,Points,Status,Date Started,Date Finished,Submitted'];
    submissions.forEach(s => {
      csvRows.push(`"${s.profiles?.full_name || ''}","${s.profiles?.email || ''}","${s.title}","${s.author}","${s.category_name}",${s.points_earned},"${s.approval_status || 'pending'}","${s.date_started}","${s.date_finished}","${new Date(s.created_at).toLocaleDateString()}"`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'submissions-export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('📥 CSV exported!');
  };

  const approveAllPending = async () => {
    const pendingSubs = submissions.filter(s => !s.approval_status || s.approval_status === 'pending');
    if (pendingSubs.length === 0) {
      toast.info('No pending submissions to approve');
      return;
    }
    setBulkApproving(true);
    const ids = pendingSubs.map(s => s.id);
    const { error } = await supabase
      .from('book_submissions')
      .update({ approval_status: 'approved', reviewed_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      toast.error('Failed to bulk approve');
    } else {
      toast.success(`✅ ${pendingSubs.length} submissions approved!`);
    }
    setBulkApproving(false);
    fetchData();
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' ? (!sub.approval_status || sub.approval_status === 'pending') : sub.approval_status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500 text-white">✅ Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">❌ Rejected</Badge>;
      case 'flagged': return <Badge className="bg-orange-500 text-white">🚩 Flagged</Badge>;
      default: return <Badge variant="secondary">⏳ Pending</Badge>;
    }
  };

  const flaggedCount = submissions.filter(s => s.approval_status === 'flagged').length;
  const pendingCount = submissions.filter(s => s.approval_status === 'pending' || !s.approval_status).length;
  const approvedCount = submissions.filter(s => s.approval_status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.approval_status === 'rejected').length;

  // Student-level stats
  const getStudentStats = (userId: string) => {
    const userSubs = submissions.filter(s => s.user_id === userId);
    const totalBooks = userSubs.length;
    const totalPoints = userSubs.reduce((sum, s) => sum + s.points_earned, 0);
    return { totalBooks, totalPoints, maxBooks: MAX_BOOKS, maxPoints: MAX_BOOKS * 3 };
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Submission Manager</h2>
            <p className="text-muted-foreground">Review, approve, reject, flag, and manage all book submissions</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pendingCount > 0 && (
            <Button onClick={approveAllPending} size="sm" disabled={bulkApproving}
              className="bg-green-600 hover:bg-green-700 text-white">
              {bulkApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve All Pending ({pendingCount})
            </Button>
          )}
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-blue-500/20 bg-blue-500/5 cursor-pointer" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5 cursor-pointer" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">⏳ Pending</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5 cursor-pointer" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">✅ Approved</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5 cursor-pointer" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">❌ Rejected</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20 bg-orange-500/5 cursor-pointer" onClick={() => setStatusFilter('flagged')}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{flaggedCount}</div>
            <p className="text-xs text-muted-foreground">🚩 Flagged</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by title, author, student, or category..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.map((submission, index) => {
          const stats = getStudentStats(submission.user_id);
          const isApproved = submission.approval_status === 'approved';

          return (
            <motion.div key={submission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}>
              <Card className={`${
                submission.approval_status === 'flagged' ? 'border-orange-500/50 bg-orange-500/5' :
                submission.approval_status === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
                isApproved ? 'border-green-500/30 bg-green-500/5' : ''
              }`}>
                <CardContent className="pt-4">
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold">{submission.title}</h3>
                          <span className="text-muted-foreground text-sm">by {submission.author}</span>
                          {getStatusBadge(submission.approval_status)}
                          {isApproved && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs">#{submission.category_number} {submission.category_name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{submission.profiles?.full_name || 'Unknown'}</span>
                          {submission.profiles?.year_group && <Badge variant="outline" className="ml-1 text-xs">{submission.profiles.year_group}</Badge>}
                          {submission.profiles?.class_name && <Badge variant="outline" className="ml-1 text-xs">{submission.profiles.class_name}</Badge>}
                          {submission.profiles?.house && <Badge variant="outline" className="ml-1 text-xs">{submission.profiles.house}</Badge>}
                        </p>
                        {/* Student progress mini-bar */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>📚 {stats.totalBooks}/{stats.maxBooks}</span>
                          <Progress value={(stats.totalBooks / stats.maxBooks) * 100} className="h-1.5 w-20" />
                          <span>⭐ {stats.totalPoints}/{stats.maxPoints} pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <Badge className="bg-primary/10 text-primary text-lg font-bold px-3 py-1">
                          {submission.points_earned} pts
                        </Badge>
                      </div>
                    </div>

                    {/* AI Feedback if present */}
                    {submission.ai_feedback && (
                      <div className="bg-muted p-2 rounded-lg text-xs">
                        <span className="font-semibold text-orange-600">AI/Librarian Feedback:</span> {submission.ai_feedback}
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-1.5 flex-wrap border-t pt-3">
                      {/* Review */}
                      <Button variant="outline" size="sm" onClick={() => setReviewSubmission(submission)} className="text-blue-600">
                        <Eye className="h-3.5 w-3.5 mr-1" />Review
                      </Button>

                      {/* Quick Approve (visible for non-approved) */}
                      {!isApproved && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={actionLoading === submission.id}
                          onClick={() => approveSubmission(submission)}>
                          {actionLoading === submission.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                          Approve
                        </Button>
                      )}

                      {/* Reject */}
                      {submission.approval_status !== 'rejected' && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => { setRejectSubmission(submission); setRejectFeedback(''); }}>
                          <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                        </Button>
                      )}

                      {/* Mark Incomplete */}
                      {submission.approval_status !== 'approved' && (
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => { setIncompleteSubmission(submission); setIncompleteFeedback(''); }}>
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />Incomplete
                        </Button>
                      )}

                      {/* Flag */}
                      {submission.approval_status !== 'flagged' && (
                        <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          disabled={actionLoading === submission.id + '-flag'}
                          onClick={() => flagSubmission(submission)}>
                          <Flag className="h-3.5 w-3.5 mr-1" />Flag
                        </Button>
                      )}

                      {/* Notify */}
                      <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => { setNotifySubmission(submission); setNotifyMessage(''); }}>
                        <Bell className="h-3.5 w-3.5 mr-1" />Notify
                      </Button>

                      {/* Edit Points */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm"
                            onClick={() => { setEditingSubmission(submission); setNewPoints(submission.points_earned.toString()); }}>
                            <Star className="h-3.5 w-3.5 mr-1 text-yellow-500" />Points
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Points</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              <strong>{submission.title}</strong> by {submission.profiles?.full_name}
                            </p>
                            <div>
                              <Label htmlFor="points">Points Earned</Label>
                              <Input id="points" type="number" value={newPoints} onChange={(e) => setNewPoints(e.target.value)} min={0} max={10} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={updateSubmissionPoints} disabled={actionLoading === 'points'}>
                              {actionLoading === 'points' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Delete */}
                      <Button variant="outline" size="sm" className="text-destructive border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteConfirm(submission)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No submissions found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewSubmission} onOpenChange={(open) => !open && setReviewSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />Submission Review
            </DialogTitle>
          </DialogHeader>
          {reviewSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-semibold text-muted-foreground">Student</p>
                  <p className="font-bold">{reviewSubmission.profiles?.full_name}</p>
                  <p className="text-xs">{reviewSubmission.profiles?.email}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-semibold text-muted-foreground">Status</p>
                  {getStatusBadge(reviewSubmission.approval_status)}
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-semibold text-muted-foreground">House / Year / Class</p>
                  <p>{reviewSubmission.profiles?.house || '-'} / {reviewSubmission.profiles?.year_group || '-'} / {reviewSubmission.profiles?.class_name || '-'}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-semibold text-muted-foreground">Points</p>
                  <p className="text-lg font-bold text-primary">{reviewSubmission.points_earned}</p>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold text-muted-foreground mb-1">📚 Book</p>
                <p className="font-bold text-lg">{reviewSubmission.title}</p>
                <p className="text-sm">by {reviewSubmission.author}</p>
                <Badge variant="outline" className="mt-1">#{reviewSubmission.category_number} {reviewSubmission.category_name}</Badge>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold text-muted-foreground mb-1">📝 Reflection</p>
                <p className="text-sm whitespace-pre-wrap">{reviewSubmission.reflection}</p>
              </div>
              {reviewSubmission.ai_feedback && (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200">
                  <p className="font-semibold text-orange-600 mb-1">🤖 AI/Librarian Feedback</p>
                  <p className="text-sm">{reviewSubmission.ai_feedback}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📅 Read: {reviewSubmission.date_started} → {reviewSubmission.date_finished}</p>
                <p>📤 Submitted: {new Date(reviewSubmission.created_at).toLocaleString()}</p>
                {reviewSubmission.reviewed_at && <p>✅ Reviewed: {new Date(reviewSubmission.reviewed_at).toLocaleString()}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                {reviewSubmission.approval_status !== 'approved' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    onClick={() => { approveSubmission(reviewSubmission); setReviewSubmission(null); }}>
                    <CheckCircle className="h-4 w-4 mr-1" />Approve
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-red-600 flex-1"
                  onClick={() => { setRejectSubmission(reviewSubmission); setReviewSubmission(null); }}>
                  <XCircle className="h-4 w-4 mr-1" />Reject
                </Button>
                <Button size="sm" variant="outline" className="text-orange-600 flex-1"
                  onClick={() => { flagSubmission(reviewSubmission); setReviewSubmission(null); }}>
                  <Flag className="h-4 w-4 mr-1" />Flag
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectSubmission} onOpenChange={(open) => !open && setRejectSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">❌ Reject Submission</DialogTitle>
            <DialogDescription>Provide mandatory feedback explaining the rejection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              <strong>{rejectSubmission?.title}</strong> by {rejectSubmission?.profiles?.full_name}
            </p>
            <div>
              <Label>Rejection Feedback *</Label>
              <Textarea value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)}
                placeholder="Explain why this submission is being rejected..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectSubmission(null)}>Cancel</Button>
            <Button variant="destructive" onClick={rejectSubmissionAction} disabled={actionLoading === 'reject' || !rejectFeedback.trim()}>
              {actionLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Incomplete Dialog */}
      <Dialog open={!!incompleteSubmission} onOpenChange={(open) => !open && setIncompleteSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600">⚠️ Mark as Incomplete</DialogTitle>
            <DialogDescription>Send the submission back to the student with feedback.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              <strong>{incompleteSubmission?.title}</strong> by {incompleteSubmission?.profiles?.full_name}
            </p>
            <div>
              <Label>Feedback for Student</Label>
              <Textarea value={incompleteFeedback} onChange={e => setIncompleteFeedback(e.target.value)}
                placeholder="What needs to be improved or added?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncompleteSubmission(null)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={markIncompleteAction} disabled={actionLoading === 'incomplete'}>
              {actionLoading === 'incomplete' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mark Incomplete & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Dialog */}
      <Dialog open={!!notifySubmission} onOpenChange={(open) => !open && setNotifySubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-purple-600">🔔 Send Notification</DialogTitle>
            <DialogDescription>Send a custom message to {notifySubmission?.profiles?.full_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Re: <strong>{notifySubmission?.title}</strong>
            </p>
            <div>
              <Label>Message</Label>
              <Textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)}
                placeholder="Type your message to the student..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifySubmission(null)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={sendManualNotification}
              disabled={actionLoading === 'notify' || !notifyMessage.trim()}>
              {actionLoading === 'notify' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">🗑️ Delete Submission</DialogTitle>
            <DialogDescription>This action cannot be undone. The submission will be permanently removed.</DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
            <p className="font-semibold">{deleteConfirm?.title}</p>
            <p className="text-sm text-muted-foreground">by {deleteConfirm?.author} — submitted by {deleteConfirm?.profiles?.full_name}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteSubmission} disabled={actionLoading === 'delete'}>
              {actionLoading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibrarianUserManager;
