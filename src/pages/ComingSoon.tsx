import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">{title}</h1>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground space-y-3">
          <Construction className="h-12 w-12 mx-auto text-primary" />
          <p className="font-serif text-xl text-foreground">Coming in Phase 2</p>
          <p className="text-sm">Charts, filters, CSV export, and full calendars are next.</p>
        </CardContent>
      </Card>
    </div>
  );
}
