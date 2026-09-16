import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/exhibitions/$slug")({
  component: () => <Navigate to="/collection" replace />,
});
