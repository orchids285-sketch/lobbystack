import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    // Forced: this runs inside a dark product, and letting a light operating system
    // repaint half of it is not a preference worth honouring here.
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
