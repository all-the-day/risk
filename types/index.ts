export interface UserWithMemberships {
  id: string;
  phone: string;
  memberships: {
    id: string;
    nickname: string;
    groupId: string;
    group: {
      id: string;
      name: string;
      inviteCode: string;
    };
  }[];
}

export interface GroupWithMembers {
  id: string;
  name: string;
  inviteCode: string;
  members: {
    id: string;
    nickname: string;
    userId: string;
  }[];
}

export interface TaskItem {
  id: string;
  type: string;
  title: string;
  order: number;
}

export interface CheckinStatus {
  taskId: string;
  checked: boolean;
  checkedAt: string | null;
}

export interface MemberCheckinStatus {
  nickname: string;
  taskId: string;
  checked: boolean;
}
