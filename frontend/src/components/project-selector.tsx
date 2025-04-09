import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

export interface Project {
  id: number;
  name: string;
}

export function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>();
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  useEffect(() => {
    refreshProjects();
  }, []);

  const refreshProjects = async () => {
    const response = await api.getProjects();
    setProjects(response.data);
    if (response.data.length > 0 && !selectedProject) {
      setSelectedProject(response.data[0].id.toString());
    }
  };

  const openEditModal = () => {
    const currentProject = projects.find(
      (p) => p.id.toString() === selectedProject
    );
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
      <Select value={selectedProject} onValueChange={setSelectedProject}>
        <SelectTrigger className="bg-background/50 border-0">
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
        <Settings className="h-4 w-4" />
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
