
import { useState } from 'react';
import { Copy, Check, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSessionKey, saveSessionKey, generateSessionKey, exportSessionData } from '@/lib/sessionManager';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface SessionKeySectionProps {
  sessionKey: string;
  setSessionKey: (key: string) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowImportDialog: (show: boolean) => void;
  setExportData: (data: string) => void;
}

export const SessionKeySection = ({
  sessionKey,
  setSessionKey,
  setShowExportDialog,
  setShowImportDialog,
  setExportData
}: SessionKeySectionProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const isMobile = useIsMobile();

  const handleCopyKey = () => {
    const currentSessionKey = getSessionKey();
    if (currentSessionKey) {
      navigator.clipboard.writeText(currentSessionKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      
      toast({
        title: "Clé copiée!",
        description: "Votre clé de session a été copiée dans le presse-papier.",
      });
    }
  };
  
  const handleGenerateKey = () => {
    const newKey = generateSessionKey();
    saveSessionKey(newKey);
    setSessionKey(newKey);
    
    toast({
      title: "Nouvelle clé générée!",
      description: "N'oubliez pas de la sauvegarder pour accéder à vos données ultérieurement.",
    });
  };
  
  const handleExportData = () => {
    const data = exportSessionData();
    setExportData(data);
    setShowExportDialog(true);
  };

  if (!sessionKey) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg max-w-md w-full mb-8 sm:mb-12">
      <Badge variant="gradient" className="mb-3">Session active</Badge>
      <h3 className="text-lg font-medium mb-2">Votre clé de session:</h3>
      <div className="bg-indigo-500/5 rounded-lg p-2 sm:p-3 mb-3 font-mono text-sm sm:text-lg tracking-wider border border-indigo-200/20 dark:border-indigo-800/20 break-all">
        {sessionKey}
      </div>
      <p className="text-xs sm:text-sm mb-4 text-muted-foreground">
        Conservez cette clé pour accéder à vos données ultérieurement
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button 
          onClick={handleCopyKey} 
          variant="outline"
          className="border-indigo-200/40 dark:border-indigo-800/40 hover:bg-indigo-500/10"
          size="sm"
        >
          {isCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {isCopied ? "Copié!" : "Copier"}
        </Button>
        <Button 
          onClick={handleExportData}
          variant="outline"
          className="border-indigo-200/40 dark:border-indigo-800/40 hover:bg-indigo-500/10"
          size="sm"
        >
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
        <Button 
          onClick={() => setShowImportDialog(true)}
          variant="outline"
          className="border-indigo-200/40 dark:border-indigo-800/40 hover:bg-indigo-500/10"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-1" />
          Importer
        </Button>
      </div>
    </div>
  );
};
