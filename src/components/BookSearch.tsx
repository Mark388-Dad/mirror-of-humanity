import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BookSuggestion {
  title: string;
  author: string;
  year?: number;
  description?: string;
}

interface BookSearchProps {
  value: string;
  onChange: (title: string, author: string) => void;
  categoryName?: string;
  placeholder?: string;
  className?: string;
}

const BookSearch = ({ value, onChange, categoryName, placeholder = "Search for a book...", className }: BookSearchProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchBooks = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-library', {
        body: {
          query: searchQuery,
          category: categoryName,
        },
      });

      if (!error && data?.suggestions) {
        setSuggestions(data.suggestions);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Book search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue, '');

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchBooks(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: BookSuggestion) => {
    setQuery(suggestion.title);
    onChange(suggestion.title, suggestion.author);
    setShowDropdown(false);
  };

  const openFollettLibrary = () => {
    window.open(
      'https://mfa.follettdestiny.com',
      '_blank'
    );
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-auto">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2 border-b last:border-b-0"
                >
                  <BookOpen className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{suggestion.title}</div>
                    <div className="text-xs text-muted-foreground">
                      by {suggestion.author} {suggestion.year && `(${suggestion.year})`}
                    </div>
                    {suggestion.description && (
                      <div className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={openFollettLibrary}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm text-blue-600"
              >
                <ExternalLink className="w-4 h-4" />
                Browse full library catalog
              </button>
            </>
          ) : (
            <div className="p-3">
              <p className="text-sm text-muted-foreground mb-2">No matches found</p>
              <button
                onClick={openFollettLibrary}
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Search in library catalog
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookSearch;
