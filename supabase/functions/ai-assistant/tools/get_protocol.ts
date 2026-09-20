import { clip } from "./db.ts";
import { defineTool } from "./types.ts";

const MAX_RESULTS = 3;
const MAX_CONTENT = 1800;

/** Any member: a treatment/protocol from the 4E knowledge base, by name. */
export const getProtocol = defineTool<{ name: string }>({
  name: "get_protocol",
  description:
    "Cerca nella knowledge base 4 Elementi il protocollo o il metodo con quel nome (trattamento, procedura di cabina, " +
    "script, passo del percorso) e ne restituisce il testo. Se non trova nulla lo dice: non inventare protocolli.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 120, description: "Nome o tema del protocollo da cercare" },
    },
    required: ["name"],
    additionalProperties: false,
  },
  access: "member",
  write: false,
  async handler({ knowledge, args }) {
    const docs = await knowledge.search(args.name, MAX_RESULTS);
    if (docs.length === 0) {
      return { query: args.name, results: [], note: "Nessun protocollo trovato nella knowledge base" };
    }
    return {
      query: args.name,
      results: docs.slice(0, MAX_RESULTS).map((d) => ({
        title: d.title,
        description: clip(d.description, 300),
        content: clip(d.content, MAX_CONTENT),
        content_truncated: d.content.length > MAX_CONTENT,
      })),
    };
  },
});
