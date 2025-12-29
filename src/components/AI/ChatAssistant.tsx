import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, X, Loader2, Sparkles, History, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FeedbackButtons } from "./FeedbackButtons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  user_type: string | null;
  primary_goal: string | null;
  experience_level: string | null;
  business_name: string | null;
  team_size: string | null;
}

interface ChatAssistantProps {
  embedded?: boolean;
}

// Suggerimenti base per tutti
const BASE_SUGGESTIONS = [
  "Come migliorare la gestione clienti?",
  "Consigli per aumentare le vendite",
];

// Suggerimenti per tipo utente
const USER_TYPE_SUGGESTIONS: Record<string, string[]> = {
  "titolare": [
    "Come ottimizzare il margine sui trattamenti?",
    "Strategie per gestire meglio il team",
  ],
  "estetista": [
    "Tecniche per fidelizzare i clienti",
    "Come proporre trattamenti premium?",
  ],
  "parrucchiere": [
    "Come aumentare lo scontrino medio?",
    "Tendenze colore della stagione",
  ],
  "dipendente": [
    "Come crescere professionalmente?",
    "Suggerimenti per la gestione del tempo",
  ],
  "freelance": [
    "Come trovare nuovi clienti?",
    "Gestione partita IVA e prezzi",
  ],
  "studente": [
    "Consigli per iniziare la carriera",
    "Competenze più richieste nel settore",
  ],
  "professional": [
    "Best practices per il mio centro",
    "Come fidelizzare i clienti",
  ],
  "user": [
    "Cosa offre 4 Elementi Italia?",
    "Come posso iniziare?",
  ],
};

// Suggerimenti per obiettivo principale
const GOAL_SUGGESTIONS: Record<string, string[]> = {
  "increase_revenue": ["Strategie per aumentare il fatturato"],
  "improve_skills": ["Quali competenze dovrei sviluppare?"],
  "expand_business": ["Consigli per espandere l'attività"],
  "better_management": ["Come ottimizzare i processi gestionali?"],
  "team_growth": ["Come far crescere il mio team?"],
  "work_life_balance": ["Come bilanciare lavoro e vita privata?"],
};

export function ChatAssistant({ embedded = false }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Genera suggerimenti personalizzati
  const personalizedSuggestions = useMemo(() => {
    const suggestions = [...BASE_SUGGESTIONS];
    
    if (userProfile) {
      // Aggiungi suggerimenti per tipo utente
      const userType = userProfile.user_type?.toLowerCase() || 'user';
      const typeMatch = Object.keys(USER_TYPE_SUGGESTIONS).find(key => 
        userType.includes(key)
      );
      if (typeMatch) {
        suggestions.push(...USER_TYPE_SUGGESTIONS[typeMatch]);
      }

      // Aggiungi suggerimenti per obiettivo
      const goal = userProfile.primary_goal;
      if (goal && GOAL_SUGGESTIONS[goal]) {
        suggestions.push(...GOAL_SUGGESTIONS[goal]);
      }
    }

    // Limita a 4 suggerimenti unici
    return [...new Set(suggestions)].slice(0, 4);
  }, [userProfile]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user?.id) {
        // Fetch user profile for personalization
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, primary_goal, experience_level, business_name, team_size')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }

        // Load recent conversations
        loadConversations(user.id);
      }
    };
    getUser();
  }, []);

  const loadConversations = async (uid: string) => {
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Parse the messages from JSONB - cast to unknown first then to target type
      const parsed = (data || []).map(conv => ({
        ...conv,
        messages: (conv.messages as unknown) as Message[]
      }));
      setConversations(parsed);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const saveConversation = async (newMessages: Message[]) => {
    if (!userId || newMessages.length < 2) return;

    try {
      // Generate title from first user message
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      const title = firstUserMsg 
        ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '') 
        : 'Nuova conversazione';

      // Cast messages to Json compatible type
      const messagesJson = JSON.parse(JSON.stringify(newMessages));

      if (currentConversationId) {
        // Update existing conversation
        await supabase
          .from('ai_conversations')
          .update({ 
            messages: messagesJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentConversationId);
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert([{
            user_id: userId,
            title,
            messages: messagesJson,
          }])
          .select()
          .single();

        if (!error && data) {
          setCurrentConversationId(data.id);
          loadConversations(userId);
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setCurrentConversationId(conv.id);
  };

  const startNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Ciao! Sono l\'assistente AI di 4 Elementi Italia. Come posso aiutarti oggi? Posso darti consigli su gestione clienti, marketing, tecniche di trattamento o business management.',
      },
    ]);
    setCurrentConversationId(null);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', convId);
      
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        startNewConversation();
      }
      toast.success('Conversazione eliminata');
    } catch (error) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if ((isOpen || embedded) && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Ciao! Sono l\'assistente AI di 4 Elementi Italia. Come posso aiutarti oggi? Posso darti consigli su gestione clienti, marketing, tecniche di trattamento o business management.',
        },
      ]);
    }
  }, [isOpen, embedded]);

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
    
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: [...messages, userMessage],
        userId,
        conversationId: currentConversationId,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        throw new Error('Limite richieste superato. Riprova tra qualche secondo.');
      }
      if (resp.status === 402) {
        throw new Error('Crediti AI esauriti. Contatta l\'amministratore.');
      }
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || 'Errore nella comunicazione con l\'assistente');
    }

    if (!resp.body) throw new Error('Nessuna risposta dal server');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';
    let streamDone = false;

    // Create initial assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                newMessages[lastIndex] = { ...newMessages[lastIndex], content: assistantContent };
              }
              return newMessages;
            });
          }
        } catch {
          // Incomplete JSON, put it back
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                newMessages[lastIndex] = { ...newMessages[lastIndex], content: assistantContent };
              }
              return newMessages;
            });
          }
        } catch { /* ignore partial leftovers */ }
      }
    }

    return assistantContent;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Starting streaming chat...');
      const assistantContent = await streamChat(userMessage);
      
      // Save conversation after successful response
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
      saveConversation(finalMessages);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage = error.message || 'Errore nella comunicazione con l\'assistente';
      toast.error(errorMessage, {
        description: 'Se il problema persiste, ricarica la pagina.',
        duration: 5000,
      });
      
      // Remove the failed messages
      setMessages(prev => prev.slice(0, -2));
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const showSuggestions = messages.length === 1 && messages[0].role === 'assistant';

  const renderMessages = () => (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex gap-3 ${
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
              {message.role === 'user' ? 'U' : <Bot className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col max-w-[80%]">
            <div
              className={`rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'assistant' && index > 0 && !isLoading && (
              <FeedbackButtons 
                userId={userId} 
                conversationId={currentConversationId} 
                messageIndex={index} 
              />
            )}
          </div>
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="rounded-lg p-3 bg-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );

  const renderQuickSuggestions = () => (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>Suggerimenti per te</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {personalizedSuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );

  const renderConversationHistory = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={startNewConversation}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova conversazione
        </DropdownMenuItem>
        {conversations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {conversations.map((conv) => (
              <DropdownMenuItem 
                key={conv.id} 
                onClick={() => loadConversation(conv)}
                className="flex justify-between items-center"
              >
                <span className="truncate flex-1 mr-2">{conv.title || 'Senza titolo'}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => deleteConversation(conv.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderInputArea = () => (
    <div className="p-4 border-t border-border">
      <div className="flex items-end gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Scrivi un messaggio..."
          className="min-h-[44px] max-h-[120px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  // Floating button mode (non-embedded)
  if (!embedded && !isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  // Embedded mode - render as full container
  if (embedded) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Assistente AI</h2>
              <p className="text-xs text-muted-foreground">4 Elementi Italia</p>
            </div>
          </div>
          {userId && renderConversationHistory()}
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {renderMessages()}
          {showSuggestions && renderQuickSuggestions()}
        </ScrollArea>

        {renderInputArea()}
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Assistente AI</CardTitle>
            <p className="text-xs text-muted-foreground">4 Elementi Italia</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {userId && renderConversationHistory()}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {renderMessages()}
          {showSuggestions && renderQuickSuggestions()}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex items-end gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 flex-shrink-0 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
