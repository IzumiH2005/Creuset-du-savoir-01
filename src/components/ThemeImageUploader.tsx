
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Image, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { isBase64String } from '@/lib/storage/utils';
import { migrateBase64MediaToIndexedDB } from '@/lib/storage/mediaStorage';

interface ThemeImageUploaderProps {
  currentImage?: string;
  onChange: (image: string | undefined) => void;
  className?: string;
}

const ThemeImageUploader: React.FC<ThemeImageUploaderProps> = ({
  currentImage,
  onChange,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Optimisation : migration automatique vers IndexedDB si nécessaire
  useEffect(() => {
    if (currentImage && isBase64String(currentImage)) {
      migrateBase64MediaToIndexedDB(currentImage)
        .then(({ imageId }) => {
          console.log("Image optimisée vers IndexedDB:", imageId);
        })
        .catch(error => {
          console.error("Échec d'optimisation d'image:", error);
        });
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("L'image ne doit pas dépasser 5 Mo");
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
        setIsLoading(false);
      };

      reader.onerror = () => {
        setError("Erreur lors du chargement de l'image");
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor="theme-image" className="block mb-1 font-serif">
        Image de couverture
      </Label>

      <div className="space-y-3">
        {currentImage ? (
          <div className="relative rounded-md overflow-hidden border">
            <img 
              src={currentImage} 
              alt="Aperçu" 
              className="w-full h-auto max-h-48 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 rounded-full"
              onClick={clearImage}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div 
            className={cn(
              "border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary/70 transition-colors",
              isMobile ? "p-4" : "p-8",
              "bg-muted/30"
            )}
            onClick={triggerFileInput}
          >
            <Image className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              Cliquez pour sélectionner une image
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou GIF • Max 5Mo
            </p>
          </div>
        )}

        <Input
          id="theme-image"
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={isLoading}
            className="text-xs"
          >
            {currentImage ? "Changer l'image" : "Sélectionner une image"}
            <Upload className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
              <span className="text-xs text-muted-foreground">Chargement...</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ThemeImageUploader;
