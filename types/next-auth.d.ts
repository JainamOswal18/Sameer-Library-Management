import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "librarian" | "student";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "librarian" | "student";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "librarian" | "student";
    id: string;
  }
}
