export interface IFile {
  id: string;
  name: string;
  url?: string;
  loading?: boolean;
  tags?: ITag[];
}

export interface ITag {
  key: string;
  value: boolean;
}
