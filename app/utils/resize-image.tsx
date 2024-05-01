import imageCompression from "browser-image-compression";
import Resizer from "react-image-file-resizer";

export async function resizeFile(file: File, isMinSizeRequired = true) {
  let newFile: File;
  if(isMinSizeRequired){
    let fileType = "JPEG";
    switch (file.type) {
      case "image/png":
        fileType = "PNG";
        break;
    }
  
    const resizeWithSizeLimit = (file: File) =>
      new Promise((resolve) =>
        Resizer.imageFileResizer(
          file,
          100,
          100,
          fileType,
          100,
          0,
          (uri) => {
            resolve(uri);
          },
          "file",
          1000,
          1250
        )
      );
  
    newFile = (await resizeWithSizeLimit(file)) as File;
  } else {
    newFile = file;
  }
  

  const sizeLimitedFile = await imageCompression(newFile, {
    maxSizeMB: 5,
    useWebWorker: true,
    alwaysKeepResolution: true,
  });

  return sizeLimitedFile;
}

export async function cropImage(file: File, width = 1000, height = 1250) {
  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1250;
      const centerX = img.width / 2;
      const centerY = img.height / 2;
      const cropX = centerX - canvas.width / 2;
      const cropY = centerY - canvas.height / 2;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(
        img,
        cropX,
        cropY,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], file.name, {
            type: file.type,
          });
          resolve(newFile);
        } else {
          reject(new Error("Failed to create blob from canvas."));
        }
      }, file.type);
    };
  });
}
