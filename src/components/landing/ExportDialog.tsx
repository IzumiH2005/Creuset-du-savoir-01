
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportData: string;
}

export const ExportDialog = ({ open, onOpenChange, exportData }: ExportDialogProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[90%] max-w-[90%] p-4' : 'sm:max-w-md'}`}>
        <DialogHeader>
          <DialogTitle>Exporter vos données</DialogTitle>
          <DialogDescription>
            Copiez ce code et conservez-le en lieu sûr pour restaurer vos données ultérieurement.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Textarea 
            value={exportData} 
            readOnly 
            className="h-32 sm:h-40 font-mono text-xs"
          />
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1 text-sm"
          >
            Fermer
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(exportData);
              toast({
                title: "Données copiées",
                description: "Les données ont été copiées dans le presse-papier.",
              });
            }}
            className="sm:flex-1 text-sm"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
