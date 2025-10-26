import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { api } from "@/lib/api";
import type { ProjectMember } from "@/lib/api";
import { useProject } from "@/contexts/project-context";

export interface Project {
  id: number;
  name: string;
}

export function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const { currentProjectId, setCurrentProjectId } = useProject();
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSuccess, setRenameSuccess] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const initializeProjects = async () => {
      try {
        // Charger les projets
        const projectsResponse = await api.getProjects();
        setProjects(projectsResponse.data);

        // Charger les préférences utilisateur
        const userResponse = await api.get<{ lastProjectId: number | null }>(
          "/users/me"
        );
        const lastProjectId = userResponse.data.lastProjectId;

        // Si un dernier projet est enregistré et existe toujours, l'utiliser
        if (
          lastProjectId &&
          projectsResponse.data.some((p) => p.id === lastProjectId)
        ) {
          setCurrentProjectId(lastProjectId);
        } else if (projectsResponse.data.length > 0) {
          // Sinon utiliser le premier projet
          setCurrentProjectId(projectsResponse.data[0].id);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProjects();
  }, [setCurrentProjectId]);

  const handleProjectChange = async (projectId: string) => {
    const numericProjectId = Number(projectId);
    setCurrentProjectId(numericProjectId);
    try {
      await api.updateLastProject(numericProjectId);
    } catch (error) {
      console.error("Failed to update last project", error);
    }
  };

  const refreshProjects = async () => {
    const response = await api.getProjects();
    setProjects(response.data);
    return response.data;
  };

  const resetModalState = () => {
    setMembers([]);
    setMemberError(null);
    setInviteEmail("");
    setInviteError(null);
    setRenameError(null);
    setRenameSuccess(null);
    setIsMembersLoading(false);
    setIsRenaming(false);
    setIsInviting(false);
    setRemovingMemberId(null);
    setIsDeletingProject(false);
    setDeleteError(null);
  };

  const closeEditModal = () => {
    setIsEditingModalOpen(false);
    setEditingProjectId(null);
    setEditingName("");
    resetModalState();
  };

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === "object" && "message" in error) {
      return (error as { message?: string }).message || "An error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An error occurred";
  };

  const loadMembers = async (projectId: number) => {
    setIsMembersLoading(true);
    setMemberError(null);
    try {
      const response = await api.getProjectMembers(projectId);
      setMembers(response.data);
    } catch (error) {
      setMemberError(getErrorMessage(error));
    } finally {
      setIsMembersLoading(false);
    }
  };

  const openEditModal = () => {
    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (currentProject) {
      setEditingProjectId(currentProject.id);
      setEditingName(currentProject.name);
      setInviteEmail("");
      setRenameError(null);
      setRenameSuccess(null);
      setMemberError(null);
      setInviteError(null);
      setMembers([]);
      setIsEditingModalOpen(true);
      void loadMembers(currentProject.id);
    }
  };

  const handleEditSubmit = async () => {
    if (editingProjectId == null) return;
    setIsRenaming(true);
    setRenameError(null);
    setRenameSuccess(null);
    try {
      await api.updateProject(editingProjectId, { name: editingName });
      await refreshProjects();
      setRenameSuccess("Project name updated successfully.");
    } catch (error) {
      console.error("Failed to update project", error);
      setRenameError(getErrorMessage(error));
    } finally {
      setIsRenaming(false);
    }
  };

  const handleInviteSubmit = async () => {
    if (!editingProjectId) {
      return;
    }
    const email = inviteEmail.trim();
    if (!email) {
      setInviteError("Please enter an email address.");
      return;
    }
    setInviteError(null);
    setMemberError(null);
    setIsInviting(true);
    try {
      await api.addProjectMember(editingProjectId, email);
      setInviteEmail("");
      await loadMembers(editingProjectId);
    } catch (error) {
      console.error("Failed to invite member", error);
      setInviteError(getErrorMessage(error));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!editingProjectId) {
      return;
    }
    try {
      setRemovingMemberId(memberId);
      setMemberError(null);
      await api.removeProjectMember(editingProjectId, memberId);
      await loadMembers(editingProjectId);
    } catch (error) {
      console.error("Failed to remove member", error);
      setMemberError(getErrorMessage(error));
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (editingProjectId == null) return;
    setIsDeletingProject(true);
    setDeleteError(null);
    try {
      await api.deleteProject(editingProjectId);
      const updatedProjects = await refreshProjects();

      if (updatedProjects.length > 0) {
        const nextProject = updatedProjects.find(
          (project) => project.id !== editingProjectId
        ) || updatedProjects[0];

        setCurrentProjectId(nextProject.id);
        try {
          await api.updateLastProject(nextProject.id);
        } catch (error) {
          console.error("Failed to update last project after deletion", error);
        }
      } else {
        setCurrentProjectId(undefined);
      }

      closeEditModal();
    } catch (error) {
      console.error("Failed to delete project", error);
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={currentProjectId?.toString()}
        onValueChange={handleProjectChange}
        disabled={isLoading}
      >
        <SelectTrigger className="border-0 bg-background/50">
          <SelectValue
            placeholder={isLoading ? "Loading..." : "Select a project"}
          />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={openEditModal}
        variant="ghost"
        size="icon"
        aria-label="Edit Project"
      >
        <Settings className="w-4 h-4" />
      </Button>

      <Dialog
        open={isEditingModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditModal();
          } else {
            setIsEditingModalOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-lg space-y-6">
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
          </DialogHeader>

          <section className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">Rename project</h3>
              <p className="text-sm text-muted-foreground">
                Update the project name for all collaborators.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Project name"
                disabled={isRenaming}
              />
              <Button
                onClick={handleEditSubmit}
                disabled={isRenaming || editingName.trim().length === 0}
              >
                {isRenaming ? "Saving..." : "Save"}
              </Button>
            </div>
            {renameError && (
              <p className="text-sm text-destructive">{renameError}</p>
            )}
            {renameSuccess && (
              <p className="text-sm text-emerald-600">{renameSuccess}</p>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">Members</h3>
              <p className="text-sm text-muted-foreground">
                Manage who has access to this project.
              </p>
            </div>
            <div className="space-y-2">
              {memberError && (
                <p className="text-sm text-destructive">{memberError}</p>
              )}
              {isMembersLoading ? (
                <p className="text-sm text-muted-foreground">Loading members…</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members found for this project.
                </p>
              ) : (
                <ul className="space-y-2">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {member.name || member.email}
                        </p>
                        {member.name && (
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMemberId === member.id}
                      >
                        {removingMemberId === member.id
                          ? "Removing..."
                          : "Remove"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite by email"
                type="email"
                disabled={isInviting}
              />
              <Button onClick={handleInviteSubmit} disabled={isInviting}>
                {isInviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-destructive">
                Delete project
              </h3>
              <p className="text-sm text-muted-foreground">
                Permanently remove this project and all associated data.
              </p>
            </div>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeletingProject}
            >
              {isDeletingProject ? "Deleting..." : "Delete project"}
            </Button>
          </section>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
