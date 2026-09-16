import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/museum")({
  component: () => <Navigate to="/collection" replace />,
});
