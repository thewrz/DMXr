import { describe, it } from "vitest";
import * as fc from "fast-check";
import {
  brightnessScaleStage,
  whiteExtractionStage,
  type PipelineContext,
} from "./pipeline-stages.js";
import { analyzeFixture } from "./fixture-capabilities.js";
import type { FixtureChannel } from "../types/protocol.js";

const dmxValue = fc.integer({ min: 0, max: 255 });
const brightnessArb = fc.float({ min: 0, max: 1, noNaN: true });

function makeRgbCtx(r: number, g: number, b: number, brightness: number): PipelineContext {
  const channels: FixtureChannel[] = [
    { offset: 0, name: "Red", type: "ColorIntensity", color: "Red", defaultValue: 0 },
    { offset: 1, name: "Green", type: "ColorIntensity", color: "Green", defaultValue: 0 },
    { offset: 2, name: "Blue", type: "ColorIntensity", color: "Blue", defaultValue: 0 },
  ];
  return {
    fixture: {
      id: "prop-test",
      name: "Prop Test",
      mode: "rgb",
      dmxStartAddress: 1,
      channelCount: 3,
      channels,
    },
    caps: analyzeFixture(channels),
    r,
    g,
    b,
    white: 0,
    brightness,
    channels: {},
    gateClosed: false,
  };
}

describe("brightnessScaleStage — property tests", () => {
  it("scaled RGB never exceeds original RGB (brightness ∈ [0,1])", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, brightnessArb, (r, g, b, brightness) => {
        const ctx = makeRgbCtx(r, g, b, brightness);
        const result = brightnessScaleStage(ctx);
        return result.r <= r && result.g <= g && result.b <= b;
      }),
    );
  });

  it("at brightness=1.0, output equals input (identity)", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, (r, g, b) => {
        const ctx = makeRgbCtx(r, g, b, 1.0);
        const result = brightnessScaleStage(ctx);
        return result.r === r && result.g === g && result.b === b;
      }),
    );
  });

  it("at brightness=0.0, all outputs are 0", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, (r, g, b) => {
        const ctx = makeRgbCtx(r, g, b, 0.0);
        const result = brightnessScaleStage(ctx);
        return result.r === 0 && result.g === 0 && result.b === 0;
      }),
    );
  });

  it("gateClosed context passes through unchanged", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, brightnessArb, (r, g, b, brightness) => {
        const ctx = { ...makeRgbCtx(r, g, b, brightness), gateClosed: true };
        const result = brightnessScaleStage(ctx);
        return result === ctx;
      }),
    );
  });
});

describe("whiteExtractionStage — property tests", () => {
  function makeRgbwCtx(r: number, g: number, b: number): PipelineContext {
    const channels: FixtureChannel[] = [
      { offset: 0, name: "Red", type: "ColorIntensity", color: "Red", defaultValue: 0 },
      { offset: 1, name: "Green", type: "ColorIntensity", color: "Green", defaultValue: 0 },
      { offset: 2, name: "Blue", type: "ColorIntensity", color: "Blue", defaultValue: 0 },
      { offset: 3, name: "White", type: "ColorIntensity", color: "White", defaultValue: 0 },
    ];
    return {
      fixture: {
        id: "prop-test-rgbw",
        name: "Prop Test RGBW",
        mode: "rgbw",
        dmxStartAddress: 1,
        channelCount: 4,
        channels,
      },
      caps: analyzeFixture(channels),
      r,
      g,
      b,
      white: 0,
      brightness: 1.0,
      channels: {},
      gateClosed: false,
    };
  }

  it("r+white ≤ original r (white comes from subtracting minimum)", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, (r, g, b) => {
        const ctx = makeRgbwCtx(r, g, b);
        const result = whiteExtractionStage(ctx);
        // After extraction: result.r + result.white === original r
        return result.r + result.white === r;
      }),
    );
  });

  it("white = min(r,g,b) before extraction", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, (r, g, b) => {
        const ctx = makeRgbwCtx(r, g, b);
        const result = whiteExtractionStage(ctx);
        return result.white === Math.min(r, g, b);
      }),
    );
  });

  it("at least one of (r,g,b) is 0 after extraction", () => {
    fc.assert(
      fc.property(dmxValue, dmxValue, dmxValue, (r, g, b) => {
        const ctx = makeRgbwCtx(r, g, b);
        const result = whiteExtractionStage(ctx);
        return result.r === 0 || result.g === 0 || result.b === 0;
      }),
    );
  });
});
