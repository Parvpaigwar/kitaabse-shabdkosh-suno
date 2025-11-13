
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadBook } from "@/services/bookService";
import { uploadBookWithSSE, UploadProgress } from "@/services/sseUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BookFormData } from "./types";
import { BookFormFields } from "./BookFormFields";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

export const BookForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [bookForm, setBookForm] = useState<BookFormData>({
    title: "",
    author: "",
    language: "hindi",
    description: "",
    isPublic: true,
    pdf: null,
    cover: null,
  });

  const resetForm = () => {
    setBookForm({
      title: "",
      author: "",
      language: "hindi",
      description: "",
      isPublic: true,
      pdf: null,
      cover: null,
    });
    setUploadProgress(null);

    // Reset file inputs
    const pdfInput = document.getElementById('pdf') as HTMLInputElement;
    const coverInput = document.getElementById('cover') as HTMLInputElement;
    if (pdfInput) pdfInput.value = '';
    if (coverInput) coverInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload a book",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!bookForm.pdf) {
      toast({
        title: "PDF required",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress({
      currentPage: 0,
      totalPages: 0,
      progress: 0,
      message: "Initializing upload...",
      status: 'uploading',
    });

    try {
      console.log('Starting SSE upload process...');

      // Upload book with SSE real-time progress
      await uploadBookWithSSE(
        {
          title: bookForm.title,
          author: bookForm.author || undefined,
          description: bookForm.description || undefined,
          language: bookForm.language,
          genre: undefined,
          pdf_file: bookForm.pdf,
          cover_image: bookForm.cover || undefined,
          is_public: bookForm.isPublic,
        },
        {
          onProgress: (progress) => {
            console.log('Upload progress:', progress);
            setUploadProgress(progress);
          },
          onCompleted: (data) => {
            console.log('Upload completed:', data);
            toast({
              title: "Book uploaded successfully!",
              description: `Your book "${data.title}" has been processed and is ready to listen.`,
            });

            // Wait a moment to show completion, then navigate
            setTimeout(() => {
              resetForm();
              navigate("/library");
            }, 2000);
          },
          onError: (error) => {
            console.error('Upload error:', error);
            toast({
              title: "Upload failed",
              description: error,
              variant: "destructive",
            });
            setUploadProgress(null);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || "An unknown error occurred";

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      setUploadProgress(null);
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Upload a Book</CardTitle>
        <CardDescription>Share your favorite Hindi literature with the world</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <BookFormFields bookForm={bookForm} setBookForm={setBookForm} />

          {/* Upload Progress Display */}
          {uploadProgress && (
            <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {uploadProgress.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  )}
                  <span className="font-medium text-sm text-gray-900">
                    {uploadProgress.message}
                  </span>
                </div>
                {uploadProgress.totalPages > 0 && (
                  <span className="text-sm text-gray-600">
                    {uploadProgress.currentPage}/{uploadProgress.totalPages} pages
                  </span>
                )}
              </div>

              {uploadProgress.totalPages > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      {uploadProgress.status === 'processing' && 'OCR Processing'}
                      {uploadProgress.status === 'audio_generation' && 'Generating Audio'}
                      {uploadProgress.status === 'completed' && 'Completed'}
                    </span>
                    <span>{uploadProgress.progress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress?.status === 'completed' ? 'Completed!' : 'Processing...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Upload Book
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
