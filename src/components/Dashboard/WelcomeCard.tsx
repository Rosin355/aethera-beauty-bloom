
const WelcomeCard = () => {
  const currentTime = new Date();
  const hour = currentTime.getHours();
  
  let greeting = "Good morning";
  if (hour >= 12 && hour < 18) {
    greeting = "Good afternoon";
  } else if (hour >= 18) {
    greeting = "Good evening";
  }

  return (
    <div className="bg-gradient-to-r from-brand-water to-brand-water/60 rounded-2xl p-6 md:p-8 shadow-sm text-white mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair">{greeting}, Jane!</h1>
          <p className="mt-2 text-white/90">
            Here's what's happening with your beauty business today.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Your account is active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
