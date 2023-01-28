export function emailToId(email: string) {
  const indexOfAt = email.indexOf("@");
  return email.slice(0, indexOfAt);
}

export function idToEmail(id: string) {
  return id + "@lofaseoul-partner.com";
}
