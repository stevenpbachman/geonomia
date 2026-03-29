import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseCSV, parseTSV } from "@/lib/parseData";
import { SpecimenRecord } from "@/lib/types";
import { Upload, FileText } from "lucide-react";

interface Props {
  onDataLoaded: (records: SpecimenRecord[]) => void;
}

export default function DataInput({ onDataLoaded }: Props) {
  const [text, setText] = useState("");

  const handleParse = () => {
    if (!text.trim()) return;
    // Auto-detect: if tabs present, TSV; otherwise CSV
    const records = text.includes("\t") ? parseTSV(text) : parseCSV(text);
    if (records.length > 0) onDataLoaded(records);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content);
      const records = content.includes("\t") ? parseTSV(content) : parseCSV(content);
      if (records.length > 0) onDataLoaded(records);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {/* Parse data option kept but hidden for now */}
        {/* <div>
          <label className="text-sm font-medium mb-1.5 block">
            Paste CSV/TSV data
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`gbifID\tscientificName\teventDate\t...`}
            className="font-mono text-xs min-h-[120px] resize-y"
          />
          <Button onClick={handleParse} className="gap-2 mt-2">
            <FileText className="w-4 h-4" />
            Parse data
          </Button>
        </div> */}
        <label>
          <input type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="gap-2 cursor-pointer" asChild>
            <span>
              <Upload className="w-4 h-4" />
              Upload file
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
}
