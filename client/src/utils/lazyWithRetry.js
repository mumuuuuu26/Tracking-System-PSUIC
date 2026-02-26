import { lazy } from "react";

const LAZY_RETRY_KEY = "__lazy_chunk_retry_once__";

export const isChunkLoadError = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("loading chunk") ||
    message.includes("chunkloaderror")
  );
};

export const lazyWithRetry = (importer) =>
  lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(LAZY_RETRY_KEY);
      }
      return module;
    } catch (error) {
      if (typeof window !== "undefined") {
        const hasRetried = sessionStorage.getItem(LAZY_RETRY_KEY) === "1";
        if (isChunkLoadError(error) && !hasRetried) {
          sessionStorage.setItem(LAZY_RETRY_KEY, "1");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });

