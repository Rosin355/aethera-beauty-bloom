
const testimonials = [
  {
    quote: "4 elementi Italia ha completamente trasformato il modo in cui gestisco il mio centro estetico. Gli strumenti di gestione mi fanno risparmiare ore ogni settimana.",
    name: "Sofia Loren",
    title: "Titolare di Centro Estetico",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    quote: "L'assistente AI offre consigli personalizzati che mi hanno aiutato a ottimizzare le operazioni del mio business. Le risorse di formazione sono di prima qualità.",
    name: "Marco Rossi",
    title: "Specialista Skincare",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    gradient: "from-blue-500 to-purple-500"
  },
  {
    quote: "Ho aumentato la mia clientela del 40% da quando uso gli strumenti analitici di 4 elementi Italia. Le intuizioni mi hanno aiutato a personalizzare i miei servizi.",
    name: "Elena Chen",
    title: "Estetista Freelance",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    gradient: "from-pink-500 to-red-500"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 relative">
      {/* Background with subtle floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/3 rounded-full blur-3xl animate-float delay-500"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair text-white">Cosa Dicono di Noi</h2>
          <div className="w-16 h-1 bg-white mx-auto mt-4 mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="glass card-hover p-8 flex flex-col h-full rounded-2xl relative overflow-hidden group border border-white/10 hover:border-white/20"
            >
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Quote */}
              <p className="text-gray-300 mb-8 flex-grow relative z-10 group-hover:text-white transition-colors">
                "{testimonial.quote}"
              </p>
              
              {/* Author */}
              <div className="flex items-center relative z-10">
                <div className="relative">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20 grayscale group-hover:grayscale-0"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-lg text-white group-hover:text-gray-100 transition-colors">{testimonial.name}</h4>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
