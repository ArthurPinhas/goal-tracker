import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
      storageKey="goal-tracker-theme"
      themes={['dark', 'light']}
    >
      {children}
    </NextThemesProvider>
  );
}
