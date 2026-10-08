import { useNavigate } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../../context/AuthContext';

/** Handles an AuthResponse: either finish login, or go to the 2-step verification page. */
export default function useAuthResult() {
  const { completeLogin } = useAuth();
  const navigate = useNavigate();

  return (auth, from) => {
    if (auth.mfaRequired) {
      navigate('/login/verify', { state: { mfaToken: auth.mfaToken, from } });
      return;
    }
    completeLogin(auth);
    navigate(from || HOME_BY_ROLE[auth.user.role], { replace: true });
  };
}
