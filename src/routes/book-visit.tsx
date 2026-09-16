import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/book-visit")({
  component: () => <Navigate to="/contact" replace />,
});
