import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Plus, X, User } from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
  bio?: string;
  skills?: string[];
  experience_years?: number;
  location?: string;
  website_url?: string;
  cv_file_url?: string;
  avatar_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
}

export function ProfileSetup() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    experience_years: "",
    location: "",
    website_url: "",
    linkedin_url: "",
    instagram_url: "",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const { toast } = useToast();

  const getErrorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : "Errore sconosciuto";
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per visualizzare il profilo",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      toast({
        title: "Errore",
        description: "Impossibile caricare il profilo",
        variant: "destructive",
      });
    } else if (data) {
      setProfile(data);
      setFormData({
        display_name: data.display_name || "",
        bio: data.bio || "",
        experience_years: data.experience_years?.toString() || "",
        location: data.location || "",
        website_url: data.website_url || "",
        linkedin_url: data.linkedin_url || "",
        instagram_url: data.instagram_url || "",
        skills: data.skills || [],
      });
    } else {
      setIsEditing(true);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per salvare il profilo",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    if (!formData.display_name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome è obbligatorio",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const profileData = {
      user_id: user.id,
      display_name: formData.display_name.trim(),
      bio: formData.bio.trim() || null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      location: formData.location.trim() || null,
      website_url: formData.website_url.trim() || null,
      linkedin_url: formData.linkedin_url.trim() || null,
      instagram_url: formData.instagram_url.trim() || null,
      skills: formData.skills.length > 0 ? formData.skills : null,
    };

    const { data, error } = profile 
      ? await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single()
      : await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il profilo",
        variant: "destructive",
      });
    } else {
      setProfile(data);
      setIsEditing(false);
      toast({
        title: "Successo",
        description: "Profilo salvato con successo",
      });
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Seleziona un'immagine valida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "L'immagine deve essere inferiore a 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      setUploadingAvatar(false);
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      
      toast({
        title: "Successo",
        description: "Avatar aggiornato con successo",
      });
    } catch (error: unknown) {
      toast({
        title: "Errore",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Errore",
        description: "Il CV deve essere in formato PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "Il file deve essere inferiore a 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingCV(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato",
        variant: "destructive",
      });
      setUploadingCV(false);
      return;
    }

    try {
      const fileName = `${user.id}-cv-${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-cvs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-cvs')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_file_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, cv_file_url: data.publicUrl } : null);
      
      toast({
        title: "Successo",
        description: "CV caricato con successo",
      });
    } catch (error: unknown) {
      toast({
        title: "Errore",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploadingCV(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Caricamento profilo...</p>
      </div>
    );
  }

  if (!profile && !isEditing) {
    return (
      <div className="text-center py-8 space-y-4 px-4">
        <div className="max-w-md mx-auto">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Benvenuto nella Community!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea il tuo profilo professionale per connetterti con altri professionisti.
          </p>
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
            <User className="h-4 w-4 mr-2" />
            Crea il tuo profilo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">Il Tuo Profilo</h2>
        {profile && !isEditing && (
          <Button onClick={() => setIsEditing(true)} size="sm" className="w-full sm:w-auto">
            Modifica
          </Button>
        )}
      </div>

      {isEditing ? (
        /* Modalità Editing - Form compatto mobile */
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              {profile ? "Modifica Profilo" : "Crea Nuovo Profilo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
            {/* Upload Avatar - Layout compatto */}
            <div className="space-y-2">
              <Label className="text-sm">Foto Profilo</Label>
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-lg sm:text-xl">
                    {formData.display_name.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploadingAvatar}
                  />
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button type="button" disabled={uploadingAvatar} size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-1.5" />
                        {uploadingAvatar ? "..." : "Foto"}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Informazioni Base - Grid responsive */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="display_name" className="text-sm">Nome *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Il tuo nome"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm">Località</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Città"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-sm">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Descrivi la tua esperienza..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Esperienza */}
            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-sm">Esperienza</Label>
              <Select 
                value={formData.experience_years} 
                onValueChange={(value) => setFormData({ ...formData, experience_years: value })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Anni di esperienza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Neolaureato/a</SelectItem>
                  <SelectItem value="1">1 anno</SelectItem>
                  <SelectItem value="2">2 anni</SelectItem>
                  <SelectItem value="3">3 anni</SelectItem>
                  <SelectItem value="5">5 anni</SelectItem>
                  <SelectItem value="6">6-10 anni</SelectItem>
                  <SelectItem value="11">10+ anni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Competenze - Compatto */}
            <div className="space-y-1.5">
              <Label className="text-sm">Competenze</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Aggiungi competenza"
                  className="h-10 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer text-xs py-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors">
                      {skill}
                      <X className="h-3 w-3 ml-1" onClick={() => removeSkill(skill)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Links Sociali - Stack verticale su mobile */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Link Social</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-xs text-muted-foreground">Sito Web</Label>
                  <Input
                    id="website"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://..."
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="linkedin.com/in/..."
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="instagram.com/..."
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Pulsanti Azione - Full width mobile */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
              {profile && (
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      display_name: profile.display_name || "",
                      bio: profile.bio || "",
                      experience_years: profile.experience_years?.toString() || "",
                      location: profile.location || "",
                      website_url: profile.website_url || "",
                      linkedin_url: profile.linkedin_url || "",
                      instagram_url: profile.instagram_url || "",
                      skills: profile.skills || [],
                    });
                  }}
                >
                  Annulla
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Modalità Visualizzazione - Layout responsive */
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {profile?.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-4 w-full">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">{profile?.display_name}</h3>
                  {profile?.location && (
                    <p className="text-sm text-muted-foreground">{profile.location}</p>
                  )}
                  {profile?.experience_years && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {profile.experience_years} anni di esperienza
                    </p>
                  )}
                </div>

                {profile?.bio && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Bio</h4>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {profile?.skills && profile.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1.5">Competenze</h4>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {profile?.website_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                        Sito
                      </a>
                    </Button>
                  )}
                  {profile?.linkedin_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {profile?.instagram_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                        Instagram
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione CV Upload - Compatta */}
      {profile && !isEditing && (
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Curriculum Vitae</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {profile.cv_file_url ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">CV caricato</p>
                    <p className="text-xs text-muted-foreground">File PDF</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
                    <a href={profile.cv_file_url} target="_blank" rel="noopener noreferrer">
                      Visualizza
                    </a>
                  </Button>
                  <div className="flex-1 sm:flex-none">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={uploadCV}
                      className="hidden"
                      id="cv-replace"
                      disabled={uploadingCV}
                    />
                    <Label htmlFor="cv-replace" className="cursor-pointer block">
                      <Button size="sm" variant="outline" disabled={uploadingCV} asChild className="w-full">
                        <span>{uploadingCV ? "..." : "Sostituisci"}</span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Carica il tuo CV per completare il profilo
                </p>
                <div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={uploadCV}
                    className="hidden"
                    id="cv-upload"
                    disabled={uploadingCV}
                  />
                  <Label htmlFor="cv-upload" className="cursor-pointer">
                    <Button disabled={uploadingCV} size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingCV ? "Caricamento..." : "Carica CV"}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Solo PDF, max 10MB
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
