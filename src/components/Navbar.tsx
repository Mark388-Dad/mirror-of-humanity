import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenge } from '@/contexts/ChallengeContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Home, PlusCircle, Trophy, BarChart3, LogOut, User, Settings, Library, Zap, Users, GraduationCap, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { activeChallenge, clearChallenge } = useChallenge();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isStudent = profile?.role === 'student';
  const isLibrarian = profile?.role === 'librarian';
  const isTutor = profile?.role === 'homeroom_tutor' || profile?.role === 'head_of_year';
  const isHousePatron = profile?.role === 'house_patron';
  const isStaff = profile?.role && profile.role !== 'student';

  // Check if we're inside a challenge environment
  const inChallenge = location.pathname.startsWith('/challenge/') && activeChallenge;
  const challengeBase = inChallenge ? `/challenge/${activeChallenge.id}` : '';

  const navItems = inChallenge
    ? [
        { path: `${challengeBase}/dashboard`, label: 'Dashboard', icon: Home },
        ...(isStudent ? [{ path: `${challengeBase}/submit`, label: 'Submit Book', icon: PlusCircle }] : []),
        ...(isStudent ? [{ path: `${challengeBase}/progress`, label: 'My Progress', icon: BarChart3 }] : []),
        { path: `${challengeBase}/gallery`, label: 'Gallery', icon: Library },
        { path: `${challengeBase}/leaderboard`, label: 'Leaderboard', icon: Trophy },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        ...(isStudent ? [{ path: '/submit', label: 'Submit Book', icon: PlusCircle }] : []),
        ...(isStudent ? [{ path: '/progress', label: 'My Progress', icon: BarChart3 }] : []),
        { path: '/gallery', label: 'Gallery', icon: Library },
        { path: '/challenges', label: 'Challenges', icon: Zap },
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        ...(isLibrarian ? [{ path: '/librarian', label: 'Librarian', icon: BookOpen }] : []),
        ...(isTutor ? [{ path: '/tutor', label: 'My Class', icon: GraduationCap }] : []),
        ...(isHousePatron ? [{ path: '/house', label: 'My House', icon: Users }] : []),
        ...(isStaff ? [{ path: '/admin', label: 'Admin', icon: Settings }] : []),
      ];

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-[hsl(220,75%,12%)]/95 backdrop-blur border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Challenge Name */}
          <div className="flex items-center gap-3">
            {inChallenge && (
              <Button variant="ghost" size="sm" onClick={() => { clearChallenge(); navigate('/challenges'); }}
                className="text-white/70 hover:text-white p-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Link to={inChallenge ? `${challengeBase}/dashboard` : '/dashboard'} className="flex items-center gap-3">
              {inChallenge && activeChallenge.logo_url ? (
                <img src={activeChallenge.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5" />
              ) : (
                <img src="/mpesa-logo.png" alt="Mpesa Foundation Academy" className="w-10 h-10 rounded-lg object-contain bg-white p-0.5" />
              )}
              <span className="font-display font-semibold text-white hidden sm:block truncate max-w-[200px]">
                {inChallenge ? activeChallenge.title : 'Reading Challenge'}
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/20 text-primary"
                    : "text-white/70 hover:text-primary hover:bg-primary/10"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 text-white/80 text-sm">
              <User className="w-4 h-4" />
              <span className="font-medium">{profile?.full_name || 'User'}</span>
              {profile?.house && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                  {profile.house}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white/70 hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-primary/10 overflow-x-auto">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors min-w-[60px]",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-white/60"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
