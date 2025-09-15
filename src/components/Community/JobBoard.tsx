import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Building, Clock, Euro, Briefcase, Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  company_name: string;
  location?: string;
  salary_range?: string;
  job_type: string;
  required_skills?: string[];
  is_active: boolean;
  applications_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  } | null;
}

const jobTypes = [
  { value: 'full-time', label: 'Tempo Pieno' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Stage' }
];

export function JobBoard() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    company_name: "",
    location: "",
    salary_range: "",
    job_type: "",
    required_skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, [selectedJobType]);

  const fetchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('job_postings')
      .select(`
        *,
        profiles (display_name, avatar_url)
      `)
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (selectedJobType !== "all") {
      query = query.eq('job_type', selectedJobType);
    }

    const { data, error } = await query;
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le offerte di lavoro",
        variant: "destructive",
      });
    } else {
      setJobs((data as any) || []);
    }
    setLoading(false);
  };

  const createJob = async () => {
    if (!newJob.title || !newJob.description || !newJob.company_name || !newJob.job_type) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi richiesti",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per pubblicare un annuncio",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('job_postings')
      .insert({
        ...newJob,
        posted_by: user.id,
        is_approved: false // Moderazione manuale
      });

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile creare l'annuncio",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Annuncio creato",
        description: "Il tuo annuncio è in attesa di approvazione",
      });
      setNewJob({
        title: "",
        description: "",
        company_name: "",
        location: "",
        salary_range: "",
        job_type: "",
        required_skills: [],
      });
      setIsCreateDialogOpen(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !newJob.required_skills.includes(skillInput.trim())) {
      setNewJob({
        ...newJob,
        required_skills: [...newJob.required_skills, skillInput.trim()]
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setNewJob({
      ...newJob,
      required_skills: newJob.required_skills.filter(skill => skill !== skillToRemove)
    });
  };

  const applyToJob = async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per candidarti",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_id: user.id,
      });

    if (error) {
      if (error.code === '23505') { // Duplicate key violation
        toast({
          title: "Info",
          description: "Ti sei già candidato per questa posizione",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile inviare la candidatura",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Candidatura inviata",
        description: "La tua candidatura è stata inviata con successo",
      });
      fetchJobs(); // Ricarica per aggiornare i contatori
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.required_skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getJobTypeLabel = (type: string) => {
    return jobTypes.find(jt => jt.value === type)?.label || type;
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-500';
      case 'part-time': return 'bg-blue-500';
      case 'freelance': return 'bg-purple-500';
      case 'internship': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtri e bottone nuovo annuncio */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca lavoro, azienda, competenze..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedJobType} onValueChange={setSelectedJobType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipo di lavoro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              {jobTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Pubblica Annuncio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pubblica Nuovo Annuncio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo Posizione *</Label>
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="es. Estetista Senior"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Azienda *</Label>
                  <Input
                    id="company"
                    value={newJob.company_name}
                    onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                    placeholder="Nome dell'azienda"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Località</Label>
                  <Input
                    id="location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="es. Milano, Italia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Retribuzione</Label>
                  <Input
                    id="salary"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                    placeholder="es. €25.000 - €35.000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_type">Tipo di Lavoro *</Label>
                <Select value={newJob.job_type} onValueChange={(value) => setNewJob({ ...newJob, job_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo di lavoro" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Competenze Richieste</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Aggiungi competenza"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Aggiungi
                  </Button>
                </div>
                {newJob.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newJob.required_skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Descrivi la posizione, le responsabilità e i requisiti..."
                  rows={6}
                />
              </div>

              <Button onClick={createJob} className="w-full">
                Pubblica Annuncio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{jobs.length}</div>
            <div className="text-sm text-muted-foreground">Annunci Attivi</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {jobs.filter(j => j.job_type === 'full-time').length}
            </div>
            <div className="text-sm text-muted-foreground">Tempo Pieno</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {jobs.filter(j => j.job_type === 'freelance').length}
            </div>
            <div className="text-sm text-muted-foreground">Freelance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {new Set(jobs.map(j => j.location).filter(Boolean)).size}
            </div>
            <div className="text-sm text-muted-foreground">Città</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista annunci */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Caricamento annunci...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nessun annuncio trovato</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <Badge className={`${getJobTypeColor(job.job_type)} text-white`}>
                        {getJobTypeLabel(job.job_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {job.company_name}
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                      )}
                      {job.salary_range && (
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {job.salary_range}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(job.created_at), { 
                          addSuffix: true, 
                          locale: it 
                        })}
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => applyToJob(job.id)}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Candidati
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 line-clamp-3">{job.description}</p>
                
                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Competenze richieste:</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>{job.applications_count} candidature</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pubblicato da {job.profiles?.display_name || 'Utente'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}