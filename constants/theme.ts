export const darkColors = {
  background: "#1B4965", // Main screen background
  surface: "#BEE9E8", // Card backgrounds, player controls row
  primary: "#62B6CB", // Accent buttons, active tab icon, sliders
  text: "#F5F5F5", // Main song titles, headers
  textSecondary: "#62B6CB", // Artist names, duration timestamps
  border: "#BEE9E8", // Subtle divider lines
};

export const lightColors = {
  background: "#BEE9E8", // Main deep dark screen background
  surface: "#62B6CB", // Dark cards, dark player row
  primary: "#1B4965", // Vibrant pink/neon accent buttons
  text: "#1E1E1E", // Crisp white titles
  textSecondary: "#1B4965", // Grayish artist text
  border: "#62B6CB", // Dark divider lines
};

export type Colors = typeof lightColors;
