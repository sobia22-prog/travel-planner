const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

/**
 * Get image URL from Strapi media object
 * Strapi v5 returns images as objects with url, formats, etc.
 */
export function getStrapiImageUrl(image: any): string | null {
  if (!image) return null;
  
  // If it's already a URL string
  if (typeof image === "string") {
    return image.startsWith("http") ? image : `${API_URL}${image}`;
  }
  
  // If it's a Strapi media object
  if (image.url) {
    return image.url.startsWith("http") ? image.url : `${API_URL}${image.url}`;
  }
  
  // If it's nested in data
  if (image.data?.url) {
    const url = image.data.url;
    return url.startsWith("http") ? url : `${API_URL}${url}`;
  }
  
  return null;
}

/**
 * Get thumbnail or small format if available
 */
export function getStrapiThumbnail(image: any): string | null {
  if (!image) return null;
  
  const fullUrl = getStrapiImageUrl(image);
  if (!fullUrl) return null;
  
  // Try to get thumbnail format
  if (image.formats?.thumbnail?.url) {
    const thumbUrl = image.formats.thumbnail.url;
    return thumbUrl.startsWith("http") ? thumbUrl : `${API_URL}${thumbUrl}`;
  }
  
  if (image.data?.formats?.thumbnail?.url) {
    const thumbUrl = image.data.formats.thumbnail.url;
    return thumbUrl.startsWith("http") ? thumbUrl : `${API_URL}${thumbUrl}`;
  }
  
  return fullUrl;
}



