"use client";

import { useActionState, useState } from "react";
import type { BodyType, Brand, Collection } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/media/image-upload";
import { collectionRuleTypeValues, type CollectionRule, type CollectionRuleConfig } from "./schema";
import { createCollectionAction, updateCollectionAction, type FormState } from "./actions";
import { CollectionRuleBuilder } from "./collection-rule-builder";

const initialState: FormState = { ok: false };

export function CollectionForm({
  collection,
  brands,
  bodyTypes,
}: {
  collection?: Collection;
  brands: Brand[];
  bodyTypes: BodyType[];
}) {
  const action = collection
    ? updateCollectionAction.bind(null, collection.id)
    : createCollectionAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isFeatured, setIsFeatured] = useState(collection?.isFeatured ?? false);
  const [ruleType, setRuleType] = useState<(typeof collectionRuleTypeValues)[number]>(
    collection?.ruleType ?? "MANUAL",
  );

  const initialRules: CollectionRule[] =
    collection?.ruleConfig && typeof collection.ruleConfig === "object"
      ? ((collection.ruleConfig as unknown as CollectionRuleConfig).rules ?? [])
      : [];

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="collection-name">Name</Label>
        <Input id="collection-name" name="name" required defaultValue={collection?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="collection-description">Description</Label>
        <Textarea
          id="collection-description"
          name="description"
          rows={3}
          defaultValue={collection?.description ?? ""}
        />
      </div>

      <ImageUpload
        name="imageUrl"
        label="Cover image"
        purpose="collections"
        defaultValue={collection?.imageUrl}
      />

      <div className="flex items-center gap-3">
        <Switch
          id="collection-featured"
          name="isFeatured"
          value="on"
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
        />
        <Label htmlFor="collection-featured" className="cursor-pointer">
          Feature on homepage
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="collection-ruleType">Membership</Label>
        <Select
          name="ruleType"
          value={ruleType}
          onValueChange={(v) => setRuleType(v as typeof ruleType)}
        >
          <SelectTrigger id="collection-ruleType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANUAL">Manual — pick vehicles yourself</SelectItem>
            <SelectItem value="RULE_BASED">Rule-based — auto-match vehicles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {ruleType === "RULE_BASED" && (
        <CollectionRuleBuilder initialRules={initialRules} brands={brands} bodyTypes={bodyTypes} />
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && state.message && (
        <p className="text-status-available text-sm">{state.message}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : collection ? "Save changes" : "Create collection"}
      </Button>
    </form>
  );
}
