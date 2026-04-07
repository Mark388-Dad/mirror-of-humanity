import { useEffect } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { useChallenge } from '@/contexts/ChallengeContext';
import ChallengeThemeProvider from '@/components/ChallengeThemeProvider';
import { Loader2 } from 'lucide-react';

/**
 * Wrapper route that loads a challenge by ID from URL params,
 * applies its theme, and renders child routes within that context.
 */
const ChallengeEnvironment = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { activeChallenge, selectChallenge, loading } = useChallenge();
  const navigate = useNavigate();

  useEffect(() => {
    if (challengeId && (!activeChallenge || activeChallenge.id !== challengeId)) {
      selectChallenge(challengeId);
    }
  }, [challengeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading challenge environment...</p>
        </div>
      </div>
    );
  }

  if (!activeChallenge && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Challenge not found</h2>
          <p className="text-muted-foreground mb-4">This challenge may have been removed or is no longer available.</p>
          <button onClick={() => navigate('/challenges')} className="text-primary underline">
            Back to Challenge Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChallengeThemeProvider>
      <Outlet />
    </ChallengeThemeProvider>
  );
};

export default ChallengeEnvironment;
