
import AuthForm from "@/components/Auth/AuthForm";
import { Link } from "react-router-dom";

const SignUp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream to-white flex flex-col">
      <div className="p-4">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-bold font-playfair text-brand-black">
            Aethera<span className="text-brand-fire">.</span>
          </h1>
        </Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <AuthForm type="signup" />
      </div>
    </div>
  );
};

export default SignUp;
