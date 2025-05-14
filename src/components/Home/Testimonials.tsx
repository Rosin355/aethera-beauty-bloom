
const testimonials = [
  {
    quote: "4 elementi Italia ha completamente trasformato il modo in cui gestisco il mio centro estetico. Gli strumenti di gestione mi fanno risparmiare ore ogni settimana, e la comunità professionale mi ha messo in contatto con mentori straordinari.",
    name: "Sofia Loren",
    title: "Titolare di Centro Estetico",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    delay: "0"
  },
  {
    quote: "L'assistente AI offre consigli personalizzati che mi hanno aiutato a ottimizzare le operazioni del mio business. Le risorse di formazione sono di prima qualità e sempre aggiornate.",
    name: "Marco Rossi",
    title: "Specialista Skincare",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    delay: "100"
  },
  {
    quote: "Ho aumentato la mia clientela del 40% da quando uso gli strumenti analitici di 4 elementi Italia. Le intuizioni mi hanno aiutato a personalizzare i miei servizi in base a ciò che i miei clienti desiderano realmente.",
    name: "Elena Chen",
    title: "Estetista Freelance",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    delay: "200"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-brand-cream relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-water/10 rounded-full transform translate-x-1/2 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-fire/10 rounded-full transform -translate-x-1/3 translate-y-1/3"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-brand-black">Cosa Dice la Nostra Comunità</h2>
          <div className="w-24 h-1 bg-brand-fire mx-auto mt-4 mb-6"></div>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Unisciti a migliaia di professionisti della bellezza che stanno facendo crescere le loro attività con 4 elementi Italia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${testimonial.delay}ms` }}
            >
              <div className="flex flex-col h-full">
                <div className="flex-grow">
                  <div className="flex justify-center mb-6">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-brand-cream"
                    />
                  </div>
                  <p className="text-gray-700 italic text-center">"{testimonial.quote}"</p>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.title}</p>
                  <div className="mt-3 flex justify-center">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
