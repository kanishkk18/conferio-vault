"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FlushResult {
  id: string;
  fileName: string;
  success: boolean;
  error?: string;
}

export function UploadQueueFlushTrigger() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const flush = () => {
      navigator.serviceWorker?.controller?.postMessage("FLUSH_UPLOAD_QUEUE");
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "UPLOAD_QUEUE_FLUSHED") return;
      const results: FlushResult[] = event.data.results;
      const succeeded = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      if (succeeded.length > 0) {
        toast.success(
          succeeded.length === 1
            ? `${succeeded[0]!.fileName} finished uploading`
            : `${succeeded.length} queued files finished uploading`
        );
        queryClient.invalidateQueries({ queryKey: ["media"] });
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} queued upload(s) still couldn't complete — will retry later.`);
      }
    };

    window.addEventListener("online", flush);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    // Also try once on mount, in case the app was opened while already online with a stale queue.
    if (navigator.onLine) flush();

    return () => {
      window.removeEventListener("online", flush);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [queryClient]);

  return null;
}
