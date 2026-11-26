'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Search, Users } from 'lucide-react';
import { PortalHeader } from '@/components/layout/portal-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError, formatGhsFromPesewas } from '@/lib/api';
import { authFetch, getStoredUser, type AuthUser } from '@/lib/auth';

interface AdminApplicationItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  instrument: { id: string; name: string };
  student: { id: string; studentNumber: string } | null;
  invoices: Array<{
    invoiceNumber: string;
    amountPesewas: number;
    status: string;
  }>;
}

interface AdminStudentItem {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  user: { status: string };
  enrollments: Array<{
    id: string;
    status: string;
    program: { name: string };
    course: { title: string };
  }>;
}

export default function AdminPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<AdminApplicationItem[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (statusVal: string, searchVal: string) => {
      setError(null);
      setLoading(true);
      try {
        const appParams = new URLSearchParams();
        if (statusVal !== 'ALL') appParams.set('status', statusVal);
        if (searchVal.trim()) appParams.set('search', searchVal.trim());

        const studentParams = new URLSearchParams();
        if (searchVal.trim()) studentParams.set('search', searchVal.trim());

        const [appRes, studentRes] = await Promise.all([
          authFetch<{ items: AdminApplicationItem[] }>(
            `/admin/applications?${appParams.toString()}`,
          ),
          authFetch<{ items: AdminStudentItem[] }>(
            `/admin/students?${studentParams.toString()}`,
          ),
        ]);
        setApplications(appRes.items);
        setStudents(studentRes.items);
        setUser(getStoredUser());
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 401 || status === 403) {
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to load admin dashboard.',
        );
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    setUser(getStoredUser());
    void loadData('ALL', '');
  }, [loadData]);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void loadData(statusFilter, search);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader user={user} homeHref="/admin" title="Admin Portal" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admissions &amp; Student Administration
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Review paid applications, approve enrollments, assign courses, and search students.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or PMH student number..."
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              void loadData(val, search);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AWAITING_REVIEW">Awaiting Review</SelectItem>
              <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            <Search className="size-4" />
            Search
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Applications Queue ({applications.length})</CardTitle>
            <CardDescription>
              Paid applications appear in <strong>AWAITING_REVIEW</strong> ready for enrollment
              approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications match your filter.
              </p>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {app.firstName} {app.lastName}
                      </span>
                      <Badge variant="outline">{app.instrument.name}</Badge>
                      <Badge
                        variant={
                          app.status === 'AWAITING_REVIEW'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {app.status}
                      </Badge>
                      {app.student && (
                        <Badge variant="outline" className="font-mono">
                          {app.student.studentNumber}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.email} &bull; {app.phone}
                      {app.invoices[0] &&
                        ` • Invoice ${app.invoices[0].invoiceNumber} (${formatGhsFromPesewas(app.invoices[0].amountPesewas)} ${app.invoices[0].status})`}
                    </p>
                  </div>

                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/applications/${app.id}`}>
                      Review
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Students Directory ({students.length})
            </CardTitle>
            <CardDescription>
              Registered student profiles created after verified GH₵50 payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students yet.</p>
            ) : (
              students.map((stu) => (
                <div
                  key={stu.id}
                  className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {stu.studentNumber}
                      </Badge>
                      <span className="font-semibold">
                        {stu.firstName} {stu.lastName}
                      </span>
                      <Badge variant="secondary">{stu.user.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stu.email} &bull; {stu.phone}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {stu.enrollments.length > 0
                      ? stu.enrollments
                          .map((e) => `${e.course.title} (${e.status})`)
                          .join(', ')
                      : 'No enrollment assigned yet'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
