import { GroupDetailsPage } from "@/features/groups/group-details-page";

export default function Page({ params }: { params: { id: string } }) {
  return <GroupDetailsPage groupId={params.id} />;
}
