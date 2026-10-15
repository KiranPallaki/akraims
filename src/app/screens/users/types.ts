export interface UserItem {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  countryCode?: string;
  status: boolean; // active = true, inactive = false
  isLocked?: boolean;
  role?: string;
  accountNumbers?: string[];
}

export interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  role: string;
  accountNumbers: string[];
  status?: boolean;
}

export interface RoleOption {
  value: string;
  label: string;
}

export interface AccountOption {
  value: string;
  label: string;
}
