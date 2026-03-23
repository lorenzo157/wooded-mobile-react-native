import {
  CreateTreeDto,
  ReadTreeDto,
  SimplyReadTreeDto,
} from "../types/tree.types";
import { apiService } from "./api.service";

export const treeService = {
  async createOrUpdateTree(
    newTree: CreateTreeDto,
    idTree: number | null,
  ): Promise<number> {
    if (idTree) {
      return apiService.put<number>(`/project/0/tree/${idTree}`, newTree);
    }
    return apiService.post<number>("/project/0/tree", newTree);
  },

  async getTreesByProjectId(idProject: number): Promise<SimplyReadTreeDto[]> {
    return apiService.get<SimplyReadTreeDto[]>(`/project/${idProject}/tree`);
  },

  async getTreeById(idTree: number): Promise<ReadTreeDto> {
    return apiService.get<ReadTreeDto>(`/project/0/tree/${idTree}`);
  },
};
