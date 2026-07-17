"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportVehiclesCsvAction, importVehiclesCsvAction } from "./actions";
import type { CsvImportReport } from "./service";

export function CsvTools() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [report, setReport] = useState<CsvImportReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleExport() {
    setIsExporting(true);
    try {
      const csv = await exportVehiclesCsvAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(file: File) {
    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await importVehiclesCsvAction(text);
      setReport(result);
      router.refresh();
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={handleExport}
      >
        <Download className="size-4" aria-hidden="true" />
        Export CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-4" aria-hidden="true" />
        {isImporting ? "Importing…" : "Import CSV"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
          e.target.value = "";
        }}
      />

      <Dialog open={report !== null} onOpenChange={(open) => !open && setReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import results</DialogTitle>
          </DialogHeader>
          {report && (
            <div className="space-y-3">
              <p className="text-sm text-ink">
                Imported <strong>{report.imported}</strong> vehicle(s).
                {report.errors.length > 0 && ` ${report.errors.length} row(s) had errors.`}
              </p>
              {report.errors.length > 0 && (
                <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md border border-border bg-muted p-3 text-xs">
                  {report.errors.map((e, i) => (
                    <li key={i} className="text-destructive">
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setReport(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
