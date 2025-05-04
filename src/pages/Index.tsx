
import { useEffect, useState } from 'react';
import { getSessionKey, verifySession } from '@/lib/sessionManager';
import { HeroSection } from '@/components/landing/HeroSection';
import { SessionKeySection } from '@/components/landing/SessionKeySection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { SessionInfoSection } from '@/components/landing/SessionInfoSection';
import { ImportDialog } from '@/components/landing/ImportDialog';
import { ExportDialog } from '@/components/landing/ExportDialog';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [sessionKey, setSessionKey] = useState(getSessionKey() || '');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportData, setExportData] = useState('');
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Check if user has a valid session key
    const hasValidSession = verifySession();
    
    // Update the session key state
    setSessionKey(getSessionKey() || '');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-foreground">
      <div className={`container mx-auto px-4 ${isMobile ? 'py-6' : 'py-16'} flex flex-col items-center justify-center text-center`}>
        <HeroSection setSessionKey={setSessionKey} />
        
        <SessionKeySection 
          sessionKey={sessionKey}
          setSessionKey={setSessionKey} 
          setShowExportDialog={setShowExportDialog}
          setShowImportDialog={setShowImportDialog}
          setExportData={setExportData}
        />
        
        <FeaturesSection />
        
        <SessionInfoSection />
      </div>
      
      <ExportDialog 
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        exportData={exportData}
      />
      
      <ImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        setSessionKey={setSessionKey}
      />
    </div>
  );
};

export default Index;
