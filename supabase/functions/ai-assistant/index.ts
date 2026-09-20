import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createUserClient,
  getBearerToken,
  HttpError,
  requireAuthenticatedUser,
  toErrorResponse,
} from "../_shared/auth.ts";
import { type CenterAccess, resolveCenterAccess } from "../_shared/center.ts";
import { enforceRateLimit, readJsonBody } from "../_shared/security.ts";
import { type AgentEvent, type AgentSummary, runAgent } from "./agent.ts";
import {
  buildSystemPrompt,
  buildToolPrompt,
  createKnowledgeSearch,
  loadPromptConfig,
  loadTrainingContext,
  loadUserContext,
} from "./context.ts";
import { createGatewayStreamRound, gatewayConfigFromEnv, type ChatMessage, UpstreamError } from "./llm.ts";
import { DONE_FRAME, encodeEvent, errorFrame } from "./sse.ts";
import { ALL_TOOLS } from "./tools/registry.ts";
import { runTool, type ToolBase } from "./tools/run.ts";

// Supabase Edge Runtime global (not part of the Deno types).
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input limits (chat history rules are unchanged; the body cap now applies BEFORE parsing).
const MAX_BODY_BYTES = 40 * 1024;
const MAX_MESSAGES = 30;
const MAX_MESSAGES_BYTES = 32 * 1024;
// Edge Functions have a wall-clock limit; past this point the next model call is forced to be the final answer.
const REQUEST_BUDGET_MS = 50_000;
const RATE_LIMIT = { requests: 30, windowSeconds: 60 };

interface RequestBody {
  messages?: unknown;
  conversationId?: unknown;
  /** Selector only: must match one of the caller's active memberships. */
  centerId?: unknown;
  /** Direct tool mode: run ONE tool without the LLM (same auth, role checks and validation). */
  toolCall?: unknown;
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * A client must never inject a "system" message, nor malformed roles/content; conversation size is capped.
 */
const sanitizeMessages = (messages: unknown): { role: "user" | "assistant"; content: string }[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpError(400, "Messaggi non validi");
  }
  if (messages.length > MAX_MESSAGES) {
    throw new HttpError(400, "Troppi messaggi nella conversazione");
  }
  if (new TextEncoder().encode(JSON.stringify(messages)).length > MAX_MESSAGES_BYTES) {
    throw new HttpError(413, "Payload dei messaggi troppo grande");
  }
  return messages.map((message: unknown) => {
    const role = (message as { role?: unknown })?.role;
    const content = (message as { content?: unknown })?.content;
    if (typeof content !== "string" || (role !== "user" && role !== "assistant")) {
      throw new HttpError(400, "Formato messaggio non valido");
    }
    return { role, content };
  });
};

const handleDirectTool = async (
  toolCall: unknown,
  toolBase: ToolBase | null,
): Promise<Response> => {
  if (!toolBase) throw new HttpError(400, "Nessun centro attivo per questo utente");
  const call = toolCall as { name?: unknown; args?: unknown } | null;
  if (!call || typeof call !== "object" || typeof call.name !== "string" || call.name.length > 64) {
    throw new HttpError(400, "toolCall non valido");
  }
  const result = await runTool(ALL_TOOLS, call.name, call.args ?? {}, toolBase);
  return jsonResponse(result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, "Metodo non consentito");
    }

    const { supabase, user } = await requireAuthenticatedUser(req);
    const authenticatedUserId = user.id;
    const userClient = createUserClient(getBearerToken(req));

    const body = await readJsonBody<RequestBody>(req, MAX_BODY_BYTES);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new HttpError(400, "Corpo della richiesta non valido");
    }
    await enforceRateLimit(supabase, `ai-assistant:${authenticatedUserId}`, RATE_LIMIT.requests, RATE_LIMIT.windowSeconds);

    // Tenant identity for the whole request: resolved from the caller's own memberships (RLS), never from the model.
    const center: CenterAccess | null = await resolveCenterAccess(userClient, authenticatedUserId, body.centerId);
    const toolBase: ToolBase | null = center
      ? {
        supabase: userClient,
        centerId: center.centerId,
        userId: authenticatedUserId,
        role: center.role,
        now: new Date(),
        knowledge: createKnowledgeSearch(supabase),
      }
      : null;

    if (body.toolCall !== undefined) {
      return await handleDirectTool(body.toolCall, toolBase);
    }

    // Input hardening: cap conversation size and only accept user/assistant roles.
    const sanitizedMessages = sanitizeMessages(body.messages);
    const gateway = gatewayConfigFromEnv();

    let validatedConversationId: string | null = null;
    if (typeof body.conversationId === "string" && body.conversationId.trim().length > 0) {
      const { data: ownedConversation, error: conversationError } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("id", body.conversationId)
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (!conversationError && ownedConversation) {
        validatedConversationId = ownedConversation.id;
      }
    }

    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';
    const [userContext, promptConfig, trainingContext] = await Promise.all([
      loadUserContext(supabase, authenticatedUserId),
      loadPromptConfig(supabase),
      loadTrainingContext(supabase, lastUserMessage),
    ]);

    const systemPrompt = buildSystemPrompt({
      ...promptConfig,
      userContext,
      trainingContext,
      toolPrompt: center ? buildToolPrompt(center, new Date()) : undefined,
    });

    const abort = new AbortController();
    const agent = runAgent({
      systemPrompt,
      history: sanitizedMessages as ChatMessage[],
      tools: ALL_TOOLS,
      toolBase,
      streamRound: createGatewayStreamRound(gateway),
      deadline: startTime + REQUEST_BUDGET_MS,
      signal: abort.signal,
    });

    // Pull the first event BEFORE committing to a 200 stream, so an upstream failure on the very
    // first model call still surfaces as a proper JSON error (429/402 mapping as before).
    let first: IteratorResult<AgentEvent, AgentSummary>;
    try {
      first = await agent.next();
    } catch (error) {
      if (error instanceof UpstreamError) {
        if (error.status === 429) {
          return jsonResponse({ error: 'Limite richieste superato. Riprova tra qualche secondo.' }, 429);
        }
        if (error.status === 402) {
          return jsonResponse({ error: 'Crediti AI esauriti. Contatta l\'amministratore.' }, 402);
        }
      }
      throw error;
    }

    // Log usage asynchronously once the stream is over (don't block the response).
    let logged = false;
    const logUsage = (summary?: AgentSummary) => {
      if (logged) return;
      logged = true;
      const work = (async () => {
        try {
          // Estimate token counts (rough approximation)
          const inputTokens = Math.ceil((systemPrompt.length + sanitizedMessages.reduce((acc, m) => acc + m.content.length, 0)) / 4);
          await supabase.from('ai_usage_logs').insert({
            user_id: authenticatedUserId,
            conversation_id: validatedConversationId,
            tokens_input: inputTokens,
            tokens_output: null, // We can't easily track streaming output tokens
            model: gateway.model,
            response_time_ms: Date.now() - startTime,
          });
          if (summary) console.log(`ai-assistant: ${summary.modelCalls} model call(s), ${summary.toolCalls} tool call(s)`);
        } catch (_logError) {
          console.error('Error saving usage log');
        }
      })();
      if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
    };

    const encoder = new TextEncoder();
    let pending: IteratorResult<AgentEvent, AgentSummary> | null = first;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const step = pending ?? await agent.next();
          pending = null;
          if (step.done) {
            controller.enqueue(encoder.encode(DONE_FRAME));
            controller.close();
            logUsage(step.value);
            return;
          }
          controller.enqueue(encoder.encode(encodeEvent(step.value)));
        } catch (error) {
          // Headers are already sent: report the failure in-band, then end the stream cleanly.
          console.error('Error in ai-assistant stream');
          const message = error instanceof UpstreamError && error.status === 429
            ? 'Limite richieste superato. Riprova tra qualche secondo.'
            : 'Errore durante la risposta. Riprova.';
          controller.enqueue(encoder.encode(errorFrame(message)));
          controller.enqueue(encoder.encode(DONE_FRAME));
          controller.close();
          logUsage();
        }
      },
      async cancel() {
        abort.abort();
        await agent.return(undefined as never);
        logUsage();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    if (!(error instanceof HttpError)) {
      console.error('Error in ai-assistant');
    }
    return toErrorResponse(error, corsHeaders);
  }
});
