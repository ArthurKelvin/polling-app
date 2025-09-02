"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "./provider";

export function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Button variant="secondary" onClick={() => signOut()}>
      Logout
    </Button>
  );
}


