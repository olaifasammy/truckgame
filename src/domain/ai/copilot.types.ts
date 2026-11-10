export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'tool';
  text: string;
  timestamp: number;
  toolCall?: {
    name: string;
    args: Record<string, any>;
    result?: any;
  };
}

export interface CopilotTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute: (S: any, args: Record<string, any>) => { success: boolean; message: string; data?: any };
}
