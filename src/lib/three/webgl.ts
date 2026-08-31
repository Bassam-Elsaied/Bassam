export type WebGLSupport = {
  supported: boolean;
  /** 2 for WebGL2, 1 for WebGL1, 0 when unavailable. */
  version: 0 | 1 | 2;
};

const UNSUPPORTED: WebGLSupport = { supported: false, version: 0 };

/**
 * Probes for WebGL without mounting a renderer.
 *
 * The probe context is explicitly released — browsers cap the number of
 * live contexts, and holding one here could starve the real canvas.
 * Any failure resolves to "unsupported", which routes the visitor to the
 * plain document rather than to an error.
 */
export function detectWebGL(): WebGLSupport {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return UNSUPPORTED;
  }

  try {
    const canvas = document.createElement("canvas");

    const gl2 = canvas.getContext("webgl2");
    if (gl2) {
      release(gl2);
      return { supported: true, version: 2 };
    }

    const gl1 =
      canvas.getContext("webgl") ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (gl1) {
      release(gl1);
      return { supported: true, version: 1 };
    }
  } catch {
    return UNSUPPORTED;
  }

  return UNSUPPORTED;
}

function release(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const ext = gl.getExtension("WEBGL_lose_context");
  ext?.loseContext();
}
