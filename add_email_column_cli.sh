#!/bin/bash
# Supabase CLI를 사용하여 email 컬럼 추가
# 사용 전에 Supabase CLI 설치 필요: npm install -g supabase

# Supabase 프로젝트에 연결 (프로젝트 참조 ID 필요)
# supabase link --project-ref nqwjvrznwzmfytjlpfsk

# SQL 실행
supabase db execute "ALTER TABLE peers ADD COLUMN IF NOT EXISTS email TEXT;"

