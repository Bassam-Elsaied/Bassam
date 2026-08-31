"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

const MESSAGE_LIMIT = 500;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(80, "That name is a little long."),
  email: z.email("Enter a valid email address."),
  subject: z
    .string()
    .trim()
    .max(120, "Keep the subject under 120 characters.")
    .refine((value) => value.length === 0 || value.length >= 3, {
      message: "Subject must be at least 3 characters.",
    }),
  message: z
    .string()
    .trim()
    .min(10, "Tell me a bit more — at least 10 characters.")
    .max(MESSAGE_LIMIT, `Keep it under ${MESSAGE_LIMIT} characters.`),
});

type ContactValues = z.infer<typeof contactSchema>;

const fieldClasses =
  "border-line-strong focus:border-accent w-full border-0 border-b bg-transparent px-0 py-3 text-lg tracking-tight outline-none transition-colors duration-300 placeholder:text-muted/60 focus-visible:outline-none";

type ContactFormProps = {
  serviceId: string;
  templateId: string;
  publicKey: string;
};

function emailJsErrorText(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "text" in error &&
    typeof error.text === "string"
  ) {
    return error.text || String("status" in error ? error.status : "");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export function ContactForm({
  serviceId,
  templateId,
  publicKey,
}: ContactFormProps) {
  const [sent, setSent] = useState<ContactValues | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  /* useWatch subscribes to a single field, so typing in the message box
     does not re-render the whole form. */
  const messageLength =
    useWatch({ control, name: "message" })?.length ?? 0;

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => setErrorMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  async function onSubmit(values: ContactValues) {
    if (!serviceId || !templateId || !publicKey) {
      setErrorMessage(
        "Email service is not configured. Add your EmailJS keys to .env",
      );
      return;
    }

    setErrorMessage("");

    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const subject = values.subject.trim() || "Portfolio contact";
    const message = values.message.trim();

    const templateParams = {
      from_name: name,
      user_name: name,
      name,
      from_email: email,
      user_email: email,
      email,
      reply_to: email,
      subject,
      message,
      user_message: message,
    };

    try {
      const emailjs = (await import("@emailjs/browser")).default;
      await emailjs.send(serviceId, templateId, templateParams, { publicKey });
      setSent(values);
      reset();
    } catch (error) {
      const detail = emailJsErrorText(error);
      console.error("EmailJS error:", detail);

      if (
        detail.includes("Invalid grant") ||
        detail.includes("insufficient authentication") ||
        detail.includes("412")
      ) {
        setErrorMessage(
          "Gmail connection expired. Reconnect your email in the EmailJS dashboard.",
        );
      } else {
        setErrorMessage("Failed to send message. Please try again later.");
      }
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (sent) {
    return (
      <div
        className="border-line border-l-accent border-y border-r border-l-2 py-8 pl-6 sm:py-10 sm:pl-8"
        role="status"
      >
        <p className="meta text-accent">Sent</p>
        <h3 className="display-sm mt-5">Your message is on its way.</h3>
        <p className="body-text text-muted mt-5 max-w-prose">
          Thanks, {sent.name}. I&apos;ll reply to {sent.email} within 24 hours.
          If you need to follow up sooner, write me directly at {profile.email}.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={copyEmail}
            className="meta bg-foreground text-background hover:bg-accent px-6 py-3.5 transition-colors duration-300"
          >
            {copied ? "Copied" : "Copy email address"}
          </button>
          <button
            type="button"
            onClick={() => setSent(null)}
            className="meta text-muted hover:text-foreground transition-colors duration-300"
          >
            Write another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10">
      <div className="grid gap-10 sm:grid-cols-2">
        <Field
          id="name"
          label="Name"
          error={errors.name?.message}
          required
        >
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldClasses}
            {...register("name")}
          />
        </Field>

        <Field id="email" label="Email" error={errors.email?.message} required>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={fieldClasses}
            {...register("email")}
          />
        </Field>
      </div>

      <Field id="subject" label="Subject" hint="Optional" error={errors.subject?.message}>
        <input
          id="subject"
          type="text"
          placeholder="What is this about?"
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          className={fieldClasses}
          {...register("subject")}
        />
      </Field>

      <Field
        id="message"
        label="Message"
        hint={`${messageLength}/${MESSAGE_LIMIT}`}
        error={errors.message?.message}
        required
      >
        <textarea
          id="message"
          rows={5}
          maxLength={MESSAGE_LIMIT}
          placeholder="What you're building, and when you need it."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(fieldClasses, "resize-y")}
          {...register("message")}
        />
      </Field>

      <div className="border-line flex flex-wrap items-center gap-x-8 gap-y-4 border-t pt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className="meta bg-foreground text-background hover:bg-accent px-8 py-4 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
        <p className="meta-sm text-muted">
          Or email {profile.email} directly
        </p>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="border-accent/30 bg-accent/10 text-accent px-4 py-3 text-sm"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="meta text-muted">
          {label}
          {required ? (
            <span className="text-accent ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {hint ? (
          <span className="meta-sm text-muted tabular-nums">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="meta-sm text-accent mt-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}
