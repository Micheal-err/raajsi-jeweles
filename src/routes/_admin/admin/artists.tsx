import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/artists")({
  component: () => <Navigate to="/admin/artworks" replace />,
});
