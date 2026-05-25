import sharp from "sharp";

/**
 * Configuration for image compression
 */
const IMAGE_COMPRESSION_CONFIG = {
  // Maximum dimensions (width or height)
  maxDimension: 1920,

  // Quality settings per format
  jpeg: {
    quality: 85,
    progressive: true,
  },
  png: {
    quality: 85,
    compressionLevel: 9,
  },
  webp: {
    quality: 85,
  },

  // Minimum file size to compress (in bytes)
  // Don't compress images smaller than 100KB
  minSizeToCompress: 100 * 1024,
};

/**
 * Compress an image buffer
 * @param buffer - Original image buffer
 * @param mimeType - Original MIME type
 * @returns Compressed image buffer and new MIME type
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string; originalSize: number; compressedSize: number }> {
  const originalSize = buffer.length;

  // Skip compression for small images
  if (originalSize < IMAGE_COMPRESSION_CONFIG.minSizeToCompress) {
    return {
      buffer,
      mimeType,
      originalSize,
      compressedSize: originalSize,
    };
  }

  try {
    let image = sharp(buffer);

    // Get image metadata
    const metadata = await image.metadata();

    // Resize if needed (maintain aspect ratio)
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > IMAGE_COMPRESSION_CONFIG.maxDimension ||
        metadata.height > IMAGE_COMPRESSION_CONFIG.maxDimension)
    ) {
      image = image.resize(IMAGE_COMPRESSION_CONFIG.maxDimension, IMAGE_COMPRESSION_CONFIG.maxDimension, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let compressedBuffer: Buffer;
    let outputMimeType: string;

    // Compress based on format
    if (mimeType.includes("png")) {
      // PNG: preserve transparency
      compressedBuffer = await image
        .png({
          quality: IMAGE_COMPRESSION_CONFIG.png.quality,
          compressionLevel: IMAGE_COMPRESSION_CONFIG.png.compressionLevel,
        })
        .toBuffer();
      outputMimeType = "image/png";
    } else if (mimeType.includes("webp")) {
      // WebP: already efficient
      compressedBuffer = await image
        .webp({
          quality: IMAGE_COMPRESSION_CONFIG.webp.quality,
        })
        .toBuffer();
      outputMimeType = "image/webp";
    } else {
      // Default to JPEG for all other formats (including JPEG, BMP, TIFF, etc.)
      compressedBuffer = await image
        .jpeg({
          quality: IMAGE_COMPRESSION_CONFIG.jpeg.quality,
          progressive: IMAGE_COMPRESSION_CONFIG.jpeg.progressive,
        })
        .toBuffer();
      outputMimeType = "image/jpeg";
    }

    const compressedSize = compressedBuffer.length;
    const savingsPercent = ((originalSize - compressedSize) / originalSize) * 100;

    console.log(
      `[ImageCompression] ${mimeType} → ${outputMimeType}: ` +
        `${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB ` +
        `(saved ${savingsPercent.toFixed(1)}%)`
    );

    return {
      buffer: compressedBuffer,
      mimeType: outputMimeType,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    console.error("[ImageCompression] Error compressing image:", error);
    // Return original if compression fails
    return {
      buffer,
      mimeType,
      originalSize,
      compressedSize: originalSize,
    };
  }
}

/**
 * Check if a MIME type is an image that should be compressed
 */
export function shouldCompressImage(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") &&
    !mimeType.includes("svg") && // Don't compress SVG (it's already optimized)
    !mimeType.includes("gif")
  ); // Don't compress GIF (might be animated)
}