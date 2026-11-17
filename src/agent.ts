import { createAgent, registerTools } from "@ui-sdk/react/agent";

const agent = createAgent({ allow: (step) => !step.confirm });
registerTools(agent, { allow: () => true });
