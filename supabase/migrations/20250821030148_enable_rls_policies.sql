-- Migration: 20240821000002_enable_rls_policies.sql

-- Row Level Security有効化
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- レストランのポリシー
CREATE POLICY "Anyone can view restaurants" ON restaurants 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create restaurants" ON restaurants 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update restaurants" ON restaurants 
    FOR UPDATE USING (auth.role() = 'authenticated');

-- お気に入りのポリシー
CREATE POLICY "Users can view own favorites" ON favorites 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites" ON favorites 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites 
    FOR DELETE USING (auth.uid() = user_id);

-- レビューのポリシー
CREATE POLICY "Anyone can view reviews" ON reviews 
    FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON reviews 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews 
    FOR DELETE USING (auth.uid() = user_id);

-- ユーザープロフィールのポリシー
CREATE POLICY "Users can view own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();