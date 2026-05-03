import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';

const toEmail = (username: string) => `${username}@goaltracker.local`;

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
      name: username,
    });
    await pb.collection('users').authWithPassword(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return { user, login, register, logout };
}
