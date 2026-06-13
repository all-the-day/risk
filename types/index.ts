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

// 活动模板类型
export interface ActivityTemplateItem {
  id: string;
  name: string;
  description: string | null;
  maxScore: number;
  period: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

export interface ActivityCategoryItem {
  id: string;
  templateId: string;
  name: string;
  order: number;
  items?: ActivityItemData[];
}

export interface ActivityItemData {
  id: string;
  templateId: string;
  categoryId: string | null;
  parentId: string | null;
  name: string;
  fullName: string | null;
  score: number;
  order: number;
  enabled: boolean;
  children?: ActivityItemData[];
  category?: ActivityCategoryItem | null;
}

export interface ActivityRecordData {
  id: string;
  userId: string;
  itemId: string;
  date: string;
  score: number;
  note: string | null;
  checkedAt: string;
  user?: {
    phone: string;
  };
  item?: {
    name: string;
    fullName: string | null;
  };
}
