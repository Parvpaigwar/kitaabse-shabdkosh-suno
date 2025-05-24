
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { BookFormData } from "./types";
import { BookFormFields } from "./BookFormFields";
import { sanitizeFileName } from "./utils";
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
      console.log('Starting upload process for user:', user.id);
      
      // 1. Insert book metadata into database
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .insert({
          title: bookForm.title,
          author: bookForm.author,
          description: bookForm.description || null,
          language: bookForm.language,
          is_public: bookForm.isPublic,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (bookError) {
        console.error('Book insertion error:', bookError);
        throw new Error(bookError.message);
      }
      
      console.log('Book created with ID:', bookData.id);
      const bookId = bookData.id;
      let coverUrl = null;

      // 2. Upload cover image if provided
      if (bookForm.cover) {
        console.log('Uploading cover image...');
        const coverFileExtension = bookForm.cover.name.split('.').pop() || 'jpg';
        const sanitizedCoverName = sanitizeFileName(`cover_${Date.now()}.${coverFileExtension}`);
        const coverPath = `${user.id}/${bookId}/${sanitizedCoverName}`;
        
        console.log('Cover upload path:', coverPath);
        
        const { error: coverUploadError } = await supabase.storage
          .from("book-covers")
          .upload(coverPath, bookForm.cover, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (coverUploadError) {
          console.warn("Cover upload failed:", coverUploadError);
        } else {
          const { data: coverUrlData } = supabase.storage
            .from("book-covers")
            .getPublicUrl(coverPath);
          
          coverUrl = coverUrlData.publicUrl;
          console.log('Cover uploaded successfully:', coverUrl);
        }
      }

      // 3. Upload PDF to storage
      console.log('Uploading PDF...');
      const pdfFileExtension = bookForm.pdf.name.split('.').pop() || 'pdf';
      const sanitizedPdfName = sanitizeFileName(`${bookForm.title}_${Date.now()}.${pdfFileExtension}`);
      const filePath = `${user.id}/${bookId}/${sanitizedPdfName}`;
      
      console.log('PDF upload path:', filePath);
      console.log('PDF file size:', bookForm.pdf.size);
      console.log('PDF file type:', bookForm.pdf.type);
      
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, bookForm.pdf, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('PDF upload error:', uploadError);
        throw new Error(`PDF upload failed: ${uploadError.message}`);
      }
      
      console.log('PDF uploaded successfully');
      
      // 4. Get public URL for the PDF
      const { data: urlData } = supabase.storage
        .from("books")
        .getPublicUrl(filePath);

      console.log('PDF public URL:', urlData.publicUrl);

      // 5. Update book with cover URL if uploaded
      if (coverUrl) {
        const { error: updateError } = await supabase
          .from("books")
          .update({ cover_url: coverUrl })
          .eq("id", bookId);
        
        if (updateError) {
          console.warn('Failed to update cover URL:', updateError);
        }
      }
      
      // 6. Create first pending chunk
      const { error: chunkError } = await supabase
        .from("chunks")
        .insert({
          book_id: bookId,
          chunk_number: 1,
          status: "pending",
        });
      
      if (chunkError) {
        console.error('Chunk creation error:', chunkError);
        throw new Error(chunkError.message);
      }
      
      console.log('First chunk created successfully');
      
      // 7. Trigger the OCR and audio generation process
      try {
        console.log('Starting book processing...');
        const processRes = await fetch("/api/process-book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId,
            pdfUrl: urlData.publicUrl,
          }),
        });
        
        if (!processRes.ok) {
          const errorData = await processRes.json();
          console.warn('Book processing failed:', errorData);
          throw new Error(errorData.error || "Failed to process book");
        }
        
        console.log('Book processing started successfully');
      } catch (processError) {
        console.warn("Book processing failed:", processError);
        toast({
          title: "Book uploaded with warning",
          description: "Your book was uploaded but audio processing may have failed. You can regenerate audio later.",
          variant: "destructive",
        });
      }
      
      // Success!
      toast({
        title: "Book uploaded successfully",
        description: "Your book has been uploaded and is now being processed.",
      });
      
      resetForm();
      navigate("/library");
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
