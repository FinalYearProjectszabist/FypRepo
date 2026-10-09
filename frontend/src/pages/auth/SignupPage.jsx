import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const ROLES = [
  { value: 'DRIVER', title: 'EV Driver', desc: 'Find, compare and book chargers for my car' },
  { value: 'STATION_OWNER', title: 'Station Owner', desc: 'List my chargers and manage bookings' },
];

const schema = {
  role: rules.role,
  fullName: rules.fullName,
  email: rules.email,
  phone: rules.phone,
  password: rules.password,
  confirmPassword: rules.confirm('password'),
  terms: (v) => (v ? null : 'You must accept the terms'),
};

export default function SignupPage() {
  const { values, errors, setErrors, onChange, onBlur, validateAll, setValues } = useForm(
    { role: 'DRIVER', fullName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false },
    schema,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const handleAuth = useAuthResult();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) return;
    setBusy(true);
    try {
      await authApi.signup({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        role: values.role,
      });
      navigate(`/verify-email?email=${encodeURIComponent(values.email.trim())}`);
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      setErrors(fieldErrors);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async (idToken) => {
    setError('');
    try {
      handleAuth(await authApi.google({ idToken, role: values.role }));
    } catch (err) {
      setError(parseError(err).message);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Pakistan's connected EV charging network."
      footer={<>Already have an account? <Link to="/login" className="link">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Alert>{error}</Alert>

        <div>
          <span className="label">I am a…</span>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                key={r.value}
                onClick={() => setValues((v) => ({ ...v, role: r.value }))}
                className={`rounded-xl border p-3 text-left transition ${
                  values.role === r.value ? 'border-brand-400/60 bg-brand-500/10 ring-2 ring-brand-400/30' : 'border-white/10 hover:border-white/20'
                }`}
                aria-pressed={values.role === r.value}
              >
                <div className="text-sm font-semibold">{r.title}</div>
                <div className="mt-0.5 text-xs text-slate-400">{r.desc}</div>
              </motion.button>
            ))}
          </div>
          {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role}</p>}
        </div>

        <GoogleSignInButton onCredential={onGoogle} onError={setError} text="signup_with" />
        <OrDivider />

        <FormField label="Full name" name="fullName" autoComplete="name"
          value={values.fullName} onChange={onChange} onBlur={onBlur} error={errors.fullName} />
        <FormField label="Email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={onChange} onBlur={onBlur} error={errors.email} />
        <FormField label="Mobile number" name="phone" type="tel" autoComplete="tel" placeholder="03XXXXXXXXX"
          value={values.phone} onChange={onChange} onBlur={onBlur} error={errors.phone} />
        <PasswordInput label="Password" name="password" autoComplete="new-password" showStrength
          value={values.password} onChange={onChange} onBlur={onBlur} error={errors.password} />
        <PasswordInput label="Confirm password" name="confirmPassword" autoComplete="new-password"
          value={values.confirmPassword} onChange={onChange} onBlur={onBlur} error={errors.confirmPassword} />

        <div>
          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input type="checkbox" name="terms" checked={values.terms} onChange={onChange}
              className="mt-0.5 h-4 w-4 rounded border-white/15 text-brand-400" />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-400">{errors.terms}</p>}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner />} Create account
        </button>
      </form>
    </AuthLayout>
  );
}
