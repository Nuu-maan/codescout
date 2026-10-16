export type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  language?: string;
  children?: FileNode[];
};

export type RepositorySnapshot = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  branch: string;
  commit: string;
  description: string | null;
  files: Record<string, string>;
  tree: FileNode[];
  fileCount: number;
  indexedBytes: number;
  languages: string[];
  truncated: boolean;
};
