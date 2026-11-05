/* WordFlow — уроки «Предложения»: как строится английское предложение.
   Разметка предложения: [Р:текст] — часть предложения с ролью Р (см. roles),
   [Р*:текст] — часть, которую прячем в упражнении «Пропуск»; варианты-ловушки — 4-й элемент.
   Формат строки: [разметка, перевод RU, перевод UA, [ловушки для пропуска], [другие верные варианты перевода]] */
window.WF_SENT = {
  roles: {
    S: ['Подлежащее', 'Підмет', 'кто? что? — тот, кто действует', '#3b82f6'],
    X: ['Вспомогательный', 'Допоміжне', 'служебное слово: do, does, is, will, have…', '#8b5cf6'],
    N: ['Отрицание', 'Заперечення', 'not / never — делает предложение отрицательным', '#ef4444'],
    V: ['Сказуемое', 'Присудок', 'что делает? — главный глагол', '#10b981'],
    O: ['Дополнение', 'Додаток', 'кого? что? кому? — на что направлено действие', '#f59e0b'],
    A: ['Описание', 'Опис', 'какой? кто такой? — признак после глагола', '#f97316'],
    P: ['Место', 'Місце', 'где? куда? откуда?', '#14b8a6'],
    T: ['Время', 'Час', 'когда? как часто? как долго?', '#0ea5e9'],
    M: ['Обстоятельство', 'Обставина', 'как? с кем? зачем? почему?', '#ec4899'],
    Q: ['Вопрос. слово', 'Пит. слово', 'what, where, why, how…', '#e11d48'],
    C: ['Связка', 'Сполучник', 'and, but, because, if, who, that…', '#64748b']
  },
  lessons: [
  /* ======================= A1 ======================= */
  {
    id: 'a1-be', level: 'A1', title: 'Глагол to be: am / is / are', sub: '«Я — менеджер», «Она дома»',
    formula: ['[S] + am / is / are + [кто? какой? где?]'],
    explain: [
      'В русском мы говорим «Я менеджер», «Она дома» — без глагола. В английском глагол <b>обязателен</b>, и в таких предложениях его роль играет <b>to be</b> («быть, являться, находиться»).',
      '<b>I am</b> · <b>he / she / it is</b> · <b>we / you / they are</b>. В речи сокращают: I\'m, she\'s, they\'re.',
      'Порядок всегда одинаковый: сначала <b>кто</b> (подлежащее), потом <b>am/is/are</b>, потом <b>кто такой / какой / где</b>.'
    ],
    s: [
      ['[S:I] [V*:am] [A:a manager].', 'Я менеджер.', 'Я менеджер.', ['is', 'are'], ["i'm a manager"]],
      ['[S:She] [V*:is] [P:at home].', 'Она дома.', 'Вона вдома.', ['am', 'are'], ["she's at home"]],
      ['[S:They] [V*:are] [A:very tired] [T:today].', 'Они сегодня очень устали.', 'Вони сьогодні дуже втомлені.', ['is', 'am'], ["they're very tired today", 'today they are very tired']],
      ['[S:My brother] [V*:is] [A:a bartender].', 'Мой брат — бармен.', 'Мій брат — бармен.', ['are', 'am']],
      ['[S:The office] [V*:is] [P:in the city centre].', 'Офис находится в центре города.', 'Офіс знаходиться в центрі міста.', ['are', 'be'], ['the office is in the city center']],
      ['[S:We] [V*:are] [A:ready].', 'Мы готовы.', 'Ми готові.', ['is', 'be'], ["we're ready"]],
      ['[S:It] [V*:is] [A:cold] [T:in winter].', 'Зимой холодно.', 'Взимку холодно.', ['are', 'am'], ["it's cold in winter", 'in winter it is cold']]
    ]
  },
  {
    id: 'a1-be-q', level: 'A1', title: 'to be: отрицание и вопрос', sub: '«Я не устал», «Ты готов?»',
    formula: ['Отрицание: [S] + am / is / are + [N:not] + …', 'Вопрос: Am / Is / Are + [S] + …?'],
    explain: [
      'Чтобы сказать «не», ставим <b>not</b> сразу после am / is / are: <i>I am not tired</i>. Сокращения: isn\'t, aren\'t (но I\'m not).',
      'Чтобы задать вопрос, <b>меняем местами</b> подлежащее и am / is / are: <i>You are ready → Are you ready?</i> Никаких do/does здесь не нужно.',
      'Вопросительное слово (where, who, how) ставится в самое начало: <i>Where is the bank?</i>'
    ],
    s: [
      ['[S:I] [V:am] [N*:not] [A:tired].', 'Я не устал.', 'Я не втомився.', ['no', "don't"], ["i'm not tired"]],
      ['[V*:Are] [S:you] [A:ready]?', 'Ты готов?', 'Ти готовий?', ['Is', 'Do'], ['are you ready']],
      ['[V*:Is] [S:he] [P:at work] [T:now]?', 'Он сейчас на работе?', 'Він зараз на роботі?', ['Are', 'Does']],
      ['[S:The shop] [V:is] [N*:not] [A:open] [T:on Sunday].', 'Магазин не работает в воскресенье.', 'Магазин не працює в неділю.', ['no', "doesn't"], ["the shop isn't open on sunday"]],
      ['[Q:Where] [V*:is] [S:the bank]?', 'Где банк?', 'Де банк?', ['are', 'does'], ["where's the bank"]],
      ['[S:We] [V:are] [N:not] [A*:late].', 'Мы не опаздываем.', 'Ми не запізнюємося.', ['lately', 'later'], ["we aren't late", "we're not late"]],
      ['[Q:How old] [V*:are] [S:you]?', 'Сколько тебе лет?', 'Скільки тобі років?', ['is', 'do']]
    ]
  },
  {
    id: 'a1-ps', level: 'A1', title: 'Present Simple: обычные действия', sub: '«Я работаю в офисе каждый день»',
    formula: ['[S] + [V] (+s для he / she / it) + [O] + [P] + [T]'],
    explain: [
      'Present Simple — для того, что происходит <b>регулярно, всегда, обычно</b>: работа, привычки, факты.',
      'Главное правило: после <b>he / she / it</b> (и одного человека: my boss, Anna) к глаголу добавляется <b>-s</b>: <i>I work → she works</i>, <i>go → goes</i>, <i>study → studies</i>.',
      'Порядок слов жёсткий: <b>кто → что делает → что/кого → где → когда</b>. Время (every day, on Monday) обычно ставят в конец.'
    ],
    s: [
      ['[S:I] [V*:work] [P:in an office] [T:every day].', 'Я работаю в офисе каждый день.', 'Я працюю в офісі щодня.', ['works', 'working']],
      ['[S:She] [V*:drinks] [O:coffee] [T:in the morning].', 'Она пьёт кофе по утрам.', 'Вона п\'є каву вранці.', ['drink', 'drinking']],
      ['[S:My boss] [V*:starts] [O:work] [T:at nine].', 'Мой начальник начинает работу в девять.', 'Мій начальник починає роботу о дев\'ятій.', ['start', 'starting']],
      ['[S:We] [V*:speak] [O:English] [P:at work].', 'Мы говорим по-английски на работе.', 'Ми розмовляємо англійською на роботі.', ['speaks', 'speaking']],
      ['[S:He] [V*:goes] [P:to the gym] [T:twice a week].', 'Он ходит в спортзал два раза в неделю.', 'Він ходить у спортзал двічі на тиждень.', ['go', 'gos']],
      ['[S:My parents] [V*:live] [P:in Dnipro].', 'Мои родители живут в Днепре.', 'Мої батьки живуть у Дніпрі.', ['lives', 'living']],
      ['[S:The bus] [V*:leaves] [T:at 8:15].', 'Автобус отправляется в 8:15.', 'Автобус вирушає о 8:15.', ['leave', 'leaving']]
    ]
  },
  {
    id: 'a1-ps-q', level: 'A1', title: 'Present Simple: do / does', sub: '«Я не курю», «Ты говоришь по-английски?»',
    formula: ['Отрицание: [S] + do not / does not + [V] …', 'Вопрос: Do / Does + [S] + [V] …?'],
    explain: [
      'В отрицании и вопросе Present Simple появляется <b>помощник</b>: <b>do</b> (I, you, we, they) или <b>does</b> (he, she, it).',
      'Важно: если есть <b>does</b>, окончание -s у глагола <b>пропадает</b> — оно «переехало» в does: <i>She works → She doesn\'t work → Does she work?</i>',
      'Сокращения: do not = <b>don\'t</b>, does not = <b>doesn\'t</b>.'
    ],
    s: [
      ['[S:I] [X*:do] [N:not] [V:smoke].', 'Я не курю.', 'Я не палю.', ['am', 'does'], ["i don't smoke"]],
      ['[X*:Do] [S:you] [V:speak] [O:English]?', 'Ты говоришь по-английски?', 'Ти розмовляєш англійською?', ['Are', 'Does']],
      ['[S:She] [X*:does] [N:not] [V:eat] [O:meat].', 'Она не ест мясо.', 'Вона не їсть м\'ясо.', ['do', 'is'], ["she doesn't eat meat"]],
      ['[X*:Does] [S:he] [V:work] [T:on Saturday]?', 'Он работает в субботу?', 'Він працює в суботу?', ['Do', 'Is']],
      ['[S:We] [X:do] [N:not] [V*:have] [O:a car].', 'У нас нет машины.', 'У нас немає машини.', ['has', 'having'], ["we don't have a car"]],
      ['[Q:Where] [X*:do] [S:you] [V:live]?', 'Где ты живёшь?', 'Де ти живеш?', ['does', 'are']],
      ['[Q:What time] [X*:does] [S:the shop] [V:open]?', 'Во сколько открывается магазин?', 'О котрій відкривається магазин?', ['do', 'is']]
    ]
  },
  {
    id: 'a1-there', level: 'A1', title: 'There is / There are', sub: '«В комнате есть стол»',
    formula: ['There is + один предмет + [P]', 'There are + много предметов + [P]'],
    explain: [
      'Когда мы сообщаем, что <b>что-то где-то есть / находится</b>, англичане начинают с <b>There is / There are</b>, а место ставят в конец.',
      'Русская фраза «В комнате есть стол» по-английски строится «задом наперёд»: <i>There is a table in the room</i>.',
      'Вопрос: <b>Is there…? / Are there…?</b> Отрицание: <b>There isn\'t / There aren\'t</b>. Часто с any: <i>There aren\'t any chairs.</i>'
    ],
    s: [
      ['[S:There] [V*:is] [O:a table] [P:in the room].', 'В комнате есть стол.', 'У кімнаті є стіл.', ['are', 'have'], ["there's a table in the room"]],
      ['[S:There] [V*:are] [O:two banks] [P:near my house].', 'Рядом с моим домом два банка.', 'Біля мого будинку два банки.', ['is', 'has']],
      ['[V*:Is] [S:there] [O:a pharmacy] [P:here]?', 'Здесь есть аптека?', 'Тут є аптека?', ['Are', 'Has']],
      ['[S:There] [V:are] [N*:not] [O:any chairs] [P:in the kitchen].', 'На кухне нет стульев.', 'На кухні немає стільців.', ['no', "don't"], ["there aren't any chairs in the kitchen"]],
      ['[S:There] [V*:is] [O:some milk] [P:in the fridge].', 'В холодильнике есть молоко.', 'У холодильнику є молоко.', ['are', 'be'], ["there's some milk in the fridge", 'there is milk in the fridge']],
      ['[V*:Are] [S:there] [O:any questions]?', 'Есть вопросы?', 'Є питання?', ['Is', 'Do']]
    ]
  },
  {
    id: 'a1-can', level: 'A1', title: 'Can: умею, могу, можно', sub: '«Я умею плавать», «Можно войти?»',
    formula: ['[S] + can + [V] (без to и без -s)', 'Вопрос: Can + [S] + [V]?   Отрицание: can\'t / cannot'],
    explain: [
      '<b>Can</b> выражает умение (умею), возможность (могу) и разрешение (можно).',
      'После can глагол идёт в <b>чистом виде</b>: без to и без -s даже после he/she: <i>She can drive</i> (не can drives, не can to drive).',
      'Can сам себе помощник: вопрос — <i>Can you help me?</i>, отрицание — <i>I can\'t swim</i>.'
    ],
    s: [
      ['[S:I] [X:can] [V*:swim].', 'Я умею плавать.', 'Я вмію плавати.', ['to swim', 'swims']],
      ['[S:She] [X:can] [V*:drive] [O:a car].', 'Она умеет водить машину.', 'Вона вміє водити машину.', ['drives', 'to drive']],
      ['[X*:Can] [S:you] [V:help] [O:me]?', 'Ты можешь мне помочь?', 'Ти можеш мені допомогти?', ['Do', 'Are']],
      ['[S:I] [X*:can\'t] [V:find] [O:my keys].', 'Я не могу найти свои ключи.', 'Я не можу знайти свої ключі.', ["don't", "am not"], ['i cannot find my keys']],
      ['[X:Can] [S:I] [V*:come] [P:in]?', 'Можно войти?', 'Можна увійти?', ['coming', 'to come']],
      ['[S:We] [X:can] [V:meet] [T*:tomorrow].', 'Мы можем встретиться завтра.', 'Ми можемо зустрітися завтра.', ['yesterday', 'ago']]
    ]
  },
  {
    id: 'a1-pc', level: 'A1', title: 'Present Continuous: прямо сейчас', sub: '«Я сейчас работаю»',
    formula: ['[S] + am / is / are + [V]-ing', 'Вопрос: Am / Is / Are + [S] + [V]-ing?'],
    explain: [
      'Present Continuous — для того, что происходит <b>в этот момент</b> или в этот период: now, at the moment, today, this week.',
      'Собирается из двух частей: <b>am / is / are</b> + глагол с окончанием <b>-ing</b>. Без am/is/are нельзя: <i>I working</i> — ошибка.',
      'Сравните: <i>I work in a bank</i> (вообще, всегда) и <i>I am working now</i> (именно сейчас).'
    ],
    s: [
      ['[S:I] [X:am] [V*:working] [T:now].', 'Я сейчас работаю.', 'Я зараз працюю.', ['work', 'works'], ["i'm working now"]],
      ['[S:She] [X*:is] [V:talking] [M:on the phone].', 'Она разговаривает по телефону.', 'Вона розмовляє по телефону.', ['are', 'does'], ["she's talking on the phone"]],
      ['[S:They] [X:are] [V*:waiting] [P:for you].', 'Они ждут тебя.', 'Вони чекають на тебе.', ['wait', 'waits'], ["they're waiting for you"]],
      ['[Q:What] [X*:are] [S:you] [V:doing]?', 'Что ты делаешь?', 'Що ти робиш?', ['do', 'is']],
      ['[S:It] [X:is] [V*:raining] [P:outside].', 'На улице идёт дождь.', 'Надворі йде дощ.', ['rains', 'rain'], ["it's raining outside"]],
      ['[S:We] [X:are] [N:not] [V*:watching] [O:TV].', 'Мы не смотрим телевизор.', 'Ми не дивимося телевізор.', ['watch', 'watches'], ["we aren't watching tv", "we're not watching tv"]],
      ['[X*:Is] [S:he] [V:sleeping]?', 'Он спит?', 'Він спить?', ['Does', 'Are']]
    ]
  },
  {
    id: 'a1-order', level: 'A1', title: 'Порядок слов: где и когда', sub: 'кто → что делает → что → где → когда',
    formula: ['[S] → [V] → [O] → [M] → [P] → [T]'],
    explain: [
      'В русском можно сказать «Вчера я в магазине купил хлеб» в любом порядке. В английском порядок <b>почти фиксирован</b>, иначе смысл теряется.',
      'Запомните схему: <b>кто → что делает → что → как → где → когда</b>. «Место раньше времени»: <i>at work every day</i>, а не every day at work.',
      'Время можно вынести в начало предложения для акцента: <i>Yesterday I bought bread.</i> Но между глаголом и дополнением ничего не ставим: <i>I like very much coffee</i> — ошибка, правильно <i>I like coffee very much</i>.'
    ],
    s: [
      ['[S:I] [V:bought] [O:bread] [P:at the shop] [T*:yesterday].', 'Вчера я купил хлеб в магазине.', 'Вчора я купив хліб у магазині.', ['tomorrow', 'now'], ['yesterday i bought bread at the shop']],
      ['[S:She] [V:likes] [O:coffee] [M*:very much].', 'Она очень любит кофе.', 'Вона дуже любить каву.', ['very', 'much very']],
      ['[S:We] [V:meet] [O:clients] [P:in the office] [T:on Mondays].', 'По понедельникам мы встречаем клиентов в офисе.', 'По понеділках ми зустрічаємо клієнтів в офісі.', [], ['on mondays we meet clients in the office']],
      ['[S:He] [V:speaks] [O:English] [M*:well].', 'Он хорошо говорит по-английски.', 'Він добре розмовляє англійською.', ['good', 'nice']],
      ['[S:My friend] [V:called] [O:me] [T:last night].', 'Мой друг позвонил мне вчера вечером.', 'Мій друг подзвонив мені вчора ввечері.', [], ['last night my friend called me']],
      ['[S:I] [V:go] [P:to work] [M:by bus] [T:every day].', 'Я каждый день езжу на работу на автобусе.', 'Я щодня їжджу на роботу автобусом.', []]
    ]
  },
  {
    id: 'a1-have', level: 'A1', title: 'Have / has: у меня есть', sub: '«У меня есть машина»',
    formula: ['[S] + have / has + [O]', 'he / she / it → has'],
    explain: [
      'Русское «<b>у меня есть</b>» по-английски звучит как «<b>я имею</b>»: <i>I have a car</i>. Подлежащим становится владелец.',
      'После he / she / it — <b>has</b>: <i>She has two children</i>.',
      'Отрицание и вопрос — через do / does (как в Present Simple): <i>I don\'t have time. Do you have a pen?</i> Также have используют в выражениях: have breakfast (завтракать), have a shower (принимать душ).'
    ],
    s: [
      ['[S:I] [V*:have] [O:a new phone].', 'У меня новый телефон.', 'У мене новий телефон.', ['has', 'am']],
      ['[S:She] [V*:has] [O:two children].', 'У неё двое детей.', 'У неї двоє дітей.', ['have', 'is']],
      ['[S:We] [X:do] [N:not] [V*:have] [O:time] [T:today].', 'Сегодня у нас нет времени.', 'Сьогодні в нас немає часу.', ['has', 'are'], ["we don't have time today"]],
      ['[X*:Do] [S:you] [V:have] [O:a pen]?', 'У тебя есть ручка?', 'У тебе є ручка?', ['Are', 'Have']],
      ['[S:He] [V*:has] [O:breakfast] [T:at seven].', 'Он завтракает в семь.', 'Він снідає о сьомій.', ['have', 'eats']],
      ['[S:My flat] [V*:has] [O:one room].', 'В моей квартире одна комната.', 'У моїй квартирі одна кімната.', ['have', 'is']]
    ]
  },

  /* ======================= A2 ======================= */
  {
    id: 'a2-past', level: 'A2', title: 'Past Simple: что было', sub: '«Вчера я работал допоздна»',
    formula: ['[S] + [V]-ed (или 2-я форма неправильного глагола)'],
    explain: [
      'Past Simple — законченное действие в прошлом, часто со словами <b>yesterday, last week, ago, in 2020</b>.',
      'Правильные глаголы получают <b>-ed</b>: work → worked, call → called, stop → stopped. Неправильные надо запомнить: go → <b>went</b>, buy → <b>bought</b>, see → <b>saw</b>, have → <b>had</b>.',
      'Форма одна для всех лиц: <i>I worked, she worked, they worked</i> — никаких -s.'
    ],
    s: [
      ['[S:I] [V*:worked] [M:late] [T:yesterday].', 'Вчера я работал допоздна.', 'Вчора я працював допізна.', ['work', 'works'], ['yesterday i worked late']],
      ['[S:We] [V*:went] [P:to the sea] [T:last summer].', 'Прошлым летом мы ездили на море.', 'Минулого літа ми їздили на море.', ['goed', 'go'], ['last summer we went to the sea']],
      ['[S:She] [V*:bought] [O:a new dress].', 'Она купила новое платье.', 'Вона купила нову сукню.', ['buyed', 'buys']],
      ['[S:They] [V*:moved] [P:to Kyiv] [T:two years ago].', 'Они переехали в Киев два года назад.', 'Вони переїхали до Києва два роки тому.', ['move', 'moving']],
      ['[S:I] [V*:saw] [O:your brother] [P:in the street].', 'Я видел твоего брата на улице.', 'Я бачив твого брата на вулиці.', ['seed', 'see']],
      ['[S:The meeting] [V*:finished] [T:at five].', 'Встреча закончилась в пять.', 'Зустріч закінчилася о п\'ятій.', ['finish', 'finishes']],
      ['[S:He] [V*:had] [O:a headache] [T:this morning].', 'Утром у него болела голова.', 'Зранку в нього боліла голова.', ['haved', 'has']]
    ]
  },
  {
    id: 'a2-past-q', level: 'A2', title: 'Past Simple: did / didn\'t', sub: '«Ты звонил ему?» — «Нет, не звонил»',
    formula: ['Отрицание: [S] + did not + [V]', 'Вопрос: Did + [S] + [V]…?'],
    explain: [
      'В прошлом помощник один для всех — <b>did</b>.',
      'Как и с does, если есть did, глагол возвращается в <b>начальную форму</b>: <i>I went → I didn\'t go → Did you go?</i> (не didn\'t went).',
      'С to be помощник не нужен: <i>I was tired → I wasn\'t tired → Were you tired?</i>'
    ],
    s: [
      ['[X*:Did] [S:you] [V:call] [O:him]?', 'Ты звонил ему?', 'Ти дзвонив йому?', ['Do', 'Were']],
      ['[S:I] [X:did] [N:not] [V*:go] [P:to work] [T:yesterday].', 'Вчера я не ходил на работу.', 'Вчора я не ходив на роботу.', ['went', 'going'], ["i didn't go to work yesterday", "yesterday i didn't go to work"]],
      ['[S:She] [X*:didn\'t] [V:understand] [O:the question].', 'Она не поняла вопрос.', 'Вона не зрозуміла питання.', ["doesn't", "wasn't"], ['she did not understand the question']],
      ['[Q:Where] [X*:did] [S:you] [V:buy] [O:it]?', 'Где ты это купил?', 'Де ти це купив?', ['do', 'were']],
      ['[S:We] [V*:were] [N:not] [P:at home] [T:last night].', 'Вчера вечером нас не было дома.', 'Вчора ввечері нас не було вдома.', ['did', 'was'], ["we weren't at home last night"]],
      ['[Q:What] [X:did] [S:he] [V*:say]?', 'Что он сказал?', 'Що він сказав?', ['said', 'says']],
      ['[V*:Was] [S:the film] [A:interesting]?', 'Фильм был интересный?', 'Фільм був цікавий?', ['Did', 'Were']]
    ]
  },
  {
    id: 'a2-will', level: 'A2', title: 'Будущее: will', sub: '«Я помогу», «Завтра будет дождь»',
    formula: ['[S] + will + [V]', 'Отрицание: won\'t (will not) · Вопрос: Will + [S] + [V]?'],
    explain: [
      '<b>Will</b> — для решений «прямо сейчас» (<i>I\'ll help you</i>), обещаний, предсказаний (<i>It will rain</i>) и фактов о будущем.',
      'После will глагол в чистом виде — для всех лиц одинаково: <i>she will come</i>.',
      'Сокращения: I\'ll, you\'ll, she\'ll; will not = <b>won\'t</b>.'
    ],
    s: [
      ['[S:I] [X*:will] [V:help] [O:you].', 'Я тебе помогу.', 'Я тобі допоможу.', ['am', 'do'], ["i'll help you"]],
      ['[S:It] [X:will] [V*:rain] [T:tomorrow].', 'Завтра будет дождь.', 'Завтра буде дощ.', ['rains', 'raining'], ["it'll rain tomorrow", 'tomorrow it will rain']],
      ['[S:She] [X:will] [V*:call] [O:you] [T:later].', 'Она позвонит тебе позже.', 'Вона подзвонить тобі пізніше.', ['calls', 'to call'], ["she'll call you later"]],
      ['[S:I] [X*:won\'t] [V:be] [A:late].', 'Я не опоздаю.', 'Я не запізнюся.', ["don't", "am not"], ['i will not be late']],
      ['[X*:Will] [S:you] [V:be] [P:at home] [T:tonight]?', 'Ты будешь дома сегодня вечером?', 'Ти будеш вдома сьогодні ввечері?', ['Do', 'Are']],
      ['[S:Prices] [X:will] [V*:go] [P:up] [T:next year].', 'В следующем году цены вырастут.', 'Наступного року ціни зростуть.', ['goes', 'went']]
    ]
  },
  {
    id: 'a2-going', level: 'A2', title: 'Планы: be going to', sub: '«Я собираюсь купить машину»',
    formula: ['[S] + am / is / are + going to + [V]'],
    explain: [
      '<b>Going to</b> — когда решение уже <b>принято заранее</b>: план, намерение. «Я собираюсь…».',
      'Сравните: <i>The phone is ringing. — I\'ll answer it!</i> (решил сейчас) и <i>I\'m going to buy a car next year</i> (план давно).',
      'Ещё going to используют, когда будущее видно по признакам: <i>Look at the clouds — it\'s going to rain.</i>'
    ],
    s: [
      ['[S:I] [X:am] [V*:going to buy] [O:a car] [T:next year].', 'В следующем году я собираюсь купить машину.', 'Наступного року я збираюся купити машину.', ['going buy', 'go to buy'], ["i'm going to buy a car next year"]],
      ['[S:We] [X*:are] [V:going to visit] [O:my parents] [T:on Sunday].', 'В воскресенье мы собираемся навестить моих родителей.', 'У неділю ми збираємося відвідати моїх батьків.', ['is', 'will'], ["we're going to visit my parents on sunday"]],
      ['[S:She] [X:is] [N:not] [V*:going to stay] [P:here].', 'Она не собирается здесь оставаться.', 'Вона не збирається тут залишатися.', ['going stay', 'go to stay'], ["she isn't going to stay here", "she's not going to stay here"]],
      ['[Q:What] [X*:are] [S:you] [V:going to do] [T:tonight]?', 'Что ты собираешься делать сегодня вечером?', 'Що ти збираєшся робити сьогодні ввечері?', ['do', 'will']],
      ['[S:It] [X:is] [V*:going to rain].', 'Сейчас пойдёт дождь.', 'Зараз піде дощ.', ['will to rain', 'going rain'], ["it's going to rain"]],
      ['[S:He] [X:is] [V:going to learn] [O*:English] [M:for his new job].', 'Он собирается учить английский для новой работы.', 'Він збирається вчити англійську для нової роботи.', ['England', 'British'], ["he's going to learn english for his new job"]]
    ]
  },
  {
    id: 'a2-compare', level: 'A2', title: 'Сравнение: bigger, more expensive', sub: '«Этот телефон дороже»',
    formula: ['короткое: [A]-er + than · самое: the [A]-est', 'длинное: more [A] + than · самое: the most [A]'],
    explain: [
      'Короткие прилагательные (1 слог и на -y): <b>-er / -est</b>: cheap → cheaper → the cheapest, easy → easier → the easiest.',
      'Длинные (2+ слога): <b>more / the most</b>: expensive → more expensive → the most expensive.',
      'Исключения: good → <b>better</b> → the best, bad → <b>worse</b> → the worst. «Чем» = <b>than</b>.'
    ],
    s: [
      ['[S:This phone] [V:is] [A*:more expensive] [M:than mine].', 'Этот телефон дороже моего.', 'Цей телефон дорожчий за мій.', ['expensiver', 'most expensive']],
      ['[S:My flat] [V:is] [A*:smaller] [M:than yours].', 'Моя квартира меньше твоей.', 'Моя квартира менша за твою.', ['more small', 'smallest']],
      ['[S:Today] [V:is] [A*:the hottest day] [T:of the year].', 'Сегодня самый жаркий день в году.', 'Сьогодні найспекотніший день року.', ['the most hot day', 'the hotter day']],
      ['[S:Your English] [V:is] [A*:better] [M:than mine].', 'Твой английский лучше моего.', 'Твоя англійська краща за мою.', ['gooder', 'more good']],
      ['[S:The train] [V:is] [A:faster] [M*:than] [O:the bus].', 'Поезд быстрее автобуса.', 'Потяг швидший за автобус.', ['then', 'that']],
      ['[S:This] [V:is] [A*:the most interesting book] [M:I have read].', 'Это самая интересная книга, которую я читал.', 'Це найцікавіша книжка, яку я читав.', ['the interestingest book', 'the more interesting book']]
    ]
  },
  {
    id: 'a2-wh', level: 'A2', title: 'Вопросы: what, where, why, how', sub: '«Почему ты опоздал?»',
    formula: ['[Q] + вспомогательный + [S] + [V] …?', 'Who / What как подлежащее: [Q] + [V] …? (без do)'],
    explain: [
      'Схема вопроса: <b>вопросительное слово → помощник (do/does/did/is/are/will/can) → подлежащее → глагол</b>. Помощник выбираем по времени.',
      'Главные слова: what (что), where (где), when (когда), why (почему), how (как), who (кто), which (который), how much / how many (сколько).',
      'Особый случай: если спрашиваем <b>о подлежащем</b> (кто? что?), помощник не нужен: <i>Who called you?</i> (Кто тебе звонил?), а не Who did call you.'
    ],
    s: [
      ['[Q:Why] [X*:were] [S:you] [A:late]?', 'Почему ты опоздал?', 'Чому ти запізнився?', ['did', 'do']],
      ['[Q:How much] [X*:does] [S:it] [V:cost]?', 'Сколько это стоит?', 'Скільки це коштує?', ['do', 'is']],
      ['[Q:When] [X:did] [S:you] [V*:start] [O:this job]?', 'Когда ты начал эту работу?', 'Коли ти почав цю роботу?', ['started', 'starts']],
      ['[Q*:Who] [V:called] [O:you]?', 'Кто тебе звонил?', 'Хто тобі дзвонив?', ['Whom', 'What']],
      ['[Q:How] [X*:do] [S:you] [V:get] [P:to work]?', 'Как ты добираешься на работу?', 'Як ти добираєшся на роботу?', ['are', 'does']],
      ['[Q*:Which] [O:bus] [V:goes] [P:to the centre]?', 'Какой автобус идёт в центр?', 'Який автобус їде в центр?', ['Who', 'Where'], ['which bus goes to the center']],
      ['[Q:How many] [O:people] [X:will] [V*:come]?', 'Сколько человек придёт?', 'Скільки людей прийде?', ['comes', 'came']]
    ]
  },
  {
    id: 'a2-must', level: 'A2', title: 'Must, have to, should', sub: '«Ты должен», «Тебе стоит»',
    formula: ['[S] + must / should + [V]', '[S] + have to / has to + [V]'],
    explain: [
      '<b>Must</b> — сильное «должен», часто правило или личное убеждение: <i>You must wear a seatbelt.</i>',
      '<b>Have to</b> — «приходится», обязанность из-за обстоятельств: <i>I have to work on Saturday.</i> В прошлом — <b>had to</b>.',
      '<b>Should</b> — мягкий совет «стоит, следует»: <i>You should see a doctor.</i> Важно: <b>don\'t have to</b> = «не обязательно», а <b>mustn\'t</b> = «нельзя».'
    ],
    s: [
      ['[S:You] [X*:should] [V:see] [O:a doctor].', 'Тебе стоит сходить к врачу.', 'Тобі варто піти до лікаря.', ['must to', 'have']],
      ['[S:I] [X:have to] [V*:work] [T:on Saturday].', 'Мне приходится работать в субботу.', 'Мені доводиться працювати в суботу.', ['working', 'works']],
      ['[S:You] [X*:must] [V:wear] [O:a seatbelt].', 'Ты должен пристегнуться.', 'Ти мусиш пристебнутися.', ['must to', 'should to']],
      ['[S:She] [X*:has to] [V:get up] [T:at six].', 'Ей приходится вставать в шесть.', 'Їй доводиться вставати о шостій.', ['have to', 'must to']],
      ['[S:You] [X:do] [N:not] [X*:have to] [V:come] [T:tomorrow].', 'Завтра тебе не обязательно приходить.', 'Завтра тобі не обов\'язково приходити.', ['must', 'should'], ["you don't have to come tomorrow"]],
      ['[S:We] [X*:had to] [V:wait] [M:for an hour].', 'Нам пришлось ждать час.', 'Нам довелося чекати годину.', ['have to', 'must']],
      ['[S:You] [X*:mustn\'t] [V:smoke] [P:here].', 'Здесь нельзя курить.', 'Тут не можна палити.', ["don't have to", "shouldn't to"], ['you must not smoke here']]
    ]
  },
  {
    id: 'a2-pp', level: 'A2', title: 'Present Perfect: опыт и результат', sub: '«Я уже поел», «Я был в Лондоне»',
    formula: ['[S] + have / has + [V] 3-я форма (-ed / done, seen, been…)'],
    explain: [
      'Present Perfect связывает прошлое с <b>настоящим</b>: важен результат или опыт, а не момент. «Я уже поел» (сейчас я сыт), «Я был в Лондоне» (у меня есть такой опыт).',
      'Строится: <b>have / has + 3-я форма</b>: work → worked, do → <b>done</b>, see → <b>seen</b>, be → <b>been</b>, eat → <b>eaten</b>.',
      'Типичные слова: <b>already</b> (уже), <b>just</b> (только что), <b>yet</b> (ещё / уже — в вопросах и отрицаниях), <b>ever</b> (когда-либо), <b>never</b> (никогда).'
    ],
    s: [
      ['[S:I] [X:have] [T:already] [V*:eaten].', 'Я уже поел.', 'Я вже поїв.', ['ate', 'eat'], ["i've already eaten"]],
      ['[S:She] [X*:has] [V:been] [P:to London] [T:twice].', 'Она была в Лондоне дважды.', 'Вона була в Лондоні двічі.', ['have', 'is'], ["she's been to london twice"]],
      ['[X*:Have] [S:you] [T:ever] [V:seen] [O:snow]?', 'Ты когда-нибудь видел снег?', 'Ти колись бачив сніг?', ['Did', 'Has']],
      ['[S:I] [X:have] [T:just] [V*:finished] [O:the report].', 'Я только что закончил отчёт.', 'Я щойно закінчив звіт.', ['finish', 'finishing'], ["i've just finished the report"]],
      ['[S:They] [X:have] [N:not] [V*:arrived] [T:yet].', 'Они ещё не приехали.', 'Вони ще не приїхали.', ['arrive', 'arrives'], ["they haven't arrived yet"]],
      ['[S:He] [X:has] [V*:lost] [O:his keys].', 'Он потерял ключи.', 'Він загубив ключі.', ['losed', 'lose'], ["he's lost his keys"]],
      ['[S:We] [X:have] [N*:never] [V:tried] [O:sushi].', 'Мы никогда не пробовали суши.', 'Ми ніколи не куштували суші.', ['ever', 'not ever'], ["we've never tried sushi"]]
    ]
  },

  /* ======================= B1 ======================= */
  {
    id: 'b1-pp-past', level: 'B1', title: 'Present Perfect или Past Simple', sub: '«Я потерял ключи» — когда что',
    formula: ['Есть точное время в прошлом → Past Simple', 'Время не указано / важен результат / «до сих пор» → Present Perfect'],
    explain: [
      'Если в предложении есть <b>законченный момент</b> — yesterday, last year, in 2019, ago, when I was a child — только <b>Past Simple</b>.',
      'Если момент не важен, а важен <b>результат сейчас</b> или период ещё <b>не закончился</b> (today, this week, since, for) — <b>Present Perfect</b>.',
      '<b>for</b> — «в течение» (for two years), <b>since</b> — «с какого-то момента» (since 2020). <i>I have worked here for three years</i> — работаю до сих пор.'
    ],
    s: [
      ['[S:I] [V*:lost] [O:my keys] [T:yesterday].', 'Вчера я потерял ключи.', 'Вчора я загубив ключі.', ['have lost', 'lose']],
      ['[S:I] [X:have] [V*:lost] [O:my keys]. [S:I] [X:can\'t] [V:open] [O:the door].', 'Я потерял ключи. Не могу открыть дверь.', 'Я загубив ключі. Не можу відчинити двері.', ['lose', 'losing'], ["i've lost my keys. i can't open the door"]],
      ['[S:She] [X:has] [V:worked] [P:here] [T*:for three years].', 'Она работает здесь уже три года.', 'Вона працює тут уже три роки.', ['since three years', 'during three years'], ["she's worked here for three years"]],
      ['[S:We] [X:have] [V:known] [O:each other] [T*:since 2015].', 'Мы знакомы с 2015 года.', 'Ми знайомі з 2015 року.', ['for 2015', 'from 2015'], ["we've known each other since 2015"]],
      ['[S:He] [V*:moved] [P:to Poland] [T:in 2022].', 'Он переехал в Польшу в 2022 году.', 'Він переїхав до Польщі у 2022 році.', ['has moved', 'moves']],
      ['[X*:Have] [S:you] [V:finished] [O:the project] [T:yet]?', 'Ты уже закончил проект?', 'Ти вже закінчив проєкт?', ['Did', 'Are']],
      ['[Q:When] [X*:did] [S:you] [V:arrive]?', 'Когда ты приехал?', 'Коли ти приїхав?', ['have', 'has']]
    ]
  },
  {
    id: 'b1-pastcont', level: 'B1', title: 'Past Continuous: процесс в прошлом', sub: '«Я ужинал, когда он позвонил»',
    formula: ['[S] + was / were + [V]-ing', 'длинное действие (was …ing) + when + короткое (Past Simple)'],
    explain: [
      'Past Continuous показывает действие <b>в процессе</b> в какой-то момент прошлого: <i>At 8 pm I was having dinner.</i>',
      'Чаще всего — в паре с Past Simple: длинное действие шло, и его <b>прервало</b> короткое: <i>I was having dinner when he called.</i>',
      '<b>while</b> («пока») обычно стоит перед длинным действием: <i>While I was driving, it started to rain.</i>'
    ],
    s: [
      ['[S:I] [X:was] [V*:having] [O:dinner] [C:when] [S:he] [V:called].', 'Я ужинал, когда он позвонил.', 'Я вечеряв, коли він подзвонив.', ['had', 'have']],
      ['[T:At 8 pm] [S:we] [X*:were] [V:watching] [O:a film].', 'В 8 вечера мы смотрели фильм.', 'О 8 вечора ми дивилися фільм.', ['was', 'are'], ['we were watching a film at 8 pm']],
      ['[C:While] [S:I] [X:was] [V:driving], [S:it] [V*:started] [O:to rain].', 'Пока я ехал, начался дождь.', 'Поки я їхав, почався дощ.', ['was starting', 'starts']],
      ['[S:She] [X:was] [N:not] [V*:listening] [M:to the teacher].', 'Она не слушала учителя.', 'Вона не слухала вчителя.', ['listen', 'listened'], ["she wasn't listening to the teacher"]],
      ['[Q:What] [X*:were] [S:you] [V:doing] [T:at midnight]?', 'Что ты делал в полночь?', 'Що ти робив опівночі?', ['did', 'was']],
      ['[S:The sun] [X:was] [V*:shining] [C:and] [S:birds] [X:were] [V:singing].', 'Светило солнце, и пели птицы.', 'Світило сонце, і співали птахи.', ['shined', 'shines']]
    ]
  },
  {
    id: 'b1-if1', level: 'B1', title: 'Условие 1-го типа: if … will', sub: '«Если пойдёт дождь, мы останемся дома»',
    formula: ['If + [S] + Present Simple, [S] + will + [V]'],
    explain: [
      'Реальное условие в будущем: <b>если</b> что-то случится — будет результат.',
      'Ловушка для русскоговорящих: после <b>if</b> (и when, as soon as, before, until) будущее выражается <b>Present Simple</b>, а не will: <i>If it rains</i> (не if it will rain).',
      'Части можно поменять местами, тогда запятая не нужна: <i>We will stay at home if it rains.</i>'
    ],
    s: [
      ['[C:If] [S:it] [V*:rains], [S:we] [X:will] [V:stay] [P:at home].', 'Если пойдёт дождь, мы останемся дома.', 'Якщо піде дощ, ми залишимося вдома.', ['will rain', 'rained'], ["if it rains, we'll stay at home", 'we will stay at home if it rains']],
      ['[C:If] [S:you] [V:study] [M:every day], [S:you] [X*:will] [V:pass] [O:the exam].', 'Если будешь заниматься каждый день, сдашь экзамен.', 'Якщо займатимешся щодня, складеш іспит.', ['would', 'are'], ["if you study every day, you'll pass the exam"]],
      ['[S:I] [X:will] [V:call] [O:you] [C:when] [S:I] [V*:arrive].', 'Я позвоню тебе, когда приеду.', 'Я подзвоню тобі, коли приїду.', ['will arrive', 'arrived'], ["i'll call you when i arrive"]],
      ['[C:If] [S:she] [X:does] [N:not] [V*:hurry], [S:she] [X:will] [V:miss] [O:the train].', 'Если она не поторопится, то опоздает на поезд.', 'Якщо вона не поквапиться, то запізниться на потяг.', ['hurries', 'will hurry'], ["if she doesn't hurry, she'll miss the train"]],
      ['[S:We] [X:won\'t] [V:start] [C:until] [S:everyone] [V*:comes].', 'Мы не начнём, пока все не придут.', 'Ми не почнемо, поки всі не прийдуть.', ['will come', 'come']],
      ['[Q:What] [X*:will] [S:you] [V:do] [C:if] [S:they] [V:say] [O:no]?', 'Что ты будешь делать, если они откажут?', 'Що ти робитимеш, якщо вони відмовлять?', ['do', 'would']]
    ]
  },
  {
    id: 'b1-if2', level: 'B1', title: 'Условие 2-го типа: if … would', sub: '«Если бы у меня были деньги…»',
    formula: ['If + [S] + Past Simple, [S] + would + [V]'],
    explain: [
      'Нереальное или маловероятное условие в настоящем: «<b>если бы</b>… то бы…».',
      'После if — <b>прошедшее время</b> (хотя речь о сейчас), в главной части — <b>would</b> + глагол: <i>If I had money, I would buy a house.</i>',
      'С to be часто используют <b>were</b> для всех лиц: <i>If I were you…</i> («на твоём месте я бы…»).'
    ],
    s: [
      ['[C:If] [S:I] [V*:had] [O:more money], [S:I] [X:would] [V:buy] [O:a house].', 'Если бы у меня было больше денег, я бы купил дом.', 'Якби в мене було більше грошей, я купив би будинок.', ['have', 'will have'], ["if i had more money, i'd buy a house"]],
      ['[C:If] [S:I] [V:were] [O:you], [S:I] [X*:would] [V:take] [O:this job].', 'На твоём месте я бы взял эту работу.', 'На твоєму місці я взяв би цю роботу.', ['will', 'did'], ["if i were you, i'd take this job"]],
      ['[S:She] [X:would] [V:travel] [M:more] [C:if] [S:she] [V*:had] [O:time].', 'Она бы больше путешествовала, если бы у неё было время.', 'Вона б більше подорожувала, якби мала час.', ['has', 'would have'], ["she'd travel more if she had time"]],
      ['[Q:What] [X*:would] [S:you] [V:do] [C:if] [S:you] [V:won] [O:a million]?', 'Что бы ты сделал, если бы выиграл миллион?', 'Що б ти зробив, якби виграв мільйон?', ['will', 'did']],
      ['[C:If] [S:we] [V:lived] [P:by the sea], [S:we] [X:would] [V*:swim] [T:every day].', 'Если бы мы жили у моря, мы бы плавали каждый день.', 'Якби ми жили біля моря, ми б плавали щодня.', ['swam', 'to swim'], ["if we lived by the sea, we'd swim every day"]],
      ['[S:I] [X:would] [N:not] [V:do] [O:that] [C:if] [S:I] [V*:were] [P:in your place].', 'Я бы так не делал на твоём месте.', 'Я б так не робив на твоєму місці.', ['am', 'will be'], ["i wouldn't do that if i were in your place"]]
    ]
  },
  {
    id: 'b1-passive', level: 'B1', title: 'Пассив: что-то делается', sub: '«Офис убирают каждый день»',
    formula: ['[S] + be (am/is/are/was/were/will be) + [V] 3-я форма (+ by …)'],
    explain: [
      'Пассив нужен, когда <b>важно действие, а не кто его делает</b>: «Офис убирают», «Дом построили в 1990-м».',
      'Строится: нужная форма <b>be</b> + <b>3-я форма</b> глагола: is cleaned, was built, will be sent.',
      'Если всё-таки надо сказать, кем сделано, — <b>by</b>: <i>The book was written by my friend.</i>'
    ],
    s: [
      ['[S:The office] [X*:is] [V:cleaned] [T:every day].', 'Офис убирают каждый день.', 'Офіс прибирають щодня.', ['does', 'has']],
      ['[S:This house] [X:was] [V*:built] [T:in 1990].', 'Этот дом построили в 1990 году.', 'Цей будинок збудували в 1990 році.', ['builded', 'build']],
      ['[S:The documents] [X:will be] [V*:sent] [T:tomorrow].', 'Документы отправят завтра.', 'Документи надішлють завтра.', ['send', 'sended']],
      ['[S:English] [X*:is] [V:spoken] [P:all over the world].', 'На английском говорят по всему миру.', 'Англійською розмовляють у всьому світі.', ['does', 'are']],
      ['[S:The book] [X:was] [V:written] [M*:by my friend].', 'Книгу написал мой друг.', 'Книжку написав мій друг.', ['from my friend', 'of my friend']],
      ['[S:My car] [X:was] [V*:stolen] [T:last night].', 'Вчера ночью у меня угнали машину.', 'Минулої ночі в мене викрали машину.', ['stealed', 'stole']],
      ['[X*:Were] [S:you] [V:invited] [M:to the party]?', 'Тебя пригласили на вечеринку?', 'Тебе запросили на вечірку?', ['Did', 'Was']]
    ]
  },
  {
    id: 'b1-relative', level: 'B1', title: 'Who, which, that: «который»', sub: '«Человек, который мне помог»',
    formula: ['люди: who / that · вещи: which / that · место: where'],
    explain: [
      'Чтобы добавить пояснение к существительному («человек, <b>который</b>…»), используют <b>who</b> (для людей), <b>which</b> (для вещей и животных) или универсальное <b>that</b>.',
      '<b>where</b> — «где / в котором» для мест: <i>the city where I was born</i>. <b>whose</b> — «чей».',
      'Если «который» — не подлежащее, его часто опускают: <i>The film (that) we watched was great.</i>'
    ],
    s: [
      ['[S:The man] [C*:who] [V:helped] [O:me] [V:was] [A:very kind].', 'Человек, который мне помог, был очень добрым.', 'Людина, яка мені допомогла, була дуже доброю.', ['which', 'where'], ['the man that helped me was very kind']],
      ['[S:This] [V:is] [O:the phone] [C*:which] [S:I] [V:bought] [T:yesterday].', 'Это телефон, который я купил вчера.', 'Це телефон, який я купив учора.', ['who', 'where'], ['this is the phone that i bought yesterday', 'this is the phone i bought yesterday']],
      ['[S:Dnipro] [V:is] [O:the city] [C*:where] [S:I] [V:was born].', 'Днепр — город, в котором я родился.', 'Дніпро — місто, в якому я народився.', ['which', 'who']],
      ['[S:I] [V:have] [O:a friend] [C*:whose] [O:brother] [V:is] [A:a pilot].', 'У меня есть друг, брат которого — пилот.', 'У мене є друг, брат якого — пілот.', ['who', 'which']],
      ['[S:The film] [C:that] [S:we] [V:watched] [V:was] [A*:boring].', 'Фильм, который мы смотрели, был скучным.', 'Фільм, який ми дивилися, був нудним.', ['bored', 'boredom'], ['the film we watched was boring', 'the film which we watched was boring']],
      ['[S:People] [C*:who] [V:work] [P:here] [V:are] [A:friendly].', 'Люди, которые здесь работают, дружелюбные.', 'Люди, які тут працюють, привітні.', ['which', 'whose'], ['people that work here are friendly']]
    ]
  },
  {
    id: 'b1-reported', level: 'B1', title: 'Косвенная речь: he said that…', sub: '«Он сказал, что устал»',
    formula: ['said (that) + время сдвигается на шаг назад', 'am/is → was · do → did · will → would · can → could'],
    explain: [
      'Когда пересказываем чужие слова после <b>said / told</b> (прошедшее), время обычно <b>сдвигается в прошлое</b>: «I am tired» → <i>He said that he was tired.</i>',
      'Сдвиги: Present → Past, will → <b>would</b>, can → <b>could</b>, Past / Present Perfect → <b>had + 3-я форма</b>.',
      '<b>say</b> — сказать (без «кому»), <b>tell</b> — сказать кому-то: <i>She told me that…</i> В пересказе вопроса нет вопросительного порядка: <i>He asked where I lived.</i>'
    ],
    s: [
      ['[S:He] [V:said] [C:that] [S:he] [V*:was] [A:tired].', 'Он сказал, что устал.', 'Він сказав, що втомився.', ['is', 'be'], ['he said he was tired']],
      ['[S:She] [V*:told] [O:me] [C:that] [S:she] [X:would] [V:come].', 'Она сказала мне, что придёт.', 'Вона сказала мені, що прийде.', ['said', 'spoke'], ['she told me she would come']],
      ['[S:They] [V:said] [C:that] [S:they] [X*:could] [V:help] [O:us].', 'Они сказали, что могут нам помочь.', 'Вони сказали, що можуть нам допомогти.', ['can', 'will'], ['they said they could help us']],
      ['[S:He] [V:asked] [O:me] [Q:where] [S:I] [V*:lived].', 'Он спросил меня, где я живу.', 'Він запитав мене, де я живу.', ['did live', 'do live']],
      ['[S:My boss] [V:said] [C:that] [S:the report] [X:had] [V*:been] [A:ready] [T:since Monday].', 'Начальник сказал, что отчёт готов с понедельника.', 'Начальник сказав, що звіт готовий з понеділка.', ['was', 'is']],
      ['[S:She] [V:asked] [C*:if] [S:I] [V:wanted] [O:coffee].', 'Она спросила, хочу ли я кофе.', 'Вона запитала, чи хочу я кави.', ['that', 'what'], ['she asked whether i wanted coffee']]
    ]
  },
  {
    id: 'b1-linkers', level: 'B1', title: 'Связки: because, although, so', sub: 'Сложные предложения',
    formula: ['[часть 1] + because / so / but / although + [часть 2]'],
    explain: [
      'Связки соединяют две мысли в одно предложение. <b>because</b> — потому что (причина), <b>so</b> — поэтому (следствие), <b>but</b> — но.',
      '<b>although / though</b> — хотя: <i>Although it was late, we continued.</i> <b>however</b> — однако (обычно в начале нового предложения, с запятой).',
      '<b>in order to / to</b> — чтобы (цель): <i>I study English to get a better job.</i> После because идёт целое предложение с подлежащим и глаголом, а после <b>because of</b> — только существительное.'
    ],
    s: [
      ['[S:I] [V:stayed] [P:at home] [C*:because] [S:I] [V:was] [A:ill].', 'Я остался дома, потому что заболел.', 'Я залишився вдома, бо захворів.', ['so', 'because of']],
      ['[S:It] [V:was] [A:late], [C*:so] [S:we] [V:took] [O:a taxi].', 'Было поздно, поэтому мы взяли такси.', 'Було пізно, тому ми взяли таксі.', ['because', 'although']],
      ['[C*:Although] [S:it] [V:was] [A:cold], [S:we] [V:went] [P:for a walk].', 'Хотя было холодно, мы пошли гулять.', 'Хоча було холодно, ми пішли гуляти.', ['Because', 'So']],
      ['[S:I] [V:study] [O:English] [M*:to get] [O:a better job].', 'Я учу английский, чтобы получить работу получше.', 'Я вчу англійську, щоб отримати кращу роботу.', ['for get', 'for to get'], ['i study english in order to get a better job']],
      ['[S:The flight] [X:was] [V:cancelled] [M*:because of] [O:the storm].', 'Рейс отменили из-за шторма.', 'Рейс скасували через шторм.', ['because', 'so']],
      ['[S:He] [V:is] [A:rich], [C*:but] [S:he] [X:is] [N:not] [A:happy].', 'Он богат, но не счастлив.', 'Він багатий, але не щасливий.', ['so', 'because'], ["he is rich, but he isn't happy", "he's rich but he's not happy"]]
    ]
  }
  ]
};
