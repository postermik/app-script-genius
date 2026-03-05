const LAST_UPDATED = "March 1, 2026";

export default function Terms() {
  return (
    <div className="flex-1 px-6 pt-24 pb-20">
      <div className="max-w-[720px] mx-auto prose-invert">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Terms of Service</h1>
        <p className="text-xs text-muted-foreground/60 mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Acceptance of Terms">
            By accessing or using Rhetoric ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </Section>
          <Section title="2. Eligibility">
            You must be at least 18 years old and legally able to enter into a binding agreement. By using the Service you represent that you meet these requirements.
          </Section>
          <Section title="3. Account Registration and Security">
            You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately at mike@getrhetoric.ai if you suspect unauthorized access.
          </Section>
          <Section title="4. Subscriptions, Billing, and Renewals">
            Paid plans are billed on a recurring basis (monthly or annually) through our payment processor, Stripe. You authorize us to charge your payment method at the start of each billing cycle. Subscriptions renew automatically unless cancelled before the renewal date. Refunds are not provided for partial billing periods.
          </Section>
          <Section title="5. Free Trials and Promotional Terms">
            We may offer free trials or promotional pricing at our discretion. At the end of a trial period, your subscription will convert to a paid plan unless you cancel. Promotional terms are subject to change.
          </Section>
          <Section title="6. User Content and Ownership">
            You retain full ownership of all content you submit to Rhetoric ("User Content"). By using the Service, you grant us a limited, non-exclusive license to process, store, and display your User Content solely for the purpose of providing the Service to you. We do not claim ownership of your ideas, narratives, or outputs.
          </Section>
          <Section title="7. Acceptable Use">
            You agree not to: (a) use the Service for unlawful purposes; (b) attempt to reverse-engineer, disassemble, or derive source code from the Service; (c) upload malicious code or interfere with the operation of the Service; (d) resell or redistribute outputs without authorization; or (e) misrepresent AI-generated outputs as human-authored professional advice (legal, financial, etc.).
          </Section>
          <Section title="8. Confidentiality and Data Handling">
            We take the security of your data seriously. Your inputs are not used to train third-party AI models. For details on how we collect, process, and store data, please refer to our <a href="/privacy" className="text-electric hover:underline">Privacy Policy</a>.
          </Section>
          <Section title="9. Third-Party Services">
            The Service integrates with third-party providers, including Stripe for payments and AI model providers for content generation. Your use of these integrations is subject to their respective terms.
          </Section>
          <Section title="10. Disclaimer of Warranties">
            The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee that outputs will be accurate, complete, or suitable for any particular purpose. Rhetoric is a narrative structuring tool, not legal, financial, or investment advice.
          </Section>
          <Section title="11. Limitation of Liability">
            To the maximum extent permitted by law, Rhetoric and its officers, employees, and affiliates shall not be liable for indirect, incidental, consequential, or punitive damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the twelve months preceding the claim.
          </Section>
          <Section title="12. Indemnification">
            You agree to indemnify and hold harmless Rhetoric and its team from any claims, damages, or expenses arising from your use of the Service, your User Content, or your violation of these Terms.
          </Section>
          <Section title="13. Termination">
            We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may cancel your account at any time. Upon termination, your right to use the Service ceases, though provisions that by their nature should survive (liability, indemnification, governing law) will remain in effect.
          </Section>
          <Section title="14. Governing Law">
            These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in Delaware.
          </Section>
          <Section title="15. Changes to Terms">
            We may update these Terms from time to time. We'll notify you of material changes via email or in-app notice. Continued use after changes constitutes acceptance.
          </Section>
          <Section title="16. Contact">
            Questions about these Terms? Email us at{" "}
            <a href="mailto:mike@getrhetoric.ai" className="text-electric hover:underline">
              mike@getrhetoric.ai
            </a>.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-foreground mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
