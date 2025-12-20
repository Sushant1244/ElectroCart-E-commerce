export function resolveImageSrc(img) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  if (!img) return { local: null, remote: null };
  if (img.startsWith('http')) return { local: img, remote: img };
  const cleanPath = img.startsWith('/uploads/') ? img : `/uploads/${img}`;
  const lastSlash = cleanPath.lastIndexOf('/');
  const prefix = cleanPath.substring(0, lastSlash + 1);
  const filename = cleanPath.substring(lastSlash + 1);
  const encoded = encodeURIComponent(filename);
  const local = `${window.location.origin}${prefix}${encoded}`; // try local public/uploads first
  const remote = `${API_BASE}${prefix}${encoded}`; // backend fallback
  return { local, remote };
}
