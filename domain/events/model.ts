export const eventSessionNumbers = [1, 2, 3, 4] as const;

export type EventSessionNumber = (typeof eventSessionNumbers)[number];

export const eventRoles = [
  "hunter",
  "solo",
  "farmer",
  "absent",
] as const;

export type EventRole = (typeof eventRoles)[number];
