"use client";

interface ImageUploadOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

export async function optimizeImageUpload(
  file: File,
  {
    maxWidth,
    maxHeight,
    quality = 0.9,
  }: ImageUploadOptions,
): Promise<File> {
  if (
    typeof createImageBitmap !== "function" ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type)
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxHeight / bitmap.height,
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const basename = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${basename}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
