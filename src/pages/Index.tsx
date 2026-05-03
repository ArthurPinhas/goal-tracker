import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import GoalCard from "@/components/GoalCard";
import AddGoalDialog from "@/components/AddGoalDialog";
import { Button } from "@/components/ui/button";
import { Target, LogOut } from "lucide-react";

const Index = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { goals, loading, pendingSubtasks, createGoal, editGoal, deleteGoal, addSubtask, toggleSubtask, deleteSubtask, updateSubtaskEffort } = useGoals();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Goal Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <AddGoalDialog onAdd={createGoal} />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
        ) : (
          <div className="space-y-5">
            {goals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">
                No goals yet. Create one to get started.
              </p>
            )}
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                pendingSubtasks={pendingSubtasks}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
                onDelete={deleteGoal}
                onDeleteSubtask={deleteSubtask}
                onEdit={editGoal}
                onSetEffort={updateSubtaskEffort}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
