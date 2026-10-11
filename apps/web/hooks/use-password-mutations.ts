"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VaultEncryption } from "@securevault/encryption";
import type { CreatePasswordInput, PasswordCategory } from "@securevault/shared-types";

export interface PasswordFormInput {
  title: string;
  username: string;
  password: string;
  notes?: string;
  url?: string;
  category: PasswordCategory;
  tags: string[];
  isHidden: boolean;
}

async function encryptPasswordPayload(
  input: PasswordFormInput,
  masterKey: CryptoKey
): Promise<CreatePasswordInput> {
  const itemKey = await VaultEncryption.generateItemKey();
  const { ciphertext, iv } = await VaultEncryption.encryptJSON(
    { password: input.password, notes: input.notes ?? "" },
    itemKey
  );
  const wrapped = await VaultEncryption.wrapItemKey(itemKey, masterKey);

  return {
    title: input.title,
    username: input.username,
    url: input.url || "",
    category: input.category,
    tags: input.tags,
    isHidden: input.isHidden,
    encryptedData: ciphertext,
    iv,
    encryptedDataKey: wrapped.wrapped,
    keyIv: wrapped.iv,
  };
}

export function useCreatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      masterKey,
    }: {
      input: PasswordFormInput;
      masterKey: CryptoKey;
    }) => {
      const payload = await encryptPasswordPayload(input, masterKey);
      const res = await fetch("/api/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
    },
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      masterKey,
    }: {
      id: string;
      input: PasswordFormInput;
      masterKey: CryptoKey;
    }) => {
      const payload = await encryptPasswordPayload(input, masterKey);
      const res = await fetch(`/api/passwords/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to update password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
    },
  });
}

export function useDeletePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/passwords/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to delete password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
    },
  });
}
