/* ==========================================================================
   Supabase 연결 설정
   --------------------------------------------------------------------------
   여기 담긴 publishable(anon) 키는 브라우저에 노출되는 공개 키입니다.
   실제 접근 제어는 서버의 RLS 정책(songsan_profiles / songsan_orders)이 담당합니다.
   service_role 키는 절대 이 파일에 넣지 마십시오.
   ========================================================================== */
window.SONGSAN = window.SONGSAN || {};
window.SONGSAN.supabase = {
  url: 'https://upivpeglioedgitufzwj.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaXZwZWdsaW9lZGdpdHVmendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDYwMTAsImV4cCI6MjEwNTQyMjAxMH0.Ni50TKpB0FkBdPkvP9ZwOw4SSjKTNomB3i37Bk88gtg'
};
