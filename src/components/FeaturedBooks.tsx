
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBooks } from "@/services/bookService";
import { Book as APIBook } from "@/services/bookService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp, Clock } from "lucide-react";
import BookCard from "./BookCard";

const FeaturedBooks = () => {
  const [books, setBooks] = useState<APIBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("popular");

  useEffect(() => {
    fetchBooks(filter, sort);
  }, [filter, sort]);

  const fetchBooks = async (filterValue: string, sortValue: string) => {
    setLoading(true);

    try {
      const response = await getAllBooks({
        language: filterValue !== "all" ? filterValue : undefined,
        sort_by: sortValue as 'recent' | 'popular' | 'title' | 'author',
        page_size: 20,
      });

      if (response.status === 'PASS') {
        // Handle both paginated and non-paginated responses
        const booksData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setBooks(booksData);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
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
          
          <Tabs defaultValue="popular" onValueChange={handleSortChange}>
            <TabsList>
              <TabsTrigger value="popular" className="flex items-center">
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
                author={book.author || "Unknown Author"}
                coverImage={book.cover_url || book.cover_image || undefined}
                language={book.language}
                likes={book.favorite_count || 0}
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
