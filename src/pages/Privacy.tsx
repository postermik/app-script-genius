const LAST_UPDATED = "March 1, 2026";

export default function Privacy() {
  return (
    <div className="flex-1 px-6 pt-24 pb-20">
      <div className="max-w-[720px] mx-auto prose-invert">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground/60 mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
          <Section title="1. Information We Collect">
            <strong className="text-foreground/80">Account information:</strong> name, email address, and password when you register.
            <br /><br />
            <strong className="text-foreground/80">Usage data:</strong> pages visited, features used, session duration, and interaction patterns.
            <br /><br />
            <strong className="text-foreground/80">Device information:</strong> browser type, operating system, IP address, and device identifiers.
            <br /><br />
            <strong className="text-foreground/80">Payment information:</strong> processed securely via Stripe. We do not store your full card number.
            <br /><br />
            <strong className="text-foreground/80">User content:</strong> text, narratives, and project data you submit to generate outputs.
          </Section>
          <Section title="2. How We Use Information">
            We use the information we collect to: provide, maintain, and improve the Service; process payments; communicate with you about your account; analyze usage patterns to improve the product; and comply with legal obligations. Your content is processed to generate outputs and is not used to train third-party AI models.
          </Section>
          <Section title="3. How We Share Information">
            We may share information with: (a) service providers who help us operate the Service (hosting, payments, analytics); (b) when required by law, regulation, or legal process; (c) in connection with a merger, acquisition, or sale of assets, in which case you will be notified. We do not sell your personal information.
          </Section>
          <Section title="4. Data Retention">
            We retain your data for as long as your account is active or as needed to provide the Service. You can delete your projects at any time. After account deletion, we will remove your personal data within 30 days, except where we are required to retain it by law.
          </Section>
          <Section title="5. Security">
            We use industry-standard security measures including encryption in transit (TLS) and at rest. While no system is perfectly secure, we take reasonable precautions to protect your data from unauthorized access, alteration, or destruction.
          </Section>
          <Section title="6. Cookies and Analytics">
            We use essential cookies to maintain your session and preferences. We may use analytics tools to understand how the Service is used. You can manage cookie preferences through your browser settings.
          </Section>
          <Section title="7. Your Choices">
            <strong className="text-foreground/80">Access and correction:</strong> you can access and update your account information at any time.
            <br /><br />
            <strong className="text-foreground/80">Deletion:</strong> you can request deletion of your account and associated data by contacting us.
            <br /><br />
            <strong className="text-foreground/80">Communications:</strong> you can opt out of non-essential emails at any time.
          </Section>
          <Section title="8. International Users">
            Rhetoric is operated from the United States. If you access the Service from outside the US, your data may be transferred to and processed in the US. By using the Service, you consent to this transfer.
          </Section>
          <Section title="9. Children's Privacy">
            The Service is not intended for users under 18. We do not knowingly collect information from children. If we learn we have collected data from a child, we will delete it promptly.
          </Section>
          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. We'll notify you of material changes via email or in-app notice. Continued use after updates constitutes acceptance.
          </Section>
          <Section title="11. Contact">
            Questions about this policy? Email us at{" "}
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
      <div>{children}</div>
    </div>
  );
}
