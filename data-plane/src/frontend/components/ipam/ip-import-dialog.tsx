"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const ipamApi = new IpamApiClient();

interface IPImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ImportResult {
  valid_rows: number;
  total_rows: number;
  validation_errors: Array<{
    row: number;
    data: Record<string, unknown>;
    errors: string[];
  }>;
  results: {
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ address: string; error: string }>;
  };
}

export function IPImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: IPImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const validExtensions = [".csv", ".json"];
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      toast.error("Please select a CSV or JSON file");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."))
        .replace(".", "") as "csv" | "json";

      const response = await ipamApi.importIPAddresses(
        file,
        fileExtension,
        skipDuplicates
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const result = response.data as ImportResult;
      setImportResult(result);

      const totalCreated = result.results.created;
      const totalUpdated = result.results.updated;
      const totalSkipped = result.results.skipped;
      const totalErrors =
        result.validation_errors.length + result.results.errors.length;

      if (totalErrors > 0) {
        toast.warning(
          `Import completed with ${totalErrors} error(s). ${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped.`
        );
      } else {
        toast.success(
          `Successfully imported ${totalCreated} IP address(es). ${totalUpdated} updated, ${totalSkipped} skipped.`
        );
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to import IP addresses"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setIsDragging(false);
    onOpenChange(false);
  };

  const getFileIcon = () => {
    if (!file) return null;
    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    return <FileText className="w-8 h-8 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import IP Addresses</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to bulk import IP addresses. The file
            should contain columns: address, subnet (optional), status
            (optional), description (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!file && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }
              `}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Drag and drop a file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports CSV and JSON files
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  document.getElementById("file-input")?.click();
                }}
              >
                Select File
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".csv,.json"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File */}
          {file && !importResult && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon()}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setImportResult(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options */}
          {file && !importResult && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) =>
                  setSkipDuplicates(checked === true)
                }
              />
              <Label
                htmlFor="skip-duplicates"
                className="text-sm font-normal cursor-pointer"
              >
                Skip duplicate IP addresses (update existing instead)
              </Label>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Import Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Rows
                      </div>
                      <div className="text-lg font-semibold">
                        {importResult.total_rows}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Valid Rows
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {importResult.valid_rows}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Created
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {importResult.results.created}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Updated
                      </div>
                      <div className="text-lg font-semibold text-orange-600">
                        {importResult.results.updated}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Skipped</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {importResult.results.skipped}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                      <div className="text-lg font-semibold text-red-600">
                        {importResult.validation_errors.length +
                          importResult.results.errors.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Errors */}
              {importResult.validation_errors.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      Validation Errors ({importResult.validation_errors.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.validation_errors.map((error, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20"
                        >
                          <div className="font-medium">Row {error.row}:</div>
                          <ul className="list-disc list-inside ml-2">
                            {error.errors.map((err, errIdx) => (
                              <li key={errIdx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Errors */}
              {importResult.results.errors.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      Import Errors ({importResult.results.errors.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {importResult.results.errors.map((error, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20"
                        >
                          <div className="font-medium">{error.address}:</div>
                          <div>{error.error}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {importResult ? "Close" : "Cancel"}
            </Button>
            {file && !importResult && (
              <Button
                type="button"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? "Importing..." : "Import"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
