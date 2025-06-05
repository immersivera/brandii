import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/png'
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
}

export async function convertUrlToFile(url: string): Promise<File | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], 'image.png', { type: 'image/png' });
  } catch (error) {
    console.error('Error converting URL to file:', error);
    return null;
  }
}

export async function optimizeImage(input: File | string): Promise<{ file: File; url: string } | null> {
  try {
    let file: File;
    
    if (typeof input === 'string') {
      const convertedFile = await convertUrlToFile(input);
      if (!convertedFile) return null;
      file = convertedFile;
    } else {
      file = input;
    }

    const compressedFile = await compressImage(file);
    const url = URL.createObjectURL(compressedFile);
    
    return { file: compressedFile, url };
  } catch (error) {
    console.error('Error optimizing image:', error);
    return null;
  }
}