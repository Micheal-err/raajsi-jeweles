import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/press")({
  component: () => <Navigate to="/collection" replace />,
});
