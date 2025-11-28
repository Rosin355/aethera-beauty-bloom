import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Globe, Linkedin, Instagram, FileText, Users, Star, Filter } from "lucide-react";
import { UserTypeBadge } from "./UserTypeBadge";

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
  user_type?: string;
}

const userTypeOptions = [
  { value: "all", label: "Tutti i profili" },
  { value: "owner", label: "Titolari / Spa Manager" },
  { value: "professional", label: "Titolari (legacy)" },
  { value: "senior_esthetician", label: "Estetiste Senior" },
  { value: "esthetician", label: "Estetiste" },
  { value: "hairdresser", label: "Parrucchieri" },
  { value: "employee", label: "Dipendenti" },
  { value: "freelance", label: "Freelance" },
  { value: "student", label: "Studenti" },
];

export function ProfessionalNetwork() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, bio, skills, experience_years, location, website_url, cv_file_url, avatar_url, linkedin_url, instagram_url, user_type')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i profili",
        variant: "destructive",
      });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      profile.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUserType = selectedUserType === "all" || profile.user_type === selectedUserType;
    
    return matchesSearch && matchesUserType;
  });

  const getExperienceLevel = (years?: number) => {
    if (!years) return "Non specificato";
    if (years < 2) return "Junior";
    if (years < 5) return "Intermedio";
    if (years < 10) return "Senior";
    return "Expert";
  };

  const getExperienceColor = (years?: number) => {
    if (!years) return "bg-gray-500";
    if (years < 2) return "bg-green-500";
    if (years < 5) return "bg-blue-500";
    if (years < 10) return "bg-purple-500";
    return "bg-yellow-500";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra di ricerca e filtri */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cerca per nome, competenze..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <Select value={selectedUserType} onValueChange={setSelectedUserType}>
          <SelectTrigger className="w-full text-sm">
            <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
            <SelectValue placeholder="Filtra per tipo" />
          </SelectTrigger>
          <SelectContent>
            {userTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">{profiles.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Professionisti</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {profiles.filter(p => p.cv_file_url).length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">CV</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {new Set(profiles.flatMap(p => p.location).filter(Boolean)).size}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Città</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista profili */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Caricamento profili...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nessun profilo trovato</p>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <Avatar className="h-14 w-14 sm:h-20 sm:w-20">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-base sm:text-lg">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="font-semibold text-base sm:text-lg">{profile.display_name}</h3>
                    
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <UserTypeBadge userType={profile.user_type} size="sm" />
                      {profile.experience_years && (
                        <Badge 
                          className={`${getExperienceColor(profile.experience_years)} text-white text-xs`}
                        >
                          <Star className="h-3 w-3 mr-0.5" />
                          {getExperienceLevel(profile.experience_years)}
                        </Badge>
                      )}
                    </div>
                    
                    {profile.location && (
                      <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.location}
                      </div>
                    )}
                    
                    {profile.bio && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {profile.skills.slice(0, 2).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Social Links */}
                  <div className="flex space-x-1.5 sm:space-x-2">
                    {profile.linkedin_url && (
                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {profile.instagram_url && (
                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                        <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {profile.website_url && (
                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {profile.cv_file_url && (
                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                        <a href={profile.cv_file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                        Visualizza Profilo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Profilo di {profile.display_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-lg">
                              {profile.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{profile.display_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <UserTypeBadge userType={profile.user_type} />
                              {profile.experience_years && (
                                <Badge className={`${getExperienceColor(profile.experience_years)} text-white`}>
                                  {profile.experience_years} anni di esperienza
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {profile.bio && (
                          <div>
                            <h4 className="font-medium mb-2">Bio</h4>
                            <p className="text-sm text-muted-foreground">{profile.bio}</p>
                          </div>
                        )}
                        
                        {profile.skills && profile.skills.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Competenze</h4>
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
                          {profile.linkedin_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4 mr-2" />
                                LinkedIn
                              </a>
                            </Button>
                          )}
                          {profile.instagram_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer">
                                <Instagram className="h-4 w-4 mr-2" />
                                Instagram
                              </a>
                            </Button>
                          )}
                          {profile.website_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4 mr-2" />
                                Sito Web
                              </a>
                            </Button>
                          )}
                          {profile.cv_file_url && (
                            <Button size="sm" asChild>
                              <a href={profile.cv_file_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" />
                                Scarica CV
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}