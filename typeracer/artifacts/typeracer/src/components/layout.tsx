import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isAuthPage = location === "/auth";

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-tighter text-primary flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-sm">TR</span>
          TYPERACER
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/leaderboard" className={`text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors ${location === '/leaderboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            Leaderboard
          </Link>
          
          {user ? (
            <>
              <Link href="/history" className={`text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors ${location === '/history' ? 'text-primary' : 'text-muted-foreground'}`}>
                History
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className={`text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors ${location === '/admin' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Admin
                </Link>
              )}
              <div className="h-4 w-px bg-border mx-2" />
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground">{user.username}</span>
                <Button variant="outline" size="sm" onClick={logout} className="font-bold text-xs h-8">
                  LOGOUT
                </Button>
              </div>
            </>
          ) : !isAuthPage ? (
            <Link href="/auth">
              <Button size="sm" className="font-bold text-xs h-8 bg-primary text-primary-foreground">
                LOGIN
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
