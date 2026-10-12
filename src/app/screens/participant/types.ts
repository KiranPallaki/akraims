export interface ParticipantItem {
  participantID: number | string;
  participantNumber?: string;
  participantName: string;
  participantType: string;
  status: "Active" | "Inactive" | string;
  openDate?: string;
  closeDate?: string | null;
  fundID?: (number | string)[]; // array of associated fund IDs
  fundNames?: string[];
  notes?: string;
}

export interface AssociatedFundItem {
  fundID: number | string;
  fund: string;
  fundName: string;
  fundType: string;
}

export interface ParticipantFormValues {
  participantNumber: string;
  participantName: string;
  participantType: string;
  isActive: boolean;
  openDate: string;
  closeDate: string;
  selectedFundIds: (number | string)[];
}

export interface AddParticipantPayload {
  participantNumber: string;
  participantName: string;
  participantType: string;
  status: string;
  isActive?: boolean;
  openDate: string;
  closeDate?: string | null;
  addFundIds: (number | string)[];
  removeFundIds: (number | string)[];
}

export interface UpdateParticipantPayload {
  participantName?: string;
  participantType?: string;
  status?: string;
  isActive?: boolean;
  openDate?: string;
  closeDate?: string | null;
  addFundIds: (number | string)[];
  removeFundIds: (number | string)[];
}
