
export interface BookFormData {
  title: string;
  author: string;
  language: string;
  description: string;
  isPublic: boolean;
  pdf: File | null;
  cover: File | null;
}
