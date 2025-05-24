
import { AuthGuard } from "@/components/upload/AuthGuard";
import { BookForm } from "@/components/upload/BookForm";
import Navbar from "@/components/Navbar";

const UploadPage = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <BookForm />
        </div>
      </div>
    </AuthGuard>
  );
};

export default UploadPage;
