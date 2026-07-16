
import { ReactNode } from "react";
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-ice/30 hover:shadow-[0_0_40px_rgba(191,238,255,0.06)]">
      <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10">
        {icon}
      </div>
      <h3 className="text-lg font-bold font-playfair mb-2 text-white">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link
        to={linkPath}
        className="link-quiet inline-flex items-center text-sm font-medium"
      >
        {linkText}
        <ArrowRight size={16} className="ml-1" aria-hidden="true" />
      </Link>
    </div>
  );
};

export default FeaturePreview;
