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
  key: 'PASTE_PUBLISHABLE_KEY_HERE'   // Supabase → Settings → API Keys → publishable (sb_publishable_...)
};
