import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { useAuthActions } from '../lib/hooks/useAuthActions';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, signIn, signUp, resetPassword, signInWithMagicLink } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setIsResetEmailSent(true);
        toast.success('Password reset email sent! Please check your inbox.');
      } else if (isSignUp) {
        await signUp(email, password);
        setIsVerificationSent(true);
        toast.success('Verification email sent! Please check your inbox.');
      } else if (isMagicLinkSent) {
        // This is the magic link sign-in flow
        await signInWithMagicLink(email);
        setIsMagicLinkSent(true);
        toast.success('Magic link sent! Please check your email to sign in.');
      } else {
        // This is the regular email/password sign-in
        await signIn(email, password);
        toast.success('Signed in successfully!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const handleBackToSignIn = () => {
    setIsVerificationSent(false);
    setIsResetEmailSent(false);
    setIsMagicLinkSent(false);
    setIsForgotPassword(false);
    setIsSignUp(false);
    setEmail('');
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="relative overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              {isMagicLinkSent ? (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We've sent a magic sign-in link to <span className="font-medium">{email}</span>.
                    Click the link in the email to sign in.
                  </p>
                  <Button
                    onClick={handleBackToSignIn}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : isResetEmailSent ? (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We've sent a password reset link to <span className="font-medium">{email}</span>.
                    Please check your inbox and follow the instructions to reset your password.
                  </p>
                  <Button
                    onClick={handleBackToSignIn}
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : isVerificationSent ? (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    We've sent a verification link to <span className="font-medium">{email}</span>.
                    Please check your inbox and click the link to verify your account.
                  </p>
                  <Button
                    onClick={handleBackToSignIn}
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create an Account' : 'Welcome Back'}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<Mail className="h-4 w-4 text-gray-500" />}
                      required
                    />

                    {!isForgotPassword && !isMagicLinkSent && (
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          leftIcon={<Lock className="h-4 w-4 text-gray-500" />}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <></>
                      ) : isForgotPassword ? (
                        'Send Reset Link'
                      ) : isMagicLinkSent ? (
                        'Resend Magic Link'
                      ) : isSignUp ? (
                        'Create Account'
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center space-y-3">
                    {!isForgotPassword && !isMagicLinkSent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setEmail('');
                          setPassword('');
                        }}
                        className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 block w-full"
                      >
                        {isSignUp
                          ? 'Already have an account? Sign in'
                          : "Don't have an account? Sign up"}
                      </button>
                    )}
                    
                    {!isSignUp && !isForgotPassword && !isMagicLinkSent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setPassword('');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 block w-full"
                      >
                        Forgot password?
                      </button>
                    )}
                    
                    {!isSignUp && !isForgotPassword && !isMagicLinkSent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMagicLinkSent(true);
                          setPassword('');
                        }}
                        className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 block w-full"
                      >
                        Sign in with a magic link
                      </button>
                    )}
                    
                    {(isForgotPassword || isMagicLinkSent) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                        }}
                        className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 block w-full"
                      >
                        Back to sign in
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};