import DailyTodoList from "@/components/DailyTodoList";
import { ListChecks } from "lucide-react";

export default function TodoListPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-primary" /> My To-Do List
        </h1>
        <p className="text-muted-foreground text-sm">
          Plan your daily spiritual routine — your facilitator and admin can review your progress.
        </p>
      </div>
      <DailyTodoList />
    </div>
  );
}
