import { describe, it } from "vitest";
import * as fc from "fast-check";
import { clampMotor, DEFAULT_MOTOR_GUARD_BUFFER } from "./motor-guard.js";

describe("clampMotor — property tests", () => {
  it("output always stays within [floor(buffer/2), 255-ceil(buffer/2)] for any DMX value", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 255 }), (value) => {
        const result = clampMotor(value);
        const lo = Math.floor(DEFAULT_MOTOR_GUARD_BUFFER / 2);
        const hi = 255 - Math.ceil(DEFAULT_MOTOR_GUARD_BUFFER / 2);
        return result >= lo && result <= hi;
      }),
    );
  });

  it("output always stays within [floor(buffer/2), 255-ceil(buffer/2)] for any buffer", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 50 }),
        (value, buffer) => {
          const result = clampMotor(value, buffer);
          const lo = Math.floor(buffer / 2);
          const hi = 255 - Math.ceil(buffer / 2);
          return result >= lo && result <= hi;
        },
      ),
    );
  });

  it("midrange values pass through unchanged", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: DEFAULT_MOTOR_GUARD_BUFFER / 2 + 1, max: 255 - DEFAULT_MOTOR_GUARD_BUFFER / 2 - 1 }),
        (value) => {
          return clampMotor(value) === value;
        },
      ),
    );
  });

  it("clampMotor is idempotent — clamping twice equals clamping once", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 255 }), (value) => {
        const once = clampMotor(value);
        const twice = clampMotor(once);
        return once === twice;
      }),
    );
  });
});
