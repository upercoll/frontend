import StaffLogin from "@/components/StaffLogin";

export default function CollabLogin() {
  return (
    <StaffLogin
      apiPath="/api/collab/login"
      tokenKey="collab_token"
      dashboardPath="/collab/dashboard"
      portalName="Collaborator Portal"
      description="Manage collaborations, track performance, and grow your partnerships."
    />
  );
}
