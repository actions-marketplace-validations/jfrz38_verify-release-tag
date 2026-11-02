import { describe, expect, test, vi } from "vitest";

import { verifyReleaseTag } from "../../../src/application/verify-release-tag.js";
import type {
  ReadVersion,
  VerificationInputs,
} from "../../../src/application/verification-types.js";

const defaultInputs: VerificationInputs = {
  workspace: "/workspace",
  versionFile: "package.json",
  tagPrefix: "v",
};

describe("verifyReleaseTag", () => {
  test.each([
    ["the conventional prefix", "v", "1.2.3", "v1.2.3"],
    ["an empty prefix", "", "1.2.3", "1.2.3"],
    ["a custom prefix", "release/", "1.2.3", "release/1.2.3"],
    ["a prerelease version", "v", "1.2.3-rc.1+build.5", "v1.2.3-rc.1+build.5"],
    ["untrimmed values", " Release-", " 1.2.3 ", " Release- 1.2.3 "],
  ])(
    "derives the exact tag with %s",
    async (_description, tagPrefix, version, tag) => {
      const outcome = await verifyReleaseTag(
        { ...defaultInputs, tagPrefix },
        { readVersion: resolvesVersion(version) },
      );

      expect(outcome).toEqual({
        result: { version, tag },
      });
    },
  );

  test("passes the workspace and configured file to the version reader", async () => {
    const readVersion = vi.fn<ReadVersion>().mockResolvedValue("1.2.3");

    await verifyReleaseTag(
      {
        ...defaultInputs,
        workspace: "/other-workspace",
        versionFile: "packages/app.json",
      },
      { readVersion },
    );

    expect(readVersion).toHaveBeenCalledOnce();
    expect(readVersion).toHaveBeenCalledWith(
      "/other-workspace",
      "packages/app.json",
    );
  });

  test.each([
    ["omitted", undefined],
    ["empty", ""],
    ["identical", "v1.2.3"],
  ])("accepts an %s explicit tag", async (_description, explicitTag) => {
    const inputs: VerificationInputs =
      explicitTag === undefined
        ? defaultInputs
        : { ...defaultInputs, tag: explicitTag };

    const outcome = await verifyReleaseTag(inputs, {
      readVersion: resolvesVersion("1.2.3"),
    });

    expect(outcome).toEqual({
      result: { version: "1.2.3", tag: "v1.2.3" },
    });
  });

  test.each([
    ["a different tag", "v1.2.4"],
    ["a case-only difference", "V1.2.3"],
  ])("rejects %s without normalizing it", async (_description, explicitTag) => {
    const outcome = await verifyReleaseTag(
      { ...defaultInputs, tag: explicitTag },
      { readVersion: resolvesVersion("1.2.3") },
    );

    expect(outcome).toEqual({
      result: { version: "1.2.3", tag: "v1.2.3" },
      error: {
        message: `Requested release tag "${explicitTag}" does not match the expected tag "v1.2.3" derived from version "1.2.3".`,
      },
    });
  });

  test("returns a structured failure when the version cannot be read", async () => {
    const outcome = await verifyReleaseTag(defaultInputs, {
      readVersion: vi
        .fn<ReadVersion>()
        .mockRejectedValue(
          new Error('Version file "package.json" does not exist.'),
        ),
    });

    expect(outcome).toEqual({
      result: {},
      error: {
        message: 'Version file "package.json" does not exist.',
      },
    });
  });

  test("does not hide a non-Error failure", async () => {
    const failure = { reason: "unexpected" };

    await expect(
      verifyReleaseTag(defaultInputs, {
        readVersion: vi.fn<ReadVersion>().mockRejectedValue(failure),
      }),
    ).rejects.toBe(failure);
  });
});

function resolvesVersion(version: string): ReadVersion {
  return vi.fn<ReadVersion>().mockResolvedValue(version);
}
