
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { importSessionData, getSessionKey } from '@/lib/sessionManager';
import { toast } from '@/hooks/use-toast';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setSessionKey: (key: string) => void;
}

export const ImportDialog = ({ open, onOpenChange, setSessionKey }: ImportDialogProps) => {
  const [importData, setImportData] = useState('');

  const handleImportData = () => {
    if (!importData.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer des données valides.",
        variant: "destructive",
      });
      return;
    }
    
    const success = importSessionData(importData);
    
    if (success) {
      toast({
        title: "Données importées",
        description: "Vos données ont été importées avec succès.",
      });
      setSessionKey(getSessionKey() || '');
      onOpenChange(false);
      setImportData('');
    } else {
      toast({
        title: "Erreur",
        description: "Les données importées sont invalides.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer vos données</DialogTitle>
          <DialogDescription>
            Collez le code d'exportation pour restaurer vos données.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Textarea 
            value={importData} 
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Collez votre code d'exportation ici..." 
            className="h-40 font-mono text-xs"
          />
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleImportData}
          >
            <Upload className="h-4 w-4 mr-1" />
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
