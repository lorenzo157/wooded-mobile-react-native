import { ProjectDto } from '../types/project.types';
import { apiService } from './api.service';
import { authService } from './auth.service';

export const projectService = {
  async getAssignedProjects(): Promise<ProjectDto[]> {
    const user = await authService.getUser();
    if (!user?.idUser) {
      throw new Error('User ID is missing or could not be retrieved');
    }
    return apiService.get<ProjectDto[]>(`/project/assignedproject/${user.idUser}`);
  },

  async findProjectById(idProject: number): Promise<ProjectDto> {
    return apiService.get<ProjectDto>(`/project/${idProject}`);
  },
};
