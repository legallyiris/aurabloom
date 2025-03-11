import { api } from "@/services/api";

type AsyncFunction<T> = () => Promise<T>;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Result<T> = T extends AsyncFunction<infer U>
  ? UnwrapPromise<U>
  : UnwrapPromise<T>;
type ExtractData<T> = T extends { data: infer D } ? D : never;
type UnwrapArray<T> = T extends (infer U)[] ? U : T;

const getChannels = () => api.api.channels({ communityId: "" }).get();

const getCommunities = () => api.api.communities.index.get();
const getMyCommunities = () => api.api.communities.me.get();
const joinCommunity = () => api.api.communities({ id: "" }).join.post();

const sendMessage = () =>
  api.api.messages({ channelId: "" }).post({ content: "" });
const getMessages = () =>
  api.api.messages({ channelId: "" }).get({ query: {} });
const getUser = () => api.api.users.me.get();

type ApiResponse<T> = Result<T> extends { data: infer D } ? D : never;
type ErrorResponse<T> = Result<T> extends { error: infer E } ? E : never;

export type ChannelsResponse = ApiResponse<typeof getChannels>;
export type ChannelsError = ErrorResponse<typeof getChannels>;
export type Channel = UnwrapArray<ExtractData<NonNullable<ChannelsResponse>>>;

export type PublicCommunitiesResponse = ApiResponse<typeof getCommunities>;
export type PublicCommunitiesError = ErrorResponse<typeof getCommunities>;
export type PublicCommunity = UnwrapArray<
  ExtractData<NonNullable<PublicCommunitiesResponse>>
>;

export type JoinedCommunitiesResponse = ApiResponse<typeof getMyCommunities>;
export type JoinedCommunitiesError = ErrorResponse<typeof getMyCommunities>;
export type JoinedCommunity = UnwrapArray<
  ExtractData<NonNullable<JoinedCommunitiesResponse>>
>;

export type JoinCommunityResponse = ApiResponse<typeof joinCommunity>;
export type JoinCommunityError = ErrorResponse<typeof joinCommunity>;

export type MessagesResponse = ApiResponse<typeof getMessages>;
export type MessagesError = ErrorResponse<typeof getMessages>;
export type Message = UnwrapArray<ExtractData<NonNullable<MessagesResponse>>>;

export type SendMessageResponse = ApiResponse<typeof sendMessage>;
export type SendMessageError = ErrorResponse<typeof sendMessage>;

export type UserResponse = ApiResponse<typeof getUser>;

export type User = ExtractData<NonNullable<UserResponse>>;
