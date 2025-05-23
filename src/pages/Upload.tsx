
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
import { Loader2, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";

const UploadPage = () => {
  const { user } = useAuth();
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
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileSize = file.size / 1024 / 1024; // Size in MB
    
    if (fileSize > 5) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5 MB.",
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
    
    setBookForm({
      ...bookForm,
      pdf: file,
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
      
      // 2. Upload PDF to storage
      const bookId = bookData.id;
      const filePath = `${user.id}/${bookId}/${bookForm.pdf.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, bookForm.pdf);
      
      if (uploadError) throw new Error(uploadError.message);
      
      // 3. Get public URL for the PDF
      const { data: urlData } = await supabase.storage
        .from("books")
        .getPublicUrl(filePath);
      
      // 4. Create first pending chunk
      const { error: chunkError } = await supabase
        .from("chunks")
        .insert({
          book_id: bookId,
          chunk_number: 1,
          status: "pending",
        });
      
      if (chunkError) throw new Error(chunkError.message);
      
      // 5. Trigger the OCR and audio generation process
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={bookForm.isPublic}
                  onCheckedChange={handleSwitchChange("isPublic")}
                />
                <Label htmlFor="isPublic">Make this book public</Label>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="pdf">Upload PDF (max 5 MB) *</Label>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
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
