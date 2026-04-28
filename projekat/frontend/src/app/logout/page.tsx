"use client";
export const runtime = 'edge';

import { useEffect } from "react";
import { useLogin } from "../login/useLogin"; 

export default function LogoutPage() {
  const { handleLogout } = useLogin();

  useEffect(() => {
    handleLogout();
  }, []);

  return (
    <div className="page stack" style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Logout...</p>
    </div>
  );
}