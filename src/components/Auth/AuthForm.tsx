
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface AuthFormProps {
  type: "login" | "signup";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate authentication process
    setTimeout(() => {
      setLoading(false);
      if (type === "login") {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Your account has been successfully created.",
        });
      }
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-playfair">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-gray-600 mt-2">
          {type === "login"
            ? "Enter your credentials to access your account"
            : "Fill in your information to create an account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="border-gray-300"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="border-gray-300"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            {type === "login" && (
              <Link
                to="/forgot-password"
                className="text-sm text-brand-fire hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              type === "login" ? "Enter your password" : "Create a password"
            }
            required
            className="border-gray-300"
          />
        </div>

        {type === "signup" && (
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="terms" />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{" "}
              <Link to="/terms" className="text-brand-fire hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-brand-fire hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-brand-fire hover:bg-brand-fire/90 text-white mt-6"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {type === "login" ? "Logging in..." : "Creating account..."}
            </>
          ) : type === "login" ? (
            "Log In"
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          {type === "login" ? "Don't have an account?" : "Already have an account?"}
          <Link
            to={type === "login" ? "/signup" : "/login"}
            className="ml-1 text-brand-fire hover:underline font-medium"
          >
            {type === "login" ? "Sign up" : "Log in"}
          </Link>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full border-gray-300 hover:bg-gray-50 mb-3"
          type="button"
        >
          <svg
            className="w-5 h-5 mr-2"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
          Continue with Google
        </Button>

        <Button
          variant="outline"
          className="w-full border-gray-300 hover:bg-gray-50"
          type="button"
        >
          <svg
            className="w-5 h-5 mr-2"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19.154 11.605c-.309-2.917-3.037-4.971-6.035-4.971-2.336 0-4.385 1.272-5.418 3.154C5.289 10.123 3 12.661 3 15.693c0 3.321 2.657 6 5.928 6h9.144c2.746 0 4.928-2.232 4.928-5a5.005 5.005 0 0 0-3.846-5.088z" />
          </svg>
          Continue with Apple
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
