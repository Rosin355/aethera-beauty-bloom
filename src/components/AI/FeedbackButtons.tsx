import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackButtonsProps {
  userId: string | null;
  conversationId: string | null;
  messageIndex: number;
}

export function FeedbackButtons({ userId, conversationId, messageIndex }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (rating: 'positive' | 'negative') => {
    if (!userId || isSubmitting || submitted) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          message_index: messageIndex,
          rating,
        });

      if (error) throw error;
      
      setSubmitted(rating);
      toast.success(rating === 'positive' ? 'Grazie per il feedback positivo!' : 'Grazie, miglioreremo!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Errore nell\'invio del feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) return null;

  // Visibili anche a riposo: bordo e sfondo leggeri, mai hover-only.
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Risposta utile"
        className={cn(
          "h-6 w-6 rounded-full border border-white/15 bg-white/[.04] text-white/60 hover:text-ice hover:border-ice/40",
          submitted === 'positive' && "bg-success/15 text-success border-success/40"
        )}
        onClick={() => submitFeedback('positive')}
        disabled={isSubmitting || !!submitted}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Risposta non utile"
        className={cn(
          "h-6 w-6 rounded-full border border-white/15 bg-white/[.04] text-white/60 hover:text-red-300 hover:border-red-400/40",
          submitted === 'negative' && "bg-destructive/15 text-red-300 border-destructive/40"
        )}
        onClick={() => submitFeedback('negative')}
        disabled={isSubmitting || !!submitted}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
