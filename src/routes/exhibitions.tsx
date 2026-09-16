import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/exhibitions")({
  component: () => <Navigate to="/collection" replace />,
});
