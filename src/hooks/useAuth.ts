import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';

/** App login field is "username"; PocketBase auth uses `name@goaltracker.local`. Accept either form so pasting the full email still works. */
function toEmail(username: string): string {
  const t = username.trim();
  const suffix = '@goaltracker.local';
  if (t.endsWith(suffix)) {
    const before = t.slice(0, -suffix.length);
    if (before.endsWith(suffix)) {
      return before;
    }
    return t;
  }
  return `${t}${suffix}`;
}

/** PocketBase `name` — short handle only, even if the user pasted `user@goaltracker.local`. */
function toUserDisplayName(username: string): string {
  const email = toEmail(username);
  const suffix = '@goaltracker.local';
  if (email.endsWith(suffix)) {
    return email.slice(0, -suffix.length);
  }
  return username.trim();
}

export function useAuth() {
  const [user, setUser] = useState(pb.authStore.record);

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setUser(pb.authStore.record);
    });
  }, []);

  const login = async (username: string, password: string) => {
    await pb.collection('users').authWithPassword(toEmail(username), password);
  };

  const register = async (username: string, password: string) => {
    const email = toEmail(username);
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name: toUserDisplayName(username),
    });
    await pb.collection('users').authWithPassword(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return { user, login, register, logout };
}
