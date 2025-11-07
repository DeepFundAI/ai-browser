/**
 * WebGL Detection Utility
 * Detects if the browser supports WebGL 1.0 or WebGL 2.0
 */

/**
 * Check if WebGL is supported in the current browser
 * @returns {boolean} true if WebGL is available, false otherwise
 */
export function isWebGLSupported(): boolean {
  try {
    // Create a temporary canvas element
    const canvas = document.createElement('canvas');

    // Try to get WebGL context (WebGL 2.0 or 1.0)
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // If we got a context, WebGL is supported
    if (gl && gl instanceof WebGLRenderingContext) {
      return true;
    }

    return false;
  } catch (e) {
    // If any error occurs during detection, assume WebGL is not supported
    console.warn('WebGL detection failed:', e);
    return false;
  }
}

/**
 * Get WebGL version info
 * @returns {string} WebGL version or 'Not supported'
 */
export function getWebGLVersion(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');

    if (gl2) {
      return 'WebGL 2.0';
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      return 'WebGL 1.0';
    }

    return 'Not supported';
  } catch (e) {
    return 'Not supported';
  }
}
