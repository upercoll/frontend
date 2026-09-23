import StaffLogin from "@/components/StaffLogin";

export default function DelivererLogin() {
  return (
    <StaffLogin
      apiPath="/api/deliverer/auth/login"
      tokenKey="deliverer_token"
      dashboardPath="/deliverer/dashboard"
      portalName="Delivery Team Portal"
      description="Access your delivery queue, manage orders, and fulfill items for customers."
    />
  );
}
