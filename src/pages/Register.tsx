import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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
          <p className="text-white/50 text-sm">Turn ambition into achievement.</p>
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
            <h2 className="text-lg font-semibold text-card-foreground">Create your account</h2>
            <p className="text-sm text-muted-foreground">Free. No email needed.</p>
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
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
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
