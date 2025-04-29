
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section className="py-20 bg-brand-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-brand-fire opacity-10 transform rotate-12 translate-x-1/4 translate-y-1/4"></div>
        <div className="absolute inset-0 bg-brand-water opacity-10 transform -rotate-12 -translate-x-1/4 -translate-y-1/4"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-10 md:p-16 border border-white/10 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold font-playfair text-white leading-tight">
                Ready to Transform Your Beauty Business?
              </h2>
              <p className="mt-4 text-xl text-gray-300">
                Join thousands of beauticians who are elevating their skills and growing their business with Aethera.
              </p>
              <ul className="mt-6 space-y-2">
                {['Free 14-day trial', 'No credit card required', 'Cancel anytime'].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-brand-fire mr-2"
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col space-y-4 animate-slide-up">
              <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-2">Get Started Today</h3>
                <p className="text-gray-300 mb-4">
                  Create your account now and start exploring all the features Aethera has to offer.
                </p>
                <Link to="/signup">
                  <Button className="w-full bg-brand-fire hover:bg-brand-fire/90 text-white">
                    Sign Up For Free
                  </Button>
                </Link>
              </div>
              <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-2">Need More Information?</h3>
                <p className="text-gray-300 mb-4">
                  Schedule a free demo with our team to see how Aethera can help your business.
                </p>
                <Link to="/demo">
                  <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-brand-black">
                    Request a Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
