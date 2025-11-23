
import { Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  title: string;
  author: string;
  coverImage?: string;
  language?: string;
  likes?: number;
  likesCount?: number;
  isLiked?: boolean;
  onLike?: (e: React.MouseEvent) => void;
  onPlay?: (e: React.MouseEvent) => void;
}

const BookCard = ({
  title,
  author,
  language = "Hindi",
  likes = 0,
  likesCount = 0,
  coverImage,
  isLiked = false,
  onLike,
  onPlay
}: BookCardProps) => {
  // Use either likes or likesCount, with likesCount taking precedence
  const displayLikes = likesCount || likes;
  
  return (
    <div className="book-card p-6 group hover:scale-105 transition-transform duration-300">
      {/* Book Cover */}
      <div className="aspect-[3/4] bg-gradient-to-br from-maroon-100 to-sandalwood-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-maroon-200 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl text-maroon-700 hindi-text">📖</span>
            </div>
            <p className="text-sm text-maroon-600 hindi-text font-semibold line-clamp-2">{title}</p>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg text-maroon-800 hindi-text line-clamp-2 group-hover:text-maroon-900 transition-colors">
          {title}
        </h3>
        
        <p className="text-sandalwood-700 hindi-text">
          {author}
        </p>

        <div className="flex items-center justify-between">
          <span className="inline-block bg-sandalwood-100 text-sandalwood-800 text-xs px-2 py-1 rounded-full">
            {language}
          </span>
          
          <div className="flex items-center gap-1 text-sm text-maroon-600">
            <Heart size={16} className={isLiked ? "fill-current text-red-500" : ""} />
            <span>{displayLikes}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 bg-maroon-600 hover:bg-maroon-700"
            onClick={onPlay}
          >
            <Play size={16} className="mr-2" />
            Listen
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`border-maroon-300 ${isLiked ? 'text-red-500 bg-red-50 border-red-300' : 'text-maroon-700'} hover:bg-maroon-50`}
            onClick={onLike}
          >
            <Heart size={16} className={isLiked ? 'fill-current' : ''} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
