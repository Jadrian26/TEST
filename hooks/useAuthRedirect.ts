import { useEffect } from 'react';
import { useNavigate, useLocation, NavigateOptions } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthRedirectOptions {
  condition?: (currentUser: ReturnType<typeof useAuth>['currentUser']) => boolean;
  redirectTo: string;
  state?: NavigateOptions['state'];
  replace?: boolean;
}

/**
 * Hook to redirect based on authentication status or a custom condition.
 * @param options - Configuration for redirection.
 *   - condition: A function that takes currentUser and returns true if redirection should occur.
 *                If not provided, defaults to redirecting if `!currentUser`.
 *   - redirectTo: The path to redirect to.
 *   - state: Optional state to pass to the navigate function.
 *   - replace: Whether to replace the current entry in the history stack.
 */
function useAuthRedirect({
  condition,
  redirectTo,
  state,
  replace = true, // Default to replace for auth redirects
}: UseAuthRedirectOptions): void {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Determine if redirection should happen based on the provided condition or default behavior
    const shouldRedirect = condition ? condition(currentUser) : !currentUser;

    if (shouldRedirect) {
      // Avoid redirecting if already on the target page (or a sub-path of account if target is account)
      // This helps prevent redirect loops, e.g. from /checkout to /account if already on /account/login
      if (location.pathname === redirectTo || (redirectTo === '/account' && location.pathname.startsWith('/account'))) {
        return;
      }
      navigate(redirectTo, { state, replace });
    }
  }, [currentUser, navigate, redirectTo, state, replace, condition, location.pathname]);
}

export default useAuthRedirect;
