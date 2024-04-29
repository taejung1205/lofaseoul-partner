import imageCompression from 'browser-image-compression';

export async function resizeFile(file: File) {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 5,
    maxWidthOrHeight: 5000,
    useWebWorker: true
  });
  return compressedFile;
}
