import {
  Measurements,
  MeasurementType,
  Locations,
  LocationType,
  TemperatureAndRelativeHumidity,
  TemperatureAndHumidities,
  SystemValues,
} from "./lueftenTypes";

import { withAbsoluteHumidity, getRecommendation } from "./lueftenMath";

import { addLanguageChangeListener } from "./lueftenLocalizationCore";

import { initializeLocalizedStrings } from "./lueftenLocalizedStrings";
import { createLanguageSelectors } from "./lueftenLanguageSelectors";
import { localizeRecommendationMessage } from "./lueftenLocalizedRecommendation";

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

    // Math
    const recommendation = getRecommendation(systemValues);

    // Populate output
    function assignOutput(controlId: string, value: string) {
      const controlElement = resultsSection?.querySelector(`#${controlId}`);
      if (controlElement) {
        controlElement.innerHTML = value;
      }
    }

    assignOutput("message", localizeRecommendationMessage(recommendation));

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

function bindEventListeners() {
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

// Bootstrap localization support
initializeLocalizedStrings();
createLanguageSelectors();

addLanguageChangeListener(() => computeResult());
