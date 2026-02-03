import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Upload, FileText, Image, Video, Music, File, Trash2, Brain, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LibrarianFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  ai_summary: string | null;
  category: string | null;
  is_public: boolean;
  created_at: string;
}

const getFileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.includes('image')) return Image;
  if (type.includes('video')) return Video;
  if (type.includes('audio')) return Music;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileUploadManager = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LibrarianFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingFile, setProcessingFile] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('librarian_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File) => {
    if (!user) return;
    
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('librarian-files')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('librarian-files')
        .getPublicUrl(fileName);

      // Save file record
      const { data: fileRecord, error: recordError } = await supabase
        .from('librarian_files')
        .insert({
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          is_public: true,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      setFiles(prev => [fileRecord, ...prev]);
      toast({ title: 'Upload complete!', description: file.name });

      // Automatically process with AI
      processFileWithAI(fileRecord.id, publicUrl, file.type);

    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const processFileWithAI = async (fileId: string, fileUrl: string, fileType: string) => {
    setProcessingFile(fileId);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-file', {
        body: { file_id: fileId, file_url: fileUrl, file_type: fileType, action: 'summarize' },
      });

      if (error) throw error;

      if (data?.result) {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, ai_summary: data.result } : f
        ));
        toast({ title: 'AI Processing Complete', description: 'Summary generated!' });
      }
    } catch (error) {
      console.error('AI processing error:', error);
    } finally {
      setProcessingFile(null);
    }
  };

  const deleteFile = async (file: LibrarianFile) => {
    try {
      // Delete from storage
      const fileName = file.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('librarian-files').remove([fileName]);
      }

      // Delete record
      await supabase.from('librarian_files').delete().eq('id', file.id);

      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast({ title: 'File deleted' });
    } catch (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      Array.from(selectedFiles).forEach(uploadFile);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="h-6 w-6 text-gold" />
        <div>
          <h2 className="text-2xl font-bold">File Uploads</h2>
          <p className="text-muted-foreground">Upload files with AI-powered analysis</p>
        </div>
      </div>

      {/* Upload Zone */}
      <Card 
        className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="py-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.mp3,.mp4"
          />
          
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              <p className="text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Click to upload files</p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, Word, PowerPoint, Excel, Images, Audio & Video
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file, index) => {
          const FileIcon = getFileIcon(file.file_type);
          const isProcessing = processingFile === file.id;

          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium truncate max-w-[200px]">
                          {file.file_name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => processFileWithAI(file.id, file.file_url, file.file_type || '')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFile(file)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {file.ai_summary ? (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="font-medium">AI Summary</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-4">{file.ai_summary}</p>
                    </div>
                  ) : isProcessing ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is analyzing this file...
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => processFileWithAI(file.id, file.file_url, file.file_type || '')}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </Button>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline">{file.is_public ? '🌐 Public' : '🔒 Private'}</Badge>
                    <a 
                      href={file.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View File →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {files.length === 0 && !uploading && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No files uploaded yet. Start by uploading your first file!</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadManager;
