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
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Trash2, 
  Play, 
  RefreshCcw, 
  Globe, 
  Lock, 
  Loader2,
  Crown,
  Shield
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
  user_id: string;
};

const Library = () => {
  const { user, userRole, isVerified } = useAuth();
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
      let query = supabase
        .from('books')
        .select(`
          *,
          chunks:chunks(count),
          ready_chunks:chunks(count)
        `);

      // If superadmin, show all books, otherwise only user's books
      if (userRole !== 'superadmin') {
        query = query.eq('user_id', user?.id);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      // Process chunks data correctly
      const booksWithCounts = data.map(book => {
        const chunksCount = book.chunks && book.chunks.length > 0 ? book.chunks[0].count : 0;
        const readyChunksCount = book.ready_chunks ? 
          book.ready_chunks.filter((chunk: any) => chunk.status === 'completed').length : 0;
        
        return {
          ...book,
          chunks_count: chunksCount,
          ready_chunks_count: readyChunksCount
        };
      });
      
      setBooks(booksWithCounts);
    } catch (error) {
      toast({
        title: "Error fetching books",
        description: error instanceof Error ? error.message : "Failed to load books",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canModifyBook = (book: Book) => {
    return userRole === 'superadmin' || book.user_id === user?.id;
  };

  const togglePublic = async (book: Book) => {
    if (!canModifyBook(book)) {
      toast({
        title: "Permission denied",
        description: "You can only modify your own books",
        variant: "destructive"
      });
      return;
    }

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

  const deleteBook = async (bookId: string, book: Book) => {
    if (!canModifyBook(book)) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own books",
        variant: "destructive"
      });
      return;
    }

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your library</h1>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!isVerified && userRole !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">Email verification required</h1>
          <p className="mb-4">Please verify your email address to access your library.</p>
          <Button onClick={() => navigate("/auth")}>Verify Email</Button>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {userRole === 'superadmin' ? 'All Books' : 'My Library'}
            </h1>
            {userRole === 'superadmin' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Superadmin
              </Badge>
            )}
          </div>
          <Button onClick={() => navigate("/upload")}>Upload New Book</Button>
        </div>

        {books.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <Book className="h-16 w-16 text-gray-400" />
                <h2 className="text-2xl font-semibold text-gray-700">
                  {userRole === 'superadmin' ? 'No books found' : 'Your library is empty'}
                </h2>
                <p className="text-gray-500">
                  {userRole === 'superadmin' ? 'No books have been uploaded yet' : 'Upload your first book to get started'}
                </p>
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
                  canModify={canModifyBook(book)}
                  userRole={userRole}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id, book)}
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
                  canModify={canModifyBook(book)}
                  userRole={userRole}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id, book)}
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
                  canModify={canModifyBook(book)}
                  userRole={userRole}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id, book)}
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
                  canModify={canModifyBook(book)}
                  userRole={userRole}
                  onTogglePublic={() => togglePublic(book)}
                  onDelete={() => deleteBook(book.id, book)}
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
  canModify: boolean;
  userRole: string | null;
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
  canModify,
  userRole,
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
          <div className="flex items-start gap-3">
            {book.cover_url && (
              <img 
                src={book.cover_url} 
                alt={`${book.title} cover`}
                className="w-16 h-20 object-cover rounded border"
              />
            )}
            <div>
              <CardTitle className="break-words">{book.title}</CardTitle>
              <CardDescription>{book.author}</CardDescription>
              {userRole === 'superadmin' && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-600">Admin View</span>
                </div>
              )}
            </div>
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
        
        {canModify && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={book.is_public}
              onCheckedChange={onTogglePublic}
              disabled={isUpdating}
            />
            <span className="text-sm">Make public</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          {canModify && (
            <>
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
            </>
          )}
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
