import type { StyleSpecification } from "maplibre-gl";

const NUMERIC_COMPARISONS = new Set(["<", "<=", ">", ">="]);

type Expression = unknown[];

function isGet(value: unknown): value is ["get", string] {
  return Array.isArray(value) && value[0] === "get" && value.length === 2 && typeof value[1] === "string";
}

/**
 * Rewrites `["<=", ["get", "ref_length"], 6]` as "if the property is a
 * number, compare it; otherwise false".
 *
 * OpenFreeMap's style compares road-shield properties that many roads
 * don't have. MapLibre already treats those comparisons as false, but it
 * logs a warning for each one on every page load. The guard gives the same
 * result without the warning, and leaves every other expression untouched.
 */
function guardExpression(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  const expression = value.map(guardExpression) as Expression;
  const [operator, left, right] = expression;
  if (typeof operator === "string" && NUMERIC_COMPARISONS.has(operator) && expression.length === 3) {
    const property = isGet(left) && typeof right === "number" ? left : isGet(right) && typeof left === "number" ? right : null;
    if (property) {
      return ["case", ["==", ["typeof", property], "number"], expression, false];
    }
  }
  return expression;
}

export function guardNullComparisons(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) =>
      "filter" in layer && layer.filter
        ? ({ ...layer, filter: guardExpression(layer.filter) } as typeof layer)
        : layer,
    ),
  };
}
