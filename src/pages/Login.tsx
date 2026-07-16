
import AuthForm from "@/components/Auth/AuthForm";
import Logo from "@/components/Layout/Logo";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="page-glow" aria-hidden="true" />
      <div className="p-4 relative z-[1]">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative z-[1]">
        <AuthForm type="login" />
      </div>
    </div>
  );
};

export default Login;
