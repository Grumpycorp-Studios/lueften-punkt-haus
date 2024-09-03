import { LueftenRecommendation } from "./lueftenMath";
import { getCurrentLanguage } from "./lueftenLocalizationCore";

export function localizeRecommendationMessage(recommendation: LueftenRecommendation): string {
  switch (getCurrentLanguage()) {
    case "de":
      switch (recommendation.recommendation) {
        case "not-required":
          return "Nein (etwa gleiche Feuchtigkeiten innen und au&szlig;en)";

        case "not-useful":
          return "NITCH l&uuml;ften";

        case "should-lueft":
          let message = "";

          switch (recommendation.recommendedDuration) {
            case "brief":
              message += "Kurzes l&uuml;ften m&ouml;glich";
              break;

            case "very-brief":
              message += "Sehr kurzes l&uuml;ften m&ouml;glich";
              break;

            case "normal":
              message = "L&uuml;ften";
              break;
          }

          switch (recommendation.mightGetMore) {
            case "humid":
              message += `, aber es wird dadurch ${recommendation.mightGetMore_Amount === "a-lot" ? "viel" : "etwas"} feuchter`;
              break;

            case "warm":
              message += `, aber es wird dadurch w&auml;rmer`;
              break;
          }

          return message;
      }

    case "en":
      switch (recommendation.recommendation) {
        case "not-required":
          return "No (no ventilating needed)";

        case "not-useful":
          return "No (ventilating would not be useful)";

        case "should-lueft":
          let message = "Should ventilate";

          switch (recommendation.recommendedDuration) {
            case "brief":
              message += " (briefly)";
              break;

            case "very-brief":
              message += " (very briefly)";
              break;

            case "normal":
              break; // do nothing
          }

          switch (recommendation.mightGetMore) {
            case "humid":
              message += ` (but it might get ${recommendation.mightGetMore_Amount === "a-lot" ? "a lot" : "somewhat"} more humid)`;
              break;

            case "warm":
              message += ` (but it might get warmer)`;
              break;
          }

          return message;
      }
  }
}
