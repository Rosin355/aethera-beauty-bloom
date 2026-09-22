import { canUseTool, toOpenAiTools } from "./run.ts";
import { createAppointment } from "./create_appointment.ts";
import { generateFirstReading } from "./generate_first_reading.ts";
import { getCenterKpi } from "./get_center_kpi.ts";
import { getCenterProfile } from "./get_center_profile.ts";
import { getLatestReport } from "./get_latest_report.ts";
import { getMissingSlots } from "./get_missing_slots.ts";
import { getProtocol } from "./get_protocol.ts";
import { listAppointments } from "./list_appointments.ts";
import { moveAppointment } from "./move_appointment.ts";
import { proposeRecall } from "./propose_recall.ts";
import { setActionDone } from "./set_action_done.ts";
import { setProfileSlot } from "./set_profile_slot.ts";
import { simulateGoal } from "./simulate_goal.ts";
import type { CenterRole, Tool } from "./types.ts";

/** Every tool the function knows. */
export const ALL_TOOLS: readonly Tool[] = [
  getCenterKpi,
  simulateGoal,
  listAppointments,
  getCenterProfile,
  getProtocol,
  createAppointment,
  moveAppointment,
  proposeRecall,
  setProfileSlot,
  getMissingSlots,
  generateFirstReading,
  getLatestReport,
  setActionDone,
];

/** Tools this role may use (owner-only tools are not even offered to the model for other roles). */
export const toolsForRole = (role: CenterRole, tools: readonly Tool[] = ALL_TOOLS): Tool[] =>
  tools.filter((tool) => canUseTool(tool, role));

export { toOpenAiTools };
