import { unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

interface SetActionDoneArgs {
  action_id: string;
  done: boolean;
  confirmed: boolean;
}

interface ActionRow {
  id: string;
  center_id: string;
  kind: string;
  number: number;
  action_text: string;
  done: boolean;
  done_at: string | null;
}

/**
 * Write tool (P1.6), owner-only per docs/CONCIERGE_TOOLS.md's catalogue (the underlying
 * center_actions RLS is member-level for a future dashboard, but the chat tool stays owner-only:
 * the report's strategic checklist isn't something the concierge lets a non-owner touch by
 * talking to it). confirmed:false previews; confirmed:true writes -- same shape as every other
 * write tool (docs/CONCIERGE_TOOLS.md §4).
 */
export const setActionDone = defineTool<SetActionDoneArgs>({
  name: "set_action_done",
  description:
    "Segna un'azione del referto (urgente o strategica) come fatta o da fare. Prima chiamata " +
    "(confirmed:false o omesso): mostra all'utente quale azione stai per aggiornare, senza " +
    "scrivere nulla. Richiama con confirmed:true SOLO dopo un sì esplicito dell'utente nel " +
    "messaggio più recente.",
  parameters: {
    type: "object",
    properties: {
      action_id: { type: "string", format: "uuid", description: "Id dell'azione (da get_latest_report)." },
      done: { type: "boolean", description: "true = fatta, false = da fare." },
      confirmed: { type: "boolean", description: "true solo dopo la conferma esplicita dell'utente." },
    },
    required: ["action_id", "done", "confirmed"],
    additionalProperties: false,
  },
  access: "owner",
  write: true,
  async handler({ supabase, centerId, args }) {
    const action = unwrap<ActionRow>(
      await supabase
        .from("center_actions")
        .select("id, center_id, kind, number, action_text, done, done_at")
        .eq("id", args.action_id)
        .eq("center_id", centerId)
        .maybeSingle(),
    );
    if (!action) throw new ToolError("invalid_args", "Azione non trovata per questo centro");

    if (!args.confirmed) {
      return {
        status: "draft",
        requires_confirmation: true,
        preview: { id: action.id, kind: action.kind, number: action.number, action_text: action.action_text, current_done: action.done, new_done: args.done },
      };
    }

    const updated = unwrap<ActionRow>(
      await supabase
        .from("center_actions")
        .update({ done: args.done, done_at: args.done ? new Date().toISOString() : null })
        .eq("id", action.id)
        .eq("center_id", centerId)
        .select("id, kind, number, action_text, done, done_at")
        .single(),
    );
    if (!updated) throw new ToolError("internal", "Azione non aggiornata");
    return { status: "updated", action: updated };
  },
});
