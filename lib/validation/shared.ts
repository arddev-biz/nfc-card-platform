import { z } from "zod";

export const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;

/** Treats an empty/whitespace-only string as "not provided" before validating. */
export const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const optionalUrl = (label: string, max = 500) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .url(`${label} must be a valid URL, including https://`)
      .max(max)
      .optional()
  );

export const optionalPhone = (label: string, max = 30) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(PHONE_PATTERN, `${label} must be a valid phone number.`)
      .max(max)
      .optional()
  );
