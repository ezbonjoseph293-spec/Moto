"use client";

import type { RefObject } from "react";
import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Submit button for a `<form action={formAction}>` (useActionState-driven)
 * form that should ask for confirmation before firing — e.g. changing a
 * password. Opens a dialog on click instead of submitting immediately;
 * confirming calls `formRef.current.requestSubmit()`, which fires the same
 * submit event the form's own `action` is already bound to.
 */
export function ConfirmSubmitButton({
  formRef,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel,
  isPending = false,
  variant = "default",
  size = "default",
  className,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={isPending}
          className={className}
        >
          {isPending ? (pendingLabel ?? confirmLabel) : confirmLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => formRef.current?.requestSubmit()}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
