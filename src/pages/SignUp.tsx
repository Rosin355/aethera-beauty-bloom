
import AuthForm from "@/components/Auth/AuthForm";
import Logo from "@/components/Layout/Logo";

const SignUp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream to-white flex flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <AuthForm type="signup" />
      </div>
    </div>
  );
};

export default SignUp;
