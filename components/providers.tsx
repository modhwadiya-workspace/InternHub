"use client";

import { SessionProvider } from "next-auth/react";
import { ReduxProvider } from "./providers/ReduxProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <SessionProvider>{children}</SessionProvider>
    </ReduxProvider>
  );
}