
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createShareCode } from '@/lib/localStorage';
import { Check, Copy, QrCode, Link2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ShareDeckDialogProps {
  isOpen?: boolean; // Compatible avec d'anciennes versions
  open?: boolean;    // Nouvelle propriété
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void; // Pour compatibilité avec le code existant
  deckId: string;
}

const ShareDeckDialog: React.FC<ShareDeckDialogProps> = ({
  isOpen,
  open,
  onOpenChange,
  onClose,
  deckId
}) => {
  const [expiryDays, setExpiryDays] = useState<string>("7");
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Utiliser open ou isOpen pour assurer la compatibilité
  const dialogOpen = open !== undefined ? open : isOpen;
  
  // Gestionnaire de changement compatible avec onClose et onOpenChange
  const handleOpenChange = (newState: boolean) => {
    if (onOpenChange) {
      onOpenChange(newState);
    } else if (!newState && onClose) {
      onClose();
    }
  };
  
  const generateCode = () => {
    try {
      const days = parseInt(expiryDays, 10);
      const code = createShareCode(deckId, days);
      const url = `${window.location.origin}/import/${code}`;
      
      setShareCode(code);
      setShareUrl(url);
      
      toast({
        title: "Code généré avec succès",
        description: "Le code de partage a été créé",
      });
    } catch (error) {
      console.error("Error generating share code:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le code de partage",
        variant: "destructive",
      });
    }
  };
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
        
        toast({
          title: "Copié !",
          description: `${type === 'url' ? 'Le lien' : 'Le code'} a été copié dans le presse-papier`,
        });
      },
      (err) => {
        console.error('Erreur lors de la copie:', err);
        toast({
          title: "Erreur",
          description: "Impossible de copier dans le presse-papier",
          variant: "destructive",
        });
      }
    );
  };
  
  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager ce deck</DialogTitle>
          <DialogDescription>
            Créez un code de partage pour permettre à d'autres utilisateurs d'importer ce deck
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Durée de validité</label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une durée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 jour</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
                <SelectItem value="365">1 an</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={generateCode} 
            className="w-full"
          >
            Générer un code de partage
          </Button>
          
          {shareCode && shareUrl && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code de partage</label>
                <div className="relative">
                  <Input 
                    value={shareCode} 
                    readOnly 
                    className="pr-12 font-mono"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => copyToClipboard(shareCode, 'code')}
                  >
                    {copySuccess === 'code' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Lien d'invitation</label>
                <div className="relative">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="pr-12 font-mono"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => copyToClipboard(shareUrl, 'url')}
                  >
                    {copySuccess === 'url' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Copier le lien
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Envoyer par email
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDeckDialog;
