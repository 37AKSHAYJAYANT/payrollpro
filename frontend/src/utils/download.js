/**
 * Utility function to trigger browser download for a Blob object.
 * Eliminates duplicate DOM anchor creation and memory leak risks across the app.
 *
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired downloaded file name
 */
export function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
