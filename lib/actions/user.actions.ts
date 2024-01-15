"use server"; //This indicates that we're going to use server actions (when specific code should be rendered only on the server)

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface updateUserParams {
  userId: string;
  name: string;
  username: string;
  bio: string;
  image: string;
  path: string;
}

interface fetchAllUsersParams {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}

export async function fetchAllUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: fetchAllUsersParams) {
  try {
    connectToDB();

    const pageSkipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    const usersRetrievalFilterQuery: FilterQuery<typeof User> = {
      userId: { $ne: userId }, // Filter out the currently loggedIn user
    };

    if (searchString.trim() !== "") {
      usersRetrievalFilterQuery.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const usersRetrievalSortOptions = {
      createdAt: sortBy,
    };

    const usersRetrievalQuery = User.find(usersRetrievalFilterQuery)
      .sort(usersRetrievalSortOptions)
      .skip(pageSkipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(
      usersRetrievalFilterQuery
    );

    const retrievedUsers = await usersRetrievalQuery.exec();

    const isNextPageRequired =
      totalUsersCount > pageSkipAmount + usersRetrievalFilterQuery.length;

    return { retrievedUsers, isNextPageRequired };
  } catch (error) {
    throw new Error(
      `Failed to fetch users from database. Error details: ${error}`
    );
  }
}

export async function fetchUserData(userId: string) {
  try {
    connectToDB();
    return await User.findOne({ userId: userId });

    /*
    .populate({
      path: "communities",
      model: Community
    });
    */
  } catch (error: any) {
    throw new Error(
      `Failed to fetch user and data from database. Error details: ${error}`
    );
  }
}

export async function fetchUserDataByDBId(userId: string) {
  try {
    connectToDB();
    return await User.findOne({ _id: userId });

    /*
    .populate({
      path: "communities",
      model: Community
    });
    */
  } catch (error: any) {
    throw new Error(
      `Failed to fetch user and data from database. Error details: ${error}`
    );
  }
}

export async function updateUser({
  userId,
  name,
  username,
  bio,
  image,
  path,
}: updateUserParams): Promise<void> {
  try {
    connectToDB();

    await User.findOneAndUpdate(
      { userId: userId },
      { username: username.toLowerCase(), name, bio, image, onboarded: true },
      { upsert: true }
    ); // Upsert sstands for updating and inserting

    {
      /* 
        Next js function that allows to revalidate data associated with a specific path. Updates cached data without
        waiting for revalidation to expire
        */
    }
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(
      `There was an error while trying to create/update user. Error details: ${error.message}`
    );
  }
}

export async function addUserThread({
  userId,
  createdThread,
}: {
  userId: string;
  createdThread: {
    threadAuthor: string;
    threadContent: string;
    threadCommunity: any;
    _id: any;
  };
}) {
  await User.findByIdAndUpdate(userId, {
    $push: {
      threads: createdThread._id,
    },
  });
}

export async function fetchProfileThreads(userId: string) {
  try {
    connectToDB();

    // TODO: populate comminity threads
    // Find all threads authored by the user with the provided profileId param
    const retrievedProfileThreads = await User.findOne({
      _id: userId,
    }).populate({
      path: "threads",
      model: Thread,
      populate: {
        path: "children",
        model: Thread,
        populate: {
          path: "threadAuthor",
          model: User,
          select: "name image userId",
        },
      },
    });

    return retrievedProfileThreads;
  } catch (error) {
    throw new Error(
      `There was an error fetching user threads. Error details => ${error}`
    );
  }
}

export async function getUserActivity(userId: string) {
  try {
    connectToDB();
    // Find all threads created by the specified user
    const userThreads = await Thread.find({ threadAuthor: userId });

    if (!userThreads) return;

    // Collect the Id's of all the comments of each thread created by the user
    const threadCommentsIds = await userThreads.reduce(
      (accumulator, userThread) => {
        return accumulator.concat(userThread.children);
      },
      []
    );

    // Use the collected comment ids to find their respective relevant information
    const userComments = await Thread.find({
      _id: { $in: threadCommentsIds },
      threadAuthor: { $ne: userId },
    }).populate({
      path: "threadAuthor",
      model: User,
      select: "name image _id",
    });

    return userComments;
  } catch (error) {
    throw new Error(
      `There was an error fetching user activity. Error details => ${error}`
    );
  }
}