import type { Experimental_EvaluationQuestion } from 'ai';

import type { PresetId } from './types';

export function questionsForPreset(
  presetId: PresetId,
): Record<string, Experimental_EvaluationQuestion> {
  switch (presetId) {
    case 'support':
      return {
        route: {
          type: 'choice' as const,
          criteria: {
            billing: 'Billing, charges, refunds, invoices, or payments',
            technical: 'Product bugs, access failures, integrations, or technical incidents',
            account: 'Account configuration, identity, plan, or profile issues',
            general: 'Questions that do not fit the other queues',
          },
          instructions: 'Choose the single best support queue for this case.',
        },
        priority: {
          type: 'score' as const,
          criteria: [
            'Low: informational or can wait',
            'Normal: needs attention but no meaningful time pressure',
            'High: important business or customer impact',
            'Critical: immediate material impact or severe service failure',
          ],
          instructions: 'Score the operational priority of the case.',
        },
        humanReview: {
          type: 'boolean' as const,
          instructions: 'Should a human review this case before the next irreversible action?',
        },
      };

    case 'lead':
      return {
        fit: {
          type: 'choice' as const,
          criteria: {
            strong: 'Clear need, realistic use case, and meaningful commercial fit',
            medium: 'Some fit, but important qualification information is missing',
            weak: 'Low fit, unclear need, or unlikely to justify sales effort',
          },
          instructions: 'Classify the lead fit.',
        },
        urgency: {
          type: 'score' as const,
          criteria: [
            'No timeline or distant timeline',
            'Interested but not time-sensitive',
            'Active project with a near-term decision',
            'Immediate buying motion or urgent deadline',
          ],
          instructions: 'Score buying urgency.',
        },
        salesReady: {
          type: 'boolean' as const,
          instructions: 'Is this lead ready for a direct sales conversation now?',
        },
      };

    case 'agent':
      return {
        nextAction: {
          type: 'choice' as const,
          criteria: {
            act: 'Execute the next known tool or operation',
            reason: 'Escalate to a stronger reasoning model before acting',
            ask: 'Ask the user or operator for missing information',
            retry: 'Retry the last safe operation',
            stop: 'Stop because the task is complete or cannot safely progress',
          },
          instructions: 'Choose the best next control action for the agent.',
        },
        certainty: {
          type: 'score' as const,
          criteria: [
            'Very uncertain',
            'Some uncertainty',
            'Mostly clear',
            'Very clear',
          ],
          instructions: 'Score how clear the next action is from the current state.',
        },
        humanReview: {
          type: 'boolean' as const,
          instructions: 'Should the agent pause for human review before continuing?',
        },
      };

    case 'review':
      return {
        mergeState: {
          type: 'choice' as const,
          criteria: {
            ready: 'Safe to merge based on the supplied evidence',
            review: 'Needs focused manual review before merge',
            block: 'Should not merge until material issues are resolved',
          },
          instructions: 'Choose the appropriate merge gate state.',
        },
        risk: {
          type: 'score' as const,
          criteria: [
            'Low risk and well-contained',
            'Moderate risk',
            'High risk or incomplete coverage',
            'Critical risk in a sensitive path',
          ],
          instructions: 'Score implementation risk.',
        },
        needsTests: {
          type: 'boolean' as const,
          instructions: 'Does this change need additional testing before merge?',
        },
      };

    case 'workflow':
      return {
        action: {
          type: 'choice' as const,
          criteria: {
            continue: 'Continue to the next workflow step',
            retry: 'Retry the current safe operation',
            pause: 'Pause and wait for conditions to change',
            escalate: 'Escalate to a person or stronger reasoning path',
          },
          instructions: 'Choose the safest useful next workflow action.',
        },
        risk: {
          type: 'score' as const,
          criteria: [
            'Low operational risk',
            'Moderate operational risk',
            'High risk or likely repeat failure',
            'Critical risk or possible irreversible side effect',
          ],
          instructions: 'Score risk if automation proceeds.',
        },
        safeToContinue: {
          type: 'boolean' as const,
          instructions: 'Is it safe for the automation to continue without human intervention?',
        },
      };
  }
}
