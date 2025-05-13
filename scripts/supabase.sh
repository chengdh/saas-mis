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

# 执行Supabase命令
echo "🔄 执行: supabase $@"
docker exec -it $CONTAINER_ID supabase "$@" 