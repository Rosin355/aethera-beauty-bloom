
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface FeaturePreviewProps {
  title: string;
  description: string;
  icon: ReactNode;
  linkText: string;
  linkPath: string;
  color: string;
}

const FeaturePreview = ({
  title,
  description,
  icon,
  linkText,
  linkPath,
  color,
}: FeaturePreviewProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold font-playfair mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link to={linkPath}>
        <Button variant="ghost" className="p-0 hover:bg-transparent text-brand-fire">
          {linkText}
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </Link>
    </div>
  );
};

export default FeaturePreview;
