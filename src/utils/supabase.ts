import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// 环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 检查必要的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase configuration. Please check your environment variables.'
  )
}

// 单例模式
let instance: SupabaseClient | null = null

/**
 * 获取Supabase客户端实例 (单例模式)
 * @returns SupabaseClient实例
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (instance === null) {
    instance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return instance
}

/**
 * 重置Supabase客户端实例
 * 在需要重新初始化客户端的情况下使用，例如用户登录/登出后更新认证
 */
export const resetSupabaseClient = (): void => {
  instance = null
}

export default getSupabaseClient 