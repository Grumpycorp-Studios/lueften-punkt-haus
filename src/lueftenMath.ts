import { TemperatureAndRelativeHumidity, TemperatureAndHumidities, SystemValues } from "./lueftenTypes";

function toKelvin(temperature_Celsius: number): number {
  return temperature_Celsius + 273.15;
}

function coefficientsFor(temperature: number): { a: number; b: number } {
  return Math.fround(temperature) >= 0 ? { a: 7.5, b: 237.3 } : { a: 7.6, b: 240.7 };
}

function absoluteHumidity_TemperaturePowerPartial_For(value: TemperatureAndRelativeHumidity): number {
  const coefficients = coefficientsFor(value.temperature_Celsius);
  return Math.pow(10, (coefficients.a * value.temperature_Celsius) / (coefficients.b + value.temperature_Celsius));
}

function absoluteHumidityFor(value: TemperatureAndRelativeHumidity): number {
  // Absolute humidity in g/m^3
  // - c.f. https://www.wetterochs.de/wetter/feuchte.html
  return (
    (((Math.pow(10, 5) * 18.016) / 8314.3) *
      (value.humidity_RH / 100.0) *
      6.1078 *
      absoluteHumidity_TemperaturePowerPartial_For(value)) /
    toKelvin(value.temperature_Celsius)
  );
}

export function withAbsoluteHumidity(value: TemperatureAndRelativeHumidity): TemperatureAndHumidities {
  return { ...value, humidity_Absolute: absoluteHumidityFor(value) };
}

export function rescaleExteriorHumidityToInteriorTemperature(
  systemValues: SystemValues<TemperatureAndRelativeHumidity>,
): number {
  return (
    systemValues.exterior.humidity_RH *
    (absoluteHumidity_TemperaturePowerPartial_For(systemValues.exterior) /
      absoluteHumidity_TemperaturePowerPartial_For(systemValues.interior)) *
    (toKelvin(systemValues.interior.temperature_Celsius) / toKelvin(systemValues.exterior.temperature_Celsius))
  );
}
