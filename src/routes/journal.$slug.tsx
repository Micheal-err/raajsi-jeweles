import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/journal/$slug")({
  component: () => <Navigate to="/collection" replace />,
});
