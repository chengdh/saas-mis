/**
 * Supabase数据库表和字段的类型定义
 * 注意：通常这些类型会使用 `supabase gen types typescript` 自动生成
 * 本文件仅提供示例结构
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 用户表
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      // 租户表
      tenants: {
        Row: {
          id: string
          name: string
          domain: string | null
          logo_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      // 用户-租户关联表
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'member' | 'viewer'
    }
  }
} 