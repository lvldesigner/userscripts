// src/utils/logger.js
// Debug log utility with ocean blue style
export const logDebug = (...messages) => {
  const css = "color: #4dd0e1; font-weight: 900;";
  console.debug("%c[GGn Upload Templator]", css, ...messages);
};
