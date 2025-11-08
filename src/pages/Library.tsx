import { useState, useEffect } from "react";
import { getMyBooks } from "@/services/bookService";
import { Book } from "@/services/bookService";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Trash2,
  Play,
  RefreshCcw,
  Globe,
  Lock,
  Loader2,
  Crown,
  Shield,
  Clock
} from "lucide-react";
import Navbar from "@/components/Navbar";

const Library = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'processing'>('all');

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchBooks();
  }, [user, navigate]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await getMyBooks();

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
      toast({
        title: "Error fetching books",
        description: error.response?.data?.message || error.message || "Failed to load books",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const playBook = (bookId: number) => {
    navigate(`/book/${bookId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Ready</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 animate-pulse">Processing</Badge>;
      case 'uploaded':
        return <Badge className="bg-yellow-500">Queued</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true;
    if (filter === 'public') return book.is_public;
    if (filter === 'private') return !book.is_public;
    if (filter === 'processing') return book.processing_status !== 'completed';
    return true;
  });

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
            <h1 className="text-3xl font-bold">My Library</h1>
            {userRole === 'superadmin' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Superadmin
              </Badge>
            )}
          </div>
          <Button onClick={() => navigate("/upload")}>Upload New Book</Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value: string) => setFilter(value as any)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredBooks.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-4">
                <BookOpen className="h-16 w-16 text-gray-400" />
                <h2 className="text-2xl font-semibold text-gray-700">
                  {filter === 'all' ? 'Your library is empty' : `No ${filter} books found`}
                </h2>
                <p className="text-gray-500">
                  {filter === 'all' ? 'Upload your first book to get started' : `You don't have any ${filter} books yet`}
                </p>
                <Button onClick={() => navigate("/upload")}>Upload Book</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                    {getStatusBadge(book.processing_status)}
                  </div>
                  <CardDescription className="line-clamp-1">
                    by {book.author || 'Unknown Author'}
                  </CardDescription>

                  {/* Cover Image */}
                  {book.cover_image && (
                    <div className="mt-3 w-full h-48 rounded-md overflow-hidden bg-gray-200">
                      <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-grow space-y-3">
                  {/* Processing Progress */}
                  {book.processing_status === 'processing' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing</span>
                        <span className="font-medium">{book.processing_progress}%</span>
                      </div>
                      <Progress value={book.processing_progress} className="h-2" />
                    </div>
                  )}

                  {/* Book Details */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {book.language}
                    </Badge>
                    {book.genre && (
                      <Badge variant="outline">{book.genre}</Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                      {book.is_public ? (
                        <>
                          <Globe className="h-3 w-3" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" /> Private
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {book.total_pages} pages
                    </div>
                    {book.listen_count !== undefined && (
                      <div className="flex items-center gap-1 mt-1">
                        <Play className="h-4 w-4" />
                        {book.listen_count} listens
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" />
                      Uploaded {new Date(book.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>

                  {book.processing_error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {book.processing_error}
                    </div>
                  )}
                </CardContent>

                <Separator />

                <CardFooter className="flex justify-between gap-2 pt-4">
                  <Button
                    onClick={() => playBook(book.id)}
                    disabled={book.processing_status !== 'completed'}
                    className="flex-1"
                    variant={book.processing_status === 'completed' ? 'default' : 'secondary'}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {book.processing_status === 'completed' ? 'Listen' : 'Processing...'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
