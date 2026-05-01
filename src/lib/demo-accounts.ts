import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type DemoRole = "public_user" | "donor" | "government" | "admin";

export interface DemoAccount {
  role: DemoRole;
  label: string;
  email: string;
  password: string;
  user_name: string;
  user_phoneno: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "public_user",
    label: "Public User",
    email: "demo.public@reliefhub.local",
    password: "ReliefHub@123",
    user_name: "Demo Public User",
    user_phoneno: "9000000001",
  },
  {
    role: "donor",
    label: "Donor",
    email: "demo.donor@reliefhub.local",
    password: "ReliefHub@123",
    user_name: "Demo Donor",
    user_phoneno: "9000000002",
  },
  {
    role: "government",
    label: "Government Authority",
    email: "demo.government@reliefhub.local",
    password: "ReliefHub@123",
    user_name: "Demo Government Officer",
    user_phoneno: "9000000003",
  },
  {
    role: "admin",
    label: "Admin",
    email: "demo.admin@reliefhub.local",
    password: "ReliefHub@123",
    user_name: "Demo Admin",
    user_phoneno: "9000000004",
  },
];

type SeedResult = {
  role: DemoRole;
  email: string;
  password: string;
  label: string;
};

export const ensureDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(listError.message);

  const existingUsers = usersData.users ?? [];

  const results: SeedResult[] = [];

  for (const account of DEMO_ACCOUNTS) {
    const existing = existingUsers.find((user) => user.email?.toLowerCase() === account.email.toLowerCase());
    let userId = existing?.id;

    if (existing) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: account.password,
        email_confirm: true,
        user_metadata: {
          user_name: account.user_name,
          user_phoneno: account.user_phoneno,
          role: account.role,
        },
      });
      if (error) throw new Error(error.message);
      userId = data.user?.id ?? userId;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          user_name: account.user_name,
          user_phoneno: account.user_phoneno,
          role: account.role,
        },
      });
      if (error) throw new Error(error.message);
      userId = data.user?.id ?? userId;
    }

    if (!userId) {
      throw new Error(`Unable to provision demo account for ${account.email}`);
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        user_name: account.user_name,
        user_email: account.email,
        user_phoneno: account.user_phoneno,
      },
      { onConflict: "id" },
    );
    if (profileError) throw new Error(profileError.message);

    const { error: deleteRolesError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    if (deleteRolesError) throw new Error(deleteRolesError.message);

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: account.role,
    });
    if (roleError) throw new Error(roleError.message);

    results.push({
      role: account.role,
      email: account.email,
      password: account.password,
      label: account.label,
    });
  }

  return results;
});