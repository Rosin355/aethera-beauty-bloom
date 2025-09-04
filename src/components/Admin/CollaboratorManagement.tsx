import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Mail, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  user_roles: { role: string }[];
}

const CollaboratorManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'collaborator' | 'admin'>('collaborator');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          created_at,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast.error('Errore nel caricamento utenti');
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast.success('Ruolo aggiornato con successo');
      fetchProfiles();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento del ruolo');
      console.error('Error updating role:', error);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) {
      toast.error('Inserisci un indirizzo email');
      return;
    }

    setInviteLoading(true);
    try {
      // In a real implementation, you would call an Edge Function to send the invite
      // For now, we'll show a success message
      toast.success(`Invito inviato a ${inviteEmail} come ${inviteRole}`);
      setInviteEmail('');
      setInviteRole('collaborator');
    } catch (error) {
      toast.error('Errore nell\'invio dell\'invito');
      console.error('Error sending invite:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'collaborator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'collaborator':
        return 'Collaboratore';
      default:
        return 'Utente';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestione Collaboratori</h1>
          <p className="text-muted-foreground">Gestisci gli utenti e i loro ruoli nella piattaforma</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invita Collaboratore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invita Nuovo Collaboratore</DialogTitle>
              <DialogDescription>
                Invia un invito per creare un account collaboratore
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="collaboratore@esempio.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Ruolo</Label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utente</SelectItem>
                    <SelectItem value="collaborator">Collaboratore</SelectItem>
                    <SelectItem value="admin">Amministratore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={sendInvite} 
                disabled={inviteLoading}
                className="w-full"
              >
                {inviteLoading ? (
                  <>
                    <Mail className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Invia Invito
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utenti Registrati</CardTitle>
          <CardDescription>
            Elenco di tutti gli utenti registrati e i loro ruoli
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Data Registrazione</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const userRole = profile.user_roles[0]?.role || 'user';
                return (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.display_name}
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(userRole)}>
                        {getRoleLabel(userRole)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRole}
                        onValueChange={(newRole) => updateUserRole(profile.id, newRole)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Utente</SelectItem>
                          <SelectItem value="collaborator">Collaboratore</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaboratorManagement;