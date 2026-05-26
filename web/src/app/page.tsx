import { redirect } from 'next/navigation';

// Root route — redirect to dashboard (or login if not authenticated)
// TODO: check auth session and redirect accordingly
export default function Home() {
  redirect('/dashboard');
}
