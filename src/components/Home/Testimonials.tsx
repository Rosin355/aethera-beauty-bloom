
const testimonials = [
  {
    quote: "4 elementi Italia ha completamente trasformato il modo in cui gestisco il mio centro estetico. Gli strumenti di gestione mi fanno risparmiare ore ogni settimana.",
    name: "Sofia Loren",
    title: "Titolare di Centro Estetico",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
  },
  {
    quote: "L'assistente AI offre consigli personalizzati che mi hanno aiutato a ottimizzare le operazioni del mio business. Le risorse di formazione sono di prima qualità.",
    name: "Marco Rossi",
    title: "Specialista Skincare",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
  },
  {
    quote: "Ho aumentato la mia clientela del 40% da quando uso gli strumenti analitici di 4 elementi Italia. Le intuizioni mi hanno aiutato a personalizzare i miei servizi.",
    name: "Elena Chen",
    title: "Estetista Freelance",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair text-brand-black">Cosa Dicono di Noi</h2>
          <div className="w-16 h-1 bg-brand-fire mx-auto mt-4 mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white p-8 flex flex-col h-full"
            >
              <p className="text-gray-700 mb-8 flex-grow">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.title}</p>
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
