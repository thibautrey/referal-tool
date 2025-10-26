import React, { createContext, useContext, useMemo } from "react";

import { useAuth } from "./AuthContext";

interface ProjectContextType {
  currentProjectId: number | null;
  setCurrentProjectId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { currentProjectId, setCurrentProjectId } = useAuth();

  const value = useMemo(
    () => ({
      currentProjectId,
      setCurrentProjectId,
    }),
    [currentProjectId, setCurrentProjectId]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
