// src/utils/keyboard.js
// Utility functions for handling keyboard keybindings

/**
 * Parse a keybinding string into its components
 * @param {string} keybinding - The keybinding string (e.g., "Ctrl+Enter")
 * @returns {object} - Parsed keybinding with ctrl, meta, shift, alt, and key properties
 */
export function parseKeybinding(keybinding) {
  const parts = keybinding.split("+").map((k) => k.trim().toLowerCase());
  return {
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("cmd") || parts.includes("meta"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key:
      parts.find((k) => !["ctrl", "cmd", "meta", "shift", "alt"].includes(k)) ||
      "enter",
  };
}

/**
 * Check if a keyboard event matches the given keybinding
 * @param {KeyboardEvent} event - The keyboard event
 * @param {object} keys - The parsed keybinding object
 * @returns {boolean} - True if the event matches the keybinding
 */
export function matchesKeybinding(event, keys) {
  return (
    event.key.toLowerCase() === keys.key &&
    !!event.ctrlKey === keys.ctrl &&
    !!event.metaKey === keys.meta &&
    !!event.shiftKey === keys.shift &&
    !!event.altKey === keys.alt
  );
}

/**
 * Build a keybinding string from a keyboard event
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {string} - The keybinding string (e.g., "Ctrl+Shift+A")
 */
export function buildKeybindingFromEvent(event) {
  const keys = [];
  if (event.ctrlKey) keys.push("Ctrl");
  if (event.metaKey) keys.push("Cmd");
  if (event.shiftKey) keys.push("Shift");
  if (event.altKey) keys.push("Alt");
  keys.push(event.key.charAt(0).toUpperCase() + event.key.slice(1));
  return keys.join("+");
}
