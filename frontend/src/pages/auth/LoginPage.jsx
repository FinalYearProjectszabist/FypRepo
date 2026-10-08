import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { parseError } from '../../api/client';
import { authApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import AuthLayout from '../../components/AuthLayout';
import FormField from '../../components/FormField';
import GoogleSignInButton, { OrDivider } from '../../components/GoogleSignInButton';
import PasswordInput from '../../components/PasswordInput';
import Spinner from '../../components/Spinner';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';
import useAuthResult from './useAuthResult';

const schema = { email: rules.email, password: rules.loginPassword };

export default function LoginPage() {
  const { values, errors, setErrors, onChange, onBlur, validateAll } = useForm({ email: '', password: '' }, schema);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const handleAuth = useAuthResult();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = location.state?.from;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    try {
      handleAuth(await authApi.login({ email: values.email.trim(), password: values.password }), from);
    } catch (err) {
      const { message, code, fieldErrors } = parseError(err);
      if (code === 'EMAIL_NOT_VERIFIED') {
        await authApi.resendVerification(values.email.trim()).catch(() => {});
        navigate(`/verify-email?email=${encodeURIComponent(values.email.trim())}&resent=1`);
        return;
      }
      setErrors(fieldErrors);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async (idToken) => {
    setError('');
    try {
      handleAuth(await authApi.google({ idToken }), from);
    } catch (err) {
      setError(parseError(err).message);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back! Sign in to find and book chargers."
      footer={<>New here? <Link to="/signup" className="font-semibold text-brand-700 hover:underline">Create an account</Link></>}
    >
      <div className="space-y-4">
        {params.get('expired') && <Alert type="info">Your session expired. Please sign in again.</Alert>}
        {params.get('reset') && <Alert type="success">Password updated. Sign in with your new password.</Alert>}
        {params.get('verified') && <Alert type="success">Email verified. You can sign in now.</Alert>}
        <Alert>{error}</Alert>

        <GoogleSignInButton onCredential={onGoogle} onError={setError} text="signin_with" />
        <OrDivider />

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            label="Email" name="email" type="email" autoComplete="email"
            value={values.email} onChange={onChange} onBlur={onBlur} error={errors.email}
          />
          <PasswordInput
            label="Password" name="password" autoComplete="current-password"
            value={values.password} onChange={onChange} onBlur={onBlur} error={errors.password}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Spinner />} Sign in
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
