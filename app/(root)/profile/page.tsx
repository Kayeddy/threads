import PostThreadForm from "@/components/forms/PostThreadForm";
import UserProfileHeader from "@/components/shared/profile/userProfileHeader";
import AccountProfileTabs from "@/components/tabs/AccountProfileTabs";
import {
  fetchProfileThreads,
  fetchUserData,
  fetchUserDataByDBId,
} from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function UserProfile() {
  const currentLoggedInUser = await currentUser();

  if (!currentLoggedInUser) return null;

  const currentLoggedInUserData = await fetchUserData(currentLoggedInUser.id);

  const fetchedThreads = await fetchProfileThreads(currentLoggedInUserData._id);

  if (!currentLoggedInUserData?.onboarded) {
    redirect("/onboarding");
  }

  const profileHeaderProps = {
    accessedAccountUserId: currentLoggedInUserData.userId,
    currentLoggedInUserId: currentLoggedInUserData.id,
    accessedAccountName: currentLoggedInUserData.name,
    accessedAcountUsername: currentLoggedInUserData.username,
    accessedAcountProfileImage: currentLoggedInUserData.image,
    accessedAccountBio: currentLoggedInUserData.bio,
  };

  return (
    <section>
      <UserProfileHeader {...profileHeaderProps} />
      <div className="mt-9">
        <AccountProfileTabs
          userId={currentLoggedInUserData.id}
          accountId={currentLoggedInUserData.id}
          accountImage={currentLoggedInUserData.image}
          userThreads={fetchedThreads.threads}
        />
      </div>
    </section>
  );
}