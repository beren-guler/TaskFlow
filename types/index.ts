export type Permission = 'viewer' | 'editor' | 'admin'
export type Role = 'intern' | 'junior' | 'mid' | 'senior' | 'lead'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  role: Role | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Board {
  id: string
  title: string
  description: string | null
  owner_id: string
  is_public: boolean
  share_token: string
  default_link_permission: 'viewer' | 'editor'
  background_color: string
  created_at: string
  updated_at: string
}

export interface BoardMember {
  board_id: string
  user_id: string
  permission: Permission
  invited_by: string | null
  created_at: string
  profile?: Profile
}

export interface BoardWithMembers extends Board {
  members?: BoardMember[]
  owner?: Profile
}

export interface Column {
  id: string
  board_id: string
  title: string
  order_key: string
  color: string
  created_at: string
  cards: Card[]
}

export interface Card {
  id: string
  column_id: string
  title: string
  description: string | null
  order_key: string
  due_date: string | null
  assignee_id: string | null
  labels: string[]
  last_edited_by: string | null
  last_edited_at: string
  created_at: string
  assignee?: Profile | null
  last_editor?: Profile | null
}
