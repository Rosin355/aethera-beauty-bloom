import { useState, useEffect, useCallback } from "react";
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
import { Plus, MapPin, Building, Clock, Euro, Briefcase, Search } from "lucide-react";
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

  const fetchJobs = useCallback(async () => {
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
      setJobs(((data || []) as unknown) as JobPosting[]);
    }
    setLoading(false);
  }, [selectedJobType, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
        is_approved: false
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
      if (error.code === '23505') {
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
      fetchJobs();
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header con filtri e bottone nuovo annuncio */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cerca lavoro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
          </div>
          <Select value={selectedJobType} onValueChange={setSelectedJobType}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 text-sm">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
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
            <Button className="w-full sm:w-auto sm:self-end">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Pubblica Annuncio</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg sm:text-xl">Pubblica Nuovo Annuncio</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm">Titolo Posizione *</Label>
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="es. Estetista Senior"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-sm">Azienda *</Label>
                  <Input
                    id="company"
                    value={newJob.company_name}
                    onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                    placeholder="Nome dell'azienda"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-sm">Località</Label>
                  <Input
                    id="location"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="Milano"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salary" className="text-sm">Retribuzione</Label>
                  <Input
                    id="salary"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                    placeholder="€25k-35k"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="job_type" className="text-sm">Tipo di Lavoro *</Label>
                <Select value={newJob.job_type} onValueChange={(value) => setNewJob({ ...newJob, job_type: value })}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Seleziona tipo" />
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

              <div className="space-y-1.5">
                <Label className="text-sm">Competenze Richieste</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Aggiungi competenza"
                    className="h-10 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline" size="sm" className="h-10 px-3">
                    +
                  </Button>
                </div>
                {newJob.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {newJob.required_skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer text-xs py-0.5" onClick={() => removeSkill(skill)}>
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Descrivi la posizione..."
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>

              <Button onClick={createJob} className="w-full h-10">
                Pubblica Annuncio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiche - Layout compatto mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">{jobs.length}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Annunci</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {jobs.filter(j => j.job_type === 'full-time').length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Full-time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {jobs.filter(j => j.job_type === 'freelance').length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Freelance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {new Set(jobs.map(j => j.location).filter(Boolean)).size}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Città</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista annunci - Layout ottimizzato mobile */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Caricamento annunci...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Nessun annuncio trovato</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
                <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                      <CardTitle className="text-base sm:text-xl truncate">{job.title}</CardTitle>
                      <Badge className={`${getJobTypeColor(job.job_type)} text-white text-xs`}>
                        {getJobTypeLabel(job.job_type)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{job.company_name}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{job.location}</span>
                        </div>
                      )}
                      {job.salary_range && (
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>{formatDistanceToNow(new Date(job.created_at), { 
                          addSuffix: true, 
                          locale: it 
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => applyToJob(job.id)} 
                    size="sm" 
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    <Briefcase className="h-4 w-4 mr-1.5" />
                    Candidati
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2 sm:line-clamp-3">{job.description}</p>
                
                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="font-medium text-xs sm:text-sm">Competenze:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs py-0">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 5 && (
                        <Badge variant="outline" className="text-xs py-0">
                          +{job.required_skills.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs sm:text-sm text-muted-foreground">
                  <span>{job.applications_count} candidature</span>
                  <span className="truncate max-w-[150px]">di {job.profiles?.display_name || 'Utente'}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
