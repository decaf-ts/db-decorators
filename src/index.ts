/**
 * @module db-decorators
 * @description Database decorators for TypeScript applications
 * @summary A comprehensive library providing decorators and utilities for database operations, model definitions, validation, and repository patterns in TypeScript applications
 */
import { Metadata } from "@decaf-ts/decoration";
import "./validation";

export * from "./identity";
export * from "./interfaces";
export * from "./model";
export * from "./operations";
export * from "./overrides";
export * from "./repository";
export * from "./validation";

/**
 * @description Current version of the reflection package
 * @summary Stores the semantic version number of the package
 * @const VERSION
 * @memberOf module:db-decorators
 */
export const VERSION = "##VERSION##";

/**
 * @description Represents the current commit hash of the module build.
 * @summary Stores the current git commit hash for the package. The build replaces
 * the placeholder with the actual commit hash at publish time.
 * @const COMMIT
 */
export const COMMIT = "##COMMIT##";

/**
 * @description Represents the full version string of the module.
 * @summary Stores the semver version and commit hash for the package.
 * The build replaces the placeholder with the actual `<version>-<commit>` value at publish time.
 * @const FULL_VERSION
 */
export const FULL_VERSION = "##FULL_VERSION##";

export const PACKAGE_NAME = "##PACKAGE##";
Metadata.registerLibrary(PACKAGE_NAME, VERSION);
