declare module "expo-document-picker" {
  export function getDocumentAsync(options?: any): Promise<any>;
}

declare module "expo-file-system" {
  export const documentDirectory: string | null;
  export function copyAsync(options: {
    from: string;
    to: string;
  }): Promise<void>;
  export function readDirectoryAsync(dirUri: string): Promise<string[]>;
}

declare module "*.png" {
  const value: number;
  export default value;
}

declare module "*.jpg" {
  const value: number;
  export default value;
}

declare module "*.jpeg" {
  const value: number;
  export default value;
}
