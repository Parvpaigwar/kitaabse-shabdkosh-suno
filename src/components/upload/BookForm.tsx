
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadBook } from "@/services/bookService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BookFormData } from "./types";
import { BookFormFields } from "./BookFormFields";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

export const BookForm = () => {
  const { user, isVerified, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

    if (!isVerified && userRole !== 'superadmin') {
      toast({
        title: "Email verification required",
        description: "Please verify your email before uploading books",
        variant: "destructive",
      });
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

    try {
      console.log('Starting upload process...');

      // Upload book using the new Django backend API
      const response = await uploadBook({
        title: bookForm.title,
        author: bookForm.author || undefined,
        description: bookForm.description || undefined,
        language: bookForm.language,
        genre: undefined, // Can be added to the form if needed
        pdf_file: bookForm.pdf,
        cover_image: bookForm.cover || undefined,
        is_public: bookForm.isPublic,
      });

      if (response.status === 'PASS') {
        console.log('Book uploaded successfully:', response.data.book);

        toast({
          title: "Book uploaded successfully",
          description: "Your book has been uploaded and is now being processed for audio conversion.",
        });

        resetForm();
        navigate("/library");
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred";
      const errorDetails = error.response?.data?.errors;

      let description = errorMessage;
      if (errorDetails) {
        const errorMessages = Object.values(errorDetails).flat().join(', ');
        description = errorMessages || errorMessage;
      }

      toast({
        title: "Upload failed",
        description,
        variant: "destructive",
      });
    } finally {
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
        </CardContent>
        
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
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
