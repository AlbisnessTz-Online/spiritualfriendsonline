import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsedTransaction {
  member_name: string;
  phone_number: string;
  amount: number;
  transaction_id: string;
  transaction_date: string;
  raw: string;
  valid: boolean;
  error?: string;
}

// Regex to parse typical M-Pesa SMS messages
// e.g.: "QAZ1234567 Confirmed. KES500 sent to JOHN DOE 0712345678 on 1/3/25 at 10:00 AM"
// or: "QAZ1234567 Confirmed.You have received KES 500 from JOHN DOE 0712345678 on 1/3/25 at 10:00 AM"
function parseMpesaSms(text: string): Omit<ParsedTransaction, 'raw' | 'valid' | 'error'> | null {
  // Transaction ID
  const txIdMatch = text.match(/([A-Z]{2,3}\d{7,10})/);
  // Amount
  const amountMatch = text.match(/KES\s*([0-9,]+(?:\.\d{2})?)/i);
  // Phone number
  const phoneMatch = text.match(/(07\d{8}|2547\d{8}|\+2547\d{8})/);
  // Name – between "from " or "to " and a phone number
  const nameMatch = text.match(/(?:from|to)\s+([A-Z\s]+)\s+(?:07\d{8}|2547\d{8})/i);
  // Date
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);

  if (!txIdMatch || !amountMatch || !phoneMatch) return null;

  const rawAmount = amountMatch[1].replace(',', '');
  const amount = parseFloat(rawAmount);
  const phone = phoneMatch[1];
  const name = nameMatch ? nameMatch[1].trim() : phone;
  const txId = txIdMatch[1];

  let transaction_date = new Date().toISOString().split('T')[0];
  if (dateMatch) {
    const parts = dateMatch[1].split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const year = y.length === 2 ? `20${y}` : y;
      transaction_date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  return { member_name: name, phone_number: phone, amount, transaction_id: txId, transaction_date };
}

function parseCSV(text: string): string[] {
  return text.split('\n').map((l) => l.replace(/^"|"$/g, '').trim()).filter(Boolean);
}

export default function SmsImportPage() {
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const processFile = (file: File) => {
    setSaved(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = parseCSV(text);
      const results: ParsedTransaction[] = lines.map((line) => {
        const result = parseMpesaSms(line);
        if (!result) return { member_name: '', phone_number: '', amount: 0, transaction_id: '', transaction_date: '', raw: line, valid: false, error: 'Not an M-Pesa message' };
        return { ...result, raw: line, valid: true };
      });
      setParsed(results);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
    else toast({ title: 'Invalid file', description: 'Please upload a .csv file.', variant: 'destructive' });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    const valid = parsed.filter((p) => p.valid);
    if (valid.length === 0) { toast({ title: 'No valid transactions to import.' }); return; }
    setSaving(true);
    const { error } = await supabase.from('transactions').upsert(
      valid.map((t) => ({
        member_name: t.member_name, phone_number: t.phone_number, amount: t.amount,
        transaction_id: t.transaction_id, transaction_date: t.transaction_date, source: 'sms_import',
      })),
      { onConflict: 'transaction_id' }
    );
    if (error) toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    else {
      toast({ title: `✓ ${valid.length} transaction(s) imported!` });
      setSaved(true);
    }
    setSaving(false);
  };

  const validCount = parsed.filter((p) => p.valid).length;
  const invalidCount = parsed.filter((p) => !p.valid).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">SMS Import</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload a CSV of exported M-Pesa SMS messages to bulk-import transactions.</p>
      </div>

      {/* Instructions */}
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
        <h3 className="font-semibold text-foreground text-sm mb-2">How to prepare your CSV file</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Export SMS messages from your phone using an SMS backup app (e.g., "SMS Backup & Restore")</li>
          <li>Open the export, copy M-Pesa SMS texts into a .csv file (one message per line)</li>
          <li>Upload the file below – the system will detect and parse valid M-Pesa messages</li>
        </ol>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'}`}
        onClick={() => document.getElementById('csv-input')?.click()}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-semibold text-foreground mb-1">Drop CSV file here or click to browse</p>
        <p className="text-muted-foreground text-sm">Only .csv files are accepted</p>
        <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
      </div>

      {/* Results */}
      {parsed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-secondary text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> {validCount} valid
              </div>
              {invalidCount > 0 && (
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <AlertCircle className="w-4 h-4" /> {invalidCount} skipped
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setParsed([]); setSaved(false); }} className="gap-2">
                <X className="w-4 h-4" /> Clear
              </Button>
              <Button onClick={handleImport} disabled={saving || saved || validCount === 0} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {saved ? 'Imported!' : `Import ${validCount} Transactions`}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr>
                    {['Status', 'Member Name', 'Phone', 'Amount', 'Tx ID', 'Date'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.map((row, i) => (
                    <tr key={i} className={row.valid ? 'hover:bg-muted/20' : 'bg-destructive/5'}>
                      <td className="px-4 py-2.5">
                        {row.valid
                          ? <CheckCircle className="w-4 h-4 text-secondary" />
                          : <AlertCircle className="w-4 h-4 text-destructive" />}
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{row.member_name || <span className="text-muted-foreground italic">{row.raw.slice(0, 40)}...</span>}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.phone_number}</td>
                      <td className="px-4 py-2.5 text-secondary font-medium">{row.amount ? `TSh ${row.amount.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.transaction_id || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.transaction_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
