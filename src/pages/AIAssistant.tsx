import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { ChatAssistant } from "@/components/AI/ChatAssistant";

const AIAssistant = () => {
  return (
    <>
      <Helmet>
        <title>Assistente AI</title>
        <meta name="description" content="Assistente AI personalizzato per supportare la tua attività nel settore beauty" />
      </Helmet>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-playfair">
              Assistente AI
            </h1>
            <p className="text-muted-foreground mt-2">
              Il tuo consulente personale per supportare la gestione e crescita della tua attività
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden h-[calc(100vh-250px)] min-h-[500px]">
            <ChatAssistant embedded />
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default AIAssistant;
