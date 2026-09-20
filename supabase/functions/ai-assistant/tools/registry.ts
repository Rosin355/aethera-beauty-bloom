import { canUseTool, toOpenAiTools } from "./run.ts";
import { getCenterKpi } from "./get_center_kpi.ts";
import { getCenterProfile } from "./get_center_profile.ts";
import { getProtocol } from "./get_protocol.ts";
import { listAppointments } from "./list_appointments.ts";
import { simulateGoal } from "./simulate_goal.ts";
import type { CenterRole, Tool } from "./types.ts";

/** Every tool the function knows. Write / profile / report tools are appended by P1.4–P1.6. */
export const ALL_TOOLS: readonly Tool[] = [
  getCenterKpi,
  simulateGoal,
  listAppointments,
  getCenterProfile,
  getProtocol,
];

/** Tools this role may use (owner-only tools are not even offered to the model for other roles). */
export const toolsForRole = (role: CenterRole, tools: readonly Tool[] = ALL_TOOLS): Tool[] =>
  tools.filter((tool) => canUseTool(tool, role));

export { toOpenAiTools };
