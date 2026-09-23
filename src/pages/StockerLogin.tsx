import StaffLogin from "@/components/StaffLogin";

export default function StockerLogin() {
  return (
    <StaffLogin
      apiPath="/api/stocker/auth/login"
      tokenKey="stocker_token"
      dashboardPath="/stocker/dashboard"
      portalName="Stocker Portal"
      description="Monitor inventory levels, manage stock replenishment, and keep products available."
    />
  );
}
