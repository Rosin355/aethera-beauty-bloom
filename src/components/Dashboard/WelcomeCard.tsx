
interface WelcomeCardProps {
  displayName?: string;
}

const WelcomeCard = ({ displayName = "Ospite" }: WelcomeCardProps) => {
  const currentTime = new Date();
  const hour = currentTime.getHours();

  let greeting = "Buongiorno";
  if (hour >= 12 && hour < 18) {
    greeting = "Buon pomeriggio";
  } else if (hour >= 18) {
    greeting = "Buonasera";
  }

  const firstName = displayName.split(' ')[0];

  return (
    <div className="glass-card rounded-[28px] border border-white/10 p-6 md:p-8 text-white mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <p className="eyebrow mb-3">Panoramica</p>
          <h1 className="text-2xl md:text-3xl font-playfair">{greeting}, {firstName}!</h1>
          <p className="mt-2 text-muted-foreground">
            Ecco cosa succede oggi nel tuo business beauty.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex items-center bg-white/[.04] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
            <div className="w-2 h-2 bg-success rounded-full mr-2" aria-hidden="true"></div>
            <span className="text-sm font-medium text-white/80">Account attivo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
