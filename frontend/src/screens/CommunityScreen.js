import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import AppShell from "../components/AppShell";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import { openAppDrawer } from "../navigation/drawer";
import {
  addCommunityComment,
  COMMUNITY_CATEGORIES,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityPost,
  getCommunityPosts,
  voteOnCommunityPost,
} from "../services/communityService";
import { COLORS, TYPOGRAPHY } from "../theme";

const initialComposer = {
  title: "",
  content: "",
  category: "exercise",
};

const CategoryChip = ({ active, label, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.86}
    onPress={onPress}
    style={[styles.filterChip, active ? styles.filterChipActive : null]}
  >
    <Text
      style={[
        styles.filterChipText,
        active ? styles.filterChipTextActive : null,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const VoteButton = ({ icon, active, text, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.84}
    onPress={onPress}
    style={[styles.voteButton, active ? styles.voteButtonActive : null]}
  >
    <Icon
      name={icon}
      size={18}
      color={active ? COLORS.white : COLORS.textSecondary}
    />
    <Text style={[styles.voteText, active ? styles.voteTextActive : null]}>
      {text}
    </Text>
  </TouchableOpacity>
);

const PostCard = ({ item, onOpen, onVote, onDelete }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={styles.postCard}
    onPress={() => onOpen(item)}
  >
    <View style={styles.postTopRow}>
      <View style={styles.authorBadge}>
        <Icon
          name="account-circle-outline"
          size={18}
          color={COLORS.secondary}
        />
        <Text style={styles.authorText}>
          {item.author?.name || "Community member"}
        </Text>
      </View>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>{item.category}</Text>
      </View>
    </View>

    <Text style={styles.postTitle}>{item.title}</Text>
    <Text numberOfLines={4} style={styles.postContent}>
      {item.content}
    </Text>

    <View style={styles.metaRow}>
      <Text style={styles.metaText}>{item.commentCount || 0} comments</Text>
      <Text style={styles.metaText}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>

    <View style={styles.actionsRow}>
      <VoteButton
        icon="arrow-up-bold"
        active={item.userVote === "upvote"}
        text={`${item.score ?? 0}`}
        onPress={() =>
          onVote(item, item.userVote === "upvote" ? "clear" : "upvote")
        }
      />
      <VoteButton
        icon="arrow-down-bold"
        active={item.userVote === "downvote"}
        text="Downvote"
        onPress={() =>
          onVote(item, item.userVote === "downvote" ? "clear" : "downvote")
        }
      />
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={() => onOpen(item)}
        style={styles.inlineAction}
      >
        <Icon
          name="comment-text-outline"
          size={18}
          color={COLORS.textSecondary}
        />
        <Text style={styles.inlineActionText}>Discuss</Text>
      </TouchableOpacity>
      {item.isOwner ? (
        <TouchableOpacity
          activeOpacity={0.84}
          onPress={() => onDelete(item)}
          style={styles.inlineAction}
        >
          <Icon name="delete-outline" size={18} color={COLORS.error} />
          <Text style={[styles.inlineActionText, styles.deleteText]}>
            Delete
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </TouchableOpacity>
);

const CommunityScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState(initialComposer);
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async (category, mode = "loading") => {
    try {
      if (mode === "loading") {
        setLoading(true);
      }
      if (mode === "refresh") {
        setRefreshing(true);
      }

      setError("");
      const data = await getCommunityPosts(category);
      setPosts(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || "Could not load community posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(selectedCategory);
  }, [loadPosts, selectedCategory]);

  const refreshSelectedPost = useCallback(async (postId) => {
    setDetailLoading(true);
    try {
      const data = await getCommunityPost(postId);
      setSelectedPost(data);
      setPosts((current) =>
        current.map((post) =>
          post._id === postId
            ? {
                ...post,
                ...data.post,
                commentCount: data.comments?.length ?? post.commentCount ?? 0,
              }
            : post,
        ),
      );
    } catch (loadError) {
      setError(loadError.message || "Could not load the discussion.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openPost = useCallback(
    async (post) => {
      setSelectedPost({ post, comments: [] });
      await refreshSelectedPost(post._id);
    },
    [refreshSelectedPost],
  );

  const closeComposer = useCallback(() => {
    setComposer(initialComposer);
    setComposerOpen(false);
  }, []);

  const closeSelectedPost = useCallback(() => {
    setCommentDraft("");
    setSelectedPost(null);
  }, []);

  const submitPost = useCallback(async () => {
    if (!composer.title.trim() || !composer.content.trim()) {
      setError("Post title and content are required.");
      return;
    }

    try {
      setPosting(true);
      setError("");
      const created = await createCommunityPost({
        title: composer.title,
        content: composer.content,
        category: composer.category,
      });
      setPosts((current) => {
        if (
          selectedCategory !== "all" &&
          created.category !== selectedCategory
        ) {
          return current;
        }

        return [created, ...current];
      });
      closeComposer();
    } catch (postError) {
      setError(postError.message || "Could not publish the post.");
    } finally {
      setPosting(false);
    }
  }, [closeComposer, composer, selectedCategory]);

  const handleVote = useCallback(async (post, type) => {
    try {
      const updated = await voteOnCommunityPost(post._id, type);
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id ? { ...item, ...updated } : item,
        ),
      );
      setSelectedPost((current) =>
        current?.post?._id === post._id
          ? { ...current, post: { ...current.post, ...updated } }
          : current,
      );
    } catch (voteError) {
      setError(voteError.message || "Could not update vote.");
    }
  }, []);

  const handleDeletePost = useCallback((post) => {
    Alert.alert("Delete post", "This will remove the post and its comments.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCommunityPost(post._id);
            setPosts((current) =>
              current.filter((item) => item._id !== post._id),
            );
            setSelectedPost((current) =>
              current?.post?._id === post._id ? null : current,
            );
          } catch (deleteError) {
            setError(deleteError.message || "Could not delete the post.");
          }
        },
      },
    ]);
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!selectedPost?.post?._id || !commentDraft.trim()) {
      return;
    }

    try {
      setCommentSubmitting(true);
      await addCommunityComment(selectedPost.post._id, commentDraft);
      setCommentDraft("");
      await refreshSelectedPost(selectedPost.post._id);
    } catch (commentError) {
      setError(commentError.message || "Could not add the comment.");
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentDraft, refreshSelectedPost, selectedPost]);

  const handleDeleteComment = useCallback(
    (commentId) => {
      Alert.alert("Delete comment", "This comment will be removed.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCommunityComment(commentId);
              if (selectedPost?.post?._id) {
                await refreshSelectedPost(selectedPost.post._id);
              }
            } catch (deleteError) {
              setError(deleteError.message || "Could not delete the comment.");
            }
          },
        },
      ]);
    },
    [refreshSelectedPost, selectedPost],
  );

  const listHeader = useMemo(
    () => (
      <>
        <ScreenHeader
          kicker="Community"
          title="Workout discussions"
          subtitle="Share routines, ask for exercise help, and vote the best advice up."
          onMenu={() => openAppDrawer(navigation)}
          right={
            <PrimaryButton
              label="Post"
              icon="plus"
              onPress={() => setComposerOpen(true)}
              style={styles.headerButton}
              textStyle={styles.headerButtonText}
            />
          }
        />

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="reddit" size={24} color={COLORS.white} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              A Reddit-style gym room inside FitTrack
            </Text>
            <Text style={styles.heroText}>
              Post training questions, comment on form tips, and let the best
              answers rise.
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Icon
              name="alert-circle-outline"
              size={20}
              color={COLORS.warning}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {COMMUNITY_CATEGORIES.map((category) => (
            <CategoryChip
              key={category.value}
              label={category.label}
              active={selectedCategory === category.value}
              onPress={() => setSelectedCategory(category.value)}
            />
          ))}
        </ScrollView>
      </>
    ),
    [error, navigation, selectedCategory],
  );

  return (
    <AppShell>
      {loading ? (
        <>
          {listHeader}
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading community feed</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              onOpen={openPost}
              onVote={handleVote}
              onDelete={handleDeletePost}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="forum-outline" size={54} color={COLORS.secondary} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>
                Start the first discussion about exercise, recovery, or workout
                programming.
              </Text>
              <PrimaryButton
                label="Create first post"
                icon="plus"
                onPress={() => setComposerOpen(true)}
                style={styles.emptyButton}
              />
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPosts(selectedCategory, "refresh")}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      <Modal
        visible={composerOpen}
        animationType="slide"
        transparent
        onRequestClose={closeComposer}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create a post</Text>
              <Pressable onPress={closeComposer} hitSlop={8}>
                <Icon name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            <TextInput
              value={composer.title}
              onChangeText={(text) =>
                setComposer((current) => ({ ...current, title: text }))
              }
              placeholder="Short title"
              placeholderTextColor="rgba(247,243,238,0.38)"
              style={styles.input}
            />
            <TextInput
              value={composer.content}
              onChangeText={(text) =>
                setComposer((current) => ({ ...current, content: text }))
              }
              placeholder="Share your question, routine, or advice"
              placeholderTextColor="rgba(247,243,238,0.38)"
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {COMMUNITY_CATEGORIES.filter((item) => item.value !== "all").map(
                (category) => (
                  <CategoryChip
                    key={category.value}
                    label={category.label}
                    active={composer.category === category.value}
                    onPress={() =>
                      setComposer((current) => ({
                        ...current,
                        category: category.value,
                      }))
                    }
                  />
                ),
              )}
            </View>

            <PrimaryButton
              label="Publish post"
              icon="send"
              onPress={submitPost}
              loading={posting}
              style={styles.publishButton}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedPost)}
        animationType="slide"
        onRequestClose={closeSelectedPost}
      >
        <AppShell>
          <View style={styles.detailHeader}>
            <TouchableOpacity
              onPress={closeSelectedPost}
              activeOpacity={0.84}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Discussion</Text>
            <View style={styles.backButton} />
          </View>

          {detailLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading replies</Text>
            </View>
          ) : selectedPost ? (
            <ScrollView
              contentContainerStyle={styles.detailContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <PostCard
                item={{
                  ...selectedPost.post,
                  isOwner: selectedPost.post?.isOwner,
                  commentCount: selectedPost.comments?.length ?? 0,
                }}
                onOpen={() => {}}
                onVote={handleVote}
                onDelete={handleDeletePost}
              />

              <View style={styles.commentComposer}>
                <Text style={styles.commentComposerTitle}>Add a comment</Text>
                <TextInput
                  value={commentDraft}
                  onChangeText={setCommentDraft}
                  placeholder="Offer advice, ask a follow-up, or share your own experience"
                  placeholderTextColor="rgba(247,243,238,0.38)"
                  style={[styles.input, styles.commentInput]}
                  multiline
                  textAlignVertical="top"
                />
                <PrimaryButton
                  label="Comment"
                  icon="comment-plus-outline"
                  onPress={handleAddComment}
                  loading={commentSubmitting}
                />
              </View>

              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>
                  Replies ({selectedPost.comments?.length ?? 0})
                </Text>
                {(selectedPost.comments || []).map((comment) => (
                  <View key={comment._id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View>
                        <Text style={styles.commentAuthor}>
                          {comment.author?.name || "Community member"}
                        </Text>
                        <Text style={styles.commentDate}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      {comment.isOwner ? (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comment._id)}
                          activeOpacity={0.84}
                        >
                          <Icon
                            name="delete-outline"
                            size={20}
                            color={COLORS.error}
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </AppShell>
      </Modal>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 28,
  },
  headerButton: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontSize: 13,
  },
  heroCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  heroText: {
    ...TYPOGRAPHY.body,
    marginTop: 6,
  },
  errorCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    color: COLORS.text,
    marginLeft: 10,
    lineHeight: 20,
    fontWeight: "700",
  },
  filterRow: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontWeight: "800",
  },
  postCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  postTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  authorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.background,
  },
  categoryBadgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  postTitle: {
    color: COLORS.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },
  postContent: {
    ...TYPOGRAPHY.body,
    marginTop: 10,
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  voteButtonActive: {
    backgroundColor: COLORS.primary,
  },
  voteText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  voteTextActive: {
    color: COLORS.white,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineActionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  deleteText: {
    color: COLORS.error,
  },
  emptyState: {
    margin: 18,
    padding: 24,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginTop: 8,
    textAlign: "center",
  },
  emptyButton: {
    alignSelf: "stretch",
    marginTop: 18,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(8,11,15,0.6)",
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },
  modalLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  input: {
    minHeight: 54,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  textarea: {
    minHeight: 130,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  publishButton: {
    marginTop: 18,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceHigh,
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  detailContent: {
    paddingBottom: 28,
  },
  commentComposer: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentComposerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  commentInput: {
    minHeight: 110,
  },
  commentsSection: {
    marginHorizontal: 18,
  },
  commentsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  commentCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  commentAuthor: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  commentDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  commentContent: {
    ...TYPOGRAPHY.body,
    marginTop: 10,
    color: COLORS.text,
  },
});

export default CommunityScreen;
