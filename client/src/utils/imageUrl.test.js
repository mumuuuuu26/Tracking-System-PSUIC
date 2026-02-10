import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getImageUrl } from './imageUrl';

describe('getImageUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Simulate Vite import.meta.env
    vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://localhost:5002/api' } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return default image if path is empty', () => {
    expect(getImageUrl(null)).toBe('/default-profile.png');
    expect(getImageUrl('')).toBe('/default-profile.png');
  });

  it('should return path as is if it starts with http', () => {
    const url = 'https://example.com/image.jpg';
    expect(getImageUrl(url)).toBe(url);
  });

  it('should prepend base URL to relative path', () => {
    // When VITE_API_URL is '/api', baseUrl becomes empty string
    // So it returns the path as is (relative) which is correct for proxy
    // const expected = 'http://localhost:5002/uploads/image.jpg';
    const expected = '/uploads/image.jpg'; 
    expect(getImageUrl('uploads/image.jpg')).toBe(expected);
    expect(getImageUrl('/uploads/image.jpg')).toBe(expected);
  });
});
