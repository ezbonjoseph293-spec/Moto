"use client";

import { useState, useTransition } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import type { Setting } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IdentityForm } from "@/features/settings/identity-form";
import { ContactForm } from "@/features/settings/contact-form";
import { DepositForm } from "@/features/settings/deposit-form";
import { completeOnboardingAction } from "./actions";

const STEPS = ["Branding", "Contact", "Deposit policy", "Publish"] as const;

export function OnboardingWizard({
  setting,
  storefrontUrl,
  dealershipName,
}: {
  setting: Setting;
  storefrontUrl: string;
  dealershipName: string;
}) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isFinishing, startFinishing] = useTransition();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ol className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border",
                i === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < step
                    ? "border-status-available bg-status-available text-white"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={i === step ? "text-ink" : undefined}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Upload your logo and pick your brand color — this shapes your entire storefront."}
            {step === 1 && "How buyers reach you and find your showroom."}
            {step === 2 && "How much buyers pay to reserve a car, and for how long."}
            {step === 3 && "You're ready to go live."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && <IdentityForm setting={setting} onSaved={() => setStep(1)} />}
          {step === 1 && <ContactForm setting={setting} onSaved={() => setStep(2)} />}
          {step === 2 && <DepositForm setting={setting} onSaved={() => setStep(3)} />}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-xs text-muted-foreground">Your storefront</p>
                <p className="mt-1 truncate font-medium text-ink">{storefrontUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(storefrontUrl);
                      setCopied(true);
                    }}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    {copied ? "Copied!" : "Copy link"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${dealershipName} is now live on Moto: ${storefrontUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Share to WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={isFinishing}
                onClick={() => startFinishing(() => void completeOnboardingAction())}
              >
                {isFinishing ? "Publishing…" : "Publish & go to dashboard"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {step > 0 && step < 3 && (
        <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
      )}
    </div>
  );
}
