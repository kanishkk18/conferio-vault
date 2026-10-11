"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ShareType } from "@securevault/shared-types";
import { wrapKeyForLinkShare, wrapKeyForUserShare } from "@/lib/share-crypto";
import { ensureKeypair } from "@/lib/keypair";

export interface CreateLinkShareParams {
  type: ShareType;
  itemId: string;
  itemKey: CryptoKey;
  expiry: "1h" | "1d" | "7d" | "never";
  maxUses?: number;
  sharePassword?: string;
}

export interface CreateUserShareParams {
  type: ShareType;
  itemId: string;
  itemKey: CryptoKey;
  masterKey: CryptoKey;
  recipientUserId: string;
  recipientPublicKey: string;
}

async function postShare(body: Record<string, unknown>) {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to create share");
  return res.json();
}

export function useCreateLinkShare() {
  return useMutation({
    mutationFn: async (params: CreateLinkShareParams) => {
      const wrap = await wrapKeyForLinkShare(params.itemKey, params.sharePassword);
      const share = await postShare({
        type: params.type,
        itemId: params.itemId,
        expiry: params.expiry,
        maxUses: params.maxUses,
        wrappedKeyForShare: wrap.wrappedKeyForShare,
        shareKeyIv: wrap.shareKeyIv,
        shareKeySalt: wrap.shareKeySalt,
      });

      const url = new URL(`${window.location.origin}/s/${share.token}`);
      if (wrap.fragmentKey) url.hash = `key=${encodeURIComponent(wrap.fragmentKey)}`;
      return { share, url: url.toString() };
    },
  });
}

export function useCreateUserShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateUserShareParams) => {
      const { privateKey } = await ensureKeypair(params.masterKey);
      const wrap = await wrapKeyForUserShare(params.itemKey, privateKey, params.recipientPublicKey);
      return postShare({
        type: params.type,
        itemId: params.itemId,
        expiry: "never",
        recipientUserId: params.recipientUserId,
        wrappedKeyForShare: wrap.wrappedKeyForShare,
        shareKeyIv: wrap.shareKeyIv,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shared-with-me"] }),
  });
}

export function useMyShares() {
  return useQuery({
    queryKey: ["my-shares"],
    queryFn: async () => {
      const res = await fetch("/api/share/mine");
      if (!res.ok) throw new Error("Failed to load shares");
      return (await res.json()).items;
    },
  });
}

export function useRevokeShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/share/mine/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke share");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-shares"] }),
  });
}

export function useSharedWithMe() {
  return useQuery({
    queryKey: ["shared-with-me"],
    queryFn: async () => {
      const res = await fetch("/api/share/shared-with-me");
      if (!res.ok) throw new Error("Failed to load shared items");
      return (await res.json()).items;
    },
  });
}

export async function searchUserByEmail(email: string) {
  const res = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}
