
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Download, FileJson, Upload } from "lucide-react";
import { exportAllData, importAllData } from "@/lib/storage";

const DataImportExport = () => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Créer un élément a pour le téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashforge-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      // Libérer l'URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast({
        title: "Exportation réussie",
        description: "Toutes vos données ont été exportées avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
      toast({
        title: "Erreur d'exportation",
        description: "Impossible d'exporter vos données",
        variant: "destructive"
      });
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = handleFileImport;
    input.click();
  };

  const handleFileImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    // Vérification du type de fichier
    if (file.type !== 'application/json') {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier JSON",
        variant: "destructive"
      });
      return;
    }
    
    setImporting(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          const success = await importAllData(data);
          
          if (success) {
            toast({
              title: "Importation réussie",
              description: "Vos données ont été importées avec succès"
            });
          } else {
            throw new Error("Erreur lors de l'importation");
          }
        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error);
          toast({
            title: "Fichier invalide",
            description: "Le fichier ne contient pas de données valides",
            variant: "destructive"
          });
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier",
          variant: "destructive"
        });
        setImporting(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Erreur lors de l\'importation des données:', error);
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'importer vos données",
        variant: "destructive"
      });
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Importation/Exportation de données
        </CardTitle>
        <CardDescription>
          Sauvegardez ou restaurez vos données à partir d'un fichier JSON
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[120px]">
          <p className="text-sm text-muted-foreground mb-4">
            Vous pouvez exporter toutes vos données (decks, cartes, thèmes, etc.) dans un fichier JSON 
            pour les sauvegarder ou les transférer sur un autre appareil. Vous pouvez également importer 
            un fichier de données précédemment exporté.
          </p>
          <div className="bg-muted/50 rounded-md p-3 text-xs">
            <p className="font-semibold mb-1">Attention:</p>
            <p>L'importation de données peut remplacer certaines de vos données existantes si elles ont le même identifiant.</p>
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleImportClick}
          disabled={importing}
        >
          <Upload className="h-4 w-4" />
          Importer
        </Button>
        
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={handleExportData}
          disabled={importing}
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataImportExport;
