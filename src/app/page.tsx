// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // This component will automatically redirect anyone visiting the root URL
  // to the login page.
  redirect('/login');
  
  // Return null because the redirect will happen before anything renders.
  return null;
}