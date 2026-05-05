import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import ThemeToggle from "@/components/ThemeToggle";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="absolute right-3 top-3 z-20 sm:right-6 sm:top-4">
        <ThemeToggle variant="header" />
      </div>
      <div className="gradient-header h-36 w-full shrink-0" aria-hidden />
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 -mt-10 relative z-10">
        <EmptyState
          compact
          icon={Compass}
          title="This page doesn't exist"
          description="That URL isn't part of Goal Tracker. Head home and keep making progress."
        >
          <Button asChild className="rounded-full min-h-10 px-6">
            <Link to="/">Back to goals</Link>
          </Button>
        </EmptyState>
      </div>
    </div>
  );
};

export default NotFound;
