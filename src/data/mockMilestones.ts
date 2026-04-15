import { Milestone } from "@/types/milestone";

export const initialMilestones: Milestone[] = [
  {
    id: "m1",
    user_id: "u1",
    title: "Backend API v2",
    description: "Migrate all endpoints to the new versioned API schema.",
    subtasks: [
      { id: "s1", milestone_id: "m1", title: "Design new schema", is_completed: true },
      { id: "s2", milestone_id: "m1", title: "Implement auth endpoints", is_completed: true },
      { id: "s3", milestone_id: "m1", title: "Migrate user service", is_completed: false },
      { id: "s4", milestone_id: "m1", title: "Write integration tests", is_completed: false },
    ],
  },
  {
    id: "m2",
    user_id: "u1",
    title: "Frontend Redesign",
    description: "Overhaul the dashboard with the new design system.",
    subtasks: [
      { id: "s5", milestone_id: "m2", title: "Set up design tokens", is_completed: true },
      { id: "s6", milestone_id: "m2", title: "Build component library", is_completed: false },
      { id: "s7", milestone_id: "m2", title: "Implement dark mode", is_completed: false },
    ],
  },
  {
    id: "m3",
    user_id: "u1",
    title: "CI/CD Pipeline",
    description: "Automate build, test, and deploy workflows.",
    subtasks: [
      { id: "s8", milestone_id: "m3", title: "Configure GitHub Actions", is_completed: false },
      { id: "s9", milestone_id: "m3", title: "Add staging environment", is_completed: false },
    ],
  },
];
