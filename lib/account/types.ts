export const ADDRESS_PURPOSES = ["APPOINTMENT", "SHIPPING", "BILLING"] as const;
export type AddressPurpose = (typeof ADDRESS_PURPOSES)[number];

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string | null;
  line1: string;
  line2: string | null;
  administrativeArea: string | null;
  locality: string;
  postalCode: string | null;
  countryCode: string;
  purpose: AddressPurpose;
  isDefault: boolean;
};

export type AddressFormValues = {
  label: string;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2: string;
  administrativeArea: string;
  locality: string;
  postalCode: string;
  countryCode: string;
  purpose: AddressPurpose;
  isDefault: boolean;
};

export const emptyAddressForm: AddressFormValues = {
  label: "",
  recipientName: "",
  recipientPhone: "",
  line1: "",
  line2: "",
  administrativeArea: "",
  locality: "",
  postalCode: "",
  countryCode: "US",
  purpose: "APPOINTMENT",
  isDefault: false,
};
