import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SocialShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

const SocialShareButton = ({ title, text, url }: SocialShareButtonProps) => {
  const shareUrl = url || window.location.href;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(shareUrl);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // user cancelled
      }
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    toast.success('Copied to clipboard!');
  };

  if (navigator.share) {
    return (
      <Button variant="outline" size="sm" onClick={handleNativeShare} className="gap-2">
        <Share2 className="w-4 h-4" /> Share
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <a href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">
            Share on X / Twitter
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">
            Share on WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShareButton;
