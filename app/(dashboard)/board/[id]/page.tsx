import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BoardCanvas from '@/components/board/BoardCanvas'
import type { Column, Card, BoardMember, Profile } from '@/types'

export default async function BoardPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!board) redirect('/boards')

  // Determine permission
  let permission: 'viewer' | 'editor' | 'admin' = 'viewer'
  if (board.owner_id === user.id) {
    permission = 'admin'
  } else {
    const { data: member } = await supabase
      .from('board_members')
      .select('permission')
      .eq('board_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member && !board.is_public) redirect('/boards')
    if (member) permission = member.permission as 'viewer' | 'editor' | 'admin'
  }

  // Fetch columns with cards and assignees
  const { data: rawColumns } = await supabase
    .from('columns')
    .select('*, cards(*, assignee:profiles!cards_assignee_id_fkey(*))')
    .eq('board_id', params.id)
    .order('order_key')

  const columns: Column[] = (rawColumns ?? []).map((col: any) => ({
    ...col,
    cards: (col.cards ?? [])
      .sort((a: Card, b: Card) => a.order_key.localeCompare(b.order_key))
  }))

  // Board members for collaboration display
  const { data: members } = await supabase
    .from('board_members')
    .select('*, profile:profiles(*)')
    .eq('board_id', params.id)

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', board.owner_id)
    .single()

  const allMembers: BoardMember[] = members ?? []

  return (
    <BoardCanvas
      board={board}
      initialColumns={columns}
      permission={permission}
      members={allMembers}
      ownerProfile={ownerProfile}
      currentUserId={user.id}
    />
  )
}
