import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
export default function SignUpModel({ openModal, setOpenModal }: { openModal: boolean; setOpenModal: (value: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!openModal) return;
    setOpenModal(false);
    router.push({ pathname: "/PhoneAuth", params: { returnTo: pathname } });
  }, [openModal, setOpenModal, router, pathname]);
  return null;
}