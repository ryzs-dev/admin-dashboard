import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy · Lunaa Women Care Back Office',
  description: 'How the Lunaa Women Care back office handles data, including data from Facebook and Instagram.',
};

const UPDATED = '10 November 2026';
const CONTACT = 'admin@lunaawomencare.com';

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-[15px] leading-7 text-foreground/85">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">Lunaa Women Care Back Office</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy policy</h1>
          <p className="text-sm text-muted-foreground">Last updated {UPDATED}</p>
        </header>

        <Section title="Who we are">
          <p>
            The Lunaa Women Care Back Office (crm.lunaawomencare.com) is an internal tool used by staff of LUNAA &amp;
            SIX SDN BHD (“Lunaa”, “we”) to manage orders, customers, shipping and marketing. It is built and maintained
            for Lunaa by RyDevHub. It is not offered to the public.
          </p>
        </Section>

        <Section title="Data from Facebook and Instagram">
          <p>
            When a Lunaa staff member chooses “Continue with Facebook”, the back office receives an access token from
            Meta and uses it to read, for Lunaa’s own Facebook pages and ad accounts only:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              ad account performance: spend, impressions, clicks, conversations and purchases per campaign and ad;
            </li>
            <li>page insights: followers, views, engagement and page visits;</li>
            <li>posts published by the page and ads’ posts, with their reaction, comment and share counts;</li>
            <li>
              comments people leave on Lunaa’s posts and ads, including the commenter’s name, so staff can read and
              reply to customer questions.
            </li>
          </ul>
          <p>
            This information is shown only to signed-in Lunaa staff. We use it to measure Lunaa’s advertising and to
            answer customers. We do not sell it, share it with third parties, use it to build profiles of individuals,
            or use it for any other purpose.
          </p>
        </Section>

        <Section title="Storage and retention">
          <p>
            The access token is stored encrypted on Lunaa’s own server. Daily ad numbers are stored so reports can
            compare periods. Page insights, posts and comments are read from Meta when a staff member opens the page and
            kept in temporary memory for at most 24 hours; they are not saved to our database.
          </p>
          <p>
            Disconnecting Facebook in the back office (Integrations → Meta ads → Disconnect) deletes the stored token.
            You can also remove the app at any time in your Facebook settings under Apps and websites.
          </p>
        </Section>

        <Section id="data-deletion" title="Deleting your data">
          <p>
            If you commented on one of Lunaa’s posts or ads and want any information about you removed, or if you
            connected your Facebook account and want everything we hold deleted, email{' '}
            <a href={`mailto:${CONTACT}`} className="font-medium underline">
              {CONTACT}
            </a>{' '}
            with your name and the post or account concerned. We will confirm and delete it within 30 days. Deleting a
            comment on Facebook also removes it from the back office within 24 hours.
          </p>
        </Section>

        <Section title="Other data">
          <p>
            The back office also holds Lunaa’s order and customer records (names, phone numbers, delivery addresses and
            order history) to fulfil orders and send shipping updates. Access is limited to Lunaa staff accounts.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy:{' '}
            <a href={`mailto:${CONTACT}`} className="font-medium underline">
              {CONTACT}
            </a>
            .
          </p>
        </Section>
      </article>
    </main>
  );
}
