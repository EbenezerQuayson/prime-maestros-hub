import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Page not found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
