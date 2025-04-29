
const testimonials = [
  {
    quote: "Aethera has completely transformed how I manage my beauty salon. The management tools save me hours each week, and the professional community has connected me with amazing mentors.",
    name: "Sofia Loren",
    title: "Beauty Salon Owner",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    delay: "0"
  },
  {
    quote: "The AI chat assistant offers personalized advice that has helped me optimize my business operations. The training resources are top-notch and always up-to-date.",
    name: "Marco Rossi",
    title: "Skincare Specialist",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    delay: "100"
  },
  {
    quote: "I've grown my client base by 40% since using Aethera's analytics tools. The insights have helped me tailor my services to what my clients really want.",
    name: "Elena Chen",
    title: "Freelance Beautician",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    delay: "200"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair">What Our Community Says</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of beauticians who are growing their businesses with Aethera.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-8 shadow-md animate-slide-up"
              style={{ animationDelay: `${testimonial.delay}ms` }}
            >
              <div className="flex items-center mb-6">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-14 h-14 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.title}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              <div className="mt-6 flex">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-brand-fire" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" 
                    />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
