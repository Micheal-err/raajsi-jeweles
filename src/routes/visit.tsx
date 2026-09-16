import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/visit")({
  component: () => <Navigate to="/contact" replace />,
});
