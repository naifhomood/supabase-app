export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: number
          created_at: string
          title: string
          is_complete: boolean
          user_id: string
        }
        Insert: {
          title: string
          is_complete?: boolean
          user_id: string
        }
        Update: {
          title?: string
          is_complete?: boolean
        }
      }
    }
  }
}
