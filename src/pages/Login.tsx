import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Login attempt with:', {
        email: credentials.email,
        passwordLength: credentials.password.length
      });
      
      // For demo purposes, using a simple check
      // In a real app, you would validate against a backend
      if (credentials.email.trim() === 'demo@example.com' && credentials.password === 'password123') {
        console.log('Credentials match!');
        // Store auth state
        localStorage.setItem('isAuthenticated', 'true');
        
        toast({
          title: "Login Successful",
          description: "Welcome to Precision Skin Insights!",
        });
        
        navigate('/');
      } else {
        console.log('Credentials do not match.');
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white font-inter overflow-auto py-8">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo_only.PNG" 
                alt="Precision Skin Insights Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-[#613175] font-playfair">Precision</h1>
            <p className="text-gray-600">AI Dermatology Consultations</p>
          </div>

          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#613175] to-purple-600 text-white rounded-t-lg">
              <CardTitle className="font-playfair text-center">Login</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="mt-1 border-purple-200 focus:border-[#613175] focus:ring-[#613175]"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="mt-1 border-purple-200 focus:border-[#613175] focus:ring-[#613175]"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#613175] to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Logging in...
                    </div>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login; 