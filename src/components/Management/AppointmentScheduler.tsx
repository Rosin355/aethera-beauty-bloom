
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, Clock, Plus, User, Scissors, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointmentsByDate,
  fetchBusinessServices,
  updateAppointment,
  type AppointmentStatus,
  type BusinessAppointment,
  type BusinessService,
} from "@/lib/api/management";
import { useCenter } from "@/contexts/CenterContext";
import { toast } from "sonner";

const STATUS_META: Record<AppointmentStatus, { label: string; className: string }> = {
  confermato: { label: "Confermato", className: "bg-blue-100 text-blue-700" },
  in_attesa: { label: "In attesa", className: "bg-amber-100 text-amber-700" },
  completato: { label: "Completato", className: "bg-green-100 text-green-700" },
  annullato: { label: "Annullato", className: "bg-red-100 text-red-600" },
};
const STATUS_ORDER: AppointmentStatus[] = ["in_attesa", "confermato", "completato", "annullato"];

const parseTimeTo24h = (time: string): { hours: number; minutes: number } => {
  const [clock, period] = time.split(" ");
  const [hourStr, minuteStr] = clock.split(":");
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

const formatTimeFromDate = (iso: string): string => {
  return format(new Date(iso), "h:mm a");
};

const AppointmentScheduler = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [services, setServices] = useState<BusinessService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    clientName: "",
    serviceId: "",
    time: "",
    notes: "",
    status: "in_attesa" as AppointmentStatus,
  });

  const { centerId, role } = useCenter();
  const isOwner = role === "owner";

  useEffect(() => {
    if (!centerId) return;
    const loadServices = async () => {
      try {
        const serviceList = await fetchBusinessServices(centerId);
        setServices(serviceList);
      } catch (error) {
        console.error("Error loading services for appointments:", error);
      }
    };
    loadServices();
  }, [centerId]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!date || !centerId) return;
      try {
        setIsLoading(true);
        const items = await fetchAppointmentsByDate(centerId, date);
        setAppointments(items);
      } catch (error) {
        console.error("Error loading appointments:", error);
        toast.error("Errore nel caricamento appuntamenti");
      } finally {
        setIsLoading(false);
      }
    };
    loadAppointments();
  }, [date, centerId]);

  const timeSlots = [
    "9:00 AM", "9:30 AM",
    "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM",
    "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM",
    "5:00 PM", "5:30 PM"
  ];

  const closeDialog = () => {
    setIsAddingAppointment(false);
    setEditingId(null);
    setNewAppointment({ clientName: "", serviceId: "", time: "", notes: "", status: "in_attesa" });
  };

  const openEdit = (appointment: BusinessAppointment) => {
    setEditingId(appointment.id);
    setDate(new Date(appointment.appointment_at));
    setNewAppointment({
      clientName: appointment.client_name,
      serviceId: appointment.service_id ?? "",
      time: formatTimeFromDate(appointment.appointment_at),
      notes: appointment.notes ?? "",
      status: (appointment.status as AppointmentStatus) ?? "in_attesa",
    });
    setIsAddingAppointment(true);
  };

  const handleSaveAppointment = async () => {
    if (!date || !centerId || !newAppointment.clientName || !newAppointment.serviceId || !newAppointment.time) {
      return;
    }
    const selectedService = services.find((s) => s.id === newAppointment.serviceId);
    if (!selectedService) return;

    const { hours, minutes } = parseTimeTo24h(newAppointment.time);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      if (editingId) {
        const updated = await updateAppointment(centerId, editingId, {
          client_name: newAppointment.clientName,
          service_id: selectedService.id,
          service_name: selectedService.name,
          appointment_at: appointmentDate.toISOString(),
          duration_minutes: selectedService.duration_minutes,
          price: Number(selectedService.price),
          notes: newAppointment.notes || null,
          status: newAppointment.status,
        });
        setAppointments((prev) =>
          prev.map((a) => (a.id === editingId ? updated : a)).sort((a, b) => a.appointment_at.localeCompare(b.appointment_at)),
        );
        toast.success("Appuntamento aggiornato");
      } else {
        const created = await createAppointment(centerId, {
          client_name: newAppointment.clientName,
          service_id: selectedService.id,
          service_name: selectedService.name,
          appointment_at: appointmentDate.toISOString(),
          duration_minutes: selectedService.duration_minutes,
          price: Number(selectedService.price),
        });
        setAppointments((prev) => [...prev, created].sort((a, b) => a.appointment_at.localeCompare(b.appointment_at)));
        toast.success("Appuntamento creato");
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("Impossibile salvare l'appuntamento");
    }
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    if (!centerId) return;
    try {
      const updated = await updateAppointment(centerId, id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Impossibile aggiornare lo stato");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!centerId) return;
    try {
      await deleteAppointment(centerId, id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Appuntamento eliminato");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Impossibile eliminare l'appuntamento (solo il titolare può eliminare)");
    }
  };

  const filteredAppointments = appointments;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <div className="mt-6">
            <Dialog open={isAddingAppointment} onOpenChange={(open) => (open ? setIsAddingAppointment(true) : closeDialog())}>
              <DialogTrigger asChild>
                <Button className="w-full bg-brand-water hover:bg-brand-water/90">
                  <Plus className="mr-2 h-4 w-4" /> Nuovo appuntamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifica appuntamento" : "Nuovo appuntamento"}</DialogTitle>
                  <DialogDescription>
                    {date && format(date, "PPP")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clientName" className="text-right">
                      Cliente
                    </Label>
                    <div className="col-span-3 flex items-center border rounded-md">
                      <User className="ml-2 h-4 w-4 text-gray-400" />
                      <Input
                        id="clientName"
                        value={newAppointment.clientName}
                        onChange={(e) => setNewAppointment({ ...newAppointment, clientName: e.target.value })}
                        className="border-0"
                        placeholder="Nome cliente"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service" className="text-right">
                      Servizio
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newAppointment.serviceId}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, serviceId: value })}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Scissors className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Seleziona servizio" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right">
                      Orario
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newAppointment.time}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, time: value })}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Seleziona orario" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {editingId && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                          Stato
                        </Label>
                        <div className="col-span-3">
                          <Select
                            value={newAppointment.status}
                            onValueChange={(value) => setNewAppointment({ ...newAppointment, status: value as AppointmentStatus })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ORDER.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_META[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right pt-2">
                          Note
                        </Label>
                        <Textarea
                          id="notes"
                          className="col-span-3"
                          rows={3}
                          value={newAppointment.notes}
                          onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                          placeholder="Note interne sull'appuntamento"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleSaveAppointment}>
                    {editingId ? "Salva" : "Crea appuntamento"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium">
            Appuntamenti del {date && format(date, "PPP")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const status = (appointment.status as AppointmentStatus) ?? "in_attesa";
                const meta = STATUS_META[status] ?? STATUS_META.in_attesa;
                return (
                  <div
                    key={appointment.id}
                    className={`flex flex-wrap justify-between items-center gap-3 p-4 border rounded-lg transition-colors ${
                      status === "annullato" ? "opacity-60 border-dashed" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-brand-water flex items-center justify-center text-white">
                        {appointment.client_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className={`font-medium ${status === "annullato" ? "line-through" : ""}`}>
                          {appointment.client_name}
                        </h4>
                        <p className="text-sm text-gray-500">{appointment.service_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={meta.className}>{meta.label}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        {formatTimeFromDate(appointment.appointment_at)}
                      </div>
                      <Select value={status} onValueChange={(v) => handleStatusChange(appointment.id, v as AppointmentStatus)}>
                        <SelectTrigger className="h-8 w-[130px]" aria-label="Cambia stato">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_META[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Modifica appuntamento"
                        onClick={() => openEdit(appointment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isOwner && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Elimina appuntamento">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare l'appuntamento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                L'azione non è reversibile. Per conservare lo storico, imposta lo stato su "Annullato".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAppointment(appointment.id)}>
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {isLoading ? "Caricamento appuntamenti..." : "Nessun appuntamento"}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Non ci sono appuntamenti per questo giorno.
              </p>
              <Button
                className="mt-6 bg-brand-water hover:bg-brand-water/90"
                onClick={() => setIsAddingAppointment(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuovo appuntamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentScheduler;
