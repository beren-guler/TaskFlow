import { createClient } from '@/lib/supabase/server'
import BoardsClient from './BoardsClient'

export default async function BoardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // My boards
  const { data: myBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('owner_id', user!.id)
    .order('updated_at', { ascending: false })

  // Shared boards (member of)
  const { data: memberRows } = await supabase
    .from('board_members')
    .select('board_id, permission, boards(*)')
    .eq('user_id', user!.id)

  const sharedBoards = (memberRows ?? [])
    .map((r: any) => ({ ...r.boards, _permission: r.permission }))
    .filter(Boolean)

  return <BoardsClient myBoards={myBoards ?? []} sharedBoards={sharedBoards} userId={user!.id} />
}
