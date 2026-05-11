import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { appleEase } from '@/lib/motion';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'header';
}

const ThemeToggle = ({ className, variant = 'default' }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-9 w-9 shrink-0 rounded-lg transition-colors duration-200',
        variant === 'header' && 'text-white/50 hover:text-white hover:bg-white/10',
        className
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {!mounted ? (
        <span className="inline-block h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'dark' : 'light'}
            initial={{ opacity: 0, rotate: -28, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 28, scale: 0.85 }}
            transition={{ duration: 0.3, ease: appleEase }}
            className="inline-flex"
            aria-hidden
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.span>
        </AnimatePresence>
      )}
    </Button>
  );
};

export default ThemeToggle;
