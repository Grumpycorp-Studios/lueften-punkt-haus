// Somewhat whackadoo headstands to create a string list that we can also use as a type
export const Measurements = ["Temperature", "Humidity"] as const;
export type MeasurementType = (typeof Measurements)[number];

export const Locations = ["Interior", "Exterior"] as const;
export type LocationType = (typeof Locations)[number];
