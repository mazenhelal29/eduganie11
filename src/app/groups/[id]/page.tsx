import { GroupDetailsPage } from "@/features/groups/group-details-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupDetailsPage groupId={id} />;
}
