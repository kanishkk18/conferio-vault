"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MediaListQuery } from "@securevault/shared-types";

export interface MediaListItem {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: string;
  encryptedFileKey: string | null;
  keyIv: string | null;
  requiresPassword: boolean;
  viewKeySalt: string | null;
  viewWrappedKey: string | null;
  viewKeyIv: string | null;
  iv: string;
  chunkSize: number;
  chunkCount: number;
  thumbnailIv: string | null;
  storageKey: string;
  thumbnailKey: string | null;
  isHidden: boolean;
  caption: string | null;
  tags: string[];
  uploadedAt: string;
  year: number;
  month: number;
}

interface MediaListResponse {
  items: MediaListItem[];
  nextCursor: string | null;
}

async function fetchMedia(
  filters: Omit<MediaListQuery, "cursor">,
  cursor?: string | null
): Promise<MediaListResponse> {
  const params = new URLSearchParams();
  if (filters.fileType) params.set("fileType", filters.fileType);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month) params.set("month", String(filters.month));
  if (filters.search) params.set("search", filters.search);
  params.set("limit", String(filters.limit));
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/media?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load media");
  return res.json();
}

export function useMedia(filters: Omit<MediaListQuery, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["media", filters],
    queryFn: ({ pageParam }) => fetchMedia(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete file");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
  });
}
