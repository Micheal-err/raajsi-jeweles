import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/journal")({
  component: () => <Navigate to="/collection" replace />,
});
