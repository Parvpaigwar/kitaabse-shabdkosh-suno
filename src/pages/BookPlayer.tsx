import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Share2,
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  BookmarkPlus,
  BookmarkCheck,
  Volume2,
  VolumeX
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getBookDetails,
  getBookPages,
  getBookProgress,
  updateProgress,
  Book,
  BookPage,
  UserProgress
} from "@/services/bookService";
import {
  addToLibrary,
  removeFromLibrary,
  toggleFavorite
} from "@/services/libraryService";

const BookPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Book & Pages State
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Progress State
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  // Library State
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Fetch book details and pages
  useEffect(() => {
    if (!id) return;
    fetchBookData();
  }, [id]);

  // Load progress on initial load
  useEffect(() => {
    if (book && user) {
      loadProgress();
    }
  }, [book, user]);

  // Setup audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      handleNextPage();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPageIndex, pages]);

  // Auto-save progress every 10 seconds while playing
  useEffect(() => {
    if (!isPlaying || !user || !book) return;

    const interval = setInterval(() => {
      saveProgress();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, currentPageIndex, currentTime, user, book]);

  const fetchBookData = async () => {
    try {
      setLoading(true);

      // Fetch book details
      const bookResponse = await getBookDetails(Number(id));
      if (bookResponse.status === 'PASS') {
        const bookData = bookResponse.data;
        setBook(bookData);
        setIsInLibrary(bookData.is_in_library || false);
        setIsFavorite(bookData.is_favorite || false);
      } else {
        throw new Error(bookResponse.message);
      }

      // Fetch book pages
      const pagesResponse = await getBookPages(Number(id));
      if (pagesResponse.status === 'PASS') {
        setPages(pagesResponse.data.pages);
      } else {
        throw new Error(pagesResponse.message);
      }
    } catch (error: any) {
      toast({
        title: "Error loading book",
        description: error.response?.data?.message || error.message || "Failed to load book",
        variant: "destructive"
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!user || !book) return;

    try {
      const progressResponse = await getBookProgress(book.id);
      if (progressResponse.status === 'PASS') {
        const progressData = progressResponse.data;
        setProgress(progressData);

        // Set current page based on progress
        if (progressData.current_page > 1) {
          const pageIndex = pages.findIndex(p => p.page_number === progressData.current_page);
          if (pageIndex !== -1) {
            setCurrentPageIndex(pageIndex);
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading progress:", error);
    }
  };

  const saveProgress = async () => {
    if (!user || !book || savingProgress) return;

    const currentPage = pages[currentPageIndex];
    if (!currentPage) return;

    try {
      setSavingProgress(true);
      await updateProgress(book.id, {
        page_number: currentPage.page_number,
        position: Math.floor(currentTime),
        listened_time: 10 // 10 seconds since last save
      });
    } catch (error: any) {
      console.error("Error saving progress:", error);
    } finally {
      setSavingProgress(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      saveProgress();
      setCurrentPageIndex(currentPageIndex - 1);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      saveProgress();
      setCurrentPageIndex(currentPageIndex + 1);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleAddToLibrary = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!book) return;

    try {
      setLibraryLoading(true);

      if (isInLibrary) {
        await removeFromLibrary(book.id);
        setIsInLibrary(false);
        setIsFavorite(false);
        toast({
          title: "Removed from library",
          description: "Book removed from your library"
        });
      } else {
        await addToLibrary({ book_id: book.id });
        setIsInLibrary(true);
        toast({
          title: "Added to library",
          description: "Book added to your library"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update library",
        variant: "destructive"
      });
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!book) return;

    try {
      setLibraryLoading(true);
      const response = await toggleFavorite(book.id);

      if (response.status === 'PASS') {
        setIsFavorite(response.data.is_favorite);
        setIsInLibrary(true); // Favoriting automatically adds to library
        toast({
          title: response.data.is_favorite ? "Added to favorites" : "Removed from favorites",
          description: response.data.message
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update favorite",
        variant: "destructive"
      });
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book?.title || "KitaabSe Audiobook",
        text: `Listen to ${book?.title} by ${book?.author} on KitaabSe`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Book link copied to clipboard"
      });
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPage = pages[currentPageIndex];
  const completedPages = pages.filter(p => p.processing_status === 'completed').length;
  const totalPages = pages.length;

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

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-10">
          <Card>
            <CardContent className="py-10 text-center">
              <h2 className="text-2xl font-bold mb-2">Book not found</h2>
              <p className="text-gray-500 mb-6">
                The book you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/")}>Go back home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Book info column */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                {/* Cover Image */}
                <div className="aspect-[2/3] bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  {book.cover_url || book.cover_image ? (
                    <img
                      src={book.cover_url || book.cover_image || ''}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-3xl font-bold text-amber-800 block mb-2">
                        {book.title}
                      </span>
                      <span className="text-xl text-amber-700">{book.author}</span>
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <h1 className="text-2xl font-bold mb-1">{book.title}</h1>
                <h2 className="text-lg text-gray-600 mb-3">{book.author || 'Unknown Author'}</h2>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="capitalize">
                    {book.language}
                  </Badge>
                  {book.genre && (
                    <Badge variant="outline" className="capitalize">
                      {book.genre.replace('_', ' ')}
                    </Badge>
                  )}
                  <Badge variant={book.processing_status === 'completed' ? 'default' : 'secondary'}>
                    {book.processing_status}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {book.favorite_count || 0} likes
                  </span>
                  <span>
                    {book.listen_count || 0} listens
                  </span>
                </div>

                {/* Description */}
                {book.description && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-sm text-gray-700 line-clamp-4">{book.description}</p>
                  </>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant={isFavorite ? "default" : "outline"}
                    className={isFavorite ? "bg-red-500 hover:bg-red-600" : ""}
                    onClick={handleToggleFavorite}
                    disabled={libraryLoading}
                  >
                    {libraryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-white" : ""}`} />
                    )}
                    {isFavorite ? "Favorited" : "Add to Favorites"}
                  </Button>

                  <Button
                    variant={isInLibrary ? "default" : "outline"}
                    onClick={handleAddToLibrary}
                    disabled={libraryLoading}
                  >
                    {libraryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isInLibrary ? (
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4 mr-2" />
                    )}
                    {isInLibrary ? "In Library" : "Add to Library"}
                  </Button>

                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <Separator className="my-4" />

                {/* Processing Info */}
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Total pages: {totalPages}</p>
                  <p>Ready: {completedPages}/{totalPages}</p>
                  {progress && (
                    <p className="text-amber-600 font-medium">
                      Progress: {progress.completion_percentage}%
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Player column */}
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardContent className="flex-grow flex flex-col pt-6">
                {pages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
                    <p className="text-gray-600">Processing book pages...</p>
                    <p className="text-gray-500 text-sm mt-2">
                      This may take a few minutes
                    </p>
                  </div>
                ) : currentPage ? (
                  <div className="flex-grow flex flex-col">
                    {/* Current Page Info */}
                    <div className="bg-amber-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Page {currentPage.page_number}</h3>
                          <p className="text-sm text-gray-600">
                            {currentPageIndex + 1} of {totalPages}
                          </p>
                        </div>
                        <Badge variant={
                          currentPage.processing_status === 'completed' ? 'default' :
                          currentPage.processing_status === 'processing' ? 'secondary' : 'outline'
                        }>
                          {currentPage.processing_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Text Content */}
                    {currentPage.text_content && (
                      <div className="bg-white border border-gray-200 p-6 rounded-lg mb-4 overflow-y-auto flex-grow">
                        <p className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {currentPage.text_content}
                        </p>
                      </div>
                    )}

                    {/* Audio Player */}
                    {currentPage.processing_status === 'completed' && currentPage.audio_url ? (
                      <div className="mt-auto">
                        <audio
                          ref={audioRef}
                          src={currentPage.audio_url}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={0.1}
                            onValueChange={handleSeek}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePreviousPage}
                            disabled={currentPageIndex === 0}
                          >
                            <SkipBack className="h-5 w-5" />
                          </Button>

                          <Button
                            size="icon"
                            className="h-14 w-14 rounded-full"
                            onClick={togglePlayPause}
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6 ml-1" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextPage}
                            disabled={currentPageIndex === pages.length - 1}
                          >
                            <SkipForward className="h-5 w-5" />
                          </Button>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                            className="w-24"
                          />
                        </div>

                        {savingProgress && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Saving progress...
                          </p>
                        )}
                      </div>
                    ) : currentPage.processing_status === 'processing' ? (
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 mt-auto">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
                        <p className="text-gray-600">Processing audio for this page...</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Page {currentPage.page_number} is being converted to audio
                        </p>
                      </div>
                    ) : currentPage.processing_status === 'failed' ? (
                      <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-8 mt-auto">
                        <p className="text-red-600 font-medium mb-2">Audio generation failed</p>
                        <p className="text-red-500 text-sm text-center">
                          {currentPage.processing_error || 'Unable to generate audio for this page'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 mt-auto">
                        <p className="text-gray-600">Audio not yet generated for this page</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No pages available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookPlayer;
