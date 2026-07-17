"use client";

import { useEffect, useState } from "react";
import type { BodyType, Brand } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  collectionRuleFieldValues,
  collectionRuleOperatorValues,
  vehicleStatusValues,
  type CollectionRule,
} from "./schema";

const FIELD_LABELS: Record<string, string> = {
  price: "Price",
  year: "Year",
  mileage: "Mileage",
  condition: "Condition",
  brandId: "Brand",
  bodyTypeId: "Body type",
  status: "Status",
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: "equals",
  lt: "is less than",
  lte: "is at most",
  gt: "is more than",
  gte: "is at least",
};

const CONDITION_VALUES = ["NEW", "USED", "IMPORTED", "CERTIFIED_PRE_OWNED"];

function ValueInput({
  rule,
  brands,
  bodyTypes,
  onChange,
}: {
  rule: CollectionRule;
  brands: Brand[];
  bodyTypes: BodyType[];
  onChange: (value: string) => void;
}) {
  if (rule.field === "brandId") {
    return (
      <Select value={rule.value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose brand" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (rule.field === "bodyTypeId") {
    return (
      <Select value={rule.value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose body type" />
        </SelectTrigger>
        <SelectContent>
          {bodyTypes.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (rule.field === "condition") {
    return (
      <Select value={rule.value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose condition" />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_VALUES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (rule.field === "status") {
    return (
      <Select value={rule.value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose status" />
        </SelectTrigger>
        <SelectContent>
          {vehicleStatusValues.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return <Input type="number" value={rule.value} onChange={(e) => onChange(e.target.value)} />;
}

export function CollectionRuleBuilder({
  initialRules,
  brands,
  bodyTypes,
}: {
  initialRules: CollectionRule[];
  brands: Brand[];
  bodyTypes: BodyType[];
}) {
  const [rules, setRules] = useState<CollectionRule[]>(
    initialRules.length > 0 ? initialRules : [{ field: "price", operator: "lte", value: "" }],
  );
  const [json, setJson] = useState("");

  useEffect(() => {
    setJson(JSON.stringify({ rules: rules.filter((r) => r.value !== "") }));
  }, [rules]);

  function updateRule(index: number, patch: Partial<CollectionRule>) {
    setRules((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRule() {
    setRules((current) => [...current, { field: "price", operator: "lte", value: "" }]);
  }

  function removeRule(index: number) {
    setRules((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="rulesJson" value={json} />
      {rules.map((rule, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
          <Select
            value={rule.field}
            onValueChange={(field) =>
              updateRule(index, { field: field as CollectionRule["field"], value: "" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {collectionRuleFieldValues.map((f) => (
                <SelectItem key={f} value={f}>
                  {FIELD_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {["brandId", "bodyTypeId", "condition", "status"].includes(rule.field) ? (
            <div />
          ) : (
            <Select
              value={rule.operator}
              onValueChange={(operator) =>
                updateRule(index, { operator: operator as CollectionRule["operator"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {collectionRuleOperatorValues.map((o) => (
                  <SelectItem key={o} value={o}>
                    {OPERATOR_LABELS[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <ValueInput
            rule={rule}
            brands={brands}
            bodyTypes={bodyTypes}
            onChange={(value) => updateRule(index, { value })}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRule(index)}
            aria-label="Remove rule"
          >
            <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        <Plus className="size-4" aria-hidden="true" />
        Add rule
      </Button>
      <p className="text-xs text-muted-foreground">
        A vehicle must match every rule (AND) to appear in this collection.
      </p>
    </div>
  );
}
