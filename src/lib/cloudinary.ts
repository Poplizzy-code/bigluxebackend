import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function getWatermarkedUrl(publicId: string): string {
  const studioName = process.env.STUDIO_NAME || "BigLuxe Studio";
  return cloudinary.url(publicId, {
    transformation: [
      { width: 1200, crop: "limit", quality: "auto", fetch_format: "auto" },
      {
        overlay: {
          font_family: "Arial",
          font_size: 32,
          font_weight: "bold",
          text: studioName,
        },
        color: "#D4AF3766",
        gravity: "south_east",
        x: 20,
        y: 20,
        opacity: 40,
      },
    ],
  });
}

export function getOriginalUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
}

export function getThumbnailUrl(publicId: string, width = 400): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, crop: "fill", quality: "auto:eco", fetch_format: "auto" },
    ],
  });
}
