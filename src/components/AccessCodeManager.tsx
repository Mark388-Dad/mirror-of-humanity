import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Copy, Key, Trash2, Plus, Users, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccessCode {
  id: string;
  code: string;
  code_type: string;
  school_name: string | null;
  year_group: string | null;
  class_name: string | null;
  house: string | null;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const AccessCodeManager = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New code form
  const [newCodeType, setNewCodeType] = useState<'librarian' | 'student'>('student');
  const [newYearGroup, setNewYearGroup] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('50');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading codes', variant: 'destructive' });
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const prefix = newCodeType === 'librarian' ? 'LIB' : 'STU';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const createCode = async () => {
    setCreating(true);
    const code = generateCode();

    const { error } = await supabase.from('access_codes').insert({
      code,
      code_type: newCodeType,
      year_group: newYearGroup === 'any' ? null : newYearGroup || null,
      class_name: newClassName || null,
      house: newHouse === 'any' ? null : newHouse || null,
      max_uses: parseInt(newMaxUses) || 50,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: 'Failed to create code', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Code created!', description: `New ${newCodeType} code: ${code}` });
      fetchCodes();
      setNewYearGroup('');
      setNewClassName('');
      setNewHouse('');
    }
    setCreating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase.from('access_codes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } else {
      setCodes(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Code deleted' });
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('access_codes')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (!error) {
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentState } : c));
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
        <Key className="h-6 w-6 text-gold" />
        <div>
          <h2 className="text-2xl font-bold">Access Codes</h2>
          <p className="text-muted-foreground">Generate secure codes for librarians and students</p>
        </div>
      </div>

      {/* Create New Code */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Code
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* CODE TYPE */}
            <Select value={newCodeType} onValueChange={(v) => setNewCodeType(v as 'librarian' | 'student'| 'Tonny')}>
              <SelectTrigger>
                <SelectValue placeholder="Code Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Student
                  </div>
                </SelectItem>
                <SelectItem value="librarian">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Librarian
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* YEAR GROUP */}
            <Select value={newYearGroup} onValueChange={setNewYearGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Year Group (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="MYP5">MYP5</SelectItem>
                <SelectItem value="DP1">DP1</SelectItem>
                <SelectItem value="DP2">DP2</SelectItem>
                <SelectItem value="G10">G10</SelectItem>
              </SelectContent>
            </Select>

            {/* HOUSE */}
            <Select value={newHouse} onValueChange={setNewHouse}>
              <SelectTrigger>
                <SelectValue placeholder="House (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="Kenya">Kenya</SelectItem>
                <SelectItem value="Longonot">Longonot</SelectItem>
                <SelectItem value="Kilimanjaro">Kilimanjaro</SelectItem>
                <SelectItem value="Elgon">Elgon</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Max uses"
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
            />

            <Button onClick={createCode} disabled={creating} className="w-full">
              <Key className="h-4 w-4 mr-2" />
              {creating ? 'Creating...' : 'Generate Code'}
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Existing Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {codes.map((code, index) => (
          <motion.div
            key={code.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`${code.is_active ? '' : 'opacity-50'}`}>
              <CardContent className="pt-4">

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={code.code_type === 'librarian' ? 'default' : 'secondary'}>
                      {code.code_type === 'librarian' ? '👤 Librarian' : '📚 Student'}
                    </Badge>
                    {!code.is_active && <Badge variant="outline">Disabled</Badge>}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(code.id, code.is_active)}>
                      {code.is_active ? '🔓' : '🔒'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteCode(code.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="font-mono text-lg font-bold bg-muted px-3 py-2 rounded text-center mb-3">
                  {code.code}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Uses: {code.current_uses} / {code.max_uses}</span>
                  <div className="flex gap-2">
                    {code.year_group && <Badge variant="outline">{code.year_group}</Badge>}
                    {code.house && <Badge variant="outline">{code.house}</Badge>}
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {codes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No access codes yet. Generate your first code above!</p>
        </div>
      )}

    </div>
  );
};

export default AccessCodeManager;
