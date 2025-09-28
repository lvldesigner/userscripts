// Default configuration - can be overridden by user settings
export const DEFAULT_CONFIG = {
  TARGET_FORM_SELECTOR: "#upload_table",
  SUBMIT_KEYBINDING: true,
  CUSTOM_FIELD_SELECTORS: [],
  IGNORED_FIELDS_BY_DEFAULT: [
    "linkgroup",
    "groupid",
    "apikey",
    "type",
    "amazonuri",
    "googleplaybooksuri",
    "goodreadsuri",
    "isbn",
    "scan_dpi",
    "other_dpi",
    "release_desc",
    "anonymous",
    "dont_check_rules",
    "title",
    "tags",
    "image",
    "gameswebsiteuri",
    "wikipediauri",
    "album_desc",
    "submit_upload",
  ],
};

// Debug log utility with ocean blue style
export const logDebug = (...messages) => {
  const css = "color: #4dd0e1; font-weight: 900;";
  console.debug("%c[GGn Upload Templator]", css, ...messages);
};