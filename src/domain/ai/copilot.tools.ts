import { CopilotTool } from './copilot.types';
import { HUB_TOOLS } from './tools/hub.tools';
import { DISPATCH_TOOLS } from './tools/dispatch.tools';
import { FLEET_TOOLS } from './tools/fleet.tools';
import { HR_TOOLS } from './tools/hr.tools';
import { FINANCE_TOOLS } from './tools/finance.tools';

export const COPILOT_TOOLS: CopilotTool[] = [
  ...HUB_TOOLS,
  ...DISPATCH_TOOLS,
  ...FLEET_TOOLS,
  ...HR_TOOLS,
  ...FINANCE_TOOLS
];

export function executeCopilotTool(
  S: any,
  name: string,
  args: Record<string, any>
): { success: boolean; message: string; data?: any; actions?: { label: string; prompt: string }[] } {
  const tool = COPILOT_TOOLS.find(t => t.name === name);
  if (!tool) {
    return { success: false, message: `Tool "${name}" is not recognized.` };
  }
  try {
    return tool.execute(S, args || {});
  } catch (err: any) {
    return { success: false, message: `Execution error in ${name}: ${err?.message || err}` };
  }
}
