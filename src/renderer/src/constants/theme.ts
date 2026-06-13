export const THEME_OPTIONS = [
  { value: "light" as const, label: "constants.themeLight" },
  { value: "colorful" as const, label: "constants.themeColorful" },
  { value: "apple" as const, label: "constants.themeApple" },
  { value: "google" as const, label: "constants.themeGoogle" },
];

export const THEME_STORAGE_KEY = "hermes-theme";

export const MARKDOWN_STYLE_OPTIONS = [
  { value: "default", label: "constants.mdStyleDefault" },
  { value: "notion", label: "constants.mdStyleNotion" },
  { value: "material", label: "constants.mdStyleMaterial" },
  { value: "nightowl", label: "constants.mdStyleNightowl" },
  { value: "solarized", label: "constants.mdStyleSolarized" },
] as const;

export type MarkdownStyle = (typeof MARKDOWN_STYLE_OPTIONS)[number]["value"];

export const MARKDOWN_STYLE_STORAGE_KEY = "hermes-md-style";
