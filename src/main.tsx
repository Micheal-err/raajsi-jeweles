import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('App root element "#root" was not found.');
}

// The SEO prerender step writes crawlable fallback HTML into #root.
// It is not React-rendered markup, so it must be replaced with the live app
// rather than left in place or passed to hydrateRoot().
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
