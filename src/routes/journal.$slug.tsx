import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/journal/$slug")({
  component: JournalArticleRedirect,
});

function JournalArticleRedirect() {
  const { slug } = Route.useParams();
  return <Navigate to="/blog/$slug" params={{ slug }} replace />;
}
