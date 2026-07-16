import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { useCenter } from "@/contexts/CenterContext";
import {
  fetchCenterMembers,
  inviteCenterMember,
  removeCenterMember,
  type CenterMemberRow,
  type CenterRole,
} from "@/lib/api/centers";

const roleLabels: Record<CenterRole, string> = {
  owner: "Titolare",
  operator: "Operatrice",
  receptionist: "Reception",
};

const CenterMembersCard = () => {
  const { centerId, role } = useCenter();
  const [members, setMembers] = useState<CenterMemberRow[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<CenterRole, "owner">>("operator");
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (id: string) => {
    try {
      setIsLoading(true);
      setMembers(await fetchCenterMembers(id));
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Errore nel caricamento del team");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (centerId) load(centerId);
  }, [centerId]);

  // Owner-only screen.
  if (role !== "owner") return null;

  const handleInvite = async () => {
    if (!centerId || !email.trim()) return;
    try {
      setIsInviting(true);
      await inviteCenterMember(centerId, email, inviteRole);
      toast.success("Invito inviato");
      setEmail("");
      await load(centerId);
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Impossibile inviare l'invito");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!centerId) return;
    try {
      await removeCenterMember(id);
      await load(centerId);
      toast.success("Membro rimosso");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Impossibile rimuovere il membro");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team del centro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            placeholder="email@collaboratrice.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email della collaboratrice"
          />
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Exclude<CenterRole, "owner">)}>
            <SelectTrigger className="sm:w-48" aria-label="Ruolo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operator">{roleLabels.operator}</SelectItem>
              <SelectItem value="receptionist">{roleLabels.receptionist}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={isInviting || !email.trim()} className="shrink-0">
            <UserPlus className="h-4 w-4" />
            Invita
          </Button>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Caricamento…</p>
          ) : members.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nessun membro ancora.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {member.invited_email ?? "Membro attivo"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge>{roleLabels[member.role]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {member.status === "invited" ? "Invitato" : "Attivo"}
                    </span>
                  </div>
                </div>
                {member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Rimuovi membro"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CenterMembersCard;
