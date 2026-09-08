import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
export default function LoginModel({ openLogin, setOpenLogin }: { openLogin: boolean; setOpenLogin: (value: boolean) => void; openSignup?: (value: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!openLogin) return;
    setOpenLogin(false);
    router.push({ pathname: "/PhoneAuth", params: { returnTo: pathname } });
  }, [openLogin, setOpenLogin, router, pathname]);
  return null;
}