
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
import { Calendar as CalendarIcon, Clock, Plus, User, Scissors } from "lucide-react";
import { format } from "date-fns";
import {
  createAppointment,
  fetchAppointmentsByDate,
  fetchBusinessServices,
  type BusinessAppointment,
  type BusinessService,
} from "@/lib/api/management";
import { toast } from "sonner";

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
  const [newAppointment, setNewAppointment] = useState({
    clientName: "",
    serviceId: "",
    time: ""
  });

  useEffect(() => {
    const loadServices = async () => {
      try {
        const serviceList = await fetchBusinessServices();
        setServices(serviceList);
      } catch (error) {
        console.error("Error loading services for appointments:", error);
      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!date) return;
      try {
        setIsLoading(true);
        const items = await fetchAppointmentsByDate(date);
        setAppointments(items);
      } catch (error) {
        console.error("Error loading appointments:", error);
        toast.error("Errore nel caricamento appuntamenti");
      } finally {
        setIsLoading(false);
      }
    };
    loadAppointments();
  }, [date]);

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

  const handleAddAppointment = async () => {
    if (!date || !newAppointment.clientName || !newAppointment.serviceId || !newAppointment.time) {
      return;
    }
    const selectedService = services.find((s) => s.id === newAppointment.serviceId);
    if (!selectedService) return;

    const { hours, minutes } = parseTimeTo24h(newAppointment.time);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      const created = await createAppointment({
        client_name: newAppointment.clientName,
        service_id: selectedService.id,
        service_name: selectedService.name,
        appointment_at: appointmentDate.toISOString(),
        duration_minutes: selectedService.duration_minutes,
        price: Number(selectedService.price),
      });
      setAppointments((prev) => [...prev, created].sort((a, b) => a.appointment_at.localeCompare(b.appointment_at)));
      setIsAddingAppointment(false);
      setNewAppointment({
        clientName: "",
        serviceId: "",
        time: ""
      });
      toast.success("Appuntamento creato");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Impossibile creare appuntamento");
    }
  };

  const filteredAppointments = appointments;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <div className="mt-6">
            <Dialog open={isAddingAppointment} onOpenChange={setIsAddingAppointment}>
              <DialogTrigger asChild>
                <Button className="w-full bg-brand-water hover:bg-brand-water/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Appointment</DialogTitle>
                  <DialogDescription>
                    Create a new appointment for {date && format(date, "PPP")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clientName" className="text-right">
                      Client
                    </Label>
                    <div className="col-span-3 flex items-center border rounded-md">
                      <User className="ml-2 h-4 w-4 text-gray-400" />
                      <Input
                        id="clientName"
                        value={newAppointment.clientName}
                        onChange={(e) => setNewAppointment({ ...newAppointment, clientName: e.target.value })}
                        className="border-0"
                        placeholder="Enter client name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service" className="text-right">
                      Service
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newAppointment.serviceId}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, serviceId: value })}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Scissors className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select service" />
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
                      Time
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newAppointment.time}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, time: value })}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select time" />
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
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddAppointment}>
                    Save appointment
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
            Appointments for {date && format(date, "PPP")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-brand-water flex items-center justify-center text-white">
                      {appointment.client_name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">{appointment.client_name}</h4>
                      <p className="text-sm text-gray-500">{appointment.service_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{formatTimeFromDate(appointment.appointment_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {isLoading ? "Caricamento appuntamenti..." : "No appointments"}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                There are no appointments scheduled for this day.
              </p>
              <Button
                className="mt-6 bg-brand-water hover:bg-brand-water/90"
                onClick={() => setIsAddingAppointment(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentScheduler;
