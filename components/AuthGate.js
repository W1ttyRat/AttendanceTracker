"use client";

import { useEffect, useState } from "react";
import { getOrCreateAnonymousSession } from "../lib/supabase";

export default function AuthGate({ children }) {
  const [state, setState] = useState({ status: "loading", error: "" });

  useEffect(() => {
    let active = true;

    getOrCreateAnonymousSession()
      .then(() => {
        if (active) setState({ status: "ready", error: "" });
      })
      .catch((error) => {
        if (active) {
          setState({
            status: "error",
            error: error.message || "Could not start an anonymous session.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <main className="auth-state">
        <div className="auth-state-mark">A</div>
        <p>Starting your private workspace...</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="auth-state">
        <div className="auth-state-mark auth-state-error">!</div>
        <h1>Workspace unavailable</h1>
        <p>{state.error}</p>
      </main>
    );
  }

  return children;
}
