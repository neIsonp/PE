"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthInitializer() {
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  return null;
}
