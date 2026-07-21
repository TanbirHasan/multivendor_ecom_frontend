"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#1e293b",
          color: "#f8fafc",
          fontSize: "0.875rem",
          borderRadius: "0.75rem",
        },
        success: { iconTheme: { primary: "#4f46e5", secondary: "#f8fafc" } },
        error: { iconTheme: { primary: "#dc2626", secondary: "#f8fafc" } },
      }}
    />
  );
}
