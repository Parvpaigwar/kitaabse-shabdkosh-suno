import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart, Share2, ArrowLeft, Play, Pause, SkipForward, SkipBack, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  language: string;
  is_public: boolean;
  cover_url: string | null;
  likes_count: number;
  user_has_liked: boolean;
};

type Chunk = {
  id: string;
  chunk_number: number;
  audio_url: string | null;
  status: string;
  text_content: string | null;
};

const BookPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [nextChunksLoading, setNextChunksLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchBookAndChunks = async () => {
      try {
        // Fetch book details
        const { data: bookData, error: bookError } = await supabase
          .from("books")
          .select(`
            *,
            likes(count),
            user_has_liked:likes!inner(id)
          `)
          .eq("id", id)
          .single();
          
        if (bookError) throw bookError;
        
        // Fix: Process likes data correctly by accessing the first element of the array
        const likesCount = bookData.likes && bookData.likes.length > 0 ? bookData.likes[0].count : 0;
        
        const bookWithCounts = {
          ...bookData,
          likes_count: likesCount,
          user_has_liked: user ? bookData.user_has_liked.length > 0 : false
        };
        
        setBook(bookWithCounts);
        
        // Fetch initial chunks
        await fetchChunks();

        // Set up real-time subscription for chunk updates
        const channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'chunks', filter: `book_id=eq.${id}` },
            () => {
              fetchChunks();
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(channel);
        };
        
      } catch (error) {
        toast({
          title: "Error loading book",
          description: error instanceof Error ? error.message : "Failed to load book details",
          variant: "destructive"
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookAndChunks();
  }, [id, user, navigate]);
  
  const fetchChunks = async () => {
    try {
      const { data, error } = await supabase
        .from("chunks")
        .select("*")
        .eq("book_id", id)
        .order("chunk_number", { ascending: true });
        
      if (error) throw error;
      
      setChunks(data);
    } catch (error) {
      toast({
        title: "Error loading audio",
        description: error instanceof Error ? error.message : "Failed to load audio chunks",
        variant: "destructive"
      });
    }
  };

  const toggleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setLiking(true);
    
    try {
      if (book?.user_has_liked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("book_id", id)
          .eq("user_id", user.id);
          
        setBook({
          ...book,
          likes_count: book.likes_count - 1,
          user_has_liked: false
        });
      } else {
        // Like
        await supabase
          .from("likes")
          .insert({
            book_id: id,
            user_id: user.id
          });
          
        setBook({
          ...book!,
          likes_count: book!.likes_count + 1,
          user_has_liked: true
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update like status",
        variant: "destructive"
      });
    } finally {
      setLiking(false);
    }
  };

  const playPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const nextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
      setIsPlaying(false);
    }
  };

  const prevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
      setIsPlaying(false);
    }
  };

  const onAudioEnded = () => {
    // When current audio ends, automatically play next chunk if available
    if (currentChunkIndex < chunks.length - 1) {
      nextChunk();
      // After switching, delay playing to allow audio to load
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 300);
    } else {
      setIsPlaying(false);
    }
    
    // If we've played some chunks and there are pending ones, try to fetch more
    if (currentChunkIndex >= chunks.length - 3) {
      checkForMoreChunks();
    }
  };

  const checkForMoreChunks = async () => {
    // Only trigger if not already loading and we have chunks
    if (nextChunksLoading || chunks.length === 0) return;
    
    setNextChunksLoading(true);
    
    try {
      // Tell the API to generate the next chunk if needed
      await fetch("/api/next-chunk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bookId: id,
          currentChunk: chunks[chunks.length - 1].chunk_number
        })
      });
    } catch (error) {
      console.error("Error requesting next chunks:", error);
    } finally {
      setNextChunksLoading(false);
    }
  };

  const shareBook = () => {
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

  const getCurrentChunk = (): Chunk | undefined => {
    return chunks[currentChunkIndex];
  };

  const currentChunk = getCurrentChunk();

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
              <p className="text-gray-500 mb-6">The book you're looking for doesn't exist or you don't have permission to view it.</p>
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
                <div className="aspect-[2/3] bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <span className="text-3xl font-bold text-amber-800">{book.title}</span>
                      <br />
                      <span className="text-xl text-amber-700">{book.author}</span>
                    </div>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold">{book.title}</h1>
                <h2 className="text-lg text-gray-600 mb-2">{book.author}</h2>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="capitalize text-sm bg-gray-100 px-2 py-1 rounded">
                    {book.language}
                  </span>
                  <span className="flex items-center text-sm text-gray-500">
                    <Heart className="h-4 w-4 mr-1 fill-red-500 text-red-500" />
                    {book.likes_count}
                  </span>
                </div>
                
                {book.description && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-sm text-gray-700">{book.description}</p>
                  </>
                )}
                
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant={book.user_has_liked ? "default" : "outline"}
                    className={book.user_has_liked ? "bg-red-500 hover:bg-red-600" : ""}
                    onClick={toggleLike}
                    disabled={liking}
                  >
                    {liking ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Heart className={`h-4 w-4 mr-2 ${book.user_has_liked ? "fill-white" : ""}`} />
                    )}
                    {book.user_has_liked ? "Liked" : "Like"}
                  </Button>
                  
                  <Button variant="outline" onClick={shareBook}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-sm text-gray-500">
                  <p>Total chunks: {chunks.length}</p>
                  <p>Ready chunks: {chunks.filter(c => c.status === "completed").length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Player column */}
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardContent className="flex-grow flex flex-col pt-6">
                <div className="flex-grow">
                  {currentChunk ? (
                    <>
                      {currentChunk.status === "completed" && currentChunk.audio_url ? (
                        <div>
                          <audio
                            ref={audioRef}
                            src={currentChunk.audio_url}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={onAudioEnded}
                          />
                          
                          <div className="bg-amber-50 p-4 rounded-lg mb-4">
                            <h3 className="font-semibold mb-2">Now playing:</h3>
                            <p className="text-sm text-gray-700">Chunk {currentChunk.chunk_number} of {chunks.length}</p>
                          </div>
                          
                          {currentChunk.text_content && (
                            <div className="bg-white border border-gray-200 p-4 rounded-lg mb-6 max-h-60 overflow-y-auto font-hindi">
                              {currentChunk.text_content}
                            </div>
                          )}
                          
                          {nextChunksLoading && currentChunkIndex >= chunks.length - 2 && (
                            <div className="flex items-center justify-center p-3 bg-amber-50 rounded-lg mb-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2 text-amber-600" />
                              <span className="text-amber-800 text-sm">Generating next part...</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-center space-x-4 mt-6">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={prevChunk}
                              disabled={currentChunkIndex === 0}
                            >
                              <SkipBack className="h-6 w-6" />
                            </Button>
                            
                            <Button
                              size="icon"
                              className="h-12 w-12 rounded-full"
                              onClick={playPause}
                            >
                              {isPlaying ? (
                                <Pause className="h-6 w-6" />
                              ) : (
                                <Play className="h-6 w-6" />
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={nextChunk}
                              disabled={currentChunkIndex === chunks.length - 1}
                            >
                              <SkipForward className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-60 bg-gray-50 rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
                          <p className="text-gray-600">Processing audio chunk...</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Chunk {currentChunk.chunk_number} is being generated
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No audio chunks available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookPlayer;
