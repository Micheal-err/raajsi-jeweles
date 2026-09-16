import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/artists/$slug")({
  component: () => <Navigate to="/collection" replace />,
});
