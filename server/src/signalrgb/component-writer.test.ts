import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  buildComponent,
  getComponentsDir,
  writeComponentFile,
  syncAllComponents,
} from "./component-writer.js";
import type { FixtureConfig } from "../types/protocol.js";

const testFixture = {
  id: "test-id-1234",
  name: "Test PAR",
  dmxStartAddress: 1,
  channelCount: 3,
  channels: [
    { offset: 0, name: "Red", type: "ColorIntensity", color: "Red", defaultValue: 0 },
    { offset: 1, name: "Green", type: "ColorIntensity", color: "Green", defaultValue: 0 },
    { offset: 2, name: "Blue", type: "ColorIntensity", color: "Blue", defaultValue: 0 },
  ],
} as unknown as FixtureConfig;

const testFixture2 = {
  id: "test-id-5678",
  name: "Test Mover",
  dmxStartAddress: 10,
  channelCount: 5,
  channels: [
    { offset: 0, name: "Pan", type: "Pan", defaultValue: 128 },
    { offset: 1, name: "Tilt", type: "Tilt", defaultValue: 128 },
    { offset: 2, name: "Red", type: "ColorIntensity", color: "Red", defaultValue: 0 },
    { offset: 3, name: "Green", type: "ColorIntensity", color: "Green", defaultValue: 0 },
    { offset: 4, name: "Blue", type: "ColorIntensity", color: "Blue", defaultValue: 0 },
  ],
} as unknown as FixtureConfig;

// ── buildComponent ──────────────────────────────────────────

describe("buildComponent", () => {
  it("produces correct metadata and address-independent fields", () => {
    const component = buildComponent(testFixture);

    expect(component.ProductName).toBe("DMXr Test PAR");
    expect(component.Brand).toBe("DMXr");
    expect(component.Type).toBe("DMX Fixture");
    expect(component.LedCount).toBe(1);
    expect(component.Width).toBe(1);
    expect(component.Height).toBe(1);
    expect(component.LedMapping).toEqual([0]);
    expect(component.LedCoordinates).toEqual([[0, 0]]);
    expect(component.LedNames).toHaveLength(1);
  });

  it("encodes fixture name and DMX address into display fields", () => {
    const component = buildComponent(testFixture);

    expect(component.DisplayName).toBe("Test PAR (DMX 1)");
  });
});

// ── getComponentsDir ────────────────────────────────────────

describe("getComponentsDir", () => {
  const originalEnv = process.env["SIGNALRGB_COMPONENTS_DIR"];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env["SIGNALRGB_COMPONENTS_DIR"] = originalEnv;
    } else {
      delete process.env["SIGNALRGB_COMPONENTS_DIR"];
    }
  });

  it("returns env var when SIGNALRGB_COMPONENTS_DIR is set", () => {
    process.env["SIGNALRGB_COMPONENTS_DIR"] = "/custom/components";
    expect(getComponentsDir()).toBe("/custom/components");
  });

  it("returns default path when env var is not set", () => {
    delete process.env["SIGNALRGB_COMPONENTS_DIR"];
    const dir = getComponentsDir();
    expect(dir).toContain("WhirlwindFX");
    expect(dir).toContain("Components");
  });
});

// ── writeComponentFile ──────────────────────────────────────

describe("writeComponentFile", () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("writes a JSON file to the given directory", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dmxr-cw-test-"));
    const filePath = await writeComponentFile(testFixture, tempDir);

    const files = await readdir(tempDir);
    expect(files).toHaveLength(1);
    expect(filePath).toContain(tempDir);
  });

  it("file name is sanitized (special chars removed)", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dmxr-cw-test-"));

    const weirdFixture = {
      ...testFixture,
      name: "Test/PAR<>:\"?*",
    } as unknown as FixtureConfig;

    const filePath = await writeComponentFile(weirdFixture, tempDir);
    const files = await readdir(tempDir);

    // No special chars in file name
    expect(files[0]).not.toMatch(/[/<>:"?*]/);
    expect(filePath).toContain(".json");
  });

  it("file contains valid JSON matching buildComponent output", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dmxr-cw-test-"));
    const filePath = await writeComponentFile(testFixture, tempDir);

    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const expected = buildComponent(testFixture);

    expect(parsed).toEqual(expected);
  });
});

// ── syncAllComponents ───────────────────────────────────────

describe("syncAllComponents", () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns paths array matching fixture count", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dmxr-cw-test-"));
    const fixtures = [testFixture, testFixture2];
    const paths = await syncAllComponents(fixtures, tempDir);

    expect(paths).toHaveLength(2);
  });

  it("creates all component files", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dmxr-cw-test-"));
    const fixtures = [testFixture, testFixture2];
    await syncAllComponents(fixtures, tempDir);

    const files = await readdir(tempDir);
    expect(files).toHaveLength(2);
  });
});
