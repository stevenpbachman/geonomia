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
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Paste CSV/TSV data or upload a file
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`gbifID\tscientificName\teventDate\trecordNumber\trecordedBy\tcluster_num_id\tdecimalLongitude\tdecimalLatitude\tlocality\n912048762\tDimorphandra gardneriana\t1985-01-09\t1349\tLewis, G.P.\t7896\tNA\tNA\tPiaui`}
          className="font-mono text-xs min-h-[120px] resize-y"
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleParse} className="gap-2">
          <FileText className="w-4 h-4" />
          Parse data
        </Button>
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
