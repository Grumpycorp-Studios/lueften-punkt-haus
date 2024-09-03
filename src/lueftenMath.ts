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

export type LueftenRecommendation_NotRequired = { recommendation: "not-required" };

export type LueftenRecommendation_NotUseful = { recommendation: "not-useful" };

export type LueftenRecommendation_ShouldLueften = {
  recommendation: "should-lueft";
  mightGetMore: "humid" | "warm" | "not-specified";
  mightGetMore_Amount: "somewhat" | "a-lot" | "not-specified";
  recommendedDuration: "normal" | "brief" | "very-brief";
};

export type LueftenRecommendation =
  | LueftenRecommendation_NotRequired
  | LueftenRecommendation_NotUseful
  | LueftenRecommendation_ShouldLueften;

export function getRecommendation(systemValues: SystemValues<TemperatureAndHumidities>): LueftenRecommendation {
  const exteriorHumidityRescaledToInteriorTemperature = rescaleExteriorHumidityToInteriorTemperature(systemValues);

  const postLueftingInteriorHumidity = Math.round(
    0.25 * systemValues.interior.humidity_RH + 0.75 * exteriorHumidityRescaledToInteriorTemperature,
  );

  if (Math.abs(systemValues.interior.humidity_Absolute - systemValues.exterior.humidity_Absolute) <= 0.5) {
    return { recommendation: "not-required" };
  }

  if (systemValues.interior.humidity_Absolute > systemValues.exterior.humidity_Absolute) {
    return {
      recommendation: "should-lueft",
      mightGetMore:
        systemValues.interior.temperature_Celsius <= systemValues.exterior.temperature_Celsius
          ? "warm"
          : "not-specified",
      mightGetMore_Amount: "not-specified",
      recommendedDuration: "normal",
    };
  }

  if (postLueftingInteriorHumidity <= 65) {
    // Wichtig ist, dass die relative Luftfeuchtigkeit in einem Bereich von 40 bis maximal 60 % liegen sollte,
    // mit der Tendenz, dass je höher die Temperatur ist, bestimmte Luftfeuchten nicht überschritten werden sollten:
    // - Bei 20 °C (80%), 22 °C (70%), 24 °C (62%) und 26 °C (55%), um nur einige Beispiele zu nennen.
    // Behaglichkeitsbereich des Menschen: zwischen 45 % und maximal 55 %.
    const humidityDelta = postLueftingInteriorHumidity - systemValues.interior.humidity_RH;

    return {
      recommendation: "should-lueft",
      mightGetMore: "humid",
      mightGetMore_Amount: humidityDelta <= 5 ? "somewhat" : "a-lot",
      recommendedDuration: postLueftingInteriorHumidity <= 55 ? "brief" : "very-brief",
    };
  }

  return { recommendation: "not-useful" };
}
