import { useState, useEffect } from "react";
import { getMyBooks, Book, updateBook, deleteBook, UpdateBookRequest } from "@/services/bookService";
import { getMyLibrary, LibraryItem, removeFromLibrary, toggleFavorite } from "@/services/libraryService";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Trash2,
  Play,
  Globe,
  Lock,
  Loader2,
  Crown,
  Clock,
  Heart,
  BookMarked,
  Upload,
  Edit,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/Navbar";
import { ProcessingStatus } from "@/components/ProcessingStatus";

const Library = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  // Uploaded Books State
  const [uploadedBooks, setUploadedBooks] = useState<Book[]>([]);
  const [uploadedLoading, setUploadedLoading] = useState(true);
  const [uploadedFilter, setUploadedFilter] = useState<'all' | 'public' | 'private' | 'processing'>('all');

  // Library Books State
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'library' | 'uploaded'>('library');

  // Edit Book State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateBookRequest>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Book State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Processing Status State
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusBookId, setStatusBookId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchUploadedBooks();
    fetchLibraryBooks();
  }, [user, navigate]);

  const fetchUploadedBooks = async () => {
    try {
      setUploadedLoading(true);
      const response = await getMyBooks();

      if (response.status === 'PASS') {
        const booksData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setUploadedBooks(booksData);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching uploaded books",
        description: error.response?.data?.message || error.message || "Failed to load books",
        variant: "destructive"
      });
    } finally {
      setUploadedLoading(false);
    }
  };

  const fetchLibraryBooks = async () => {
    try {
      setLibraryLoading(true);
      const response = await getMyLibrary();

      if (response.status === 'PASS') {
        const libraryData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setLibraryItems(libraryData);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching library",
        description: error.response?.data?.message || error.message || "Failed to load library",
        variant: "destructive"
      });
    } finally {
      setLibraryLoading(false);
    }
  };

  const playBook = (bookId: number) => {
    navigate(`/book/${bookId}`);
  };

  const handleRemoveFromLibrary = async (bookId: number) => {
    try {
      await removeFromLibrary(bookId);
      toast({
        title: "Removed from library",
        description: "Book removed from your library"
      });
      fetchLibraryBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove book",
        variant: "destructive"
      });
    }
  };

  const handleToggleFavorite = async (bookId: number) => {
    try {
      const response = await toggleFavorite(bookId);
      toast({
        title: response.data.is_favorite ? "Added to favorites" : "Removed from favorites",
        description: response.data.message
      });
      fetchLibraryBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update favorite",
        variant: "destructive"
      });
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setEditFormData({
      title: book.title,
      author: book.author || '',
      description: book.description || '',
      genre: book.genre || '',
      is_public: book.is_public,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateBook = async () => {
    if (!editingBook) return;

    try {
      setIsUpdating(true);
      const response = await updateBook(editingBook.id, editFormData);

      if (response.status === 'PASS') {
        toast({
          title: "Book updated successfully",
          description: "Your changes have been saved"
        });
        setEditDialogOpen(false);
        setEditingBook(null);
        setEditFormData({});
        fetchUploadedBooks();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        title: "Error updating book",
        description: error.response?.data?.message || error.message || "Failed to update book",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBook = (book: Book) => {
    setDeletingBook(book);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBook = async () => {
    if (!deletingBook) return;

    try {
      setIsDeleting(true);
      const response = await deleteBook(deletingBook.id);

      if (response.status === 'PASS') {
        toast({
          title: "Book deleted successfully",
          description: "The book has been removed from your uploads"
        });
        setDeleteDialogOpen(false);
        setDeletingBook(null);
        fetchUploadedBooks();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        title: "Error deleting book",
        description: error.response?.data?.message || error.message || "Failed to delete book",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const viewProcessingStatus = (bookId: number) => {
    setStatusBookId(bookId);
    setStatusDialogOpen(true);
  };

  const handleProcessingComplete = () => {
    toast({
      title: "Processing Complete!",
      description: "Your book is ready to listen"
    });
    fetchUploadedBooks();
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

  const filteredUploadedBooks = uploadedBooks.filter(book => {
    if (uploadedFilter === 'all') return true;
    if (uploadedFilter === 'public') return book.is_public;
    if (uploadedFilter === 'private') return !book.is_public;
    if (uploadedFilter === 'processing') return book.processing_status !== 'completed';
    return true;
  });

  const filteredLibraryItems = libraryItems.filter(item => {
    if (showFavoritesOnly) return item.is_favorite;
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
          <Button onClick={() => navigate("/upload")}>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Book
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'library' | 'uploaded')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              My Library ({libraryItems.length})
            </TabsTrigger>
            <TabsTrigger value="uploaded" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Uploaded ({uploadedBooks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                Books you've saved to your library
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-red-500 text-red-500' : ''}`} />
                {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
              </Button>
            </div>

            {libraryLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
              </div>
            ) : filteredLibraryItems.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <BookMarked className="h-16 w-16 text-gray-400" />
                    <h2 className="text-2xl font-semibold text-gray-700">
                      {showFavoritesOnly ? 'No favorite books yet' : 'Your library is empty'}
                    </h2>
                    <p className="text-gray-500">
                      {showFavoritesOnly
                        ? 'Start adding books to your favorites!'
                        : 'Start adding books to your library from the explore page'}
                    </p>
                    <Button onClick={() => navigate("/")}>Explore Books</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLibraryItems.map((item) => {
                  const book = item.book;
                  return (
                    <Card key={book.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                          <div className="flex items-center gap-1">
                            {item.is_favorite && (
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            )}
                            {getStatusBadge(book.processing_status)}
                          </div>
                        </div>
                        <CardDescription className="line-clamp-1">
                          by {book.author || 'Unknown Author'}
                        </CardDescription>

                        {(book.cover_url || book.cover_image) && (
                          <div className="mt-3 w-full h-48 rounded-md overflow-hidden bg-gray-200">
                            <img
                              src={book.cover_url || book.cover_image || ''}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="flex-grow space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="capitalize">
                            {book.language}
                          </Badge>
                          {book.genre && (
                            <Badge variant="outline" className="capitalize">
                              {book.genre.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {book.total_pages} pages
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-4 w-4" />
                            Added {new Date(item.added_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>

                      <Separator />

                      <CardFooter className="flex flex-col gap-2 pt-4">
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={() => playBook(book.id)}
                            disabled={book.processing_status !== 'completed'}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Listen
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleFavorite(book.id)}
                          >
                            <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromLibrary(book.id)}
                          className="w-full text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Library
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="uploaded">
            <div className="flex gap-2 mb-6">
              <Button
                variant={uploadedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadedFilter('all')}
              >
                All
              </Button>
              <Button
                variant={uploadedFilter === 'public' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadedFilter('public')}
              >
                Public
              </Button>
              <Button
                variant={uploadedFilter === 'private' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadedFilter('private')}
              >
                Private
              </Button>
              <Button
                variant={uploadedFilter === 'processing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadedFilter('processing')}
              >
                Processing
              </Button>
            </div>

            {uploadedLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
              </div>
            ) : filteredUploadedBooks.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Upload className="h-16 w-16 text-gray-400" />
                    <h2 className="text-2xl font-semibold text-gray-700">
                      {uploadedFilter === 'all' ? 'No uploaded books yet' : `No ${uploadedFilter} books found`}
                    </h2>
                    <p className="text-gray-500">
                      {uploadedFilter === 'all'
                        ? 'Upload your first book to get started'
                        : `You don't have any ${uploadedFilter} books yet`}
                    </p>
                    <Button onClick={() => navigate("/upload")}>Upload Book</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUploadedBooks.map((book) => (
                  <Card key={book.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(book.processing_status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditBook(book)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteBook(book)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Book
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-1">
                        by {book.author || 'Unknown Author'}
                      </CardDescription>

                      {(book.cover_url || book.cover_image) && (
                        <div className="mt-3 w-full h-48 rounded-md overflow-hidden bg-gray-200">
                          <img
                            src={book.cover_url || book.cover_image || ''}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="flex-grow space-y-3">
                      {book.processing_status === 'processing' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Processing</span>
                            <span className="font-medium">{book.processing_progress}%</span>
                          </div>
                          <Progress value={book.processing_progress} className="h-2" />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="capitalize">
                          {book.language}
                        </Badge>
                        {book.genre && (
                          <Badge variant="outline" className="capitalize">
                            {book.genre.replace('_', ' ')}
                          </Badge>
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

                    <CardFooter className="flex flex-col gap-2 pt-4">
                      {book.processing_status === 'completed' ? (
                        <Button
                          onClick={() => playBook(book.id)}
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Listen
                        </Button>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={() => viewProcessingStatus(book.id)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Loader2 className="h-4 w-4 mr-2" />
                            View Status
                          </Button>
                          <Button
                            onClick={() => playBook(book.id)}
                            disabled
                            variant="secondary"
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Listen
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Book Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Book Details</DialogTitle>
            <DialogDescription>
              Update the information for "{editingBook?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title || ''}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Book title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-author">Author</Label>
              <Input
                id="edit-author"
                value={editFormData.author || ''}
                onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                placeholder="Author name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Book description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-genre">Genre</Label>
              <Select
                value={editFormData.genre || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, genre: value })}
              >
                <SelectTrigger id="edit-genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="literature">Literature</SelectItem>
                  <SelectItem value="fiction">Fiction</SelectItem>
                  <SelectItem value="non_fiction">Non-Fiction</SelectItem>
                  <SelectItem value="poetry">Poetry</SelectItem>
                  <SelectItem value="drama">Drama</SelectItem>
                  <SelectItem value="biography">Biography</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="philosophy">Philosophy</SelectItem>
                  <SelectItem value="religion">Religion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select
                value={editFormData.is_public ? 'public' : 'private'}
                onValueChange={(value) => setEditFormData({ ...editFormData, is_public: value === 'public' })}
              >
                <SelectTrigger id="edit-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public - Anyone can view
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private - Only you can view
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBook} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Book Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingBook?.title}". This action cannot be undone.
              All associated data including pages, audio files, and user progress will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBook}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Book'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Processing Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Book Processing Status</DialogTitle>
            <DialogDescription>
              Real-time processing updates for your book
            </DialogDescription>
          </DialogHeader>

          {statusBookId && (
            <ProcessingStatus
              bookId={statusBookId}
              onComplete={handleProcessingComplete}
              pollInterval={5000}
              autoStop={true}
            />
          )}

          <DialogFooter>
            <Button onClick={() => setStatusDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
