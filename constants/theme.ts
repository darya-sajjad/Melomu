// AFTER:
export type Colors = {
  background: string;
  surface: string;
  primary: string;
  text: string;
  texttwo: string;
  textSecondary: string;
  border: string;
  active: string;
};

export const darkColors: Colors = {
  background: "#0f0f0f", //Main Background #EBA2b9 #F9EBF2 #BF3054 #260309 #930507 #CFE9DE
  surface: "#260309",
  primary: "#EBA2b9",
  text: "#F9EBF2", //Main Text and Icons
  texttwo: "#260309",
  textSecondary: "#727272", //SubText
  border: "#EBA2b9",
  active: "#BF3054",
};

export const lightColors: Colors = {
  background: "#fcfcfc", //Main Background #EBA2b9 #F9EBF2 #BF3054 #260309 #930507 #CFE9DE
  surface: "#EBA2b9",
  primary: "#260309",
  text: "#260309", //Main Text and Icons
  texttwo: "#F9EBF2",
  textSecondary: "#727272", //SubText
  border: "#EBA2b9",
  active: "#BF3054",
};
