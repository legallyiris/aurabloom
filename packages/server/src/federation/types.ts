export type ActivityPubContext =
  | string
  | string[]
  | Record<string, string | Record<string, string>>;

export type ActivityPubObject = {
  "@context"?: ActivityPubContext;
  id: string;
  type: string;
  [key: string]: unknown;
};

export type ActivityPubActor = ActivityPubObject & {
  type: "Person" | "Group" | "Organization" | "Application" | "Service";
  preferredUsername: string;
  name?: string;
  summary?: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  icon?: {
    type: "Image";
    mediaType: string;
    url: string;
  };
  url?: string;
};

export type ActivityPubActivity = ActivityPubObject & {
  actor: string;
  object: string | ActivityPubObject;
  published?: string;
  to?: string | string[];
  cc?: string | string[];
};

export type FollowActivity = ActivityPubActivity & {
  type: "Follow";
  /* actor being followed */
  object: string;
};

export type CreateNoteActivity = ActivityPubActivity & {
  type: "Create";
  object: {
    type: "Note";
    content: string;
    attributedTo: string;
    to: string | string[];
    cc?: string | string[];
    [key: string]: unknown;
  };
};

export type AcceptActivity = ActivityPubActivity & {
  type: "Accept";
  object: FollowActivity | string;
};

export type RejectActivity = ActivityPubActivity & {
  type: "Reject";
  object: FollowActivity | string;
};

export type WebfingerResponse = {
  subject: string;
  aliases?: string[];
  links: {
    rel: string;
    type?: string;
    href?: string;
    template?: string;
  }[];
};

export function isFollowActivity(
  activity: ActivityPubActivity,
): activity is FollowActivity {
  return (
    activity.type === "Follow" &&
    (typeof activity.object === "string" ||
      (typeof activity.object === "object" && activity.object !== null))
  );
}

export function isCreateNoteActivity(
  activity: ActivityPubActivity,
): activity is CreateNoteActivity {
  return (
    activity.type === "Create" &&
    typeof activity.object === "object" &&
    activity.object !== null &&
    activity.object.type === "Note"
  );
}

export type FederatedActor = {
  id: string;
  userId: number | null;
  communityId: string | null;
  actorType: "user" | "community";
  actorUrl: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  publicKey: string | null;
  privateKey: string | null;
  sharedInbox: string | null;
};

export type Community = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: number;
  createdBy: number;
  isPublic: boolean;
  domain: string | null;
  isLocal: boolean;
};
