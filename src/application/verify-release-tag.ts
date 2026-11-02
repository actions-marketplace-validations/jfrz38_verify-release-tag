import type {
  VerificationDependencies,
  VerificationInputs,
  VerificationOutcome,
  VerificationResult,
} from "./verification-types.js";

export async function verifyReleaseTag(
  inputs: VerificationInputs,
  dependencies: VerificationDependencies,
): Promise<VerificationOutcome> {
  let version: string;

  try {
    version = await dependencies.readVersion(
      inputs.workspace,
      inputs.versionFile,
    );
  } catch (error: unknown) {
    return failure({}, error);
  }

  const tag = `${inputs.tagPrefix}${version}`;
  const result = { version, tag };

  if (inputs.tag !== undefined && inputs.tag !== "" && inputs.tag !== tag) {
    return {
      result,
      error: {
        message: `Requested release tag "${inputs.tag}" does not match the expected tag "${tag}" derived from version "${version}".`,
      },
    };
  }

  return { result };
}

function failure(
  result: VerificationResult,
  error: unknown,
): VerificationOutcome {
  if (error instanceof Error) {
    return {
      result,
      error: { message: error.message },
    };
  }

  throw error;
}
