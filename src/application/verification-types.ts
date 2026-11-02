export interface VerificationInputs {
  readonly workspace: string;
  readonly versionFile: string;
  readonly tagPrefix: string;
  readonly tag?: string;
}

export interface VerificationResult {
  readonly version?: string;
  readonly tag?: string;
}

export interface VerificationFailure {
  readonly message: string;
}

export interface VerificationOutcome {
  readonly result: VerificationResult;
  readonly error?: VerificationFailure;
}

export type ReadVersion = (
  workspace: string,
  versionFile: string,
) => Promise<string>;

export interface VerificationDependencies {
  readonly readVersion: ReadVersion;
}
