
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MewurkService } from "@/services/mewurk";

interface LoginFormProps {
    onLoginSuccess: (token: string, employeeCode: string, userName: string) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: "Error", description: "Please enter both email and password.", variant: "destructive" });
            return;
        }
  
        setIsLoggingIn(true);
        setError(null);
  
        try {
            const lookupRes = await MewurkService.lookupUser(email);
            if (!lookupRes.isSuccess || !lookupRes.data.tenantDetails.length) {
                throw new Error("User not found or no tenant associated.");
            }
            const tenantId = lookupRes.data.tenantDetails[0].tenantId;
  
            const loginRes = await MewurkService.loginUser(email, password, tenantId);
            if (!loginRes.isSuccess) {
                throw new Error(loginRes.message || "Login failed.");
            }
  
            const newToken = loginRes.data.token;
            const newEmpCode = String(loginRes.data.userModel.employeeCode);
            const newName = `${loginRes.data.userModel.firstName} ${loginRes.data.userModel.lastName}`;
  
            onLoginSuccess(newToken, newEmpCode, newName);
            
            toast({ title: "Success", description: "Logged in to Mewurk successfully." });
  
        } catch (err: any) {
            setError(err.message || "Login failed. Please check credentials.");
            toast({ title: "Login Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="flex h-full items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-xl border-primary/10 bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                         <Icons.Building className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">Mewurk Connect</CardTitle>
                    <CardDescription>Login with your corporate credentials</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoggingIn}
                                className="bg-background/50"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoggingIn}
                                    className="bg-background/50 pr-10"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoggingIn}
                                >
                                    {showPassword ? (
                                        <Icons.EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Icons.Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
                                <Icons.Info className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                            {isLoggingIn ? (
                                <>
                                    <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Login to Mewurk
                                    <Icons.LogIn className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
