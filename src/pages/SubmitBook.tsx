import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, Calendar, User, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { READING_CATEGORIES } from '@/lib/constants';
import { z } from 'zod';

const submissionSchema = z.object({
  categoryNumber: z.number().min(1).max(30),
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author is required').max(100),
  dateStarted: z.string().min(1, 'Start date is required'),
  dateFinished: z.string().min(1, 'Finish date is required'),
  reflection: z.string().min(50, 'Reflection must be at least 50 characters').max(2000),
});

const SubmitBook = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dateStarted: '',
    dateFinished: '',
    reflection: '',
  });

  const currentCategory = READING_CATEGORIES.find(c => c.id === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    try {
      const validatedData = submissionSchema.parse({
        categoryNumber: selectedCategory,
        ...formData,
      });

      // Validate dates
      if (new Date(validatedData.dateFinished) < new Date(validatedData.dateStarted)) {
        toast.error('Finish date cannot be before start date');
        return;
      }

      setLoading(true);

      const { error } = await supabase.from('book_submissions').insert({
        user_id: user.id,
        category_number: validatedData.categoryNumber,
        category_name: currentCategory?.name || '',
        title: validatedData.title.trim(),
        author: validatedData.author.trim(),
        date_started: validatedData.dateStarted,
        date_finished: validatedData.dateFinished,
        reflection: validatedData.reflection.trim(),
        points_earned: 3,
      });

      if (error) throw error;

      toast.success('Book submitted successfully! +3 points earned!');
      navigate('/progress');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to submit book');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Submit a Book 📚
          </h1>
          <p className="text-muted-foreground">
            Record your reading journey and earn points for the challenge.
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              Book Submission Form
            </CardTitle>
            <CardDescription>
              Fill in the details of the book you've completed reading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Reading Category *
                </Label>
                <Select 
                  value={selectedCategory?.toString() || ''} 
                  onValueChange={(value) => setSelectedCategory(parseInt(value))}
                >
                  <SelectTrigger className="h-auto py-3">
                    <SelectValue placeholder="Select a category for your book" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {READING_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <span className="font-medium">#{category.id}</span> - {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentCategory && (
                  <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 mt-2">
                    <p className="text-sm text-muted-foreground italic">
                      <span className="font-medium text-gold">Reflection prompt:</span> {currentCategory.prompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Book Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter the book title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Author *
                  </Label>
                  <Input
                    id="author"
                    placeholder="Enter the author's name"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateStarted" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Started *
                  </Label>
                  <Input
                    id="dateStarted"
                    type="date"
                    value={formData.dateStarted}
                    onChange={(e) => setFormData({ ...formData, dateStarted: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFinished" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Finished *
                  </Label>
                  <Input
                    id="dateFinished"
                    type="date"
                    value={formData.dateFinished}
                    onChange={(e) => setFormData({ ...formData, dateFinished: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Reflection */}
              <div className="space-y-2">
                <Label htmlFor="reflection">
                  Reflection * <span className="text-muted-foreground font-normal">(min 50 characters)</span>
                </Label>
                <Textarea
                  id="reflection"
                  placeholder="Share your thoughts, insights, and reflections on the book..."
                  value={formData.reflection}
                  onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                  className="min-h-[150px]"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.reflection.length}/2000 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gold text-navy hover:bg-gold-light h-12 text-lg"
                disabled={loading || !selectedCategory}
              >
                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Submit Book (+3 points)
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubmitBook;
