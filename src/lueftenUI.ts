import {
  Measurements,
  MeasurementType,
  Locations,
  LocationType,
  TemperatureAndRelativeHumidity,
  TemperatureAndHumidities,
  SystemValues,
} from "./lueftenTypes";

import { withAbsoluteHumidity, rescaleExteriorHumidityToInteriorTemperature } from "./lueftenMath";

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
  // Prepare output
  const resultsSection = document.querySelector<HTMLDivElement>(".results");

  if (!resultsSection) {
    console.error("Results HTML section not found.");
    return;
  }

  // Prepare input
  function valueForLocationAndMeasurement(location: LocationType, measurement: MeasurementType): number {
    const element = elementFor<HTMLInputElement>(location, measurement);
    const parsedValue = parseMeasurement(element.value, measurement);

    if (Number.isNaN(parsedValue)) {
      throw new Error();
    }

    return parsedValue;
  }

  function valueForLocation(location: LocationType): TemperatureAndRelativeHumidity {
    return {
      temperature_Celsius: valueForLocationAndMeasurement(location, "Temperature"),
      humidity_RH: valueForLocationAndMeasurement(location, "Humidity"),
    };
  }

  try {
    // Retrieve values from input controls
    const systemValues: SystemValues<TemperatureAndHumidities> = {
      interior: withAbsoluteHumidity(valueForLocation("Interior")),
      exterior: withAbsoluteHumidity(valueForLocation("Exterior")),
    };

    const exteriorHumidityRescaledToInteriorTemperature = rescaleExteriorHumidityToInteriorTemperature(systemValues);

    const postLueftingInteriorHumidity = Math.round(
      0.25 * systemValues.interior.humidity_RH + 0.75 * exteriorHumidityRescaledToInteriorTemperature,
    );

    function computeResultText(): string {
      if (Math.abs(systemValues.interior.humidity_Absolute - systemValues.exterior.humidity_Absolute) <= 0.5) {
        return "No l&uuml;ften needed";
      }

      if (systemValues.interior.humidity_Absolute > systemValues.exterior.humidity_Absolute) {
        return ` L&uuml;ften${systemValues.interior.temperature_Celsius <= systemValues.exterior.temperature_Celsius ? ", but it might get warmer" : ""}`;
      }

      if (postLueftingInteriorHumidity <= 65) {
        // Wichtig ist, dass die relative Luftfeuchtigkeit in einem Bereich von 40 bis maximal 60 % liegen sollte,
        // mit der Tendenz, dass je höher die Temperatur ist, bestimmte Luftfeuchten nicht überschritten werden sollten:
        // - Bei 20 °C (80%), 22 °C (70%), 24 °C (62%) und 26 °C (55%), um nur einige Beispiele zu nennen.
        // Behaglichkeitsbereich des Menschen: zwischen 45 % und maximal 55 %.
        const humidityDelta = postLueftingInteriorHumidity - systemValues.interior.humidity_RH;

        return `${postLueftingInteriorHumidity <= 55 ? "Briefly" : "Very briefly"} l&uuml;ften, though it will get ${humidityDelta <= 5 ? "somewhat" : "a lot"} more humid`;
      }

      return "L&uuml;ften not beneficial";
    }

    // Populate output
    function assignOutput(controlId: string, value: string) {
      const controlElement = resultsSection?.querySelector(`#${controlId}`);
      if (controlElement) {
        controlElement.innerHTML = value;
      }
    }

    assignOutput("message", computeResultText());

    assignOutput("interiorTemperature", `${systemValues.interior.temperature_Celsius.toFixed(1)} &deg;C`);
    assignOutput("interiorHumidity", `${systemValues.interior.humidity_RH.toFixed(1)} %RH`);
    assignOutput("interiorAbsoluteHumidity", `${systemValues.interior.humidity_Absolute.toFixed(1)} g/m^3`);

    assignOutput("exteriorTemperature", `${systemValues.exterior.temperature_Celsius.toFixed(1)} &deg;C`);
    assignOutput("exteriorHumidity", `${systemValues.exterior.humidity_RH.toFixed(1)} %RH`);
    assignOutput("exteriorAbsoluteHumidity", `${systemValues.exterior.humidity_Absolute.toFixed(1)} g/m^3`);

    // Show output
    resultsSection.style.display = "block";
  } catch (e) {
    // Hide output
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
