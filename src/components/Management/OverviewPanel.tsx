
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartPie, TrendingUp, Calendar, ShoppingBag } from "lucide-react";

const OverviewPanel = () => {
  // Sample data for the charts
  const bookingData = [
    { name: "Mon", bookings: 4 },
    { name: "Tue", bookings: 3 },
    { name: "Wed", bookings: 5 },
    { name: "Thu", bookings: 2 },
    { name: "Fri", bookings: 7 },
    { name: "Sat", bookings: 9 },
    { name: "Sun", bookings: 2 },
  ];

  const productUsageData = [
    { name: "Skincare", value: 35 },
    { name: "Haircare", value: 25 },
    { name: "Massage", value: 20 },
    { name: "Makeup", value: 15 },
    { name: "Other", value: 5 },
  ];

  const topServices = [
    { name: "Classic Facial", count: 28, revenue: 2100 },
    { name: "Swedish Massage", count: 22, revenue: 1870 },
    { name: "Haircut & Style", count: 19, revenue: 1045 },
    { name: "Gel Manicure", count: 15, revenue: 525 },
  ];

  const COLORS = ["#6AA8B3", "#E46A39", "#C2977E", "#CBD8D4", "#1B1B1B"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">128</div>
              <div className="text-xs text-green-500 font-semibold flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs. last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <ChartPie className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">€8,250</div>
              <div className="text-xs text-green-500 font-semibold flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs. last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">42</div>
              <div className="text-xs text-green-500 font-semibold flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs. last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Avg. Service Value</CardTitle>
            <ChartPie className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">€64.45</div>
              <div className="text-xs text-green-500 font-semibold flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3%
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs. last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Weekly Bookings</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bookingData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#6AA8B3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Product Usage by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Top Performing Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {topServices.map((service, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{service.name}</h3>
                    <Badge variant="outline" className="bg-brand-cream text-brand-black">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bookings:</span>
                      <span className="font-medium">{service.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Revenue:</span>
                      <span className="font-medium">€{service.revenue}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">% of total revenue</span>
                      <span className="text-brand-fire font-semibold">{Math.round((service.revenue / 8250) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewPanel;
