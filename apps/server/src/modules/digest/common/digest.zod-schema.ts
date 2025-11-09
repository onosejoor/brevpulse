import { Schema, SchemaType } from '@google/generative-ai';

const digestActionGenerativeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    url: {
      type: SchemaType.STRING,
      description: 'The direct URL for the action.',
    },
    type: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['primary', 'secondary'],
      description: 'The type of action, for styling purposes.',
      nullable: true,
    },
    label: {
      type: SchemaType.STRING,
      description:
        'A short, actionable label for the button, e.g., "View Email".',
    },
  },
  required: ['url'],
};

const digestItemGenerativeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    source: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['gmail', 'calendar', 'github', 'slack', 'figma'],
      description: 'The source of the notification.',
    },
    priority: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['high', 'medium', 'low'],
      description: 'The calculated priority of the item.',
    },
    title: {
      type: SchemaType.STRING,
      description:
        'A concise, rewritten, and engaging title for the digest item.',
    },
    description: {
      type: SchemaType.STRING,
      description: 'A brief, witty, and informative summary of the item.',
    },
    count: {
      type: SchemaType.INTEGER,
      description: 'The number of raw items grouped into this digest item.',
    },
    actions: {
      type: SchemaType.ARRAY,
      items: digestActionGenerativeSchema,
    },
  },
  required: ['source', 'priority', 'title', 'count'],
};

export const digestPayloadGenerativeSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    period: {
      format: 'enum',
      type: SchemaType.STRING,
      enum: ['daily', 'weekly'],
      description: 'The time period this digest covers.',
    },
    plan: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['free', 'pro'],
      description:
        'The user subscription plan, which dictates filtering rules.',
    },
    items: {
      type: SchemaType.ARRAY,
      description: 'A list of summarized and prioritized digest items.',
      items: digestItemGenerativeSchema,
    },
    summary: {
      type: SchemaType.OBJECT,
      description: 'A summary of the digest content.',
      properties: {
        totalItems: { type: SchemaType.INTEGER },
        bySource: {
          type: SchemaType.OBJECT,
          description:
            'A map of item counts by source. Must include all possible sources, with a value of 0 for sources with no items.',
          properties: {
            gmail: { type: SchemaType.INTEGER },
            calendar: { type: SchemaType.INTEGER },
            github: { type: SchemaType.INTEGER },
            slack: { type: SchemaType.INTEGER },
            figma: { type: SchemaType.INTEGER },
          },
          required: ['gmail', 'calendar', 'github', 'slack', 'figma'],
        },
        byPriority: {
          type: SchemaType.OBJECT,
          description:
            'A map of item counts by priority. Must include all possible priorities (high, medium, low), with a value of 0 for priorities with no items.',
          properties: {
            high: { type: SchemaType.INTEGER },
            medium: { type: SchemaType.INTEGER },
            low: { type: SchemaType.INTEGER },
          },
          required: ['high', 'medium', 'low'],
        },
        integrations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['gmail', 'calendar', 'github', 'slack', 'figma'],
          },
        },
      },
      required: ['totalItems', 'bySource', 'byPriority', 'integrations'],
    },
  },
  required: ['items', 'summary'],
};
