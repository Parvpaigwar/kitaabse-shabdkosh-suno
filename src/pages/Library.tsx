
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Trash2, 
  Play, 
  RefreshCcw, 
  Globe, 
  Lock, 
  Loader2 
} from "lucide-react";
import Navbar from "@/components/Navbar";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  language: string;
  is_public: boolean;
  created_at: string;
  cover_url: string | null;
  chunks_count: number;
  ready_chunks_count: number;
};

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchBooks();
    
    // Set up real-time subscription for chunk status updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chunks' },
        () => {
          fetchBooks(); // Refresh books when chunks are updated
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchBooks = async () => {
    try {
      // Get books with chunk counts
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          chunks:chunks(count),
          ready_chunks:chunks(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const booksWithCounts = data.map(book => ({
        ...book,
        chunks_count: book.chunks.count,
        ready_chunks_count: book.ready_chunks.filter((chunk: any) => chunk.status === 'completed').length
      }));
      
      setBooks(booksWithCounts);
    } catch (error) {
      toast({
        title: "Error fetching books",
        description: error instanceof Error ? error.message : "Failed to load your books",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async (book: Book) => {
    setUpdating(book.id);
    try {
      const { error } = await supabase
        .from('books')
        .update({ is_public: !book.is_public })
        .eq('id', book.id);
        
      if (error) throw error;
      
      setBooks(books.map(b => 
        b.id === book.id ? { ...b, is_public: !book.is_public } : b
      ));
      
      toast({
        title: `Book is now ${!book.is_public ? 'public' : 'private'}`,
        description: `"${book.title}" visibility has been updated.`
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update book visibility",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteBook = async (bookId: string) => {
    setDeleting(bookId);
    try {
      // Delete book will cascade to chunks due to database constraints
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);
        
      if (error) throw error;
      
      setBooks(books.filter(b => b.id !== bookId));
      
      toast({
        title: "Book deleted",
        description: "The book and all associated audio files have been removed."
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete book",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const regenerateAudio = async (bookId: string) => {
    setRegenerating(bookId);
    try {
      const response = await fetch("/api/regenerate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bookId })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to regenerate audio");
      }
      
      toast({
        title: "Audio regeneration started",
        description: "The audio for this book is being regenerated. This may take a few minutes."
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Failed to regenerate audio",
        variant: "destructive"
      });
    } finally {
      setRegenerating(null);
    }
  };

  const playBook = (bookId: string) => {
    navigate(`/book/${bookId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-10 flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Library</h1>
          <Button onClick={() => navigate("/upload")}>Upload New Book</Button>
        </div>

        {books.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <Book className="h-16 w-16 text-gray-400" />
                <h2 className="text-2xl font-semibold text-gray-700">Your library is empty</h2>
                <p className="text-gray-500">Upload your first book to get started</p>
                <Button onClick={() => navigate("/upload")}>Upload Book</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Books</TabsTrigger>
              <TabsTrigger value="public">Public Books</TabsTrigger>
              <TabsTrigger value="private">Private Books</TabsTrigger>
              <TabsTrigger value="processing">Processing Books</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="grid gap-6 md:grid-cols-2">
              {books.map(book => (
                <BookCard 
                  key={book.id}
                  book={book}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id)}
                  onRegenerate={() => regenerateAudio(book.id)}
                  onPlay={() => playBook(book.id)}
                  isDeleting={deleting === book.id}
                  isUpdating={updating === book.id}
                  isRegenerating={regenerating === book.id}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="public" className="grid gap-6 md:grid-cols-2">
              {books.filter(book => book.is_public).map(book => (
                <BookCard 
                  key={book.id}
                  book={book}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id)}
                  onRegenerate={() => regenerateAudio(book.id)}
                  onPlay={() => playBook(book.id)}
                  isDeleting={deleting === book.id}
                  isUpdating={updating === book.id}
                  isRegenerating={regenerating === book.id}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="private" className="grid gap-6 md:grid-cols-2">
              {books.filter(book => !book.is_public).map(book => (
                <BookCard 
                  key={book.id}
                  book={book}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id)}
                  onRegenerate={() => regenerateAudio(book.id)}
                  onPlay={() => playBook(book.id)}
                  isDeleting={deleting === book.id}
                  isUpdating={updating === book.id}
                  isRegenerating={regenerating === book.id}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="processing" className="grid gap-6 md:grid-cols-2">
              {books.filter(book => book.ready_chunks_count < book.chunks_count).map(book => (
                <BookCard 
                  key={book.id}
                  book={book}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id)}
                  onRegenerate={() => regenerateAudio(book.id)}
                  onPlay={() => playBook(book.id)}
                  isDeleting={deleting === book.id}
                  isUpdating={updating === book.id}
                  isRegenerating={regenerating === book.id}
                />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

type BookCardProps = {
  book: Book;
  onTogglePublic: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onPlay: () => void;
  isDeleting: boolean;
  isUpdating: boolean;
  isRegenerating: boolean;
};

const BookCard = ({ 
  book, 
  onTogglePublic, 
  onDelete, 
  onRegenerate,
  onPlay,
  isDeleting,
  isUpdating,
  isRegenerating
}: BookCardProps) => {
  const isProcessing = book.ready_chunks_count < book.chunks_count;
  const progress = book.chunks_count > 0 
    ? Math.round((book.ready_chunks_count / book.chunks_count) * 100) 
    : 0;
    
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="break-words">{book.title}</CardTitle>
            <CardDescription>{book.author}</CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            {book.is_public ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-xs text-gray-500">
              {book.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">
            {book.description || "No description provided."}
          </p>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Language: <span className="capitalize">{book.language}</span></span>
          <span className="text-xs text-gray-500">
            {new Date(book.created_at).toLocaleDateString()}
          </span>
        </div>
        
        {isProcessing && (
          <div className="space-y-1">
            <div className="text-sm flex justify-between">
              <span>Processing audio...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={book.is_public}
            onCheckedChange={onTogglePublic}
            disabled={isUpdating}
          />
          <span className="text-sm">Make public</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button 
          onClick={onPlay}
          disabled={book.ready_chunks_count === 0}
          size="sm"
        >
          <Play className="h-4 w-4 mr-1" /> Listen
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Library;
