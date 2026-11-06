/* Настройки облака WordFlow (Supabase).
   Впишите сюда адрес проекта и публичный ключ (anon / publishable) из Supabase:
   Project Settings → API (или Data API) → Project URL и anon public key.
   Этот ключ публичный, его можно хранить в открытом репозитории — данные защищены правилами доступа (RLS)
   из файла supabase.sql: каждый пользователь видит только свои данные.
   Если оставить пустыми — адрес и ключ можно ввести в самом приложении: «Ещё» → «Свои слова и синхронизация». */
window.WF_CONFIG = {
  supabaseUrl: 'https://zwriaypdlrdbmueyfvoj.supabase.co',
  supabaseKey: 'sb_publishable__gdZYq_l2tO7rgf1PoyIPg_TqLOqnI1'
};
