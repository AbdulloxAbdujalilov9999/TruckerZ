import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    companyId?: string;
    companyName?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      companyId: string;
      companyName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    companyId?: string;
    companyName?: string;
  }
}
