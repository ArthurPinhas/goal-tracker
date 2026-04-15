import { useState } from "react";
import { Milestone } from "@/types/milestone";
import { initialMilestones } from "@/data/mockMilestones";
import MilestoneCard from "@/components/MilestoneCard";
import AddMilestoneDialog from "@/components/AddMilestoneDialog";
import { Target } from "lucide-react";

const Index = () => {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);

  const toggleSubtask = (milestoneId: string, subtaskId: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              subtasks: m.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
              ),
            }
          : m
      )
    );
  };

  const addMilestone = (title: string, description: string) => {
    const newMilestone: Milestone = {
      id: `m${Date.now()}`,
      user_id: "u1",
      title,
      description,
      subtasks: [],
    };
    setMilestones((prev) => [...prev, newMilestone]);
  };

  const addSubtask = (milestoneId: string, title: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              subtasks: [
                ...m.subtasks,
                {
                  id: `s${Date.now()}`,
                  milestone_id: milestoneId,
                  title,
                  is_completed: false,
                },
              ],
            }
          : m
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Milestones</h1>
          </div>
          <AddMilestoneDialog onAdd={addMilestone} />
        </header>

        <div className="space-y-5">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onToggleSubtask={toggleSubtask}
              onAddSubtask={addSubtask}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
