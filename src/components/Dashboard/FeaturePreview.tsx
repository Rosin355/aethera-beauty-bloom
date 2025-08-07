
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
}

const FeaturePreview = ({
  title,
  description,
  icon,
  linkText,
  linkPath,
}: FeaturePreviewProps) => {
  return (
    <div className="glass rounded-xl p-6 transition-all hover:shadow-md border border-neutral-800">
      <div className="bg-neutral-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4 border border-neutral-700">
        {icon}
      </div>
      <h3 className="text-lg font-bold font-playfair mb-2 text-white">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link to={linkPath}>
        <Button variant="ghost" className="p-0 hover:bg-transparent text-neutral-300 hover:text-white">
          {linkText}
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </Link>
    </div>
  );
};

export default FeaturePreview;
