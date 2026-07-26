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
  background: "#0f0f0f", // #EBA2b9 #F9EBF2 #BF3054 #260309
  surface: "#260309", // Card backgrounds, player controls row
  primary: "#EBA2b9", // Accent buttons, active tab icon, sliders
  text: "#ffffff", // Main song titles, headers
  textSecondary: "#F9EBF2", // Artist names, duration timestamps
  border: "#EBA2b9", // Subtle divider lines
  active: "#BF3054",
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
