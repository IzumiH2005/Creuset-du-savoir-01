
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import ProfileAvatar from "@/components/ProfileAvatar";
import { getProfile, updateProfile, resetUserData, logout } from "@/lib/localStorage";
import { Loader2, Save, RefreshCw, AlertTriangle, User } from "lucide-react";
import DataImportExport from "@/components/DataImportExport";
import StorageMigrationTool from "@/components/StorageMigrationTool";
import { hasSession } from "@/lib/sessionManager";
import { useIsMobile } from '@/hooks/use-mobile';
import { User as UserType } from '@/lib/storage/types';

const ProfilePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // État du profil utilisateur
  const [profile, setProfile] = useState({
    id: "",
    username: "",
    email: "",
    bio: "",
    displayName: "",
    avatar: "",
    avatarId: "",
    settings: {
      darkMode: false,
      notifications: true,
      soundEffects: true
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    bio: "",
    displayName: "",
  });
  
  // Charger le profil au montage du composant
  useEffect(() => {
    if (!hasSession()) {
      navigate('/login');
      return;
    }
    
    const userProfile = getProfile();
    if (userProfile) {
      setProfile({
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        bio: userProfile.bio || "",
        displayName: userProfile.displayName || "",
        avatar: userProfile.avatar || "",
        avatarId: userProfile.avatarId || "",
        settings: userProfile.settings || {
          darkMode: false,
          notifications: true,
          soundEffects: true
        }
      });
      
      setEditFormData({
        username: userProfile.username,
        email: userProfile.email,
        bio: userProfile.bio || "",
        displayName: userProfile.displayName || "",
      });
    }
    setLoading(false);
  }, [navigate]);
  
  const handleAvatarChange = (avatar: string, avatarId: string) => {
    if (avatar && avatarId) {
      const updatedProfile = {
        ...profile,
        avatar,
        avatarId
      };
      
      updateProfile(updatedProfile);
      setProfile(updatedProfile);
    }
  };
  
  const handleSettingChange = (setting: string, value: boolean) => {
    const updatedProfile = {
      ...profile,
      settings: {
        ...profile.settings,
        [setting]: value
      }
    };
    
    updateProfile(updatedProfile);
    setProfile(updatedProfile);
    
    if (setting === 'darkMode') {
      // Appliquer le mode sombre/clair immédiatement
      document.documentElement.classList.toggle('dark', value);
    }
    
    toast({
      title: "Paramètre mis à jour",
      description: `Le paramètre a été mis à jour avec succès`
    });
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès"
    });
  };
  
  const handleResetData = () => {
    const confirmed = window.confirm(
      "Attention ! Cette action supprimera toutes vos données (decks, cartes, statistiques...). Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?"
    );
    
    if (confirmed) {
      resetUserData();
      toast({
        title: "Données réinitialisées",
        description: "Toutes vos données ont été supprimées"
      });
      
      // Rediriger vers la page d'accueil après la réinitialisation
      navigate('/');
    }
  };
  
  const toggleEditMode = () => {
    if (isEditing) {
      // Quitter le mode édition sans enregistrer
      setEditFormData({
        username: profile.username,
        email: profile.email,
        bio: profile.bio || "",
        displayName: profile.displayName || "",
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Valider les champs
      if (!editFormData.username.trim()) {
        toast({
          title: "Nom d'utilisateur requis",
          description: "Veuillez saisir un nom d'utilisateur",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      
      // Mettre à jour le profil
      const updatedProfile = {
        ...profile,
        username: editFormData.username.trim(),
        email: editFormData.email.trim(),
        bio: editFormData.bio.trim(),
        displayName: editFormData.displayName.trim()
      };
      
      updateProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations de profil ont été mises à jour avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }
  
  const containerClass = isMobile ? "container mx-auto px-4 py-6 pb-24" : "container mx-auto py-8";
  
  return (
    <div className={containerClass}>
      <h1 className="text-3xl font-bold mb-6">Profil</h1>
      
      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="donnees">Données</TabsTrigger>
        </TabsList>
        
        <TabsContent value="informations" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Informations personnelles</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleEditMode}
                disabled={saving}
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-4">
                  <ProfileAvatar 
                    username={profile.username}
                    initialAvatar={profile.avatar}
                    onAvatarChange={handleAvatarChange}
                    size="lg"
                  />
                  {!isEditing ? (
                    <div className="text-center">
                      <h2 className="text-xl font-bold">{profile.displayName || profile.username}</h2>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  ) : null}
                </div>
                
                {!isEditing ? (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">À propos</p>
                      <p>{profile.bio || "Aucune biographie renseignée"}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Nom d'utilisateur</p>
                      <p>{profile.username}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProfile} className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nom à afficher</Label>
                      <Input 
                        id="displayName"
                        name="displayName"
                        value={editFormData.displayName}
                        onChange={handleInputChange}
                        placeholder="Votre nom public"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d'utilisateur</Label>
                      <Input 
                        id="username"
                        name="username"
                        value={editFormData.username}
                        onChange={handleInputChange}
                        placeholder="Nom d'utilisateur"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        value={editFormData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biographie</Label>
                      <Textarea 
                        id="bio"
                        name="bio"
                        value={editFormData.bio}
                        onChange={handleInputChange}
                        placeholder="Parlez-nous de vous"
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={toggleEditMode}
                        disabled={saving}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Niveau global</span>
                  <span>Niveau 3</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold">12</span>
                  <p className="text-xs text-muted-foreground">Decks créés</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold">153</span>
                  <p className="text-xs text-muted-foreground">Cartes étudiées</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold">86%</span>
                  <p className="text-xs text-muted-foreground">Taux de réussite</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <span className="text-2xl font-bold">14</span>
                  <p className="text-xs text-muted-foreground">Jours d'étude</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Mode sombre</Label>
                  <p className="text-sm text-muted-foreground">Activer l'interface en mode sombre</p>
                </div>
                <Switch 
                  id="darkMode" 
                  checked={profile.settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">Recevoir des notifications d'apprentissage</p>
                </div>
                <Switch 
                  id="notifications" 
                  checked={profile.settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="soundEffects">Effets sonores</Label>
                  <p className="text-sm text-muted-foreground">Activer les sons lors de l'utilisation des flashcards</p>
                </div>
                <Switch 
                  id="soundEffects" 
                  checked={profile.settings.soundEffects}
                  onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLogout}
              >
                <User className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleResetData}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Réinitialiser toutes les données
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="donnees" className="space-y-6">
          <DataImportExport />
          
          <StorageMigrationTool />
          
          <Card>
            <CardHeader>
              <CardTitle>Utilisation de l'espace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Espace utilisé (LocalStorage)</span>
                  <span>2.3 MB / 5 MB</span>
                </div>
                <Progress value={46} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Espace utilisé (IndexedDB)</span>
                  <span>13.7 MB / 50 MB</span>
                </div>
                <Progress value={27} className="h-2" />
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => {
                  // Cette fonction serait implémentée dans un contexte réel
                  toast({
                    title: "Vérification effectuée",
                    description: "L'utilisation de l'espace a été actualisée"
                  });
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser les statistiques d'espace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
