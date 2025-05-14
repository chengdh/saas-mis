#!/bin/bash
# Supabase CLI便捷执行脚本
# 使用方法: ./scripts/supabase.sh [命令] [参数...]

# 获取容器ID
CONTAINER_ID=$(docker compose ps -q supabase-cli 2>/dev/null)

if [ -z "$CONTAINER_ID" ]; then
  echo "🚀 Supabase CLI服务未运行，正在启动..."
  docker compose up -d supabase-cli
  CONTAINER_ID=$(docker compose ps -q supabase-cli 2>/dev/null)
  
  if [ -z "$CONTAINER_ID" ]; then
    echo "❌ 无法启动Supabase CLI服务！"
    exit 1
  fi
  
  echo "✅ Supabase CLI服务已启动"
fi

# 检查是否存在密码文件
PASSWORD_FILE=".supabase-password"

# 检查命令是否包含 db push
if [[ "$*" == *"db push"* ]] && [ -f "$PASSWORD_FILE" ]; then
  # 从文件读取密码，确保没有额外的换行符
  DB_PASSWORD=$(tr -d '\n' < "$PASSWORD_FILE")
  
  echo "🔄 执行: supabase $@ (使用存储的密码)"
  
  # 直接将密码作为参数传递
  docker exec -i $CONTAINER_ID supabase $* -p "$DB_PASSWORD"
else
  # 正常执行命令
  echo "🔄 执行: supabase $@"
  if [[ "$*" == *"db push"* ]]; then
    echo "💡 提示: 要避免输入密码，可创建 .supabase-password 文件并存入数据库密码"
  fi
  docker exec -it $CONTAINER_ID supabase "$@"
fi