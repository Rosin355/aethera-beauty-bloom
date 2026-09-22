import { unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

interface SetProfileSlotArgs {
  slot_key: string;
  value: unknown;
  source: "interview" | "conversation" | "computed";
}

/**
 * NOT a confirm-first write tool (P1.5), on purpose: recording a fact the owner just mentioned
 * ("ho 3 cabine") is low-stakes and freely correctable, unlike booking an appointment or sending
 * a message — and the concierge often learns several slots in one turn, which the confirm-first
 * backstop (one call per write-tool name per request) would otherwise block on the second one.
 * See docs/CONCIERGE_TOOLS.md §4 and docs/PROFILE_SLOTS.md "Source".
 */
export const setProfileSlot = defineTool<SetProfileSlotArgs>({
  name: "set_profile_slot",
  description:
    "Registra o aggiorna un dato dell'Analisi di Valore del centro (un 'slot' del profilo). " +
    "Usalo ogni volta che l'utente ti dice qualcosa che corrisponde a uno slot — non serve " +
    "chiedere conferma, è solo un appunto che puoi sempre correggere. source:'conversation' per " +
    "un dato emerso parlando, 'interview' per l'intervista di benvenuto, 'computed' per un dato " +
    "che hai dedotto da altri dati (mai da una domanda diretta).",
  parameters: {
    type: "object",
    properties: {
      slot_key: {
        type: "string",
        minLength: 1,
        maxLength: 64,
        description: "Chiave dello slot (vedi get_missing_slots per l'elenco valido).",
      },
      value: {
        description: "Il dato catturato: stringa, numero, booleano, elenco o oggetto — qualsiasi forma abbia la risposta.",
      },
      source: { type: "string", enum: ["interview", "conversation", "computed"] },
    },
    required: ["slot_key", "value", "source"],
    additionalProperties: false,
  },
  access: "member",
  write: false,
  async handler({ supabase, centerId, userId, args }) {
    const known = unwrap<{ slot_key: string }>(
      await supabase.from("profile_slot_catalog").select("slot_key").eq("slot_key", args.slot_key).maybeSingle(),
    );
    if (!known) throw new ToolError("invalid_args", `slot_key sconosciuto: ${args.slot_key}`);

    const saved = unwrap<{ slot_key: string; value: unknown; source: string; updated_at: string }>(
      await supabase
        .from("center_profile_slots")
        .upsert(
          { center_id: centerId, slot_key: args.slot_key, value: args.value, source: args.source, updated_by: userId },
          { onConflict: "center_id,slot_key" },
        )
        .select("slot_key, value, source, updated_at")
        .single(),
    );
    if (!saved) throw new ToolError("internal", "Slot non salvato");
    return saved;
  },
});
