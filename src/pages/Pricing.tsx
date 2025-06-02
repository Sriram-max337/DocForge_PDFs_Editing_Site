import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Moon, Sun, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Pricing = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">DocForge</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost">Login</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Pricing Section */}
        <section className="py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Basic Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Basic</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹199</span>
                    <span className="text-muted-foreground"> / $2.5</span>
                    <p className="text-sm text-muted-foreground mt-1">One-Time Payment</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Merge PDFs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Split PDFs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Compress PDFs</span>
                    </li>
                    <li className="flex items-center space-x-2 text-muted-foreground">
                      <span>20 docs/month</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Standard Plan */}
              <Card className="relative border-blue-500">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Standard</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹399</span>
                    <span className="text-muted-foreground"> / $5</span>
                    <p className="text-sm text-muted-foreground mt-1">One-Time Payment</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>All Basic Features</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Text Extraction</span>
                      <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">Coming Soon</span>
                    </li>
                    <li className="flex items-center space-x-2 text-muted-foreground">
                      <span>50 docs/month</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹999</span>
                    <span className="text-muted-foreground"> / $12</span>
                    <p className="text-sm text-muted-foreground mt-1">One-Time Payment</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>All Standard Features</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Format Conversion</span>
                      <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">Coming Soon</span>
                    </li>
                    <li className="flex items-center space-x-2 text-muted-foreground">
                      <span>150 docs/month</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-blue-500" />
            <span className="text-lg font-bold">DocForge</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 DocForge. All rights reserved. Transform your documents with ease.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing; 