import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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
      // Nessun profilo esistente, inizia in modalità editing
      setIsEditing(true);
    }
    setLoading(false);
  };

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Seleziona un'immagine valida",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
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
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
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
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare l'avatar",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Errore",
        description: "Il CV deve essere in formato PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
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
      // Create unique file name
      const fileName = `${user.id}-cv-${Date.now()}.pdf`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('profile-cvs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('profile-cvs')
        .getPublicUrl(filePath);

      // Update profile with new CV URL
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
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare il CV",
        variant: "destructive",
      });
    } finally {
      setUploadingCV(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Caricamento profilo...</p>
      </div>
    );
  }

  if (!profile && !isEditing) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">Benvenuto nella Community!</h3>
          <p className="text-muted-foreground mb-4">
            Crea il tuo profilo professionale per connetterti con altri professionisti del settore.
          </p>
          <Button onClick={() => setIsEditing(true)}>
            <User className="h-4 w-4 mr-2" />
            Crea il tuo profilo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Il Tuo Profilo Professionale</h2>
        {profile && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Modifica Profilo
          </Button>
        )}
      </div>

      {isEditing ? (
        /* Modalità Editing */
        <Card>
          <CardHeader>
            <CardTitle>
              {profile ? "Modifica Profilo" : "Crea Nuovo Profilo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Avatar */}
            <div className="space-y-2">
              <Label>Foto Profilo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xl">
                    {formData.display_name.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploadingAvatar}
                  />
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button type="button" disabled={uploadingAvatar} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingAvatar ? "Caricamento..." : "Carica Foto"}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, max 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Informazioni Base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome Visualizzato *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Il tuo nome professionale"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Località</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Città, Paese"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio Professionale</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Descrivi la tua esperienza e specializzazioni..."
                rows={4}
              />
            </div>

            {/* Esperienza */}
            <div className="space-y-2">
              <Label htmlFor="experience">Anni di Esperienza</Label>
              <Select 
                value={formData.experience_years} 
                onValueChange={(value) => setFormData({ ...formData, experience_years: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona anni di esperienza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Neolaureato/a</SelectItem>
                  <SelectItem value="1">1 anno</SelectItem>
                  <SelectItem value="2">2 anni</SelectItem>
                  <SelectItem value="3">3 anni</SelectItem>
                  <SelectItem value="4">4 anni</SelectItem>
                  <SelectItem value="5">5 anni</SelectItem>
                  <SelectItem value="6">6-10 anni</SelectItem>
                  <SelectItem value="11">Più di 10 anni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Competenze */}
            <div className="space-y-2">
              <Label>Competenze e Specializzazioni</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Aggiungi competenza (es. Massaggio rilassante)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors">
                      {skill}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Links Sociali */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Sito Web</Label>
                <Input
                  id="website"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.esempio.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>

            {/* Pulsanti Azione */}
            <div className="flex gap-2 pt-4">
              <Button onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvataggio..." : "Salva Profilo"}
              </Button>
              {profile && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
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
        /* Modalità Visualizzazione */
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{profile?.display_name}</h3>
                  {profile?.location && (
                    <p className="text-muted-foreground">{profile.location}</p>
                  )}
                  {profile?.experience_years && (
                    <p className="text-sm text-muted-foreground">
                      {profile.experience_years} anni di esperienza
                    </p>
                  )}
                </div>

                {profile?.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">Bio</h4>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {profile?.skills && profile.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Competenze</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {profile?.website_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                        Sito Web
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

      {/* Sezione CV Upload */}
      {profile && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Curriculum Vitae</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.cv_file_url ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">CV caricato</p>
                      <p className="text-sm text-muted-foreground">File PDF</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={profile.cv_file_url} target="_blank" rel="noopener noreferrer">
                        Visualizza
                      </a>
                    </Button>
                    <div>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={uploadCV}
                        className="hidden"
                        id="cv-replace"
                        disabled={uploadingCV}
                      />
                      <Label htmlFor="cv-replace" className="cursor-pointer">
                        <Button size="sm" variant="outline" disabled={uploadingCV} asChild>
                          <span>{uploadingCV ? "Caricamento..." : "Sostituisci"}</span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
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
                    <Button disabled={uploadingCV} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingCV ? "Caricamento..." : "Carica CV"}
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Solo file PDF, max 10MB
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