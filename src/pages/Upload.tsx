import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Image } from "lucide-react";
import Navbar from "@/components/Navbar";

const UploadPage = () => {
  const { user, isVerified } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    language: "hindi",
    description: "",
    isPublic: true,
    pdf: null as File | null,
    cover: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'cover') => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileSize = file.size / 1024 / 1024; // Size in MB
    
    if (type === 'pdf') {
      if (fileSize > 10) {
        toast({
          title: "File too large",
          description: "Please upload a PDF file smaller than 10 MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      
      if (!file.type.includes("pdf")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    } else if (type === 'cover') {
      if (fileSize > 5) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5 MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      
      if (!file.type.includes("image")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, etc.).",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    }
    
    setBookForm({
      ...bookForm,
      [type]: file,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookForm({
      ...bookForm,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setBookForm({
      ...bookForm,
      [name]: value,
    });
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setBookForm({
      ...bookForm,
      [name]: checked,
    });
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

    if (!isVerified) {
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
      
      if (bookError) throw new Error(bookError.message);
      
      const bookId = bookData.id;
      let coverUrl = null;

      // 2. Upload cover image if provided
      if (bookForm.cover) {
        const coverPath = `${user.id}/${bookId}/cover.${bookForm.cover.name.split('.').pop()}`;
        
        const { error: coverUploadError } = await supabase.storage
          .from("book-covers")
          .upload(coverPath, bookForm.cover);
        
        if (coverUploadError) {
          console.warn("Cover upload failed:", coverUploadError.message);
        } else {
          const { data: coverUrlData } = supabase.storage
            .from("book-covers")
            .getPublicUrl(coverPath);
          
          coverUrl = coverUrlData.publicUrl;
        }
      }

      // 3. Upload PDF to storage
      const filePath = `${user.id}/${bookId}/${bookForm.pdf.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, bookForm.pdf);
      
      if (uploadError) throw new Error(uploadError.message);
      
      // 4. Get public URL for the PDF
      const { data: urlData } = supabase.storage
        .from("books")
        .getPublicUrl(filePath);

      // 5. Update book with cover URL if uploaded
      if (coverUrl) {
        await supabase
          .from("books")
          .update({ cover_url: coverUrl })
          .eq("id", bookId);
      }
      
      // 6. Create first pending chunk
      const { error: chunkError } = await supabase
        .from("chunks")
        .insert({
          book_id: bookId,
          chunk_number: 1,
          status: "pending",
        });
      
      if (chunkError) throw new Error(chunkError.message);
      
      // 7. Trigger the OCR and audio generation process
      try {
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
          throw new Error(errorData.error || "Failed to process book");
        }
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
      
      navigate("/library");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to upload books</h1>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Email verification required</h1>
          <p className="mb-4">Please verify your email address before uploading books.</p>
          <Button onClick={() => navigate("/auth")}>Verify Email</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Upload a Book</CardTitle>
            <CardDescription>Share your favorite Hindi literature with the world</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  value={bookForm.title}
                  onChange={handleChange}
                  placeholder="Enter the book title"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="author">Author Name *</Label>
                <Input
                  id="author"
                  name="author"
                  required
                  value={bookForm.author}
                  onChange={handleChange}
                  placeholder="Enter the author's name"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="language">Language *</Label>
                <Select 
                  value={bookForm.language} 
                  onValueChange={handleSelectChange("language")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="urdu">Urdu</SelectItem>
                    <SelectItem value="sanskrit">Sanskrit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={bookForm.description}
                  onChange={handleChange}
                  placeholder="Enter a brief description of the book"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cover">Book Cover (optional)</Label>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'cover')}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a cover image (JPG, PNG, max 5 MB)
                  </p>
                </div>
                {bookForm.cover && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Image className="h-4 w-4" />
                    {bookForm.cover.name}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={bookForm.isPublic}
                  onCheckedChange={handleSwitchChange("isPublic")}
                />
                <Label htmlFor="isPublic">Make this book public</Label>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="pdf">Upload PDF (max 10 MB) *</Label>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'pdf')}
                    required
                  />
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default UploadPage;
