"""
添加video表的product_category字段的迁移脚本
"""
from database import engine
from sqlalchemy import text

def add_product_category_column():
    """给videos表添加product_category字段"""
    try:
        with engine.connect() as conn:
            # 检查字段是否已存在
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='videos' AND column_name='product_category'
            """))
            
            if result.fetchone():
                print("✓ product_category 字段已存在，无需添加")
                return True
            
            # 添加字段
            conn.execute(text("""
                ALTER TABLE videos 
                ADD COLUMN product_category VARCHAR(100)
            """))
            conn.commit()
            print("✓ 成功添加 product_category 字段到 videos 表")
            return True
            
    except Exception as e:
        print(f"✗ 添加字段失败: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("视频表添加商品类目字段")
    print("=" * 60)
    add_product_category_column()
