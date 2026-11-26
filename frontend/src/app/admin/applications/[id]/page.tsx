'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, formatGhsFromPesewas } from '@/lib/api';
import { authFetch, getStoredUser, type AuthUser } from '@/lib/auth';

interface ApplicationDetailResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  experienceLevel: string | null;
  goals: string | null;
  availability: string | null;
  status: string;
  decisionReason: string | null;
  createdAt: string;
  instrument: {
    id: string;
    name: string;
    programs: Array<{
      id: string;
      name: string;
      courses: Array<{ id: string; title: string; level: string }>;
    }>;
  };
  student: {
    id: string;
    studentNumber: string;
    user: { email: string; status: string };
  } | null;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    amountPesewas: number;
    status: string;
    paidAt: string | null;
    payments: Array<{
      id: string;
      provider: string;
      providerReference: string;
      status: string;
      channel: string | null;
    }>;
  }>;
  enrollment: {
    id: string;
    status: string;
    program: { name: string };
    course: { title: string; level: string };
  } | null;
}

export default function AdminApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [detail, setDetail] = useState<ApplicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [programId, setProgramId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await authFetch<ApplicationDetailResponse>(
        `/admin/applications/${params.id}`,
      );
      setDetail(data);
      const firstProg = data.instrument.programs[0];
      if (firstProg) {
        setProgramId(firstProg.id);
        if (firstProg.courses[0]) {
          setCourseId(firstProg.courses[0].id);
        }
      }
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
          : 'Unable to load application details.',
      );
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    setUser(getStoredUser());
    void loadDetail();
  }, [loadDetail]);

  const selectedProgram = detail?.instrument.programs.find(
    (p) => p.id === programId,
  );

  async function handleApprove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!programId) {
      setError('Select a program before approving.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setActionMsg(null);
    try {
      await authFetch(`/admin/applications/${params.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          programId,
          courseId: courseId || undefined,
          decisionReason: approvalNote || undefined,
        }),
      });
      setActionMsg('Application approved and active enrollment created.');
      await loadDetail();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Approval failed.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setActionMsg(null);
    try {
      await authFetch(`/admin/applications/${params.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setActionMsg('Application rejected.');
      await loadDetail();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Rejection failed.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setActionMsg(null);
    try {
      await authFetch(`/admin/applications/${params.id}/request-info`, {
        method: 'POST',
        body: JSON.stringify({ message: infoMessage }),
      });
      setActionMsg('Information request recorded and sent to applicant.');
      setInfoMessage('');
      await loadDetail();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Request failed.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader user={user} homeHref="/admin" title="Admin Portal" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Admin Queue
        </Link>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading application...</p>
        ) : (
          detail && (
            <>
              {actionMsg && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <CheckCircle2 className="text-emerald-700" />
                  <AlertDescription className="text-emerald-800">
                    {actionMsg}
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Action Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-2xl">
                        {detail.firstName} {detail.lastName}
                      </CardTitle>
                      <CardDescription>
                        {detail.email} &bull; {detail.phone}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{detail.instrument.name}</Badge>
                      <Badge>{detail.status}</Badge>
                      {detail.student && (
                        <Badge variant="secondary" className="font-mono">
                          {detail.student.studentNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Experience</p>
                    <p>{detail.experienceLevel || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Availability</p>
                    <p>{detail.availability || 'Not provided'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground text-xs">Goals</p>
                    <p>{detail.goals || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Address</p>
                    <p>{detail.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Emergency Contact
                    </p>
                    <p>
                      {detail.emergencyContactName
                        ? `${detail.emergencyContactName} (${detail.emergencyContactPhone || 'N/A'})`
                        : 'Not provided'}
                    </p>
                  </div>
                  {detail.decisionReason && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground text-xs">Decision / Note</p>
                      <p className="font-medium">{detail.decisionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Registration Payment &amp; Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {detail.invoices.map((inv) => (
                    <div key={inv.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="font-mono font-medium">
                          {inv.invoiceNumber}
                        </span>
                        <Badge variant={inv.status === 'PAID' ? 'default' : 'outline'}>
                          {formatGhsFromPesewas(inv.amountPesewas)} &bull; {inv.status}
                        </Badge>
                      </div>
                      {inv.payments.map((pay) => (
                        <p key={pay.id} className="text-xs text-muted-foreground">
                          Ref: {pay.providerReference} ({pay.provider} /{' '}
                          {pay.channel || 'checkout'}) &mdash; {pay.status}
                        </p>
                      ))}
                    </div>
                  ))}
                  {detail.student && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Account status: <strong>{detail.student.user.status}</strong>
                    </p>
                  )}
                </CardContent>
              </Card>

              {detail.enrollment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assigned Enrollment</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      Program: <strong>{detail.enrollment.program.name}</strong>
                    </p>
                    <p>
                      Course: <strong>{detail.enrollment.course.title}</strong> (
                      {detail.enrollment.course.level})
                    </p>
                    <Badge>{detail.enrollment.status}</Badge>
                  </CardContent>
                </Card>
              )}

              {detail.status === 'AWAITING_REVIEW' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Approve &amp; Grant Course Access
                      </CardTitle>
                      <CardDescription>
                        Assign program and course to activate student enrollment.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleApprove} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="program">Program</Label>
                          <Select
                            value={programId}
                            onValueChange={(val) => {
                              setProgramId(val);
                              const prog = detail.instrument.programs.find(
                                (p) => p.id === val,
                              );
                              setCourseId(prog?.courses[0]?.id || '');
                            }}
                          >
                            <SelectTrigger id="program">
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              {detail.instrument.programs.map((prog) => (
                                <SelectItem key={prog.id} value={prog.id}>
                                  {prog.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedProgram && (
                          <div className="space-y-2">
                            <Label htmlFor="course">Course</Label>
                            <Select value={courseId} onValueChange={setCourseId}>
                              <SelectTrigger id="course">
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedProgram.courses.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="approvalNote">Approval Note (Optional)</Label>
                          <Textarea
                            id="approvalNote"
                            value={approvalNote}
                            onChange={(e) => setApprovalNote(e.target.value)}
                            placeholder="Optional onboarding note..."
                          />
                        </div>

                        <Button type="submit" disabled={submitting} className="w-full">
                          {submitting ? 'Processing...' : 'Approve Application'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Request Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleRequestInfo} className="space-y-3">
                          <Textarea
                            required
                            minLength={5}
                            value={infoMessage}
                            onChange={(e) => setInfoMessage(e.target.value)}
                            placeholder="Describe what clarification is needed..."
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            disabled={submitting}
                            className="w-full"
                          >
                            Send Request
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Reject Application</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleReject} className="space-y-3">
                          <Textarea
                            required
                            minLength={5}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Provide rejection reason (minimum 5 characters)..."
                          />
                          <Button
                            type="submit"
                            variant="destructive"
                            disabled={submitting}
                            className="w-full"
                          >
                            Reject Application
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </main>
    </div>
  );
}
