import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/services")({
  component: () => <Navigate to="/collection" replace />,
});
