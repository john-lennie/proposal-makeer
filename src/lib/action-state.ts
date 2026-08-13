export interface EditorActionState {
  status: "idle" | "saved" | "error" | "conflict";
  message: string;
  updatedAt?: string;
}

export const initialEditorActionState: EditorActionState = {
  status: "idle",
  message: "",
};

export interface PublicationActionState {
  status: "idle" | "success" | "error" | "conflict";
  message: string;
  publicUrl?: string;
  responseUrl?: string;
  revisionNumber?: number;
}

export const initialPublicationActionState: PublicationActionState = {
  status: "idle",
  message: "",
};

export interface NewProposalActionState {
  status: "idle" | "error";
  message: string;
  fields?: Record<string, string>;
  values?: {
    title: string;
    clientName: string;
  };
}

export const initialNewProposalActionState: NewProposalActionState = {
  status: "idle",
  message: "",
};
