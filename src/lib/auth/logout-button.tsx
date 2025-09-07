"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "./provider";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <Button variant="secondary" onClick={handleSignOut}>
      Logout
    </Button>
  );
}


