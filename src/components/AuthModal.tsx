import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Users, Shield, Mail, UserPlus, ArrowLeft, Eye, EyeOff, Check, AlertTriangle, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AuthModal = ({ onAuth, onBack, initialUsername, initialIsSignUp, minimalSignUp }: { 
  onAuth: (type: 'guest' | 'email', data?: any) => void;
  onBack: () => void;
  initialUsername?: string;
  initialIsSignUp?: boolean;
  minimalSignUp?: boolean;
}) => {
  const { toast } = useToast();
  
  // Guest login states
  const [guestName, setGuestName] = useState(initialUsername || "");
  
  // Email auth states
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSignUp, setIsSignUp] = useState(Boolean(initialIsSignUp) || Boolean(minimalSignUp));

  useEffect(() => {
    if (minimalSignUp) {
      setIsSignUp(true);
    }
  }, [minimalSignUp]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Email verification states for signup
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState(0);

  // Bot Protection States
  const [rateLimitData, setRateLimitData] = useState({
    attempts: 0,
    lastAttempt: 0,
    blocked: false,
    blockUntil: 0
  });
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: '', answer: 0 });
  const [honeypotValue, setHoneypotValue] = useState(''); // Honeypot field for bots

  // Validation States
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    email: '',
    password: '',
    guestName: ''
  });

  const [fieldTouched, setFieldTouched] = useState({
    username: false,
    email: false,
    password: false,
    guestName: false
  });

  // Username availability checking
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameCheckTimer, setUsernameCheckTimer] = useState<NodeJS.Timeout | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Validation Functions
  const validateUsername = (username: string) => {
    if (!username.trim()) {
      return 'Username is required';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    if (/^[0-9]/.test(username)) {
      return 'Username cannot start with a number';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (email.length > 100) {
      return 'Email is too long';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (password.length > 50) {
      return 'Password is too long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*[0-9])/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  // Check username availability from backend
  const checkUsernameAvailability = async (username: string) => {
    try {
      setCheckingUsername(true);
      const response = await fetch(`http://localhost:4000/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (response.status === 409) {
        // Username already exists
        setValidationErrors(prev => ({ ...prev, guestName: 'Username already taken. Please choose another one.' }));
        setFieldTouched(prev => ({ ...prev, guestName: true }));
        setUsernameAvailable(false);
      } else if (response.ok && data.available) {
        // Username is available - clear any previous errors
        setValidationErrors(prev => ({ ...prev, guestName: '' }));
        setUsernameAvailable(true);
      } else if (!response.ok) {
        // Other errors (400, etc)
        setValidationErrors(prev => ({ ...prev, guestName: data.message || 'Error checking username' }));
        setFieldTouched(prev => ({ ...prev, guestName: true }));
        setUsernameAvailable(false);
      }
    } catch (error) {
      // Network error - backend might not be running
      console.error('Error checking username:', error);
      // Don't show error to user for network issues during typing
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateGuestName = (name: string) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.length < 3) {
      return 'Name must be at least 3 characters';
    }
    if (name.length > 15) {
      return 'Name must be less than 15 characters';
    }
    if (!/^[a-zA-Z0-9\s_-]+$/.test(name)) {
      return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return '';
  };

  const validateField = (fieldName: string, value: string) => {
    let error = '';
    
    switch (fieldName) {
      case 'username':
        error = validateUsername(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'guestName':
        error = validateGuestName(value);
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return error === '';
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    // Update the actual field value
    switch (fieldName) {
      case 'username':
        setUsername(value);
        break;
      case 'email':
        setEmailOrUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'guestName':
        // Auto-replace spaces with underscores
        const cleanedValue = value.replace(/\s+/g, '_');
        setGuestName(cleanedValue);
        // Reset availability while typing
        setUsernameAvailable(null);
        // Clear existing timer
        if (usernameCheckTimer) {
          clearTimeout(usernameCheckTimer);
        }
        // Set new timer for debounced username check
        if (cleanedValue.trim().length >= 3) {
          const timer = setTimeout(() => {
            checkUsernameAvailability(cleanedValue.trim());
          }, 500); // 500ms debounce
          setUsernameCheckTimer(timer);
        }
        break;
    }

    // Only validate if field has been touched
    if (fieldTouched[fieldName as keyof typeof fieldTouched]) {
      validateField(fieldName, value);
    }
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    setFieldTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    validateField(fieldName, value);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*[0-9])/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    
    if (strength <= 2) return { text: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { text: 'Medium', color: 'bg-yellow-500' };
    return { text: 'Strong', color: 'bg-green-500' };
  };

  // Bot Protection Functions
  const generateCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer;
    let question;
    
    switch (operation) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;
      case '-':
        answer = Math.max(num1, num2) - Math.min(num1, num2);
        question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ?`;
        break;
      case '*':
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
    }
    
    setCaptchaQuestion({ question, answer });
    setCaptchaAnswer('');
  }, []);

  const checkRateLimit = () => {
    const now = Date.now();
    const timeDiff = now - rateLimitData.lastAttempt;
    
    // Check if user is blocked
    if (rateLimitData.attempts >= 5) {
      const blockDuration = 30 * 60 * 1000; // 30 minutes
      if (timeDiff < blockDuration) {
        const remainingTime = Math.ceil((blockDuration - timeDiff) / (60 * 1000));
        toast({
          title: "Account temporarily blocked",
          description: `Too many failed attempts. Please wait ${remainingTime} minutes.`,
          variant: "destructive"
        });
        return false;
      } else {
        // Reset attempts after block period
        setRateLimitData(prev => ({
          ...prev,
          attempts: 0,
          blocked: false
        }));
      }
    }
    
    return true;
  };

  const incrementAttempts = () => {
    const now = Date.now();
    setRateLimitData(prev => ({
      ...prev,
      attempts: prev.attempts + 1,
      lastAttempt: now
    }));
    
    // Show captcha after 2 attempts
    if (rateLimitData.attempts >= 2) {
      setCaptchaRequired(true);
      generateCaptcha();
    }
  };

  const validateBotProtection = () => {
    // Check honeypot field (should be empty)
    if (honeypotValue.trim() !== '') {
      toast({
        title: "Security check failed",
        description: "Bot activity detected",
        variant: "destructive"
      });
      return false;
    }
    
    // Check rate limiting
    if (!checkRateLimit()) {
      return false;
    }
    
    // Check captcha if required
    if (captchaRequired) {
      if (!captchaAnswer.trim()) {
        toast({
          title: "Captcha required",
          description: "Please solve the math problem to continue",
          variant: "destructive"
        });
        return false;
      }
      
      if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
        toast({
          title: "Incorrect captcha",
          description: "Please solve the math problem correctly",
          variant: "destructive"
        });
        generateCaptcha(); // Generate new captcha
        return false;
      }
    }
    
    return true;
  };

  // Initialize captcha on mount
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimer) {
        clearTimeout(usernameCheckTimer);
      }
    };
  }, [usernameCheckTimer]);

  const handleGuestLogin = async () => {
    // Validate guest name first
    const guestNameError = validateGuestName(guestName);
    if (guestNameError) {
      setFieldTouched(prev => ({ ...prev, guestName: true }));
      setValidationErrors(prev => ({ ...prev, guestName: guestNameError }));
      return;
    }

    if (!validateBotProtection()) {
      incrementAttempts();
      return;
    }
    
    if (guestName.trim()) {
      try {
        await onAuth('guest', { name: guestName.trim() });
      } catch (error: any) {
        // Handle backend validation errors
        const errorMessage = error?.message || error?.response?.data?.message || 'Failed to login';
        
        if (errorMessage.includes('Username already taken') || errorMessage.includes('already exist')) {
          setValidationErrors(prev => ({ ...prev, guestName: 'Username already taken. Please choose another one.' }));
          setFieldTouched(prev => ({ ...prev, guestName: true }));
        } else {
          toast({
            title: "Login failed",
            description: errorMessage,
            variant: "destructive"
          });
        }
        incrementAttempts();
      }
    }
  };

  // Email Verification Function
  const createAccountWithEmailVerification = async () => {
    // Validate all fields first
    const emailError = validateEmail(emailOrUsername);
    const usernameError = minimalSignUp ? '' : validateUsername(username);
    const passwordError = validatePassword(password);

    // Mark all fields as touched
    setFieldTouched({
      username: minimalSignUp ? false : true,
      email: true,
      password: true,
      guestName: false
    });

    // Set all validation errors
    setValidationErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
      guestName: ''
    });

    // If any validation fails, stop here
    if (emailError || usernameError || passwordError) {
      toast({
        title: "Please fix the errors",
        description: "Check the highlighted fields and try again",
        variant: "destructive"
      });
      return;
    }

    // Bot protection check
    if (!validateBotProtection()) {
      incrementAttempts();
      return;
    }

    setIsCreatingAccount(true);
    
    try {
      // Call the auth function to create account and send email verification
        await onAuth('email', { 
        email: emailOrUsername, 
        password, 
        username: minimalSignUp ? undefined : username, 
        isSignUp: true,
        requireEmailVerification: false // Do not force email verification during signup; verification handled in Settings
      });

      // Account created and signed in (no forced verification)
      toast({
        title: "Account created",
        description: "Your account has been created and you are signed in.",
        variant: "default"
      });
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Something went wrong. Please try again.';
      // If backend reports email/user exists, show inline validation on email field
      if (error?.status === 409 || (typeof msg === 'string' && /user exists|email already/i.test(msg))) {
        setValidationErrors(prev => ({ ...prev, email: 'Email already in use. Try logging in or use a different email.' }));
        setFieldTouched(prev => ({ ...prev, email: true }));
      }
      toast({
        title: "Signup failed",
        description: msg,
        variant: "destructive"
      });
      incrementAttempts();
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const resendEmailVerification = async () => {
    setIsCreatingAccount(true);
    
    try {
      // Verification via email is not forced at signup in this flow.
      // If you want to verify email, use the Settings page where verification can be requested.
      toast({
        title: "Verification not required",
        description: "Email verification is optional and can be managed from Settings.",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleEmailAuth = async () => {
    if (isSignUp) {
      // For signup, we use email verification flow
      return;
    } else {
      // Bot protection check for sign in
      if (!validateBotProtection()) {
        incrementAttempts();
        return;
      }

      if (!emailOrUsername || !password) {
        toast({
          title: "Missing information",
          description: "Please enter both email/username and password",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsSigningIn(true);

        // Simulate sign in delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Sign in allows email or username - await so we can catch errors and show them to the user
        await onAuth('email', { emailOrUsername, password, isSignUp });
      } catch (error: any) {
        const msg = error?.message || error?.response?.data?.message || 'Invalid credentials. Please try again.';

        // Show inline validation where appropriate
        setValidationErrors(prev => ({ ...prev, email: msg }));
        setFieldTouched(prev => ({ ...prev, email: true }));

        toast({
          title: 'Sign in failed',
          description: msg,
          variant: 'destructive'
        });
        incrementAttempts();
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  // Email Verification Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (verificationTimer > 0) {
      interval = setInterval(() => {
        setVerificationTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [verificationTimer]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md professional-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="mx-auto p-3 rounded-full bg-primary/10">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
          <CardTitle className="text-2xl font-bold">Join ChitZ</CardTitle>
          <CardDescription>
            Connect with people worldwide through our secure chat platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue={minimalSignUp ? "email" : "guest"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {!minimalSignUp && (
                <TabsTrigger value="guest" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Guest
                </TabsTrigger>
              )}
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guest" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <div className="relative">
                  <Input
                    placeholder="Enter your username"
                    value={guestName}
                    onChange={(e) => handleFieldChange('guestName', e.target.value)}
                    onBlur={(e) => handleFieldBlur('guestName', e.target.value)}
                    className={`h-11 ${validationErrors.guestName && fieldTouched.guestName ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {!checkingUsername && usernameAvailable && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {validationErrors.guestName && fieldTouched.guestName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors.guestName}
                  </p>
                )}
                {!validationErrors.guestName && (
                  <p className="text-xs text-muted-foreground">
                    3-20 characters, letters, numbers, and underscores. Spaces auto-convert to underscores.
                  </p>
                )}
              </div>

              {/* Honeypot field - hidden from users, visible to bots */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
                <Input
                  type="text"
                  value={honeypotValue}
                  onChange={(e) => setHoneypotValue(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Show rate limit warning */}
              {rateLimitData.attempts > 0 && rateLimitData.attempts < 5 && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    Attempt {rateLimitData.attempts}/5. Too many failed attempts will result in temporary blocking.
                  </AlertDescription>
                </Alert>
              )}

              {/* Captcha for bot protection */}
              {captchaRequired && (
                <div className="space-y-2">
                  <Label htmlFor="guest-captcha">Security Check</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted p-3 rounded-lg text-center font-mono text-lg">
                      {captchaQuestion.question}
                    </div>
                    <Input
                      id="guest-captcha"
                      type="number"
                      placeholder="Answer"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-20 h-11 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateCaptcha}
                      title="Generate new problem"
                    >
                      🔄
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Quick access without registration</span>
                </div>
              </div>

              <Button 
                onClick={handleGuestLogin}
                disabled={!guestName || rateLimitData.blocked || (captchaRequired && !captchaAnswer)}
                className="w-full h-11"
                variant="secondary"
              >
                <Users className="w-4 h-4 mr-2" />
                Join as Guest
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              {!minimalSignUp && (
                <div className="flex rounded-lg border p-1 bg-muted/30">
                  <button
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 rounded-md py-2 text-sm transition-all ${
                      !isSignUp 
                        ? 'bg-background shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 rounded-md py-2 text-sm transition-all ${
                      isSignUp 
                        ? 'bg-background shadow-sm font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {isSignUp ? (
                  // Sign Up Flow with Email Verification
                  <div className="space-y-4">
                    {!emailVerificationSent ? (
                      // Step 1: Enter details and create account
                      <>
                        {!minimalSignUp && (
                          <div className="space-y-2">
                            <Label htmlFor="signup-username">Username</Label>
                            <Input
                              id="signup-username"
                              placeholder="Choose a username"
                              value={username}
                              onChange={(e) => handleFieldChange('username', e.target.value)}
                              onBlur={(e) => handleFieldBlur('username', e.target.value)}
                              className={`h-11 ${validationErrors.username && fieldTouched.username ? 'border-red-500 focus:border-red-500' : ''}`}
                              disabled={isCreatingAccount}
                            />
                            {validationErrors.username && fieldTouched.username && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {validationErrors.username}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email Address</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email address"
                            value={emailOrUsername}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            onBlur={(e) => handleFieldBlur('email', e.target.value)}
                            className={`h-11 ${validationErrors.email && fieldTouched.email ? 'border-red-500 focus:border-red-500' : ''}`}
                            disabled={isCreatingAccount}
                          />
                          {validationErrors.email && fieldTouched.email && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {validationErrors.email}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              value={password}
                              onChange={(e) => handleFieldChange('password', e.target.value)}
                              onBlur={(e) => handleFieldBlur('password', e.target.value)}
                              className={`h-11 pr-10 ${validationErrors.password && fieldTouched.password ? 'border-red-500 focus:border-red-500' : ''}`}
                              disabled={isCreatingAccount}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              disabled={isCreatingAccount}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          {/* Password validation error */}
                          {validationErrors.password && fieldTouched.password && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {validationErrors.password}
                            </p>
                          )}
                          
                          {/* Password strength indicator */}
                          {password && fieldTouched.password && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Password strength:</span>
                                <span className={`text-xs font-medium ${getPasswordStrength(password).color === 'bg-red-500' ? 'text-red-500' : 
                                  getPasswordStrength(password).color === 'bg-yellow-500' ? 'text-yellow-500' : 'text-green-500'}`}>
                                  {getPasswordStrength(password).text}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                                  style={{ 
                                    width: getPasswordStrength(password).text === 'Weak' ? '33%' : 
                                           getPasswordStrength(password).text === 'Medium' ? '66%' : '100%' 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Honeypot field for signup */}
                        <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
                          <Input
                            type="text"
                            value={honeypotValue}
                            onChange={(e) => setHoneypotValue(e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                          />
                        </div>

                        {/* Rate limit warning for signup */}
                        {rateLimitData.attempts > 0 && rateLimitData.attempts < 5 && (
                          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                              Attempt {rateLimitData.attempts}/5. Too many failed attempts will result in temporary blocking.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Captcha for signup */}
                        {captchaRequired && (
                          <div className="space-y-2">
                            <Label htmlFor="signup-captcha">Security Check</Label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted p-3 rounded-lg text-center font-mono text-lg">
                                {captchaQuestion.question}
                              </div>
                              <Input
                                id="signup-captcha"
                                type="number"
                                placeholder="Answer"
                                value={captchaAnswer}
                                onChange={(e) => setCaptchaAnswer(e.target.value)}
                                className="w-20 h-11 text-center"
                                disabled={isCreatingAccount}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={generateCaptcha}
                                title="Generate new problem"
                                disabled={isCreatingAccount}
                              >
                                🔄
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button 
                          onClick={createAccountWithEmailVerification}
                          disabled={isCreatingAccount || !emailOrUsername || !password || (!minimalSignUp && !username) || rateLimitData.blocked}
                          className="w-full h-11"
                        >
                          {isCreatingAccount ? (
                            <>
                              <Mail className="w-4 h-4 mr-2 animate-pulse" />
                              Creating account...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Create Account
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      // Step 2: Email verification sent
                      <>
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold">Check your email</h3>
                          <p className="text-sm text-muted-foreground">
                            We sent a verification link to <br />
                            <span className="font-medium">{emailOrUsername}</span>
                          </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Click the verification link
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                Click the link in your email to verify your account and complete signup. 
                                The link will expire in 24 hours.
                              </p>
                              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                <p>💡 <strong>Not seeing the email?</strong></p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  <li>Check your spam/junk folder</li>
                                  <li>Email can take 2-5 minutes to arrive</li>
                                  <li>Make sure email address is correct</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEmailVerificationSent(false);
                              setVerificationTimer(0);
                            }}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          
                          <Button
                            variant="ghost"
                            onClick={resendEmailVerification}
                            disabled={verificationTimer > 0 || isCreatingAccount}
                            className="text-sm"
                          >
                            {verificationTimer > 0 ? `Resend in ${verificationTimer}s` : 'Resend Link'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // Sign In Flow (no OTP needed)
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email or Username</Label>
                      <Input
                        id="signin-email"
                        type="text"
                        placeholder="Enter email or username"
                        value={emailOrUsername}
                        onChange={(e) => {
                          setEmailOrUsername(e.target.value);
                          // Clear validation errors on change for signin
                          if (validationErrors.email) {
                            setValidationErrors(prev => ({ ...prev, email: '' }));
                          }
                        }}
                        className={`h-11 ${validationErrors.email && fieldTouched.email ? 'border-red-500 focus:border-red-500' : ''}`}
                        disabled={isSigningIn}
                      />
                      {validationErrors.email && fieldTouched.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            // Clear validation errors on change for signin
                            if (validationErrors.password) {
                              setValidationErrors(prev => ({ ...prev, password: '' }));
                            }
                          }}
                          className={`h-11 pr-10 ${validationErrors.password && fieldTouched.password ? 'border-red-500 focus:border-red-500' : ''}`}
                          disabled={isSigningIn}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          disabled={isSigningIn}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>

                    {/* Honeypot field for signin */}
                    <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
                      <Input
                        type="text"
                        value={honeypotValue}
                        onChange={(e) => setHoneypotValue(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {/* Rate limit warning for signin */}
                    {rateLimitData.attempts > 0 && rateLimitData.attempts < 5 && (
                      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                          Attempt {rateLimitData.attempts}/5. Too many failed attempts will result in temporary blocking.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Captcha for signin (shown after 2 failed attempts) */}
                    {(rateLimitData.attempts >= 2 || captchaRequired) && (
                      <div className="space-y-2">
                        <Label htmlFor="signin-captcha">Security Check</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted p-3 rounded-lg text-center font-mono text-lg">
                            {captchaQuestion.question}
                          </div>
                          <Input
                            id="signin-captcha"
                            type="number"
                            placeholder="Answer"
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            className="w-20 h-11 text-center"
                            disabled={isSigningIn}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateCaptcha}
                            title="Generate new problem"
                            disabled={isSigningIn}
                          >
                            🔄
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span>Secure account with profile & message history</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleEmailAuth}
                      disabled={isSigningIn || !emailOrUsername || !password || rateLimitData.blocked || 
                        ((rateLimitData.attempts >= 2 || captchaRequired) && !captchaAnswer)}
                      className="w-full h-11"
                      variant="default"
                    >
                      {isSigningIn ? (
                        <>
                          <LogIn className="w-4 h-4 mr-2 animate-pulse" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Separator />

                {!emailVerificationSent && !minimalSignUp && (
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isSignUp ? (
                      <>Already have an account? <span className="font-medium text-primary">Sign in</span></>
                    ) : (
                      <>Don't have an account? <span className="font-medium text-primary">Sign up</span></>
                    )}
                  </button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
