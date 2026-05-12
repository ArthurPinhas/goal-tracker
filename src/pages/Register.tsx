import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { springContent } from '@/lib/motion';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(username, password);
      navigate('/');
    } catch {
      setError('Registration failed. Username may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] min-h-screen overflow-x-clip bg-background flex flex-col relative">
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
          <p className="text-white/50 text-sm">Turn ambition into achievement.</p>
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
            <h2 className="text-lg font-semibold text-card-foreground">Create your account</h2>
            <p className="text-sm text-muted-foreground">Free. No email needed.</p>
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
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="min-h-11 w-full touch-manipulation md:min-h-10" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
