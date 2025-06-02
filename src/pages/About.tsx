import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

const About = () => {
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
        {/* About Section */}
        <section className="py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            About DocForge
          </h1>
          <div className="max-w-3xl mx-auto space-y-8">
            <p className="text-lg text-muted-foreground">
              DocForge is a lightweight, easy-to-use PDF utility tool made with real-world problems in mind.
              Whether you're a student editing assignments or a professional cleaning up documentation, DocForge helps you merge, split, compress, and soon even extract text and convert formats—all from your browser.
            </p>
            <p className="text-lg text-muted-foreground">
              No logins, no bloat, just clean document handling with modern UI.
            </p>
            <p className="text-lg text-muted-foreground italic">
              Built by a student who just wanted to fix his own assignment headache, and it turned into something bigger.
            </p>
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

export default About; 