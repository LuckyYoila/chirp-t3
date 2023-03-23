import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import type { User } from "@clerk/nextjs/dist/api";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const filterForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profilePicture: user.profileImageUrl,
  };
};
export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) =>  post.authorId),
        limit: 100,
      })
    ).map(filterForClient);

    // console.log(users);

    return posts.map((post) => {

        const author = users.find((user) => user.id === post.authorId)

        if (!author) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author not found for post" })

      return {
        post,
        author: {
          ...author,
          username: author.username
        },
      };
    });
  }),
});
