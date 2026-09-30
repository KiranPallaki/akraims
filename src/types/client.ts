export interface Client {
  clientID: number;
  clientName: string;
  clientCode: string;
  clientOpenDate?: string;
  isActive?: string;
  clientCloseDate?: string | null;
  databaseName?: string;
  fileDirectory?: string | null;
  contactName?: string;
  ContactName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  baseCurrency?: string;
  allocDateType?: string;
  allocLedgerStoreProc?: string;
}
