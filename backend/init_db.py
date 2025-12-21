#!/usr/bin/env python3
"""
数据库初始化脚本
用于在云服务器上初始化数据库表结构
"""

import sys
from database import test_connection, init_database, engine, Base
from sqlalchemy import inspect

def check_existing_tables():
    """检查已存在的表"""
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    return existing_tables

def main():
    print("="*60)
    print("AIvdeo 数据库初始化脚本")
    print("="*60)
    print()
    
    # 步骤1：测试连接
    print("步骤 1/3: 测试数据库连接...")
    if not test_connection():
        print("\n❌ 数据库连接失败！")
        print("请检查：")
        print("  1. .env 文件中的数据库配置是否正确")
        print("  2. 数据库服务器是否可访问")
        print("  3. 用户名和密码是否正确")
        sys.exit(1)
    
    print("✓ 数据库连接成功！\n")
    
    # 步骤2：检查现有表
    print("步骤 2/3: 检查现有表...")
    existing_tables = check_existing_tables()
    
    if existing_tables:
        print(f"发现 {len(existing_tables)} 个已存在的表：")
        for table in existing_tables:
            print(f"  - {table}")
        print()
        
        response = input("是否要删除现有表并重新创建？(yes/no): ").strip().lower()
        if response == 'yes':
            print("\n⚠️  正在删除现有表...")
            Base.metadata.drop_all(bind=engine)
            print("✓ 已删除所有表\n")
        else:
            print("保留现有表，仅创建缺失的表...\n")
    else:
        print("没有发现已存在的表\n")
    
    # 步骤3：创建表
    print("步骤 3/3: 创建数据库表...")
    if init_database():
        print("\n" + "="*60)
        print("🎉 数据库初始化成功！")
        print("="*60)
        print("\n您现在可以启动后端服务了：")
        print("  python main.py")
        print("  或")
        print("  uvicorn main:app --host 0.0.0.0 --port 8000")
    else:
        print("\n❌ 数据库初始化失败！")
        sys.exit(1)

if __name__ == "__main__":
    main()
