"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { UploadQueueFlushTrigger } from "@/components/pwa/upload-queue-flush-trigger";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegistration />
      <UploadQueueFlushTrigger />
      {children}
      <InstallPrompt />
      <Toaster theme="dark" position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
