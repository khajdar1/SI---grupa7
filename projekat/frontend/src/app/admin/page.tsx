'use client';
export const runtime = 'edge';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import { ConfirmDialog, DataTable, PageHeader, PageLayout, StatCard } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES, UI } from '@/constants';
import {
  clearFieldError,
  getApiFieldErrors,
  validateEmail,
  validatePersonName,
  validateRequiredSelection,
  validateSafeText,
} from '@/lib/form-validation';
import type { Company } from '@/models/Company';
import { getCompanies } from '@/services/companies.service';
import {
  MANAGED_USER_ROLES,
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  getUsers,
  updateUser,
  type ManagedUser,
  type ManagedUserRole,
} from '@/services/users.service';

type FormMode = 'create' | 'edit';
type PendingAction = {
  type: 'activate' | 'deactivate' | 'delete';
  user: ManagedUser;
} | null;

const ROLE_LABELS: Record<ManagedUserRole, string> = {
  KORISNIK: 'User',
  SERVISER: 'Technician',
  KOORDINATOR: 'Coordinator',
  MENADZMENT: 'Management',
  KOMPANIJA_ADMIN: 'Company Admin',
  SUPPORT_AGENT: 'Support Agent',
  ADMIN: 'Admin',
};
const NO_COMPANY_VALUE = 'NO_COMPANY';

const emptyForm = {
  id: 0,
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'KORISNIK' as ManagedUserRole,
  companyId: '',
};

function getTokenRoles(token: string): string[] {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
    };

    const realmRoles = payload.realm_access?.roles ?? [];
    const clientRoles = Object.values(payload.resource_access ?? {}).flatMap((access) => access.roles ?? []);
    return [...realmRoles, ...clientRoles].map((role) => role.toLowerCase());
  } catch {
    return [];
  }
}

function hasAdminRole(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = window.localStorage.getItem('token');
  if (!token) {
    return false;
  }

  const roles = getTokenRoles(token);
  return roles.includes('admin') || roles.includes('administrator');
}

function getUnauthorizedRedirectRoute(token: string | null): string {
  const roles = token ? getTokenRoles(token) : [];
  const isCompanyAdmin = roles.includes('kompanijaadmin') || roles.includes('companyadmin');
  const isSystemAdmin = roles.includes('admin') || roles.includes('administrator');

  return isCompanyAdmin && !isSystemAdmin ? ROUTES.COMPANY : ROUTES.DASHBOARD;
}

function getCurrentUserId(): number | null {
  try {
    const rawUser = window.localStorage.getItem('user');
    const parsedUser = rawUser ? (JSON.parse(rawUser) as { id?: unknown }) : null;
    return typeof parsedUser?.id === 'number' ? parsedUser.id : null;
  } catch {
    return null;
  }
}

function getRoleBadgeVariant(role: ManagedUserRole | null): 'default' | 'secondary' | 'outline' {
  if (role === 'ADMIN') {
    return 'default';
  }

  if (role === 'MENADZMENT' || role === 'KOORDINATOR') {
    return 'secondary';
  }

  return 'outline';
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.active).length;
    const inactiveUsers = users.length - activeUsers;
    const admins = users.filter((user) => user.role === 'ADMIN').length;

    return [
      { title: 'Users', value: users.length },
      { title: 'Active', value: activeUsers },
      { title: 'Inactive', value: inactiveUsers },
      { title: 'Admins', value: admins },
    ];
  }, [users]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [userList, companyList] = await Promise.all([getUsers(), getCompanies()]);
      setUsers(userList);
      setCompanies(companyList);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const canUseAdmin = hasAdminRole();
    setAuthorized(canUseAdmin);
    setCurrentUserId(getCurrentUserId());

    if (canUseAdmin) {
      void loadAdminData();
    } else {
      window.sessionStorage.setItem('authRedirectMessage', 'You do not have permission to access the admin area.');
      router.replace(`${getUnauthorizedRedirectRoute(token)}?unauthorized=1`);
      setLoading(false);
    }

    setAuthChecked(true);
  }, [router]);

  const resetForm = () => {
    setFormMode('create');
    setFormData(emptyForm);
    setFieldErrors({});
    setFormError('');
  };

  const handleEdit = (user: ManagedUser) => {
    setFormMode('edit');
    setFormData({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role ?? 'KORISNIK',
      companyId: user.companyId ? String(user.companyId) : '',
    });
    setFieldErrors({});
    setFormError('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const firstNameError = validatePersonName(formData.firstName, {
      requiredMessage: 'First name is required.',
      maxLength: 100,
    });
    const lastNameError = validatePersonName(formData.lastName, {
      requiredMessage: 'Last name is required.',
      maxLength: 100,
    });
    const emailError = validateEmail(formData.email, 'Email is required.', 'Enter a valid email address.');

    if (firstNameError) nextErrors.firstName = firstNameError;
    if (lastNameError) nextErrors.lastName = lastNameError;
    if (emailError) nextErrors.email = emailError;

    if (formMode === 'create') {
      const usernameError = validateSafeText(formData.username, {
        requiredMessage: 'Username is required.',
        minLength: 2,
        maxLength: 50,
      });

      if (usernameError) nextErrors.username = usernameError;

      if (!formData.password) {
        nextErrors.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        nextErrors.password = 'Password must be at least 8 characters.';
      } else if (!/[0-9]/.test(formData.password) || !/[A-Z]/.test(formData.password)) {
        nextErrors.password = 'Password must contain one uppercase letter and one number.';
      }
    }

    if (formData.role === 'SERVISER' || formData.role === 'KOMPANIJA_ADMIN') {
      const companyError = validateRequiredSelection(
        formData.companyId,
        'Company is required for servicer and company admin users.',
      );
      if (companyError) nextErrors.companyId = companyError;
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccessMessage('');

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError('Please correct the highlighted fields.');
      setSaving(false);
      return;
    }

    try {
      const companyId = formData.companyId ? Number(formData.companyId) : null;

      if (formMode === 'create') {
        await createUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          companyId,
        });
        setSuccessMessage('User created.');
      } else {
        await updateUser(formData.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          companyId,
        });
        setSuccessMessage('User updated.');
      }

      resetForm();
      await loadAdminData();
    } catch (requestError: unknown) {
      const serviceDetails =
        typeof requestError === 'object' && requestError !== null
          ? (requestError as { details?: unknown }).details
          : undefined;
      const backendFieldErrors = getApiFieldErrors(
        serviceDetails ? { response: (serviceDetails as { response?: unknown }).response } : requestError,
      );

      setFieldErrors(backendFieldErrors);
      setFormError(requestError instanceof Error ? requestError.message : 'User save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.type === 'activate') {
        await activateUser(pendingAction.user.id);
        setSuccessMessage('User reactivated.');
      } else if (pendingAction.type === 'deactivate') {
        await deactivateUser(pendingAction.user.id);
        setSuccessMessage('User deactivated.');
      } else {
        await deleteUser(pendingAction.user.id);
        setSuccessMessage('User deleted.');
      }

      await loadAdminData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Action failed.');
    } finally {
      setPendingAction(null);
    }
  };

  if (!authChecked || !authorized) {
    return null;
  }

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Admin"
        subtitle="Account governance dashboard."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Admin' }]}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} isLoading={loading} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>{formMode === 'create' ? 'New User' : 'Edit User'}</CardTitle>
            <CardDescription>{formMode === 'create' ? 'Create a Keycloak-backed account.' : formData.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(event) => {
                      setFormData((previous) => ({ ...previous, firstName: event.target.value }));
                      setFieldErrors((previous) => clearFieldError(previous, 'firstName'));
                    }}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                  />
                  {fieldErrors.firstName ? <p className="text-xs text-destructive">{fieldErrors.firstName}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(event) => {
                      setFormData((previous) => ({ ...previous, lastName: event.target.value }));
                      setFieldErrors((previous) => clearFieldError(previous, 'lastName'));
                    }}
                    aria-invalid={Boolean(fieldErrors.lastName)}
                  />
                  {fieldErrors.lastName ? <p className="text-xs text-destructive">{fieldErrors.lastName}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  disabled={formMode === 'edit'}
                  onChange={(event) => {
                    setFormData((previous) => ({ ...previous, username: event.target.value }));
                    setFieldErrors((previous) => clearFieldError(previous, 'username'));
                  }}
                  aria-invalid={Boolean(fieldErrors.username)}
                />
                {fieldErrors.username ? <p className="text-xs text-destructive">{fieldErrors.username}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => {
                    setFormData((previous) => ({ ...previous, email: event.target.value }));
                    setFieldErrors((previous) => clearFieldError(previous, 'email'));
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
              </div>

              {formMode === 'create' ? (
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => {
                      setFormData((previous) => ({ ...previous, password: event.target.value }));
                      setFieldErrors((previous) => clearFieldError(previous, 'password'));
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                  {fieldErrors.password ? <p className="text-xs text-destructive">{fieldErrors.password}</p> : null}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      setFormData((previous) => ({ ...previous, role: (value as ManagedUserRole) ?? previous.role }));
                      setFieldErrors((previous) => clearFieldError(previous, 'role'));
                    }}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue>
                        {ROLE_LABELS[formData.role as ManagedUserRole] ?? formData.role}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MANAGED_USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Select
                    value={formData.companyId || NO_COMPANY_VALUE}
                    onValueChange={(value) => {
                      setFormData((previous) => ({
                        ...previous,
                        companyId: value === NO_COMPANY_VALUE ? '' : value ?? '',
                      }));
                      setFieldErrors((previous) => clearFieldError(previous, 'companyId'));
                    }}
                  >
                    <SelectTrigger id="company" className="w-full" aria-invalid={Boolean(fieldErrors.companyId)}>
                      <SelectValue>
                        {formData.companyId
                          ? (companies.find((c) => String(c.id) === formData.companyId)?.name ?? 'Select company')
                          : 'No company'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_COMPANY_VALUE}>No company</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.companyId ? <p className="text-xs text-destructive">{fieldErrors.companyId}</p> : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {formMode === 'create' ? <Plus className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                  {saving ? 'Saving...' : formMode === 'create' ? 'Create' : 'Save'}
                </Button>
                {formMode === 'edit' ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>Keycloak roles with local account status and company assignment.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={loadAdminData} disabled={loading}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable<ManagedUser>
              columns={[
                {
                  key: 'username',
                  header: 'User',
                  render: (_, row) => (
                    <div className="min-w-44">
                      <p className="font-medium text-foreground">{row.firstName} {row.lastName}</p>
                      <p className="text-xs text-muted-foreground">@{row.username}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Role',
                  width: UI.TABLE_COLUMN_WIDTHS.USER_ROLE,
                  render: (value) => (
                    <Badge variant={getRoleBadgeVariant(value as ManagedUserRole | null)}>
                      {value ? ROLE_LABELS[value as ManagedUserRole] : 'Unmapped'}
                    </Badge>
                  ),
                },
                {
                  key: 'active',
                  header: 'Status',
                  width: UI.TABLE_COLUMN_WIDTHS.USER_STATUS,
                  render: (value) =>
                    value ? <Badge variant="secondary">Active</Badge> : <Badge variant="destructive">Inactive</Badge>,
                },
                {
                  key: 'companyName',
                  header: 'Company',
                  width: UI.TABLE_COLUMN_WIDTHS.USER_COMPANY,
                  render: (value) => (value ? String(value) : '-'),
                },
                {
                  key: 'id',
                  header: 'Actions',
                  width: UI.TABLE_COLUMN_WIDTHS.USER_ACTIONS,
                  render: (_, row) => {
                    const isSelf = currentUserId === row.id;
                    return (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(row)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant={row.active ? 'outline' : 'default'}
                          size="sm"
                          disabled={isSelf && row.active}
                          onClick={() => setPendingAction({ type: row.active ? 'deactivate' : 'activate', user: row })}
                        >
                          <Power className="size-4" aria-hidden="true" />
                          {row.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isSelf}
                          onClick={() => setPendingAction({ type: 'delete', user: row })}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={users}
              keyExtractor={(row) => String(row.id)}
              isLoading={loading}
              error={error || null}
              onRetry={loadAdminData}
              emptyTitle="No users"
              emptyDescription="Create the first managed account."
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmedAction}
        title={
          pendingAction?.type === 'delete'
            ? 'Delete user?'
            : pendingAction?.type === 'deactivate'
              ? 'Deactivate user?'
              : 'Reactivate user?'
        }
        description={
          pendingAction?.type === 'delete'
            ? 'Deletion is blocked when the user is linked to active interventions.'
            : pendingAction?.type === 'deactivate'
              ? 'The user will lose access immediately.'
              : 'The user will be able to sign in again.'
        }
        confirmLabel={
          pendingAction?.type === 'delete'
            ? 'Delete'
            : pendingAction?.type === 'deactivate'
              ? 'Deactivate'
              : 'Reactivate'
        }
        variant={pendingAction?.type === 'delete' ? 'danger' : 'warning'}
      />
    </PageLayout>
  );
}
