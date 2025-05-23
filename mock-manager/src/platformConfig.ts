export type Field = "username" | "email" | "age";

export interface Platform {
  id: string;
  label: string;
  fields: Field[];
}

export const platforms: Platform[] = [
  { id: "ps5", label: "PS5", fields: ["username", "age"] },
  { id: "ps4", label: "PS4", fields: ["username", "email", "age"] },
  { id: "xbox", label: "Xbox", fields: ["username", "email", "age"] },
  { id: "switch", label: "Xbox", fields: ["username", "email", "age"] },
];
