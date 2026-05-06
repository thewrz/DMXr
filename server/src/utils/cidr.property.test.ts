import { describe, it } from "vitest";
import * as fc from "fast-check";
import { matchCidr } from "./cidr.js";

const ipv4Arb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

// Generates a random valid IPv4 CIDR with prefix 0-32
const cidrArb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 32 }),
).map(([a, b, c, d, prefix]) => `${a}.${b}.${c}.${d}/${prefix}`);

describe("matchCidr — property tests", () => {
  it("any IP matches /0 (wildcard)", () => {
    fc.assert(
      fc.property(ipv4Arb, (ip) => {
        return matchCidr(ip, ["0.0.0.0/0"]) === true;
      }),
    );
  });

  it("no IP matches an empty allow-list", () => {
    fc.assert(
      fc.property(ipv4Arb, (ip) => {
        return matchCidr(ip, []) === false;
      }),
    );
  });

  it("any IP matches a /32 that is itself", () => {
    fc.assert(
      fc.property(ipv4Arb, (ip) => {
        return matchCidr(ip, [`${ip}/32`]) === true;
      }),
    );
  });

  it("result is boolean for any arbitrary inputs", () => {
    fc.assert(
      fc.property(fc.string(), fc.array(fc.string()), (ip, allowList) => {
        const result = matchCidr(ip, allowList);
        return typeof result === "boolean";
      }),
    );
  });

  it("adding more valid CIDRs never makes a previously-matching IP not match", () => {
    fc.assert(
      fc.property(
        ipv4Arb,
        fc.array(cidrArb, { minLength: 1, maxLength: 5 }),
        cidrArb,
        (ip, list, extra) => {
          const matchedBefore = matchCidr(ip, list);
          const matchedAfter = matchCidr(ip, [...list, extra]);
          // Adding CIDRs can only extend the match set, never shrink it
          return !matchedBefore || matchedAfter;
        },
      ),
    );
  });
});
