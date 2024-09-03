// Somewhat whackadoo headstands to create a string list that we can also use as a type
export const Measurements = ["Temperature", "Humidity"] as const;
export type MeasurementType = (typeof Measurements)[number];

export const Locations = ["Interior", "Exterior"] as const;
export type LocationType = (typeof Locations)[number];

export interface TemperatureAndRelativeHumidity {
  temperature_Celsius: number; // in Celsius
  humidity_RH: number; // in %RH (0-100)
}

export interface TemperatureAndHumidities extends TemperatureAndRelativeHumidity {
  humidity_Absolute: number; // in g/m^3
}

export interface SystemValues<T extends TemperatureAndRelativeHumidity> {
  interior: T;
  exterior: T;
}
