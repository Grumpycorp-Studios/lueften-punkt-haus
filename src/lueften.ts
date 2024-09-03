import { Measurements, MeasurementType, Locations, LocationType } from "./lueftenTypes";

function elementFor<T extends Element>(
  location: LocationType,
  measurement: MeasurementType,
  suffix: string | undefined = undefined,
): T {
  const elementId = `#${location}${measurement}${suffix ?? ""}`;
  const element = document.querySelector<T>(elementId);

  if (!element) {
    throw new Error(`Could not find element ${elementId}`);
  }

  return element;
}

function parseMeasurement(value: string, measurement: MeasurementType): number {
  // Check presence
  if (!value) {
    return NaN;
  }

  // Check parsing
  const parsedValue = Number.parseFloat(value);

  if (Number.isNaN(parsedValue)) {
    return NaN;
  }

  // Check range
  switch (measurement) {
    case "Temperature":
      if (parsedValue < -20 || parsedValue > 60) {
        return NaN;
      }
      break;
    case "Humidity":
      if (parsedValue <= 0 || parsedValue >= 100) {
        return NaN;
      }
      break;
  }

  return parsedValue;
}

function computeResult() {
  // Output
  const resultsSection = document.querySelector<HTMLDivElement>(".results");

  if (!resultsSection) {
    console.error("Results HTML section not found.");
    return;
  }

  function assignOutput(controlId: string, value: string) {
    const controlElement = resultsSection?.querySelector(`#${controlId}`);
    if (controlElement) {
      controlElement.innerHTML = value;
    }
  }

  // Input
  function valueFor(location: LocationType, measurement: MeasurementType): number {
    const element = elementFor<HTMLInputElement>(location, measurement);
    const parsedValue = parseMeasurement(element.value, measurement);

    if (Number.isNaN(parsedValue)) {
      throw new Error();
    }

    return parsedValue;
  }

  // Math
  function coefficientsFor(temperature: number): { a: number; b: number } {
    return Math.fround(temperature) >= 0 ? { a: 7.5, b: 237.3 } : { a: 7.6, b: 240.7 };
  }

  function toKelvin(temperatureInCelsius: number): number {
    return temperatureInCelsius + 273.15;
  }

  // Absolute humidity in g/m^3
  function absoluteHumidityFor(relativeHumidity: number, temperature: number): number {
    // c.f. https://www.wetterochs.de/wetter/feuchte.html
    const coefficients = coefficientsFor(temperature);

    return (
      (((Math.pow(10, 5) * 18.016) / 8314.3) *
        (relativeHumidity / 100.0) *
        6.1078 *
        Math.pow(10, (coefficients.a * temperature) / (coefficients.b + temperature))) /
      toKelvin(temperature)
    );
  }

  function rescaleExteriorHumidityToInteriorTemperature(
    exteriorTemperature: number,
    exteriorHumidity: number,
    interiorTemperature: number,
  ): number {
    const exteriorCoefficients = coefficientsFor(exteriorTemperature);
    const interiorCoefficients = coefficientsFor(interiorTemperature);

    return (
      ((exteriorHumidity *
        Math.pow(10, (exteriorCoefficients.a * exteriorTemperature) / (exteriorCoefficients.b + exteriorTemperature))) /
        Math.pow(10, (interiorCoefficients.a * interiorTemperature) / (interiorCoefficients.b + interiorTemperature))) *
      (toKelvin(interiorTemperature) / toKelvin(exteriorTemperature))
    );
  }

  try {
    const interiorTemperature = valueFor("Interior", "Temperature");
    const interiorHumidity = valueFor("Interior", "Humidity");

    const exteriorTemperature = valueFor("Exterior", "Temperature");
    const exteriorHumidity = valueFor("Exterior", "Humidity");

    const interiorAbsoluteHumidity = absoluteHumidityFor(interiorHumidity, interiorTemperature);
    const exteriorAbsoluteHumidity = absoluteHumidityFor(exteriorHumidity, exteriorTemperature);

    const exteriorHumidityRescaledToInteriorTemperature = rescaleExteriorHumidityToInteriorTemperature(
      exteriorTemperature,
      exteriorHumidity,
      interiorTemperature,
    );

    const postLueftingInteriorHumidity = Math.round(
      0.25 * interiorHumidity + 0.75 * exteriorHumidityRescaledToInteriorTemperature,
    );

    function computeResultText(): string {
      if (Math.abs(interiorAbsoluteHumidity - exteriorAbsoluteHumidity) <= 0.5) {
        return "No l&uuml;ften needed";
      }

      if (interiorAbsoluteHumidity > exteriorAbsoluteHumidity) {
        return ` L&uuml;ften${interiorTemperature <= exteriorTemperature ? ", but it might get warmer" : ""}`;
      }

      if (postLueftingInteriorHumidity <= 65) {
        // Wichtig ist, dass die relative Luftfeuchtigkeit in einem Bereich von 40 bis maximal 60 % liegen sollte,
        // mit der Tendenz, dass je höher die Temperatur ist, bestimmte Luftfeuchten nicht überschritten werden sollten:
        // - Bei 20 °C (80%), 22 °C (70%), 24 °C (62%) und 26 °C (55%), um nur einige Beispiele zu nennen.
        // Behaglichkeitsbereich des Menschen: zwischen 45 % und maximal 55 %.
        const humidityDelta = postLueftingInteriorHumidity - interiorHumidity;

        return `${postLueftingInteriorHumidity <= 55 ? "Briefly" : "Very briefly"} l&uuml;ften, though it will get ${humidityDelta <= 5 ? "somewhat" : "a lot"} more humid`;
      }

      return "No l&uuml;ften needed";
    }

    resultsSection.style.display = "block";

    assignOutput("message", computeResultText());

    assignOutput("interiorTemperature", `${interiorTemperature.toFixed(1)} &deg;C`);
    assignOutput("interiorHumidity", `${interiorHumidity.toFixed(1)} %RH`);
    assignOutput("interiorAbsoluteHumidity", `${interiorAbsoluteHumidity.toFixed(1)} g/m^3`);

    assignOutput("exteriorTemperature", `${exteriorTemperature.toFixed(1)} &deg;C`);
    assignOutput("exteriorHumidity", `${exteriorHumidity.toFixed(1)} %RH`);
    assignOutput("exteriorAbsoluteHumidity", `${exteriorAbsoluteHumidity.toFixed(1)} g/m^3`);
  } catch (e) {
    resultsSection.style.display = "none";
  }
}

export function bindEventListeners() {
  Locations.forEach((location) => {
    Measurements.forEach((measurement) => {
      const inputElement = elementFor<HTMLInputElement>(location, measurement);
      const errorElement = elementFor<HTMLSpanElement>(location, measurement, "Error");

      inputElement.addEventListener("input", () => {
        // Validate
        const isProvided = !!inputElement.value;
        const isValid = !Number.isNaN(parseMeasurement(inputElement.value, measurement));

        errorElement.style.visibility = isProvided && !isValid ? "visible" : "hidden";

        // Recompute
        computeResult();
      });
    });
  });
}

bindEventListeners();
