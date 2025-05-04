
import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { base64ToBlob, blobToBase64, storeImage, generateMediaId } from "@/lib/indexedDBStorage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileAvatarProps {
  username: string;
  initialAvatar?: string;
  onAvatarChange?: (avatarImage: string, avatarId: string) => void;
  size?: "sm" | "md" | "lg";
}

const ProfileAvatar = ({
  username,
  initialAvatar,
  onAvatarChange,
  size = "md"
}: ProfileAvatarProps) => {
  const [avatar, setAvatar] = useState<string | undefined>(initialAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const sizeClass = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  };
  
  const buttonSizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner une image",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Convertir le fichier en base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setAvatar(base64);
        
        // Stocker l'image dans IndexedDB
        const avatarId = generateMediaId('img');
        const contentType = file.type;
        const imageBlob = base64ToBlob(base64, contentType);
        const success = await storeImage(avatarId, imageBlob);
        
        if (success && onAvatarChange) {
          onAvatarChange(base64, avatarId);
          
          toast({
            title: "Photo de profil mise à jour",
            description: "Votre photo de profil a été mise à jour avec succès"
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image",
        variant: "destructive"
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const initials = username
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="relative group">
      <Avatar className={`${sizeClass[size]} border-2 border-primary/20`}>
        {avatar ? (
          <AvatarImage src={avatar} alt={username} />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className={`${buttonSizeClass[size]} absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md`}
              onClick={triggerFileUpload}
            >
              <Upload className="h-3/5 w-3/5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Changer l'avatar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default ProfileAvatar;
