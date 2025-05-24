export const sanitizeFileName = (fileName: string): string => {
  // Remove special characters and spaces, keep only alphanumeric, dots, and hyphens
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
};
