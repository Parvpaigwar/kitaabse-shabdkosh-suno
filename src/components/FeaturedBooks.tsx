
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp, Clock } from "lucide-react";
import BookCard from "./BookCard";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  language: string;
  cover_url: string | null;
  likes_count: number;
};

const FeaturedBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("likes");

  useEffect(() => {
    fetchBooks(filter, sort);

    // Set up real-time subscription for likes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          fetchBooks(filter, sort); // Refresh when likes change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, sort]);

  const fetchBooks = async (filterValue: string, sortValue: string) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('books')
        .select(`
          *,
          likes(count)
        `)
        .eq('is_public', true);
        
      // Apply language filter
      if (filterValue !== "all") {
        query = query.eq('language', filterValue);
      }
      
      // Apply sorting
      if (sortValue === "likes") {
        // Fix: Apply proper sorting method without directly accessing count
        query = query.order('id', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fix: Process likes data correctly by accessing the first element of the array
      const booksWithLikes = data.map(book => {
        // Each book has a 'likes' array from the join, which contains a single object with a count property
        const likesCount = book.likes && book.likes.length > 0 ? book.likes[0].count : 0;
        
        return {
          ...book,
          likes_count: likesCount
        };
      });
      
      // If sorting by likes, sort the processed data in memory
      if (sortValue === "likes") {
        booksWithLikes.sort((a, b) => b.likes_count - a.likes_count);
      }
      
      setBooks(booksWithLikes);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
  };

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Explore Books</h2>
          <p className="text-gray-600">Discover audiobooks in Hindi and more</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <Tabs defaultValue="all" onValueChange={handleFilterChange}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="hindi">Hindi</TabsTrigger>
              <TabsTrigger value="urdu">Urdu</TabsTrigger>
              <TabsTrigger value="sanskrit">Sanskrit</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs defaultValue="likes" onValueChange={handleSortChange}>
            <TabsList>
              <TabsTrigger value="likes" className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-2" /> Popular
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" /> Recent
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : books.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id}>
              <BookCard
                title={book.title}
                author={book.author}
                coverImage={book.cover_url || undefined}
                language={book.language}
                likes={book.likes_count}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-2xl font-semibold mb-4">No books found</h3>
          <p className="text-gray-600 mb-6">Be the first to share a book with the community!</p>
          <Link to="/upload">
            <Button>Upload a Book</Button>
          </Link>
        </div>
      )}
    </section>
  );
};

export default FeaturedBooks;
