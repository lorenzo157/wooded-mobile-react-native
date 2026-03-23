import { ProjectDto } from '../types/project.types';
import { apiService } from './api.service';

export const projectService = {
  async getAssignedProjects(): Promise<ProjectDto[]> {
    return apiService.get<ProjectDto[]>(`/project/assignedproject`);
  },

  async findProjectById(idProject: number): Promise<ProjectDto> {
    return apiService.get<ProjectDto>(`/project/${idProject}`);
  },
};
