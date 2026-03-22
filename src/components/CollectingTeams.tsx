import { SpecimenRecord } from "@/lib/types";
import { Users } from "lucide-react";

interface Props {
  records: SpecimenRecord[];
}

export default function CollectingTeams({ records }: Props) {
  const collectors = [...new Set(records.map((r) => r.recordedBy))];
  if (collectors.length <= 1) return null;

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Collecting Teams</h3>
      </div>
      <div className="space-y-1">
        {collectors.map((c) => (
          <p key={c} className="text-sm text-muted-foreground">{c}</p>
        ))}
      </div>
    </div>
  );
}
