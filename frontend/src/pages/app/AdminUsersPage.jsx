import { useEffect, useState } from 'react';
import { parseError } from '../../api/client';
import { adminApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import Spinner from '../../components/Spinner';
import { ROLE_LABEL, useAuth } from '../../context/AuthContext';

/** Minimal user list for admins (full Admin Panel is a later module). */
export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    adminApi.users().then(setUsers).catch((e) => setError(parseError(e).message));
  }, []);

  const toggle = async (u) => {
    try {
      const updated = await adminApi.setEnabled(u.id, !u.enabled);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      setError(parseError(e).message);
    }
  };

  const shown = users?.filter((u) => filter === 'ALL' || u.role === filter) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All roles</option>
          <option value="DRIVER">Drivers</option>
          <option value="STATION_OWNER">Station owners</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>
      <Alert>{error}</Alert>
      {users === null ? (
        <div className="flex justify-center py-10 text-brand-400"><Spinner className="h-6 w-6" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verified</th><th className="px-4 py-3">2FA</th><th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3">{u.emailVerified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{u.mfaEnabled ? 'On' : 'Off'}</td>
                  <td className="px-4 py-3">
                    {u.id === me.id ? <span className="text-xs text-slate-400">You</span> : (
                      <button onClick={() => toggle(u)}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.enabled ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20' : 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-400/20'}`}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
