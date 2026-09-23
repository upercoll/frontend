import StaffLogin from "@/components/StaffLogin";

export default function SocialsLogin() {
  return (
    <StaffLogin
      apiPath="/api/collab/login"
      tokenKey="social_token"
      dashboardPath="/socials/dashboard"
      portalName="Creator Portal"
      description="Create content, manage your social presence, and collaborate with the RBstars community."
    />
  );
}
