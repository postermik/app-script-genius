import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const mailto = `mailto:mike@getrhetoric.ai?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`From: ${form.name} (${form.email})\n\n${form.message}`)}`;
    window.open(mailto, "_blank");
    toast.success("Opening your email client…", { description: "If nothing opens, email us directly at mike@getrhetoric.ai" });
  };

  const field = (key: keyof typeof form, label: string, multiline = false) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: "" }); }}
          rows={5}
          className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-foreground focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground/40 resize-none"
        />
      ) : (
        <input
          type={key === "email" ? "email" : "text"}
          value={form[key]}
          onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setErrors({ ...errors, [key]: "" }); }}
          className="w-full bg-card border border-border rounded-sm px-4 py-3 text-sm text-foreground focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground/40"
        />
      )}
      {errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="flex-1 px-6 pt-24 pb-20">
      <div className="max-w-[520px] mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Support</p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">Contact</h1>
        <p className="text-sm text-muted-foreground mb-12">
          Send a note and we'll get back to you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {field("name", "Name")}
          {field("email", "Email")}
          {field("subject", "Subject")}
          {field("message", "Message", true)}
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-8 py-3 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity glow-blue"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
