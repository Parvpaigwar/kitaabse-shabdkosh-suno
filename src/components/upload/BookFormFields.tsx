
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Image, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { BookFormData } from "./types";

interface BookFormFieldsProps {
  bookForm: BookFormData;
  setBookForm: React.Dispatch<React.SetStateAction<BookFormData>>;
}

export const BookFormFields = ({ bookForm, setBookForm }: BookFormFieldsProps) => {
  const { toast } = useToast();

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

  return (
    <>
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
          <p className="text-sm text-muted-foreground">
            PDF files only, maximum 10 MB
          </p>
        </div>
        {bookForm.pdf && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Upload className="h-4 w-4" />
            {bookForm.pdf.name}
          </div>
        )}
      </div>
    </>
  );
};
