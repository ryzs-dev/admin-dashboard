export type CreateAutomationInput = {
  name: string;
  trigger_event: string;
  delay_seconds?: number;
  actions: {
    type: string;
    config: Record<string, any>;
  }[];
};
