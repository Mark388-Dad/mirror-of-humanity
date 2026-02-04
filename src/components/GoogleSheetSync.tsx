import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, Cloud, CheckCircle, AlertCircle, Database, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface SyncLog {
  id: string;
  sync_type: string;
  records_synced: number;
  errors: string[] | null;
  created_at: string;
}

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf-u0b7RP1aUMOJGQvGzUaJKEP2hMKyNWvB0cMu68ANHqFq-A/viewform?usp=header";
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1QMquWqbvB7OAhyry0YpS5hCJ7KpVsa6MPHgEbERKTKw/edit?usp=sharing";

const GoogleSheetSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyncLogs();
  }, []);

  const fetchSyncLogs = async () => {
    const { data, error } = await supabase
      .from('sheet_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setSyncLogs(data);
      setLastSync(data[0] || null);
    }
    setLoading(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-sheet', {
        body: { sync_type: 'manual' },
      });

      if (error) throw error;

      // Handle case where sheet is not public
      if (data.success === false && data.error) {
        toast({
          title: 'Sync Issue',
          description: data.error,
          variant: 'destructive',
        });
        
        // Show instructions if available
        if (data.instructions) {
          console.log('Instructions to make sheet public:', data.instructions);
        }
        return;
      }

      toast({
        title: 'Sync Complete! ✅',
        description: `${data.records_synced} new records synced, ${data.auto_imported || 0} auto-imported`,
      });

      fetchSyncLogs();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="h-6 w-6 text-gold" />
        <div>
          <h2 className="text-2xl font-bold">Google Sheets Sync</h2>
          <p className="text-muted-foreground">Sync student submissions from Google Forms</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors">
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
            <CardContent className="py-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <ExternalLink className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Student Submission Form</h3>
                <p className="text-sm text-muted-foreground">Google Form for students</p>
              </div>
            </CardContent>
          </a>
        </Card>

        <Card className="border-2 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
          <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer">
            <CardContent className="py-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Master Data Sheet</h3>
                <p className="text-sm text-muted-foreground">View all responses</p>
              </div>
            </CardContent>
          </a>
        </Card>
      </div>

      {/* Sync Button */}
      <Card className="border-2 border-primary/20">
        <CardContent className="py-8 text-center">
          <motion.div
            animate={syncing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <RefreshCw className={`h-12 w-12 ${syncing ? 'text-primary' : 'text-muted-foreground'}`} />
          </motion.div>
          
          <h3 className="text-xl font-semibold mb-2">
            {syncing ? 'Syncing...' : 'Ready to Sync'}
          </h3>
          
          {lastSync && (
            <p className="text-sm text-muted-foreground mb-4">
              Last sync: {formatDate(lastSync.created_at)} ({lastSync.records_synced} records)
            </p>
          )}

          <Button
            size="lg"
            onClick={triggerSync}
            disabled={syncing}
            className="min-w-[200px]"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            Pulls new submissions from Google Sheets and auto-imports for registered students
          </p>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : syncLogs.length > 0 ? (
            <div className="space-y-3">
              {syncLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {log.errors && log.errors.length > 0 ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{formatDate(log.created_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.sync_type} sync
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {log.records_synced} records
                    </Badge>
                    {log.errors && log.errors.length > 0 && (
                      <Badge variant="destructive">
                        {log.errors.length} errors
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No sync history yet. Click "Sync Now" to start!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSheetSync;
