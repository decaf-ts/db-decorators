/**
 * @module db-decorators
 * @description Database decorators for TypeScript applications
 * @summary A comprehensive library providing decorators and utilities for database operations, model definitions, validation, and repository patterns in TypeScript applications
 */
import { Metadata } from "@decaf-ts/decoration";

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
export const PACKAGE_NAME = "##PACKAGE##";
Metadata.registerLibrary(PACKAGE_NAME, VERSION);
