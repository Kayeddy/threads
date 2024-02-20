"use client";
import Image from "next/image";
import CommentThreadDialog from "../dialogs/CommentThreadDialog";
import RepostThreadDialog from "../dialogs/RepostThreadDialog";
import ShareThreadDialog from "../dialogs/ShareThreadDialog";
import { toggleLikeThread } from "@/lib/actions/thread.actions";
import { useState, useRef, useEffect } from "react";
import DeleteThreadDialog from "../dialogs/DeleteThreadDialog";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  threadId: string;
  currentUserId: string | null;
  currentUserImage?: string | undefined;
  threadContent?: string;
  threadAuthor: {
    name: string;
    image: string;
    id: string;
  };
  threadComments?: {}[];
  threadLikes?: {}[];
  isComment?: boolean;
}

export default function ThreadInteractionSection({
  threadId,
  threadAuthor,
  threadContent,
  threadComments,
  threadLikes,
  currentUserId,
  currentUserImage,
  isComment = false,
}: Props) {
  const [threadLiked, setThreadLiked] = useState(false);

  const pathname = usePathname();

  const handleThreadLike = async () => {
    const toggleThreadLikeResult = await toggleLikeThread(
      threadId,
      currentUserId ? currentUserId : "",
      pathname
    );
    setThreadLiked(
      //@ts-ignore
      toggleThreadLikeResult.likes.includes(currentUserId ? currentUserId : "")
    );
  };

  useEffect(() => {
    if (threadLikes && threadLikes.includes(currentUserId ? currentUserId : ""))
      setThreadLiked(true);
  }, [threadLikes, threadId]);

  return (
    <div className="flex gap-3.5">
      <Image
        src={
          threadLiked ? "/assets/heart-filled.svg" : "/assets/heart-gray.svg"
        }
        alt="Thread_Heart_Reaction_Icon"
        width={24}
        height={24}
        className="cursor-pointer object-contain hover:scale-110 transition-all duration-300 ease-in-out hover:brightness-200"
        onClick={async () => {
          await handleThreadLike();
        }}
      ></Image>

      {!isComment && (
        <>
          <CommentThreadDialog
            triggerImage={
              <Image
                src="/assets/reply.svg"
                alt="Thread_Reply_Icon"
                width={24}
                height={24}
                className="cursor-pointer object-contain hover:scale-110 transition-all duration-300 ease-in-out hover:brightness-200"
              ></Image>
            }
            parentThread={{
              id: threadId,
              userId: threadAuthor.id,
              authorName: threadAuthor.name,
              authorImage: threadAuthor.image,
              content: threadContent ? threadContent : "",
            }}
            comments={threadComments ? threadComments : []}
            currentUserId={currentUserId}
            currentUserImage={currentUserImage}
          />

          <RepostThreadDialog
            triggerImage={
              <Image
                src="/assets/repost.svg"
                alt="Thread_Repost_Icon"
                width={24}
                height={24}
                className="cursor-pointer object-contain hover:scale-110 transition-all duration-300 ease-in-out hover:brightness-200"
              ></Image>
            }
            currentUserId={currentUserId}
            threadContent={threadContent ? threadContent : ""}
          />

          <ShareThreadDialog
            triggerImage={
              <Image
                src="/assets/share.svg"
                alt="Thread_Share_Icon"
                width={24}
                height={24}
                className="cursor-pointer object-contain hover:scale-110 transition-all duration-300 ease-in-out hover:brightness-200"
              ></Image>
            }
            threadId={threadId}
          />
        </>
      )}

      {currentUserId === threadAuthor.id && (
        <DeleteThreadDialog
          triggerImage={
            <Image
              src="/assets/delete.svg"
              alt="Thread_Share_Icon"
              width={16}
              height={16}
              className="cursor-pointer object-contain hover:scale-110 transition-all duration-300 ease-in-out hover:brightness-200"
            ></Image>
          }
          threadId={threadId}
          isComment={isComment}
        />
      )}
    </div>
  );
}
