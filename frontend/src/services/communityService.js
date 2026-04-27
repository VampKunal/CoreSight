import { apiFetch } from "./apiClient";

export const COMMUNITY_CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Exercise", value: "exercise" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Motivation", value: "motivation" },
  { label: "General", value: "general" },
];

export const getCommunityPosts = async (category = "all") => {
  const suffix =
    category && category !== "all"
      ? `?category=${encodeURIComponent(category)}`
      : "";
  return apiFetch(`/api/community/posts${suffix}`);
};

export const getCommunityPost = async (postId) =>
  apiFetch(`/api/community/posts/${postId}`);

export const createCommunityPost = async (payload) =>
  apiFetch("/api/community/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const voteOnCommunityPost = async (postId, type) =>
  apiFetch(`/api/community/posts/${postId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });

export const addCommunityComment = async (postId, content) =>
  apiFetch(`/api/community/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

export const deleteCommunityPost = async (postId) =>
  apiFetch(`/api/community/posts/${postId}`, {
    method: "DELETE",
  });

export const deleteCommunityComment = async (commentId) =>
  apiFetch(`/api/community/comments/${commentId}`, {
    method: "DELETE",
  });
