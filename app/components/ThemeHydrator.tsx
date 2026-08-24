"use client";

import { useEffect, useLayoutEffect } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "draftly-theme";

function getStoredTheme(): Theme | null {
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

// 設定ページ以外でも、ブラウザに保存したライト/ダーク設定を復元する。
// RootLayoutはサーバー描画のため安全側でdarkを出すが、クライアント起動時に
// localStorageの値で上書きする。これが無いと、設定でライトにしても
// /home等をリロードした瞬間にdata-theme="dark"へ戻ってしまう。
export function ThemeHydrator() {
  useLayoutEffect(() => {
    applyTheme(getStoredTheme() ?? "dark");
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === "light" || event.newValue === "dark") {
        applyTheme(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
