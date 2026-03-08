import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, User, Calendar, MessageSquare, Filter } from 'lucide-react';
import { READING_CATEGORIES, HOUSES, YEAR_GROUPS } from '@/lib/constants';
import { format } from 'date-fns';

interface BookSubmission {
  id: string;
  title: string;
  author: string;
  category_number: number;
  category_name: string;
  reflection: string;
  date_finished: string;
  created_at: string;
  profiles: {
    full_name: string;
    house: string | null;
    year_group: string | null;
  } | null;
}

const BookGallery = () => {
  const { profile } = useAuth();
  const [books, setBooks] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [expandedReflection, setExpandedReflection] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('book_submissions')
      .select(`
        id, title, author, category_number, category_name, 
        reflection, date_finished, created_at,
        profiles!book_submissions_user_id_fkey (full_name, house, year_group)
      `)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching books:', error);
    } else {
      setBooks((data as unknown as BookSubmission[]) || []);
    }
    setLoading(false);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || book.category_number.toString() === categoryFilter;
    const matchesHouse = houseFilter === 'all' || book.profiles?.house === houseFilter;
    const matchesYear = yearFilter === 'all' || book.profiles?.year_group === yearFilter;

    return matchesSearch && matchesCategory && matchesHouse && matchesYear;
  });

  const getCategoryColor = (categoryNumber: number) => {
    const colors = [
      'bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800', 'bg-orange-100 text-orange-800', 'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
    ];
    return colors[(categoryNumber - 1) % colors.length];
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Book Gallery" description="Browse books submitted by students in the 45-Book Reading Challenge. Filter by category, house, and year group." path="/gallery" />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Book Gallery 📖
          </h1>
          <p className="text-muted-foreground">
            Discover what your fellow students are reading and their reflections.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search books, authors, or readers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Categories</SelectItem>
                  {READING_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      #{cat.id} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="House" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Houses</SelectItem>
                  {HOUSES.map(house => (
                    <SelectItem key={house} value={house}>{house}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Year Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {YEAR_GROUPS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
        </p>

        {/* Book Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No books found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map(book => (
              <Card key={book.id} className="card-elevated hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-display line-clamp-2">
                        {book.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {book.author}
                      </p>
                    </div>
                    <Badge className={getCategoryColor(book.category_number)}>
                      #{book.category_number}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="outline" className="text-xs">
                    {book.category_name}
                  </Badge>

                  {/* Reflection */}
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MessageSquare className="w-4 h-4" />
                      Reflection
                    </div>
                    <p className={`text-sm ${expandedReflection === book.id ? '' : 'line-clamp-3'}`}>
                      {book.reflection}
                    </p>
                    {book.reflection.length > 150 && (
                      <button
                        onClick={() => setExpandedReflection(expandedReflection === book.id ? null : book.id)}
                        className="text-xs text-gold hover:underline mt-2"
                      >
                        {expandedReflection === book.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  {/* Reader Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{book.profiles?.full_name || 'Anonymous'}</span>
                      {book.profiles?.house && (
                        <Badge variant="secondary" className="text-xs">
                          {book.profiles.house}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(book.date_finished), 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookGallery;
