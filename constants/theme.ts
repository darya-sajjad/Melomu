// AFTER:
export type Colors = {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  active: string;
};

export const darkColors: Colors = {
  background: "#1B4965", // Main screen background
  surface: "#62B6CB", // Card backgrounds, player controls row
  primary: "#BEE9E8", // Accent buttons, active tab icon, sliders
  text: "#F5F5F5", // Main song titles, headers
  textSecondary: "#BEE9E8", // Artist names, duration timestamps
  border: "#62B6CB", // Subtle divider lines
  active: "#c762cb",
};

export const lightColors: Colors = {
  background: "#F5F6F8", // Soft off-white / light cool grey background
  surface: "#FFFFFF", // Card, container, and modal backgrounds
  primary: "#181A20", // Deep charcoal for main buttons, titles, and key accents
  text: "#0D0E12", // Crisp dark text for track names and headings
  textSecondary: "#8C919E", // Muted grey for artist names, durations, and inactive icons
  border: "#E5E7EB", // Light subtle dividers and borders
  active: "#181A20", // Active state color (matches primary button styling)
};
