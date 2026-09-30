export interface ProductMenuItem {
  clientID: number | undefined;
  webPageFile: string;
  webPageStatus: "Y" | "N" | string;
  notes?: string | null;
  icon: string;
  toURL: string;
}

export interface ProductMenuListResponse {
  ok: boolean;
  data: ProductMenuItem[];
  error?: string;
}
