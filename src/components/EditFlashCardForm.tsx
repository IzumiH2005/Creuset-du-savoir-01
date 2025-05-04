
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Plus, Check, Edit } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

// Move the types to a better location
interface CardSideData {
  text: string;
  image?: string;
  audio?: string;
  additionalInfo?: string;
}

interface EditFlashCardFormProps {
  initialFront?: CardSideData;
  initialBack?: CardSideData;
  onSubmit: (front: CardSideData, back: CardSideData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Extract CardSide into its own component for better organization
const CardSideEditor = ({
  side,
  data,
  onChange,
  showInfo,
  onToggleInfo,
  sideLabel
}: {
  side: 'front' | 'back';
  data: CardSideData;
  onChange: (data: CardSideData) => void;
  showInfo: boolean;
  onToggleInfo: (show: boolean) => void;
  sideLabel: string;
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 5 Mo",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({
        ...data,
        image: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'audio ne doit pas dépasser 10 Mo",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier audio",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({
        ...data,
        audio: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="border rounded-lg p-3 mb-4">
      <h3 className="text-base font-medium mb-2">{sideLabel}</h3>
      
      <div className="space-y-2 mb-3">
        <Label htmlFor={`${side}-text`} className="text-sm">Texte</Label>
        <Textarea
          id={`${side}-text`}
          rows={isMobile ? 2 : 3}
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder={side === 'front' ? "Ex: Définition, question, mot..." : "Ex: Réponse, traduction..."}
          className="w-full resize-y text-sm"
        />
      </div>
      
      <div className="space-y-2 mb-3">
        <Label htmlFor={`${side}-image`} className="text-sm flex items-center justify-between">
          <span>Image</span>
          {!data.image && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => document.getElementById(`${side}-image`)?.click()}
            >
              <Plus className="h-3 w-3 mr-1" /> Ajouter
            </Button>
          )}
        </Label>
        <Input
          id={`${side}-image`}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full text-sm hidden"
        />
        {data.image ? (
          <div className="relative mt-2 w-full h-20 rounded-md overflow-hidden border">
            <img
              src={data.image}
              alt={side === 'front' ? "Recto" : "Verso"}
              className="w-full h-full object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 w-5 h-5 rounded-full"
              onClick={() => onChange({ ...data, image: undefined })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : null}
      </div>
      
      <div className="space-y-2 mb-3">
        <Label htmlFor={`${side}-audio`} className="text-sm flex items-center justify-between">
          <span>Audio</span>
          {!data.audio && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => document.getElementById(`${side}-audio`)?.click()}
            >
              <Plus className="h-3 w-3 mr-1" /> Ajouter
            </Button>
          )}
        </Label>
        <Input
          id={`${side}-audio`}
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="w-full text-sm hidden"
        />
        {data.audio && (
          <div className="mt-2 relative">
            <audio controls className="w-full h-8">
              <source src={data.audio} />
              Votre navigateur ne supporte pas l'audio.
            </audio>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 right-0 w-5 h-5 rounded-full"
              onClick={() => onChange({ ...data, audio: undefined })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id={`show-${side}-info`}
          checked={showInfo}
          onCheckedChange={(checked) => onToggleInfo(!!checked)}
        />
        <Label htmlFor={`show-${side}-info`} className="text-sm">Infos supplémentaires</Label>
      </div>
      
      {showInfo && (
        <div className="space-y-2 mt-2">
          <Textarea
            id={`${side}-additional-info`}
            rows={isMobile ? 2 : 3}
            value={data.additionalInfo || ""}
            onChange={(e) => onChange({ ...data, additionalInfo: e.target.value })}
            placeholder="Contexte, notes, détails..."
            className="w-full resize-y text-sm"
          />
        </div>
      )}
    </div>
  );
};

const EditFlashCardForm = ({
  initialFront = { text: "", additionalInfo: "" },
  initialBack = { text: "", additionalInfo: "" },
  onSubmit,
  onCancel,
  isLoading = false
}: EditFlashCardFormProps) => {
  const [frontData, setFrontData] = useState<CardSideData>(initialFront);
  const [backData, setBackData] = useState<CardSideData>(initialBack);
  const [showFrontInfo, setShowFrontInfo] = useState(!!initialFront.additionalInfo);
  const [showBackInfo, setShowBackInfo] = useState(!!initialBack.additionalInfo);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Reset form when initialFront/initialBack change
  useEffect(() => {
    setFrontData(initialFront);
    setBackData(initialBack);
    setShowFrontInfo(!!initialFront.additionalInfo);
    setShowBackInfo(!!initialBack.additionalInfo);
  }, [initialFront, initialBack]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontData.text.trim() && !frontData.image) {
      toast({
        title: "Contenu requis",
        description: "Veuillez ajouter du texte ou une image au recto de la carte",
        variant: "destructive",
      });
      return;
    }

    if (!backData.text.trim() && !backData.image) {
      toast({
        title: "Contenu requis",
        description: "Veuillez ajouter du texte ou une image au verso de la carte",
        variant: "destructive",
      });
      return;
    }

    onSubmit(
      {
        ...frontData,
        additionalInfo: showFrontInfo ? frontData.additionalInfo : undefined,
      },
      {
        ...backData,
        additionalInfo: showBackInfo ? backData.additionalInfo : undefined,
      }
    );
  };

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className={`${isMobile ? "mobile-form-container" : "p-4"}`}>
        <div className="space-y-2 mb-4">
          <CardSideEditor
            side="front"
            data={frontData}
            onChange={setFrontData}
            showInfo={showFrontInfo}
            onToggleInfo={setShowFrontInfo}
            sideLabel="Recto de la carte"
          />
          
          <CardSideEditor
            side="back"
            data={backData}
            onChange={setBackData}
            showInfo={showBackInfo}
            onToggleInfo={setShowBackInfo}
            sideLabel="Verso de la carte"
          />
        </div>
        
        <div className="flex justify-end gap-2 sticky bottom-0 bg-background p-2 border-t z-10">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} size={isMobile ? "sm" : "default"}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading} size={isMobile ? "sm" : "default"}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
            {!isLoading && <Check className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditFlashCardForm;
