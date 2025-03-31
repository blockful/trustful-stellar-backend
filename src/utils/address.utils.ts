export function toLowerCaseAddress(address: string): string {
  if (!address) return address;
  return address.toLowerCase();
}

export function toLowerCaseAddresses(addresses: string[]): string[] {
  if (!addresses) return addresses;
  return addresses.map(addr => toLowerCaseAddress(addr));
} 