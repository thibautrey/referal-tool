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

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !currentProjectId) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId, setCurrentProjectId]);

  const refreshProjects = async () => {
    const response = await api.getProjects();
    setProjects(response.data);
  };

  const openEditModal = () => {
    const currentProject = projects.find((p) => p.id === currentProjectId);
    if (currentProject) {
      setEditingProjectId(currentProject.id);
      setEditingName(currentProject.name);
      setIsEditingModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setIsEditingModalOpen(false);
    setEditingProjectId(null);
    setEditingName("");
  };

  const handleEditSubmit = async () => {
    if (editingProjectId == null) return;
    try {
      await api.updateProject(editingProjectId, { name: editingName });
      await refreshProjects();
    } catch (error) {
      console.error("Failed to update project", error);
    } finally {
      closeEditModal();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={currentProjectId?.toString()}
        onValueChange={(value) => setCurrentProjectId(Number(value))}
      >
        <SelectTrigger className="border-0 bg-background/50">
          <SelectValue placeholder="Select a project" />
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

      <Dialog open={isEditingModalOpen} onOpenChange={setIsEditingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder="Project name"
            className="mb-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
