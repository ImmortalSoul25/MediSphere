// src/context/useData.js
//
// The useData hook lives in its own file so Vite Fast Refresh is happy.
// Vite requires that a file exports ONLY React components OR only
// non-components (hooks, utilities). DataContext.jsx exports DataProvider
// (a component), so the hook must live separately.
//
// Import this wherever you need data:
//   import { useData } from "../context/useData"

import { useContext } from "react";
import { DataContext } from "./DataContext";

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}