import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useEcomStore from "../store/ecom-store";

export default function useAppLogout() {
  const navigate = useNavigate();
  const logout = useEcomStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.success("ออกจากระบบสำเร็จ");
    navigate("/");
  };

  return handleLogout;
}
