import { useEffect, useState } from 'react';
import { parseError } from '../../api/client';
import { profileApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import PasswordInput from '../../components/PasswordInput';
import Spinner from '../../components/Spinner';
import { ROLE_LABEL, useAuth } from '../../context/AuthContext';
import useForm from '../../utils/useForm';
import { rules } from '../../utils/validation';

function toLocalPhone(phone) {
  return phone?.startsWith('+92') ? `0${phone.slice(3)}` : phone || '';
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const profile = useForm({ fullName: user.fullName, phone: toLocalPhone(user.phone) },
    { fullName: rules.fullName, phone: rules.phone });
  const hasPassword = user.provider === 'LOCAL';
  const pwd = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' }, {
    ...(hasPassword ? { currentPassword: rules.loginPassword } : {}),
    newPassword: rules.password,
    confirmPassword: rules.confirm('newPassword'),
  });
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    profileApi.get().then((u) => {
      setUser(u);
      profile.setValues({ fullName: u.fullName, phone: toLocalPhone(u.phone) });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg({});
    if (!profile.validateAll()) return;
    setBusy('profile');
    try {
      setUser(await profileApi.update({ fullName: profile.values.fullName.trim(), phone: profile.values.phone.trim() }));
      setMsg({ profile: { type: 'success', text: 'Profile updated' } });
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      profile.setErrors(fieldErrors);
      setMsg({ profile: { type: 'error', text: message } });
    } finally {
      setBusy('');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg({});
    if (!pwd.validateAll()) return;
    setBusy('password');
    try {
      await profileApi.changePassword({
        currentPassword: pwd.values.currentPassword || null,
        newPassword: pwd.values.newPassword,
      });
      pwd.setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMsg({ password: { type: 'success', text: 'Password changed' } });
    } catch (err) {
      const { message, fieldErrors } = parseError(err);
      pwd.setErrors(fieldErrors);
      setMsg({ password: { type: 'error', text: message } });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card space-y-4" noValidate>
        <div>
          <h2 className="text-lg font-semibold">Personal details</h2>
          <p className="text-sm text-slate-500">{ROLE_LABEL[user.role]} · {user.email}
            {user.provider === 'GOOGLE' && ' · Google account'}
          </p>
        </div>
        <Alert type={msg.profile?.type}>{msg.profile?.text}</Alert>
        <FormField label="Full name" name="fullName" value={profile.values.fullName}
          onChange={profile.onChange} onBlur={profile.onBlur} error={profile.errors.fullName} />
        <FormField label="Mobile number" name="phone" type="tel" placeholder="03XXXXXXXXX"
          hint="Stored encrypted (AES-256)"
          value={profile.values.phone} onChange={profile.onChange} onBlur={profile.onBlur} error={profile.errors.phone} />
        <FormField label="Email" name="email" value={user.email} disabled hint="Email cannot be changed" />
        <button className="btn-primary" disabled={busy === 'profile'}>
          {busy === 'profile' && <Spinner />} Save changes
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4" noValidate>
        <div>
          <h2 className="text-lg font-semibold">{hasPassword ? 'Change password' : 'Set a password'}</h2>
          {!hasPassword && <p className="text-sm text-slate-500">Optional — lets you sign in with email too.</p>}
        </div>
        <Alert type={msg.password?.type}>{msg.password?.text}</Alert>
        {hasPassword && (
          <PasswordInput label="Current password" name="currentPassword" autoComplete="current-password"
            value={pwd.values.currentPassword} onChange={pwd.onChange} onBlur={pwd.onBlur} error={pwd.errors.currentPassword} />
        )}
        <PasswordInput label="New password" name="newPassword" autoComplete="new-password" showStrength
          value={pwd.values.newPassword} onChange={pwd.onChange} onBlur={pwd.onBlur} error={pwd.errors.newPassword} />
        <PasswordInput label="Confirm new password" name="confirmPassword" autoComplete="new-password"
          value={pwd.values.confirmPassword} onChange={pwd.onChange} onBlur={pwd.onBlur} error={pwd.errors.confirmPassword} />
        <button className="btn-primary" disabled={busy === 'password'}>
          {busy === 'password' && <Spinner />} Update password
        </button>
      </form>
    </div>
  );
}
