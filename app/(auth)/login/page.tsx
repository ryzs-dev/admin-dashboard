'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/auth/actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });
      const FormData = { email, password };

      const data = await login(FormData);
      console.log('Login response data:', data);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
    } catch (error) {
      setError('An unexpected error occurred');
      setLoading(false);
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff8f3] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Image
            src="/brand/lunaa-logo.png"
            alt="LUNAA – Soft & Strong"
            width={1188}
            height={437}
            priority
            className="mx-auto mb-4 h-auto w-36"
          />
          <CardTitle className="text-2xl font-bold text-center">
            Lunaa Women Care
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <button
              className="text-[#662d91] hover:underline"
              onClick={() => router.push('/forget-password')}
            >
              Forgot password?
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#662d91] hover:bg-[#55247a]"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
