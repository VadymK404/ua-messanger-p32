import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";



/**
 * Генерує тимчасове посилання для завантаження файлу в Convex Storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  console.log("Identity:", identity);

  const userId = await getAuthUserId(ctx);
  console.log("UserId:", userId);

  if (userId === null) {
    throw new Error("Unauthorized: Неавторизований доступ");
  }

  return await ctx.storage.generateUploadUrl();
});

/**
 * Зберігає пост у БД та оновлює кількість постів у профілі користувача
 */
export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized: Неавторизований доступ");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found: Користувача не знайдено");
    }

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) {
      throw new Error("Image URL not found: Не вдалося згенерувати посилання на зображення");
    }

    const postId = await ctx.db.insert("posts", {
      userId,
      imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    await ctx.db.patch(userId, {
      posts: (currentUser.posts ?? 0) + 1,
    });

    return postId;
  },
});

/**
 * Перемикає лайк на пості та створює сповіщення для автора (якщо це не наш пост)
 */
export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized: Неавторизований доступ");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Пост не знайдено");

    // Шукаємо, чи поточний користувач уже поставив лайк
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    if (existingLike) {
      // Якщо лайк є – видаляємо його
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likes: Math.max(0, post.likes - 1),
      });
      return false; // Повернути false (лайк прибрано)
    } else {
      // Якщо лайка немає – створюємо
      await ctx.db.insert("likes", {
        userId,
        postId: args.postId,
      });
      await ctx.db.patch(args.postId, {
        likes: post.likes + 1,
      });

      // Створюємо нотифікацію автору поста (якщо лайкаємо не свій пост)
      if (userId !== post.userId) {
        await ctx.db.insert("notifications", {
          type: "like",
          receiverId: post.userId,
          senderId: userId,
          postId: args.postId,
        });
      }
      return true; // Повернути true (лайк успішно поставлено)
    }
  },
});

/**
 * Отримує всі пости для стрічки разом із інформацією про автора, лайки та закладки
 */
export const getPosts = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const posts = await ctx.db.query("posts").order("desc").collect();

    if (posts.length === 0) return [];

    const postsWithInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = await ctx.db.get(post.userId);

        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", userId).eq("postId", post._id)
          )
          .first();

        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_both", (q) =>
            q.eq("userId", userId).eq("postId", post._id)
          )
          .first();

        return {
          ...post,
          author: {
            _id: postAuthor?._id,
            username: postAuthor?.username ?? postAuthor?.name ?? "user",
            image:
              postAuthor?.image ??
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
          },
          isLiked: !!like,
          isBookmarked: !!bookmark,
        };
      })
    );

    return postsWithInfo;
  },
});

/**
 * Видаляє пост та всі пов'язані з ним сутності (лайки, коментарі, закладки, файли)
 */
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized: Неавторизований доступ");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Пост не знайдено");

    // Дозволено видаляти тільки власні пости
    if (post.userId !== userId) {
      throw new Error("Немає прав для видалення цього поста");
    }

    // 1. Видаляємо всі пов'язані лайки
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // 2. Видаляємо всі пов'язані коментарі
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // 3. Видаляємо всі пов'язані закладки
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    // 4. Видаляємо зображення зі Storage
    await ctx.storage.delete(post.storageId);

    // 5. Видаляємо сам документ посту
    await ctx.db.delete(args.postId);

    // 6. Зменшуємо кількість постів користувача
    const currentUser = await ctx.db.get(userId);
    if (currentUser) {
      await ctx.db.patch(userId, {
        posts: Math.max(0, (currentUser.posts ?? 1) - 1),
      });
    }
  },
});


export const getPostById = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const author = await ctx.db.get(post.userId);
    const userId = await getAuthUserId(ctx);

    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const like = await ctx.db
        .query("likes")
        .withIndex("by_user_and_post", (q) =>
          q.eq("userId", userId).eq("postId", post._id),
        )
        .first();
      isLiked = !!like;

      const bookmark = await ctx.db
        .query("bookmarks")
        .withIndex("by_both", (q) =>
          q.eq("userId", userId).eq("postId", post._id),
        )
        .first();
      isBookmarked = !!bookmark;
    }

    return {
      ...post,
      author: {
        _id: author?._id,
        username: author?.username ?? author?.name ?? "user",
        image:
          author?.image ??
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
      },
      isLiked,
      isBookmarked,
    };
  },
});

export const getPostsByUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? (await getAuthUserId(ctx));
    if (!userId) return [];

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return posts;
  },
});