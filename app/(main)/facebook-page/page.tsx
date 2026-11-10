import { redirect } from 'next/navigation';

// Moved to /pages.
export default function FacebookPageRedirect() {
  redirect('/pages');
}
