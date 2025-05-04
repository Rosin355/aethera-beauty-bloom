
import { useState } from "react";
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

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: Date;
  time: string;
}

const AppointmentScheduler = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      clientName: "Emma Thompson",
      service: "Facial Treatment",
      date: new Date(),
      time: "10:00 AM"
    },
    {
      id: "2",
      clientName: "Michael Johnson",
      service: "Haircut & Styling",
      date: new Date(),
      time: "2:30 PM"
    }
  ]);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    clientName: "",
    service: "",
    date: new Date(),
    time: ""
  });

  const services = [
    "Facial Treatment",
    "Haircut & Styling",
    "Manicure",
    "Pedicure",
    "Massage",
    "Waxing",
    "Makeup"
  ];

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

  const handleAddAppointment = () => {
    if (!newAppointment.clientName || !newAppointment.service || !newAppointment.time) {
      return;
    }
    
    const appointment = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: newAppointment.clientName,
      service: newAppointment.service,
      date: date || new Date(),
      time: newAppointment.time
    };
    
    setAppointments([...appointments, appointment]);
    setIsAddingAppointment(false);
    setNewAppointment({
      clientName: "",
      service: "",
      time: ""
    });
  };

  const filteredAppointments = appointments.filter(
    (appointment) => 
      date && 
      appointment.date.getDate() === date.getDate() &&
      appointment.date.getMonth() === date.getMonth() &&
      appointment.date.getFullYear() === date.getFullYear()
  );

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
                        value={newAppointment.service}
                        onValueChange={(value) => setNewAppointment({ ...newAppointment, service: value })}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Scissors className="mr-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Select service" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
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
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-brand-water flex items-center justify-center text-white">
                      {appointment.clientName.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">{appointment.clientName}</h4>
                      <p className="text-sm text-gray-500">{appointment.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{appointment.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No appointments</h3>
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
