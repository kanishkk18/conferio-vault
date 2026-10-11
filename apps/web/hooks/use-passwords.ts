"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { PasswordListQuery } from "@securevault/shared-types";

export interface PasswordListItem {
  id: string;
  title: string;
  username: string;
  url: string | null;
  category: string;
  tags: string[];
  icon: string | null;
  isHidden: boolean;
  encryptedData: string;
  iv: string;
  encryptedDataKey: string;
  keyIv: string;
  createdAt: string;
  updatedAt: string;
}

interface PasswordListResponse {
  items: PasswordListItem[];
  nextCursor: string | null;
}

async function fetchPasswords(
  filters: Omit<PasswordListQuery, "cursor">,
  cursor?: string | null
): Promise<PasswordListResponse> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.tag) params.set("tag", filters.tag);
  params.set("sort", filters.sort);
  params.set("limit", String(filters.limit));
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/passwords?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load passwords");
  return res.json();
}

export function usePasswords(filters: Omit<PasswordListQuery, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["passwords", filters],
    queryFn: ({ pageParam }) => fetchPasswords(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
