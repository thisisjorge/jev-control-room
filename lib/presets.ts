import type { PresetId } from './types';

export interface Preset {
  id: PresetId;
  label: string;
  eyebrow: string;
  description: string;
  placeholder: string;
  example: string;
}

export const presets: Preset[] = [
  {
    id: 'support',
    label: 'Support Triage',
    eyebrow: 'OPERATIONS',
    description: 'Route a support case, estimate urgency, and decide whether a human should take over.',
    placeholder: 'Describe a support request, incident, or customer message…',
    example:
      'The customer says they were charged twice, the second charge is still pending, and they need the money back before a trip tomorrow.',
  },
  {
    id: 'lead',
    label: 'Lead Qualification',
    eyebrow: 'REVENUE',
    description: 'Classify fit, urgency, and the next commercial action without generating prose.',
    placeholder: 'Paste a lead message or qualification context…',
    example:
      'A 35-person clinic wants WhatsApp automation connected to its CRM. They have budget approved this month and want a demo this week.',
  },
  {
    id: 'agent',
    label: 'Agent Router',
    eyebrow: 'AGENTS',
    description: 'Choose the next execution path for an agent loop: act, reason, ask, retry, or stop.',
    placeholder: 'Describe the current agent state and objective…',
    example:
      'The agent has already found the invoice in the CRM, but the refund policy is ambiguous and the customer is asking for an exception.',
  },
  {
    id: 'review',
    label: 'Code Review Gate',
    eyebrow: 'ENGINEERING',
    description: 'Assess merge readiness, risk, and whether a change needs manual review.',
    placeholder: 'Describe a diff, PR, test result, or code change…',
    example:
      'The PR changes authentication middleware, adds two unit tests, but has no integration test for expired sessions and touches the production callback path.',
  },
  {
    id: 'workflow',
    label: 'Workflow Guard',
    eyebrow: 'AUTOMATION',
    description: 'Decide whether an automated workflow should continue, retry, pause, or escalate.',
    placeholder: 'Describe the workflow state and latest event…',
    example:
      'The automation retried the CRM update twice. The API is returning 429 and the payload has already been written to the audit log.',
  },
];

export const getPreset = (id: PresetId) =>
  presets.find((preset) => preset.id === id) ?? presets[0];
