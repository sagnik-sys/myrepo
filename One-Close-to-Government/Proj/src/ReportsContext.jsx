import React, { createContext, useState, useEffect, useContext } from "react";

// Resolve API base URL (absolute for production, relative in dev if not provided)
const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_BASE = (RAW_API_URL && RAW_API_URL.trim()) ? RAW_API_URL.trim().replace(/\/+$/, "") : "";

// Create the Reports context
const ReportsContext = createContext();

// Provider component
export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLocalReports = async () => {
      // 1) Try localStorage
      const stored = localStorage.getItem("reports");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setReports(parsed);
          setLoading(false);
          return;
        } catch {}
      }

      // 2) Fallback to bundled static JSON
      try {
        const res = await fetch("/reports.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load static reports.json");
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error("Error loading static reports:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadLocalReports();
  }, []);

  return (
    <ReportsContext.Provider value={{
      reports,
      setReports: (next) => {
        const final = typeof next === 'function' ? next(reports) : next;
        try {
          localStorage.setItem('reports', JSON.stringify(final));
        } catch {}
        setReports(final);
      },
      loading,
      error
    }}>
      {children}
    </ReportsContext.Provider>
  );
};

// Custom hook to use reports
export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used inside a ReportsProvider");
  }
  return context;
};

// Utility to download current reports as JSON
export const downloadReportsJson = (reports) => {
  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reports-export.json';
  a.click();
  URL.revokeObjectURL(url);
};
