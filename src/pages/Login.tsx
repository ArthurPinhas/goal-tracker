import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Gradient header */}
      <div className="gradient-header px-4 pt-12 pb-16 text-center relative">
        <div className="absolute right-3 top-3 sm:right-6 sm:top-4">
          <ThemeToggle variant="header" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
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
      <div className="flex-1 flex items-start justify-center px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm bg-card border rounded-2xl shadow-xl p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
