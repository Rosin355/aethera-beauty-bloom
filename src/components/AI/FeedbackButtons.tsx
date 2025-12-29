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

  return (
    <div className="flex items-center gap-1 mt-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 rounded-full",
          submitted === 'positive' && "bg-green-500/20 text-green-600"
        )}
        onClick={() => submitFeedback('positive')}
        disabled={isSubmitting || !!submitted}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 rounded-full",
          submitted === 'negative' && "bg-red-500/20 text-red-600"
        )}
        onClick={() => submitFeedback('negative')}
        disabled={isSubmitting || !!submitted}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  );
}
