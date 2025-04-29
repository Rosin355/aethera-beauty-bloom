
import { 
  BookOpen, 
  Calendar, 
  Users, 
  MessageSquare, 
  ChartPie 
} from "lucide-react";

const features = [
  {
    title: "Continuous Learning",
    description: "Access video courses, downloadable materials, and earn automatic certificates to enhance your professional skills.",
    icon: BookOpen,
    color: "bg-brand-water",
    delay: "0"
  },
  {
    title: "Management Tools",
    description: "Organize your business with digital calendars, inventory management, and comprehensive analytics dashboards.",
    icon: Calendar,
    color: "bg-brand-fire",
    delay: "100"
  },
  {
    title: "Professional Community",
    description: "Connect with fellow beauticians through forums, share testimonials, and participate in live events.",
    icon: Users,
    color: "bg-brand-air",
    delay: "200"
  },
  {
    title: "AI Driven Support",
    description: "Receive tailored tips on business and treatment management through our intelligent AI Chat Assistant.",
    icon: MessageSquare,
    color: "bg-brand-earth",
    delay: "300"
  },
  {
    title: "Analytics Dashboard",
    description: "Track KPIs, sales, margins, and monthly performance with beautiful, easy-to-understand visualizations.",
    icon: ChartPie,
    color: "bg-brand-black",
    delay: "400"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair">Comprehensive Features for Beauticians</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to grow your beauty business, enhance your skills, and connect with your community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group animate-slide-up"
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              <div className={`${feature.color} w-14 h-14 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold font-playfair mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
