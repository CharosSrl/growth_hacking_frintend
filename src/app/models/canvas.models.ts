export interface Project {
  id: string;
  name: string;
  owner_uid: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  section: string;
  field: string;
  content: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export type Canvas = Record<string, Record<string, Note[]>>;

export interface SectionField {
  key: string;
  label: string;
}

export interface SectionSchema {
  key: string;
  label: string;
  color: string;
  icon: string;
  fields: SectionField[];
}

/** Educational hints, loaded at runtime from assets/hints.json (editable content). */
export interface SectionHints {
  summary?: string;                      // short line shown under the section title
  about?: string;                        // longer explanation (info-button popover)
  fields?: Record<string, string[]>;     // field key → list of hints
}
export type HintsData = Record<string, SectionHints>;

export const CANVAS_SCHEMA: SectionSchema[] = [
  {
    key: 'project_overview', label: 'Project Overview', color: '#6366f1', icon: '🎯',
    fields: [
      { key: 'unique_value_proposition', label: 'Unique Value Proposition' },
      { key: 'secret_sauce', label: 'Secret Sauce' },
      { key: 'core_value', label: 'Core Value' },
      { key: 'target_customers', label: 'Target Customers' },
      { key: 'why', label: 'Why' },
    ],
  },
  {
    key: 'metrics', label: 'Metrics', color: '#06b6d4', icon: '📊',
    fields: [
      { key: 'formula', label: 'Growth Formula' },
      { key: 'north_star_metric', label: 'North Star Metric' },
    ],
  },
  {
    key: 'retention', label: 'Retention', color: '#10b981', icon: '🧲',
    fields: [
      { key: 'short_term', label: 'Short Term' },
      { key: 'medium_term', label: 'Medium Term' },
      { key: 'long_term', label: 'Long Term' },
    ],
  },
  {
    key: 'acquisition', label: 'Acquisition', color: '#f59e0b', icon: '🚀',
    fields: [
      { key: 'language_market_fit', label: 'Language-Market Fit' },
      { key: 'channel_product_fit', label: 'Channel-Product Fit' },
    ],
  },
  {
    key: 'toolbox', label: 'Toolbox', color: '#ef4444', icon: '🧰',
    fields: [
      { key: 'data_mining', label: 'Data Mining' },
      { key: 'social_tracking', label: 'Social Tracking' },
      { key: 'ads_tracking', label: 'Ads Tracking' },
      { key: 'surveys', label: 'Surveys' },
      { key: 'other', label: 'Other' },
    ],
  },
  {
    key: 'high_tempo_testing', label: 'High-Tempo Testing', color: '#8b5cf6', icon: '⚡',
    fields: [
      { key: 'framework', label: 'Framework' },
      { key: 'frequency', label: 'Frequency' },
    ],
  },
  {
    key: 'customer_loops', label: 'Customer Loops', color: '#ec4899', icon: '🔄',
    fields: [
      { key: 'payload', label: 'Payload' },
      { key: 'conversion_rate', label: 'Conversion Rate' },
      { key: 'frequency', label: 'Frequency' },
    ],
  },
];
