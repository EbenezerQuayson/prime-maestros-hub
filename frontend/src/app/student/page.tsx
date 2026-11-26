'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, Clock, Lock } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { ApiError, formatGhsFromPesewas } from '@/lib/api';
import { authFetch, getStoredUser, type AuthUser } from '@/lib/auth';

interface StudentProfileResponse {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  applications: Array<{
    id: string;
    status: string;
    decisionReason: string | null;
    createdAt: string;
    instrument: { id: string; name: string; slug: string };
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    type: string;
    amountPesewas: number;
    currency: string;
    status: string;
    paidAt: string | null;
  }>;
}

interface StudentCoursesResponse {
  studentNumber: string;
  accessGranted: boolean;
  latestApplicationStatus: string | null;
  courses: Array<{
    enrollmentId: string;
    enrollmentStatus: string;
    program: {
      id: string;
      name: string;
      instrument: { name: string };
    };
    course: {
      id: string;
      title: string;
      level: string;
      description: string | null;
    };
    instructor: { firstName: string; lastName: string } | null;
    class: { name: string; venue: string; room: string | null } | null;
  }>;
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [coursesData, setCoursesData] = useState<StudentCoursesResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] =
    useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);

    Promise.all([
      authFetch<StudentProfileResponse>('/students/me'),
      authFetch<StudentCoursesResponse>('/students/me/courses'),
    ])
      .then(([me, courses]) => {
        setProfile(me);
        setCoursesData(courses);
        setPhone(me.phone || '');
        setAddress(me.address || '');
        setEmergencyContactName(me.emergencyContactName || '');
        setEmergencyContactPhone(me.emergencyContactPhone || '');
        setEmergencyContactRelationship(me.emergencyContactRelationship || '');
        setUser(getStoredUser());
      })
      .catch((err) => {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 401 || status === 403) {
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to load student portal.',
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveMessage(null);
    setError(null);
    setSaving(true);
    try {
      const updated = await authFetch<StudentProfileResponse>('/students/me', {
        method: 'PATCH',
        body: JSON.stringify({
          phone,
          address,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
        }),
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaveMessage('Profile details updated.');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to update profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader user={user} homeHref="/student" title="Student Portal" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading your student portal...
          </p>
        ) : error && !profile ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Portal Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          profile && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Welcome back
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {profile.firstName} {profile.lastName}
                  </h1>
                </div>
                <Badge className="text-sm px-3 py-1 font-mono w-fit">
                  {profile.studentNumber}
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    Enrollment &amp; Course Access
                  </CardTitle>
                  <CardDescription>
                    Course resources unlock once your enrollment is approved by an academy
                    administrator.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {coursesData && !coursesData.accessGranted ? (
                    <Alert>
                      <Lock />
                      <AlertTitle>
                        Course Access Pending Enrollment Approval (
                        {coursesData.latestApplicationStatus || 'PENDING'})
                      </AlertTitle>
                      <AlertDescription>
                        Your student account is active and your registration payment is verified.
                        An administrator will review your application and assign your program,
                        instructor, and physical class.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {coursesData?.courses.map((item) => (
                        <Card key={item.enrollmentId} className="bg-background">
                          <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline">
                                {item.program.instrument.name}
                              </Badge>
                              <Badge>{item.course.level}</Badge>
                            </div>
                            <CardTitle className="text-lg mt-2">
                              {item.course.title}
                            </CardTitle>
                            <CardDescription>{item.program.name}</CardDescription>
                          </CardHeader>
                          <CardContent className="text-xs text-muted-foreground space-y-1">
                            <p>
                              Instructor:{' '}
                              {item.instructor
                                ? `${item.instructor.firstName} ${item.instructor.lastName}`
                                : 'To be assigned'}
                            </p>
                            <p>
                              Class:{' '}
                              {item.class
                                ? `${item.class.name} (${item.class.venue}${item.class.room ? `, ${item.class.room}` : ''})`
                                : 'To be assigned'}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">My Contact &amp; Emergency Details</CardTitle>
                    <CardDescription>
                      Student ID and email are managed by administration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {saveMessage && (
                        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                          <CheckCircle2 className="text-emerald-700" />
                          <AlertDescription className="text-emerald-800">
                            {saveMessage}
                          </AlertDescription>
                        </Alert>
                      )}
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="emName">Emergency Contact</Label>
                          <Input
                            id="emName"
                            value={emergencyContactName}
                            onChange={(e) =>
                              setEmergencyContactName(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emPhone">Emergency Phone</Label>
                          <Input
                            id="emPhone"
                            value={emergencyContactPhone}
                            onChange={(e) =>
                              setEmergencyContactPhone(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emRel">Relationship</Label>
                        <Input
                          id="emRel"
                          value={emergencyContactRelationship}
                          onChange={(e) =>
                            setEmergencyContactRelationship(e.target.value)
                          }
                        />
                      </div>
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Applications &amp; Invoices</CardTitle>
                    <CardDescription>
                      Recent registration and tuition records
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {profile.applications.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-lg border p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{app.instrument.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Application {app.id.slice(0, 8)}...
                          </p>
                        </div>
                        <Badge variant="secondary">{app.status}</Badge>
                      </div>
                    ))}

                    {profile.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-lg border p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-mono font-medium text-xs">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {inv.type} &bull; {formatGhsFromPesewas(inv.amountPesewas)}
                          </p>
                        </div>
                        <Badge
                          variant={inv.status === 'PAID' ? 'default' : 'outline'}
                          className="gap-1"
                        >
                          {inv.status !== 'PAID' && <Clock className="size-3" />}
                          {inv.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
