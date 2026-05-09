import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { AuthAmbientBackground } from '@/components/AuthAmbientBackground';
import { springContent } from '@/lib/motion';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] min-h-screen overflow-x-clip bg-background flex flex-col relative">
      <AuthAmbientBackground />
      {/* Gradient header */}
      <div className="gradient-header px-4 pt-[max(3rem,calc(env(safe-area-inset-top,0px)+2.5rem))] pb-16 md:pt-12 text-center relative z-10">
        <div className="absolute right-[max(0.75rem,calc(env(safe-area-inset-right,0px)+0.5rem))] top-[max(0.75rem,calc(env(safe-area-inset-top,0px)+0.5rem))] md:right-6 md:top-4">
          <ThemeToggle variant="header" className="h-11 w-11 touch-manipulation md:h-9 md:w-9" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springContent}
          className="space-y-3"
        >
          <div className="goal-float inline-block">
            <Target className="h-12 w-12 text-white/70 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Goal Tracker</h1>
          <p className="text-white/50 text-sm">Your goals. Your progress. Your wins.</p>
        </motion.div>
      </div>

      {/* Form card — overlaps header */}
      <div className="flex-1 flex items-start justify-center px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springContent, delay: 0.08 }}
          className="w-full max-w-sm bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl shadow-black/12 ring-1 ring-border/35 dark:shadow-2xl dark:shadow-black/40 dark:ring-border/45 dark:border-border/55 p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="ui-section-label">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="h-11 rounded-lg app-surface-input transition-shadow duration-300"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="ui-section-label">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-lg app-surface-input transition-shadow duration-300"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="min-h-11 w-full touch-manipulation md:min-h-10" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Registration disabled for private use — uncomment to re-enable:
          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
          */}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
