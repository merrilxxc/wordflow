/* WordFlow — тексты для чтения. Абзацы разделяются пустой строкой (\n\n), перевод — построчно по абзацам.
   q: [вопрос, [варианты], индекс верного]; gloss — подсказки к словам, которых нет в общей базе */
window.WF_TEXTS = [
/* ======================= A1 ======================= */
{ id: 'a1-01', level: 'A1', title: 'My Day', ru: 'Мой день', topic: 'work',
  text: `My name is Max. I am thirty years old and I live in Dnipro. I work in an office in the city centre.

I get up at seven o'clock. I have a shower and drink a cup of coffee. I don't eat much in the morning. I go to work by bus. The bus is usually full.

I start work at nine. I talk to people on the phone and write emails. At one o'clock I have lunch with my colleagues. We often eat in a small café near the office.

I finish work at six. In the evening I cook dinner, watch TV or read a book. I go to bed at eleven.`,
  tr: `Меня зовут Макс. Мне тридцать лет, и я живу в Днепре. Я работаю в офисе в центре города.

Я встаю в семь часов. Я принимаю душ и выпиваю чашку кофе. Утром я ем немного. Я езжу на работу на автобусе. Автобус обычно полный.

Я начинаю работу в девять. Я разговариваю с людьми по телефону и пишу письма. В час я обедаю с коллегами. Мы часто едим в маленьком кафе возле офиса.

Я заканчиваю работу в шесть. Вечером я готовлю ужин, смотрю телевизор или читаю книгу. Я ложусь спать в одиннадцать.`,
  gloss: { colleagues: 'коллеги', 'café': 'кафе', shower: 'душ' },
  q: [
    ['How does Max go to work?', ['By car', 'By bus', 'On foot'], 1],
    ['What time does he start work?', ['At seven', 'At nine', 'At one'], 1],
    ['Where does he have lunch?', ['At home', 'In a café near the office', 'In the office kitchen'], 1],
    ['What does he NOT do in the evening?', ['Cook dinner', 'Read a book', 'Go to the gym'], 2]
  ] },
{ id: 'a1-02', level: 'A1', title: 'My Family', ru: 'Моя семья', topic: 'people',
  text: `This is my family. We are not a big family. There are four of us: my mother, my father, my brother and me.

My father's name is Ivan. He is fifty-five. He is an engineer, and he likes fishing. My mother is Olga. She is a teacher at a school. She is very kind and she cooks very well.

My brother Denis is older than me. He is a bartender in a popular bar. He knows a lot about cocktails and wine.

On Sundays we often have lunch together. We talk, laugh and eat my mother's soup. I love my family.`,
  tr: `Это моя семья. Мы не большая семья. Нас четверо: моя мама, мой папа, мой брат и я.

Моего папу зовут Иван. Ему пятьдесят пять. Он инженер и любит рыбалку. Мою маму зовут Ольга. Она учитель в школе. Она очень добрая и очень хорошо готовит.

Мой брат Денис старше меня. Он бармен в популярном баре. Он много знает о коктейлях и вине.

По воскресеньям мы часто обедаем вместе. Мы разговариваем, смеёмся и едим мамин суп. Я люблю свою семью.`,
  gloss: { engineer: 'инженер', fishing: 'рыбалка', bartender: 'бармен', cocktails: 'коктейли' },
  q: [
    ['How many people are there in the family?', ['Three', 'Four', 'Five'], 1],
    ['What is the mother\'s job?', ['Engineer', 'Teacher', 'Bartender'], 1],
    ['Who is older?', ['The writer', 'Denis', 'They are the same age'], 1],
    ['When do they have lunch together?', ['On Sundays', 'Every day', 'On Fridays'], 0]
  ] },
{ id: 'a1-03', level: 'A1', title: 'At the Café', ru: 'В кафе', topic: 'food',
  text: `— Good morning! What would you like?
— Hello! A large cappuccino, please.
— With sugar?
— No, thank you. And can I have a cheese sandwich?
— Of course. Anything else?
— No, that's all. How much is it?
— It's ninety-five hryvnias.
— Here you are.
— Thank you! Your coffee will be ready in two minutes.

Anna sits at a table near the window. She drinks her coffee and looks at the street. It is sunny today, and there are a lot of people outside.`,
  tr: `— Доброе утро! Что будете?
— Здравствуйте! Большой капучино, пожалуйста.
— С сахаром?
— Нет, спасибо. И можно мне бутерброд с сыром?
— Конечно. Что-нибудь ещё?
— Нет, это всё. Сколько с меня?
— Девяносто пять гривен.
— Вот, пожалуйста.
— Спасибо! Ваш кофе будет готов через две минуты.

Анна садится за столик у окна. Она пьёт кофе и смотрит на улицу. Сегодня солнечно, и на улице много людей.`,
  gloss: { cappuccino: 'капучино', hryvnias: 'гривен', sandwich: 'бутерброд' },
  q: [
    ['What does Anna order to drink?', ['Tea', 'A cappuccino', 'Juice'], 1],
    ['Does she want sugar?', ['Yes', 'No', 'Two spoons'], 1],
    ['How much does she pay?', ['59 hryvnias', '95 hryvnias', '90 hryvnias'], 1],
    ['What is the weather like?', ['Rainy', 'Sunny', 'Cold'], 1]
  ] },
{ id: 'a1-04', level: 'A1', title: 'My Flat', ru: 'Моя квартира', topic: 'home',
  text: `I live in a small flat on the fifth floor. It has one room, a kitchen and a bathroom. The flat is small, but it is warm and comfortable.

In my room there is a bed, a desk and a big wardrobe. There is a computer on the desk. I work and play games on it. There are some pictures on the walls.

The kitchen is very small. There is a fridge, a cooker and a little table. I don't have a dishwasher, so I wash the dishes by hand.

My favourite place is the balcony. In summer I sit there in the evening and drink tea.`,
  tr: `Я живу в маленькой квартире на пятом этаже. В ней одна комната, кухня и ванная. Квартира маленькая, но тёплая и уютная.

В моей комнате есть кровать, письменный стол и большой шкаф. На столе стоит компьютер. Я работаю и играю на нём в игры. На стенах висят несколько картин.

Кухня очень маленькая. Там есть холодильник, плита и маленький столик. У меня нет посудомоечной машины, поэтому я мою посуду руками.

Моё любимое место — балкон. Летом я сижу там по вечерам и пью чай.`,
  gloss: { wardrobe: 'шкаф для одежды', cooker: 'плита', dishwasher: 'посудомоечная машина', balcony: 'балкон' },
  q: [
    ['Which floor is the flat on?', ['The first', 'The fifth', 'The tenth'], 1],
    ['What is on the desk?', ['A TV', 'A computer', 'A lamp'], 1],
    ['Why does the writer wash dishes by hand?', ['He likes it', 'He has no dishwasher', 'The dishwasher is broken'], 1],
    ['What is his favourite place?', ['The kitchen', 'The bed', 'The balcony'], 2]
  ] },
{ id: 'a1-05', level: 'A1', title: 'Shopping', ru: 'Покупки', topic: 'money',
  text: `On Saturday I go to the supermarket. I always make a shopping list because I often forget things.

Today I need bread, milk, eggs, tomatoes and chicken. The supermarket is big and there are a lot of people. I take a basket and walk between the shelves.

The tomatoes are expensive today, so I buy cucumbers. The chicken is on sale — that's great! At the checkout I pay by card.

At home I put the food in the fridge. Then I see my list on the table. Oh no! I forgot the bread.`,
  tr: `В субботу я хожу в супермаркет. Я всегда составляю список покупок, потому что часто что-то забываю.

Сегодня мне нужны хлеб, молоко, яйца, помидоры и курица. Супермаркет большой, и там много людей. Я беру корзину и хожу между полками.

Помидоры сегодня дорогие, поэтому я покупаю огурцы. Курица со скидкой — отлично! На кассе я плачу картой.

Дома я кладу продукты в холодильник. Потом я вижу свой список на столе. О нет! Я забыл хлеб.`,
  gloss: { basket: 'корзина', shelves: 'полки', checkout: 'касса', 'on sale': 'со скидкой', cucumbers: 'огурцы' },
  q: [
    ['Why does the writer make a list?', ['He forgets things', 'His wife asks him', 'It is a rule'], 0],
    ['What does he buy instead of tomatoes?', ['Potatoes', 'Cucumbers', 'Apples'], 1],
    ['How does he pay?', ['In cash', 'By card', 'By phone'], 1],
    ['What did he forget?', ['Milk', 'Eggs', 'Bread'], 2]
  ] },
{ id: 'a1-06', level: 'A1', title: 'The Weather', ru: 'Погода', topic: 'nature',
  text: `In Ukraine there are four seasons: spring, summer, autumn and winter.

Spring is warm and green. Trees and flowers start to grow. Summer is hot and sunny. People go to the beach and swim in the river.

In autumn the leaves are yellow and red. It often rains and it is windy. I don't like autumn very much because it gets dark early.

Winter is cold. Sometimes there is a lot of snow. Children make snowmen and play outside. My favourite season is summer, because I love the sun and long evenings.`,
  tr: `В Украине четыре времени года: весна, лето, осень и зима.

Весна тёплая и зелёная. Деревья и цветы начинают расти. Лето жаркое и солнечное. Люди ходят на пляж и купаются в реке.

Осенью листья жёлтые и красные. Часто идёт дождь и дует ветер. Я не очень люблю осень, потому что рано темнеет.

Зима холодная. Иногда бывает много снега. Дети лепят снеговиков и играют на улице. Моё любимое время года — лето, потому что я люблю солнце и долгие вечера.`,
  gloss: { seasons: 'времена года', snowmen: 'снеговики', leaves: 'листья' },
  q: [
    ['What colour are the leaves in autumn?', ['Green', 'Yellow and red', 'White'], 1],
    ['Why doesn\'t the writer like autumn?', ['It is hot', 'It gets dark early', 'There is snow'], 1],
    ['What do children do in winter?', ['Swim in the river', 'Make snowmen', 'Pick flowers'], 1],
    ['What is the writer\'s favourite season?', ['Spring', 'Summer', 'Winter'], 1]
  ] },
{ id: 'a1-07', level: 'A1', title: 'A New Colleague', ru: 'Новая коллега', topic: 'work',
  text: `Today we have a new colleague in our office. Her name is Kate. She is from Lviv.

Kate is tall and has long dark hair. She is friendly and smiles a lot. She speaks Ukrainian, English and a little Polish.

I show her the office. "This is the kitchen. Here is the coffee machine. And this is your desk, next to the window."

"Thank you very much!" she says. "Everyone here is so nice."

At lunch we eat together and talk about our hobbies. Kate likes running and photography. I think we will be good friends.`,
  tr: `Сегодня у нас в офисе новая коллега. Её зовут Катя. Она из Львова.

Катя высокая, у неё длинные тёмные волосы. Она дружелюбная и часто улыбается. Она говорит по-украински, по-английски и немного по-польски.

Я показываю ей офис. «Это кухня. Вот кофемашина. А это твой стол, рядом с окном».

«Большое спасибо! — говорит она. — Все здесь такие милые».

В обед мы едим вместе и говорим о наших хобби. Катя любит бег и фотографию. Думаю, мы станем хорошими друзьями.`,
  gloss: { colleague: 'коллега', photography: 'фотография', 'coffee machine': 'кофемашина' },
  q: [
    ['Where is Kate from?', ['Kyiv', 'Lviv', 'Odesa'], 1],
    ['Where is her desk?', ['Next to the door', 'Next to the window', 'In the kitchen'], 1],
    ['Which language does Kate speak only a little?', ['English', 'Ukrainian', 'Polish'], 2],
    ['What are Kate\'s hobbies?', ['Running and photography', 'Cooking and reading', 'Music and games'], 0]
  ] },
{ id: 'a1-08', level: 'A1', title: 'Weekend Plans', ru: 'Планы на выходные', topic: 'leisure',
  text: `— Hi, Tom! What are you doing this weekend?
— Hi! On Saturday I'm going to the gym in the morning. In the afternoon I'm free. Why?
— There is a new film at the cinema. Do you want to go?
— Yes, sure! What time does it start?
— At five o'clock. After the film we can have pizza.
— Great idea. Where do we meet?
— At the cinema, at a quarter to five.
— OK. See you on Saturday!
— See you!`,
  tr: `— Привет, Том! Что делаешь на этих выходных?
— Привет! В субботу утром я иду в спортзал. Днём я свободен. А что?
— В кинотеатре новый фильм. Хочешь сходить?
— Да, конечно! Во сколько он начинается?
— В пять часов. После фильма можем поесть пиццу.
— Отличная идея. Где встречаемся?
— У кинотеатра, без пятнадцати пять.
— Хорошо. Увидимся в субботу!
— До встречи!`,
  gloss: { 'a quarter to five': 'без пятнадцати пять', cinema: 'кинотеатр' },
  q: [
    ['What is Tom doing on Saturday morning?', ['Going to the cinema', 'Going to the gym', 'Working'], 1],
    ['What time does the film start?', ['At 4:45', 'At 5:00', 'At 5:15'], 1],
    ['What will they eat after the film?', ['Sushi', 'Burgers', 'Pizza'], 2],
    ['Where will they meet?', ['At the gym', 'At the cinema', 'At a café'], 1]
  ] },

/* ======================= A2 ======================= */
{ id: 'a2-01', level: 'A2', title: 'My First Job', ru: 'Моя первая работа', topic: 'work',
  text: `I got my first job when I was nineteen. I was a student, and I needed money for my studies, so I started working in a call centre.

The first week was really difficult. I had to answer a lot of calls, and some customers were angry. I was nervous and often didn't know what to say. My manager, Svitlana, was very patient. She sat next to me and helped me with every call.

After a month, things became easier. I learned how to listen carefully, how to stay calm and how to explain things simply. I also understood that most people just want someone to hear them.

I worked there for two years. The salary wasn't high, but the experience was very useful. Now I'm a team leader myself, and I always remember how Svitlana helped me.`,
  tr: `Я получил свою первую работу, когда мне было девятнадцать. Я был студентом, и мне нужны были деньги на учёбу, поэтому я начал работать в колл-центре.

Первая неделя была очень трудной. Мне приходилось отвечать на множество звонков, и некоторые клиенты были злыми. Я нервничал и часто не знал, что сказать. Мой руководитель, Светлана, была очень терпеливой. Она сидела рядом и помогала мне с каждым звонком.

Через месяц стало легче. Я научился внимательно слушать, сохранять спокойствие и просто объяснять. Ещё я понял, что большинство людей просто хотят, чтобы их услышали.

Я проработал там два года. Зарплата была невысокой, но опыт оказался очень полезным. Теперь я сам руководитель команды и всегда помню, как Светлана мне помогала.`,
  gloss: { 'call centre': 'колл-центр', patient: 'терпеливый', 'team leader': 'руководитель команды' },
  q: [
    ['Why did the writer start working?', ['He was bored', 'He needed money for his studies', 'His parents asked him'], 1],
    ['Who helped him in the first week?', ['A customer', 'His manager', 'His friend'], 1],
    ['What did he understand about people?', ['They want to be heard', 'They are always angry', 'They don\'t like phones'], 0],
    ['What is his job now?', ['Student', 'Call centre operator', 'Team leader'], 2]
  ] },
{ id: 'a2-02', level: 'A2', title: 'A Trip to Lviv', ru: 'Поездка во Львов', topic: 'travel',
  text: `Last spring my friend and I decided to visit Lviv. We bought train tickets online and left on Friday evening. The train was comfortable, and we slept most of the way.

We arrived early in the morning. The city was quiet and beautiful. We left our bags at the hotel and went to the old town. We walked along narrow streets, looked at old buildings and took hundreds of photos.

Of course, we tried the famous Lviv coffee and chocolate. In the evening we had dinner in a restaurant with live music. The food was delicious, and the prices were not too high.

On Sunday it rained all day, but we didn't care. We visited two museums and a small bookshop. We came home tired but very happy. I want to go back in winter, when the city is full of lights.`,
  tr: `Прошлой весной мы с другом решили съездить во Львов. Мы купили билеты на поезд онлайн и уехали в пятницу вечером. Поезд был удобный, и мы проспали большую часть пути.

Мы приехали рано утром. Город был тихим и красивым. Мы оставили сумки в отеле и пошли в старый город. Мы гуляли по узким улочкам, рассматривали старинные здания и сделали сотни фотографий.

Конечно, мы попробовали знаменитые львовские кофе и шоколад. Вечером мы ужинали в ресторане с живой музыкой. Еда была очень вкусной, а цены — не слишком высокими.

В воскресенье весь день шёл дождь, но нам было всё равно. Мы посетили два музея и маленький книжный магазин. Мы вернулись домой уставшими, но очень счастливыми. Хочу поехать снова зимой, когда город полон огней.`,
  gloss: { narrow: 'узкий', 'live music': 'живая музыка', "didn't care": 'было всё равно' },
  q: [
    ['How did they travel to Lviv?', ['By plane', 'By bus', 'By train'], 2],
    ['What did they do first in the morning?', ['Went to a museum', 'Left their bags at the hotel', 'Had dinner'], 1],
    ['What was the weather like on Sunday?', ['Sunny', 'Rainy', 'Snowy'], 1],
    ['When does the writer want to go back?', ['In summer', 'In autumn', 'In winter'], 2]
  ] },
{ id: 'a2-03', level: 'A2', title: 'At the Doctor\'s', ru: 'У врача', topic: 'health',
  text: `— Good afternoon. What seems to be the problem?
— I've had a sore throat and a headache for three days. And yesterday I had a temperature.
— Let me have a look. Open your mouth, please… Yes, your throat is red. Do you have a cough?
— A little, mostly at night.
— It's a cold, nothing serious. You should stay at home for a few days and drink a lot of warm tea.
— Do I need any medicine?
— Take these tablets three times a day after meals. If you don't feel better in five days, come back and see me again.
— Thank you, doctor. Can I go to work tomorrow?
— I'd rather you didn't. Rest is the best medicine.`,
  tr: `— Добрый день. Что вас беспокоит?
— У меня уже три дня болит горло и голова. А вчера была температура.
— Давайте посмотрю. Откройте рот, пожалуйста… Да, горло красное. Кашель есть?
— Немного, в основном ночью.
— Это простуда, ничего серьёзного. Вам стоит несколько дней побыть дома и пить много тёплого чая.
— Мне нужны какие-нибудь лекарства?
— Принимайте эти таблетки три раза в день после еды. Если через пять дней не станет лучше, приходите ко мне снова.
— Спасибо, доктор. Можно мне завтра на работу?
— Лучше не надо. Отдых — лучшее лекарство.`,
  gloss: { 'sore throat': 'боль в горле', cough: 'кашель', "I'd rather you didn't": 'лучше не надо' },
  q: [
    ['How long has the patient been ill?', ['One day', 'Three days', 'A week'], 1],
    ['What does the doctor say it is?', ['Flu', 'A cold', 'Nothing'], 1],
    ['How often should he take the tablets?', ['Once a day', 'Twice a day', 'Three times a day'], 2],
    ['Can he go to work tomorrow?', ['Yes, of course', 'The doctor thinks it\'s better not to', 'Only in the afternoon'], 1]
  ] },
{ id: 'a2-04', level: 'A2', title: 'Learning English', ru: 'Изучение английского', topic: 'study',
  text: `Many people say that learning English is hard. I think it's not hard, but it takes time.

When I started, I tried to learn fifty new words every day. After a week I was tired, and I forgot most of them. Then I changed my plan. Now I learn ten words a day, but I repeat old words too. I use an app on my phone, and I practise for fifteen minutes in the morning on the bus.

I also watch short videos and series with English subtitles. At first I understood very little, but now I can follow the story. Listening every day really helps.

My biggest problem is speaking. I'm afraid of making mistakes. My teacher says that mistakes are normal and that nobody speaks perfectly at the beginning. So I'm trying to speak more, even when it's difficult.`,
  tr: `Многие говорят, что учить английский трудно. Я думаю, это не трудно, но требует времени.

Когда я начинал, я пытался учить пятьдесят новых слов каждый день. Через неделю я устал и забыл большинство из них. Тогда я изменил план. Теперь я учу десять слов в день, но повторяю и старые слова. Я пользуюсь приложением на телефоне и занимаюсь по пятнадцать минут утром в автобусе.

Ещё я смотрю короткие видео и сериалы с английскими субтитрами. Сначала я понимал очень мало, а теперь могу следить за сюжетом. Ежедневное слушание действительно помогает.

Моя самая большая проблема — говорение. Я боюсь ошибиться. Мой преподаватель говорит, что ошибки — это нормально и что никто не говорит идеально в начале. Поэтому я стараюсь больше говорить, даже когда трудно.`,
  gloss: { subtitles: 'субтитры', 'follow the story': 'следить за сюжетом', perfectly: 'идеально' },
  q: [
    ['Why did the writer change his plan?', ['50 words a day was too many', 'The app stopped working', 'His teacher told him'], 0],
    ['When does he practise with the app?', ['In the evening', 'On the bus in the morning', 'At lunch'], 1],
    ['What helps him with listening?', ['Radio', 'Videos and series with subtitles', 'Books'], 1],
    ['What is his biggest problem?', ['Reading', 'Writing', 'Speaking'], 2]
  ] },
{ id: 'a2-05', level: 'A2', title: 'A Birthday Surprise', ru: 'Сюрприз на день рождения', topic: 'feelings',
  text: `Last Friday was my mum's sixtieth birthday. My brother and I wanted to make it special, so we planned a surprise party.

For two weeks we secretly called her friends and old colleagues. My brother, who is a bartender, prepared drinks, and I ordered a big chocolate cake. We booked a small room in a restaurant and decorated it with balloons and flowers.

On the day of the party, Dad told Mum that they were going out for a quiet dinner. When she opened the door, everybody shouted "Surprise!" She was so shocked that she couldn't say anything for a minute. Then she started laughing and crying at the same time.

It was a wonderful evening. We danced, told funny stories and looked at old family photos. Mum said it was the best birthday of her life.`,
  tr: `В прошлую пятницу маме исполнилось шестьдесят. Мы с братом хотели сделать этот день особенным, поэтому спланировали вечеринку-сюрприз.

Две недели мы тайком обзванивали её подруг и бывших коллег. Мой брат, который работает барменом, приготовил напитки, а я заказал большой шоколадный торт. Мы забронировали небольшой зал в ресторане и украсили его шарами и цветами.

В день праздника папа сказал маме, что они идут на тихий ужин. Когда она открыла дверь, все закричали: «Сюрприз!» Она была так потрясена, что минуту не могла ничего сказать. Потом она начала одновременно смеяться и плакать.

Это был чудесный вечер. Мы танцевали, рассказывали смешные истории и смотрели старые семейные фотографии. Мама сказала, что это был лучший день рождения в её жизни.`,
  gloss: { secretly: 'тайком', decorated: 'украсили', balloons: 'воздушные шары', shocked: 'потрясена' },
  q: [
    ['How old did Mum become?', ['Fifty', 'Fifty-five', 'Sixty'], 2],
    ['What did the writer order?', ['Flowers', 'A chocolate cake', 'Drinks'], 1],
    ['What did Dad tell Mum?', ['They were going to a party', 'They were going out for a quiet dinner', 'They were visiting friends'], 1],
    ['How did Mum react at first?', ['She couldn\'t say anything', 'She was angry', 'She left'], 0]
  ] },
{ id: 'a2-06', level: 'A2', title: 'Online Shopping', ru: 'Покупки онлайн', topic: 'tech',
  text: `These days I buy almost everything online: clothes, electronics, even food. It saves a lot of time, and I can compare prices on different websites.

But online shopping is not always easy. Last month I ordered a pair of running shoes. On the website they looked great, but when the parcel arrived, the shoes were too small. I had to return them. The shop sent me a new pair, but it took ten days.

Another time I ordered a phone case, and it never arrived. I wrote to customer support three times before they gave me my money back.

Now I follow a few simple rules. I read reviews from other buyers, I check the size chart carefully, and I only buy from shops with a good return policy. And for important things, I still prefer to go to a real shop.`,
  tr: `Сейчас я покупаю онлайн почти всё: одежду, электронику, даже еду. Это экономит много времени, и я могу сравнивать цены на разных сайтах.

Но онлайн-покупки не всегда простые. В прошлом месяце я заказал кроссовки для бега. На сайте они выглядели отлично, но когда пришла посылка, кроссовки оказались малы. Пришлось их вернуть. Магазин прислал новую пару, но это заняло десять дней.

В другой раз я заказал чехол для телефона, и он так и не пришёл. Я трижды писал в службу поддержки, прежде чем мне вернули деньги.

Теперь я соблюдаю несколько простых правил. Я читаю отзывы других покупателей, внимательно смотрю таблицу размеров и покупаю только в магазинах с хорошими условиями возврата. А важные вещи я всё ещё предпочитаю покупать в обычном магазине.`,
  gloss: { parcel: 'посылка', 'customer support': 'служба поддержки', 'size chart': 'таблица размеров', 'return policy': 'условия возврата' },
  q: [
    ['What was wrong with the running shoes?', ['They were too big', 'They were too small', 'They were the wrong colour'], 1],
    ['What happened with the phone case?', ['It was broken', 'It never arrived', 'It was too expensive'], 1],
    ['Which is NOT one of his rules?', ['Read reviews', 'Check the size chart', 'Always pay in cash'], 2],
    ['Where does he buy important things?', ['Online', 'In a real shop', 'From friends'], 1]
  ] },
{ id: 'a2-07', level: 'A2', title: 'Moving to a New City', ru: 'Переезд в новый город', topic: 'city',
  text: `Two years ago my sister Iryna got a job offer in Kyiv. She was excited, but also a bit scared. She had lived in a small town all her life and didn't know anyone in the capital.

The first months were not easy. The city was big and noisy, the rent was expensive, and the metro at rush hour was a real challenge. In the evenings she often felt lonely and called our parents for hours.

Then things started to change. She joined a running club, and every Saturday she ran in the park with a group of friendly people. She found a nice flat with a roommate who later became her best friend. At work she was promoted.

Now Iryna says that moving was the best decision of her life. "Big changes are frightening," she told me, "but without them you never find out what you can do."`,
  tr: `Два года назад моя сестра Ирина получила предложение о работе в Киеве. Она была рада, но и немного боялась. Всю жизнь она прожила в маленьком городке и никого не знала в столице.

Первые месяцы были непростыми. Город был большим и шумным, аренда — дорогой, а метро в час пик было настоящим испытанием. По вечерам ей часто было одиноко, и она часами говорила по телефону с родителями.

Потом всё начало меняться. Она вступила в беговой клуб и каждую субботу бегала в парке с компанией дружелюбных людей. Она нашла хорошую квартиру с соседкой, которая позже стала её лучшей подругой. На работе её повысили.

Теперь Ирина говорит, что переезд был лучшим решением в её жизни. «Большие перемены пугают, — сказала она мне, — но без них никогда не узнаешь, на что ты способен».`,
  gloss: { capital: 'столица', 'rush hour': 'час пик', roommate: 'сосед(ка) по квартире', promoted: 'повысили (в должности)' },
  q: [
    ['Why did Iryna move to Kyiv?', ['To study', 'She got a job offer', 'Her friends lived there'], 1],
    ['What was difficult at first?', ['Loneliness and expensive rent', 'Bad weather', 'Learning a new language'], 0],
    ['Where did she meet new people?', ['At a running club', 'At a language school', 'In a café'], 0],
    ['What does she think about moving now?', ['It was a mistake', 'It was the best decision of her life', 'She wants to go back'], 1]
  ] },
{ id: 'a2-08', level: 'A2', title: 'Saving for a Car', ru: 'Коплю на машину', topic: 'money',
  text: `For a long time I didn't have any savings. I got my salary, and by the end of the month the money was gone. I couldn't even say where it went.

Last year I decided to save for a car. First, I wrote down all my spending for one month. The result surprised me: I spent a lot on taxis, food delivery and things I didn't really need.

So I made a budget. As soon as I get my salary, I put twenty percent into a separate account. I cook at home more often and take the bus instead of a taxi. I also stopped buying things just because they are on sale.

It isn't always easy, and sometimes I break my own rules. But after ten months I have saved more than half of the money I need. If everything goes well, next summer I'll buy a reliable second-hand car.`,
  tr: `Долгое время у меня совсем не было сбережений. Я получал зарплату, а к концу месяца деньги заканчивались. Я даже не мог сказать, куда они уходили.

В прошлом году я решил копить на машину. Сначала я месяц записывал все свои расходы. Результат меня удивил: я много тратил на такси, доставку еды и вещи, которые мне на самом деле были не нужны.

Тогда я составил бюджет. Как только получаю зарплату, я откладываю двадцать процентов на отдельный счёт. Я чаще готовлю дома и езжу на автобусе вместо такси. А ещё перестал покупать вещи только потому, что на них скидка.

Это не всегда легко, и иногда я нарушаю собственные правила. Но за десять месяцев я накопил больше половины нужной суммы. Если всё пойдёт хорошо, следующим летом я куплю надёжную подержанную машину.`,
  gloss: { savings: 'сбережения', 'food delivery': 'доставка еды', 'second-hand': 'подержанный', percent: 'процент' },
  q: [
    ['What did the writer do first?', ['Opened an account', 'Wrote down all his spending', 'Sold his things'], 1],
    ['How much of his salary does he save?', ['10%', '20%', '50%'], 1],
    ['Which change did he NOT make?', ['Cooking at home more', 'Taking the bus', 'Working at weekends'], 2],
    ['What kind of car does he want?', ['A new sports car', 'A reliable second-hand car', 'An electric car'], 1]
  ] },

/* ======================= B1 ======================= */
{ id: 'b1-01', level: 'B1', title: 'How to Deal with Difficult Customers', ru: 'Как работать со сложными клиентами', topic: 'work',
  text: `Anyone who has worked with customers knows that some conversations are harder than others. A customer may be angry, impatient or even rude. However, there are a few techniques that can turn a difficult call into a successful one.

First of all, let the person speak. When people are upset, they need to express their emotions before they are ready to listen. Interrupting them usually makes things worse. Simple phrases like "I understand" or "I see what you mean" show that you are paying attention.

Secondly, don't take it personally. The customer is angry about the situation, not about you. If you stay calm and polite, the conversation will usually calm down too.

Thirdly, focus on solutions, not on problems. Instead of saying "I can't do that", explain what you can do: "I can't cancel the payment today, but I can offer you a new schedule."

Finally, always finish the conversation with a clear next step. The customer should know exactly what will happen and when. Experienced managers say that a well-handled complaint can make a customer more loyal than before the problem appeared.`,
  tr: `Каждый, кто работал с клиентами, знает, что одни разговоры сложнее других. Клиент может быть злым, нетерпеливым или даже грубым. Однако есть несколько приёмов, которые могут превратить трудный звонок в успешный.

Прежде всего, дайте человеку высказаться. Когда люди расстроены, им нужно выразить эмоции, прежде чем они будут готовы слушать. Если перебивать, обычно становится только хуже. Простые фразы вроде «Я понимаю» или «Понимаю, что вы имеете в виду» показывают, что вы внимательно слушаете.

Во-вторых, не принимайте на свой счёт. Клиент злится на ситуацию, а не на вас. Если вы сохраняете спокойствие и вежливость, разговор обычно тоже успокаивается.

В-третьих, сосредоточьтесь на решениях, а не на проблемах. Вместо «Я не могу этого сделать» объясните, что вы можете: «Сегодня я не могу отменить платёж, но могу предложить вам новый график».

Наконец, всегда заканчивайте разговор понятным следующим шагом. Клиент должен точно знать, что произойдёт и когда. Опытные руководители говорят, что хорошо отработанная жалоба может сделать клиента более лояльным, чем до появления проблемы.`,
  gloss: { techniques: 'приёмы, методики', upset: 'расстроенный', interrupting: 'перебивание', 'take it personally': 'принимать на свой счёт', loyal: 'лояльный', complaint: 'жалоба' },
  q: [
    ['Why should you let an upset customer speak?', ['To save time', 'They need to express emotions before they can listen', 'Because it is a rule'], 1],
    ['What is the customer usually angry about?', ['The operator personally', 'The situation', 'The company logo'], 1],
    ['What should you say instead of "I can\'t do that"?', ['Nothing', 'What you can do', 'Ask them to call later'], 1],
    ['According to the text, a well-handled complaint can…', ['make a customer more loyal', 'lose the customer', 'cost a lot of money'], 0]
  ] },
{ id: 'b1-02', level: 'B1', title: 'The Power of Habits', ru: 'Сила привычек', topic: 'health',
  text: `Why is it so hard to start going to the gym, but so easy to spend an hour scrolling through your phone? The answer is habits. Scientists say that about forty percent of what we do every day is not a conscious decision, but a habit.

Every habit has three parts: a trigger, an action and a reward. For example, you feel bored (trigger), you open social media (action), and you get a bit of entertainment (reward). Your brain remembers this loop, and next time it happens automatically.

The good news is that we can use the same loop to build useful habits. Experts suggest starting with something very small. If you want to read more, don't promise yourself to read for an hour. Start with two pages before bed. If you want to run, just put on your running shoes and go outside for five minutes.

It is also helpful to connect a new habit to an old one. "After I make my morning coffee, I will learn five English words." After a few weeks, the new action becomes almost automatic.

Most importantly, don't give up if you miss a day. Missing once is an accident; missing twice is the start of a new habit.`,
  tr: `Почему так трудно начать ходить в спортзал, но так легко провести час, листая ленту в телефоне? Ответ — привычки. Учёные говорят, что около сорока процентов того, что мы делаем каждый день, — не осознанное решение, а привычка.

У каждой привычки три части: триггер, действие и награда. Например, вам скучно (триггер), вы открываете соцсети (действие) и получаете немного развлечения (награда). Мозг запоминает этот цикл, и в следующий раз всё происходит автоматически.

Хорошая новость в том, что тот же цикл можно использовать для полезных привычек. Эксперты советуют начинать с чего-то совсем маленького. Если хотите больше читать, не обещайте себе читать по часу. Начните с двух страниц перед сном. Если хотите бегать, просто наденьте кроссовки и выйдите на улицу на пять минут.

Полезно также привязать новую привычку к старой: «После того как сварю утренний кофе, я выучу пять английских слов». Через несколько недель новое действие становится почти автоматическим.

И самое главное — не сдавайтесь, если пропустили день. Пропустить один раз — случайность; пропустить дважды — начало новой привычки.`,
  gloss: { scrolling: 'прокрутка (ленты)', conscious: 'осознанный', trigger: 'триггер, пусковой сигнал', reward: 'награда', loop: 'цикл, петля', 'give up': 'сдаваться' },
  q: [
    ['About how much of what we do daily is habit?', ['10%', '40%', '90%'], 1],
    ['What are the three parts of a habit?', ['Trigger, action, reward', 'Plan, effort, result', 'Morning, day, evening'], 0],
    ['What do experts suggest when building a habit?', ['Start very small', 'Do it for an hour', 'Only do it at weekends'], 0],
    ['According to the text, missing twice is…', ['not a problem', 'an accident', 'the start of a new habit'], 2]
  ] },
{ id: 'b1-03', level: 'B1', title: 'Remote Work: Pros and Cons', ru: 'Удалённая работа: плюсы и минусы', topic: 'work',
  text: `A few years ago, working from home was a rare privilege. Today millions of people work remotely at least a few days a week. But is it really better than going to the office?

Supporters of remote work point out several advantages. People save time and money on commuting. They can organise their day more flexibly, for example, take a break to go for a run or pick up their children from school. Many employees say they are more productive at home because there are fewer interruptions.

However, remote work also has its disadvantages. Some people find it difficult to separate work from private life: the laptop is always there, so they keep checking emails late in the evening. Others miss the social side of the office — lunch with colleagues, quick chats in the kitchen, the feeling of being part of a team. Managers sometimes worry that it is harder to train new employees and to build trust.

That is why many companies now choose a hybrid model: two or three days in the office and the rest at home. It seems that, as with many things, the best solution lies somewhere in the middle.`,
  tr: `Несколько лет назад работа из дома была редкой привилегией. Сегодня миллионы людей работают удалённо хотя бы несколько дней в неделю. Но действительно ли это лучше, чем ходить в офис?

Сторонники удалённой работы указывают на несколько преимуществ. Люди экономят время и деньги на дорогу. Они могут гибче организовать день: например, сделать перерыв на пробежку или забрать детей из школы. Многие сотрудники говорят, что дома они продуктивнее, потому что их реже отвлекают.

Однако у удалёнки есть и недостатки. Некоторым трудно отделить работу от личной жизни: ноутбук всегда рядом, поэтому они проверяют почту до позднего вечера. Другим не хватает социальной стороны офиса — обедов с коллегами, коротких разговоров на кухне, ощущения себя частью команды. Руководители иногда беспокоятся, что так сложнее обучать новичков и выстраивать доверие.

Поэтому многие компании сейчас выбирают гибридную модель: два-три дня в офисе, остальное — дома. Похоже, как и во многом, лучшее решение находится где-то посередине.`,
  gloss: { privilege: 'привилегия', remotely: 'удалённо', commuting: 'дорога на работу и обратно', flexibly: 'гибко', interruptions: 'отвлечения, помехи', hybrid: 'гибридный' },
  q: [
    ['Which is an advantage of remote work mentioned in the text?', ['Higher salary', 'Saving time on commuting', 'Free lunch'], 1],
    ['Why do some people check emails late in the evening?', ['Their boss asks them', 'It is hard to separate work and private life', 'They like it'], 1],
    ['What do managers worry about?', ['Training new employees and building trust', 'Office rent', 'Internet speed'], 0],
    ['What is a hybrid model?', ['Only office work', 'Only home work', 'Some days in the office, some at home'], 2]
  ] },
{ id: 'b1-04', level: 'B1', title: 'A Lesson from My Grandfather', ru: 'Урок моего деда', topic: 'people',
  text: `When I was about twelve, I spent every summer at my grandfather's house in a village near the river. He was a quiet man who had worked as a carpenter all his life, and his hands could make almost anything out of wood.

One summer I asked him to teach me how to make a small boat. I imagined that we would finish it in a day. Instead, he gave me a piece of wood and a knife and told me to make the wood perfectly smooth. I worked for hours, and every time I showed it to him, he just shook his head and said, "Not yet."

I was angry. I wanted to build a boat, not to sit and polish a boring piece of wood. On the third day I almost gave up. Then my grandfather sat down next to me and said, "Anyone can start a boat. The difference between a good boat and a bad one is in the work nobody sees."

We finished the boat two weeks later. It was small and simple, but it floated perfectly. I still have it on my bookshelf. Whenever I want to rush through a task at work, I look at that boat and remember his words.`,
  tr: `Когда мне было около двенадцати, я проводил каждое лето в доме деда в селе у реки. Он был тихим человеком, всю жизнь проработавшим плотником, и его руки могли сделать из дерева почти что угодно.

Однажды летом я попросил его научить меня делать маленькую лодку. Я представлял, что мы закончим за день. Вместо этого он дал мне кусок дерева и нож и велел сделать дерево идеально гладким. Я работал часами, и каждый раз, когда я показывал ему результат, он лишь качал головой и говорил: «Ещё нет».

Я злился. Я хотел строить лодку, а не сидеть и шлифовать скучный кусок дерева. На третий день я чуть не сдался. Тогда дед сел рядом и сказал: «Начать лодку может каждый. Разница между хорошей лодкой и плохой — в работе, которую никто не видит».

Мы закончили лодку через две недели. Она была маленькой и простой, но держалась на воде идеально. Она до сих пор стоит у меня на книжной полке. Каждый раз, когда мне хочется сделать задачу на работе наспех, я смотрю на эту лодку и вспоминаю его слова.`,
  gloss: { carpenter: 'плотник', smooth: 'гладкий', polish: 'шлифовать, полировать', floated: 'держалась на воде', 'rush through': 'делать наспех' },
  q: [
    ['What was the grandfather\'s job?', ['Fisherman', 'Carpenter', 'Teacher'], 1],
    ['What did the grandfather ask the boy to do first?', ['Paint the boat', 'Make a piece of wood smooth', 'Go fishing'], 1],
    ['How long did it take to finish the boat?', ['One day', 'Three days', 'Two weeks'], 2],
    ['What is the main idea of the story?', ['Boats are hard to make', 'Quality is in the work nobody sees', 'Summer is the best season'], 1]
  ] },
{ id: 'b1-05', level: 'B1', title: 'The History of Coffee', ru: 'История кофе', topic: 'food',
  text: `Coffee is one of the most popular drinks in the world, but its history began with a legend. According to an old story, a goat herder in Ethiopia noticed that his goats became very energetic after eating red berries from a certain bush. He tried the berries himself and felt the same effect.

By the fifteenth century, coffee was being grown in Yemen, and soon coffee houses appeared in cities across the Middle East. They quickly became important places where people met, listened to music, played games and discussed the news.

In the seventeenth century, coffee arrived in Europe. At first, some people were suspicious of the dark, bitter drink and called it "the drink of the devil". However, it soon became fashionable, and coffee houses opened in London, Paris and Vienna. In London they were sometimes called "penny universities", because for the price of a cup of coffee you could listen to interesting conversations.

Today, more than two billion cups of coffee are drunk every day. Brazil is the largest producer, and Finland has one of the highest rates of coffee drinking per person.`,
  tr: `Кофе — один из самых популярных напитков в мире, но его история началась с легенды. Согласно старому преданию, пастух коз в Эфиопии заметил, что его козы становятся очень энергичными, поев красных ягод с определённого куста. Он сам попробовал ягоды и почувствовал тот же эффект.

К пятнадцатому веку кофе выращивали в Йемене, и вскоре в городах Ближнего Востока появились кофейни. Они быстро стали важными местами, где люди встречались, слушали музыку, играли в игры и обсуждали новости.

В семнадцатом веке кофе попал в Европу. Поначалу некоторые с подозрением относились к тёмному горькому напитку и называли его «напитком дьявола». Однако вскоре он вошёл в моду, и кофейни открылись в Лондоне, Париже и Вене. В Лондоне их иногда называли «университетами за пенни», потому что за цену чашки кофе можно было послушать интересные беседы.

Сегодня в мире выпивают более двух миллиардов чашек кофе в день. Бразилия — крупнейший производитель, а Финляндия — одна из стран, где пьют больше всего кофе на человека.`,
  gloss: { legend: 'легенда', 'goat herder': 'пастух коз', berries: 'ягоды', bush: 'куст', suspicious: 'относящийся с подозрением', bitter: 'горький', devil: 'дьявол', producer: 'производитель' },
  q: [
    ['According to the legend, who discovered coffee?', ['A king', 'A goat herder', 'A doctor'], 1],
    ['What happened in coffee houses in the Middle East?', ['Only drinking coffee', 'Meeting, music, games and news', 'Selling goats'], 1],
    ['Why were London coffee houses called "penny universities"?', ['Students studied there', 'You could hear interesting conversations for the price of a coffee', 'They were near universities'], 1],
    ['Which country is the largest coffee producer?', ['Ethiopia', 'Finland', 'Brazil'], 2]
  ] },
{ id: 'b1-06', level: 'B1', title: 'A Job Interview', ru: 'Собеседование', topic: 'work',
  text: `— Good morning, please have a seat. Thank you for coming. Could you tell us a little about yourself?
— Of course. I've been working in customer service for four years, the last two as a team leader. I manage a team of about forty operators, and I'm responsible for training new staff and analysing our results.
— That's impressive. What would you say is your biggest achievement?
— Last year our department had a serious problem with overdue payments. I introduced a new system of daily targets and short morning meetings. Within six months, the results improved by almost thirty percent.
— And what about your weaknesses?
— Sometimes I take on too much work myself instead of delegating. I'm learning to trust my team more, and it's working.
— Why are you interested in this position?
— I'd like to develop my skills in a bigger company, and I'm especially interested in using data to make better decisions. I've read a lot about your projects, and I think my experience would be useful here.
— Thank you. Do you have any questions for us?
— Yes. What would a typical day look like in this role, and how do you measure success?`,
  tr: `— Доброе утро, присаживайтесь. Спасибо, что пришли. Расскажите немного о себе?
— Конечно. Я работаю в клиентском сервисе четыре года, последние два — руководителем команды. Я управляю командой примерно из сорока операторов и отвечаю за обучение новых сотрудников и анализ наших результатов.
— Впечатляет. Что бы вы назвали своим главным достижением?
— В прошлом году у нашего отдела была серьёзная проблема с просроченными платежами. Я внедрил новую систему ежедневных целей и короткие утренние планёрки. За шесть месяцев результаты выросли почти на тридцать процентов.
— А как насчёт ваших слабых сторон?
— Иногда я беру слишком много работы на себя вместо того, чтобы делегировать. Я учусь больше доверять команде, и это работает.
— Почему вас интересует эта должность?
— Я хотел бы развивать навыки в более крупной компании, и мне особенно интересно использовать данные для принятия лучших решений. Я много читал о ваших проектах и думаю, что мой опыт был бы здесь полезен.
— Спасибо. У вас есть вопросы к нам?
— Да. Как выглядит типичный день на этой должности и как вы измеряете успех?`,
  gloss: { responsible: 'ответственный', achievement: 'достижение', overdue: 'просроченный', targets: 'цели, плановые показатели', weaknesses: 'слабые стороны', delegating: 'делегирование', 'measure success': 'измерять успех' },
  q: [
    ['How long has the candidate worked in customer service?', ['Two years', 'Four years', 'Six years'], 1],
    ['What problem did the department have?', ['Too many staff', 'Overdue payments', 'A small office'], 1],
    ['What is the candidate\'s weakness?', ['He is often late', 'He takes on too much work himself', 'He doesn\'t like data'], 1],
    ['What does the candidate ask at the end?', ['About the salary', 'About a typical day and how success is measured', 'About holidays'], 1]
  ] },
{ id: 'b1-07', level: 'B1', title: 'Should We Use Less Plastic?', ru: 'Стоит ли меньше пользоваться пластиком?', topic: 'nature',
  text: `Plastic is everywhere: in our kitchens, our cars, our clothes and even our phones. It is cheap, light and strong, which is why it became so popular in the twentieth century. But these same qualities have created a serious problem.

Most plastic is used only once — think of bags, bottles and packaging — and then thrown away. Because it doesn't break down naturally, it can stay in the environment for hundreds of years. Every year millions of tonnes of plastic end up in rivers and oceans, where it harms fish, birds and other animals. Tiny pieces, called microplastics, have even been found in drinking water and in the human body.

Some countries have already taken action. They have banned free plastic bags in shops or introduced deposits on bottles, so people get money back when they return them. Many cafés now give a discount to customers who bring their own cup.

Individual actions may seem small, but together they make a difference. Carrying a reusable bag, refusing a plastic straw or choosing products with less packaging are simple steps that anyone can take today.`,
  tr: `Пластик повсюду: на наших кухнях, в машинах, одежде и даже телефонах. Он дешёвый, лёгкий и прочный — поэтому и стал таким популярным в двадцатом веке. Но эти же качества создали серьёзную проблему.

Большая часть пластика используется только один раз — вспомните пакеты, бутылки и упаковку, — а потом выбрасывается. Поскольку он не разлагается естественным путём, он может оставаться в окружающей среде сотни лет. Каждый год миллионы тонн пластика попадают в реки и океаны, где он вредит рыбам, птицам и другим животным. Крошечные частицы, так называемый микропластик, нашли даже в питьевой воде и в организме человека.

Некоторые страны уже приняли меры. Они запретили бесплатные пакеты в магазинах или ввели залог за бутылки, чтобы люди получали деньги назад, когда их сдают. Многие кафе теперь дают скидку клиентам, которые приходят со своей чашкой.

Действия одного человека могут казаться мелкими, но вместе они меняют ситуацию. Носить многоразовую сумку, отказываться от пластиковой трубочки или выбирать товары с меньшим количеством упаковки — простые шаги, которые каждый может сделать уже сегодня.`,
  gloss: { packaging: 'упаковка', 'break down': 'разлагаться', environment: 'окружающая среда', tonnes: 'тонны', banned: 'запретили', deposits: 'залог', reusable: 'многоразовый', straw: 'трубочка' },
  q: [
    ['Why did plastic become popular?', ['It is cheap, light and strong', 'It is beautiful', 'It breaks down quickly'], 0],
    ['How long can plastic stay in the environment?', ['A few weeks', 'A few years', 'Hundreds of years'], 2],
    ['What is a deposit on bottles?', ['A tax for shops', 'Money you get back when you return a bottle', 'A free bottle'], 1],
    ['Which step is NOT mentioned in the text?', ['Carrying a reusable bag', 'Refusing a plastic straw', 'Buying a new phone'], 2]
  ] },
{ id: 'b1-08', level: 'B1', title: 'The Night Train', ru: 'Ночной поезд', topic: 'travel',
  text: `It was almost midnight when Mark got on the night train to Odesa. He had had a terrible week at work, and all he wanted was to sleep. He found his compartment, put his bag under the seat and lay down without even taking off his shoes.

He was woken up by a strange noise. The train had stopped in the middle of nowhere. Outside it was completely dark, and the only sound was the wind. Mark looked at his phone: 3:17 a.m., no signal.

In the corridor he met an old woman with a cup of tea. "Don't worry," she said, as if she had read his mind. "This happens every time. They are waiting for another train to pass. Would you like some tea? I always carry an extra cup."

They talked for almost an hour. She told him that she had been a train conductor for thirty years and knew every station on this line. She told him stories about famous passengers, lost suitcases and a wedding that had once taken place in the dining car.

When the train finally started moving again, Mark realised that he was no longer tired or angry. In the morning he looked for the old woman to say goodbye, but she wasn't in any of the compartments. The conductor said nobody like her had been on the train.`,
  tr: `Было почти за полночь, когда Марк сел в ночной поезд до Одессы. У него была ужасная неделя на работе, и всё, чего он хотел, — это спать. Он нашёл своё купе, поставил сумку под сиденье и лёг, даже не сняв обуви.

Его разбудил странный звук. Поезд остановился посреди пустоты. За окном была полная темнота, и единственным звуком был ветер. Марк посмотрел на телефон: 3:17 ночи, сети нет.

В коридоре он встретил пожилую женщину с чашкой чая. «Не волнуйтесь, — сказала она, словно прочитав его мысли. — Так бывает каждый раз. Ждём, пока пройдёт другой поезд. Хотите чаю? Я всегда вожу с собой лишнюю чашку».

Они проговорили почти час. Она рассказала, что тридцать лет была проводницей и знает каждую станцию на этой линии. Она рассказывала истории о знаменитых пассажирах, потерянных чемоданах и свадьбе, которая однажды прошла в вагоне-ресторане.

Когда поезд наконец снова тронулся, Марк понял, что больше не чувствует ни усталости, ни злости. Утром он искал пожилую женщину, чтобы попрощаться, но её не было ни в одном купе. Проводник сказал, что никого похожего в поезде не было.`,
  gloss: { compartment: 'купе', 'in the middle of nowhere': 'посреди пустоты, в глуши', corridor: 'коридор', 'read his mind': 'прочитала его мысли', conductor: 'проводник', 'dining car': 'вагон-ресторан' },
  q: [
    ['Why did Mark want to sleep?', ['He had a terrible week at work', 'He was ill', 'He had a long flight'], 0],
    ['Why had the train stopped?', ['It was broken', 'It was waiting for another train', 'There was snow'], 1],
    ['What was the old woman\'s job?', ['Teacher', 'Train conductor', 'Cook'], 1],
    ['What is surprising at the end?', ['The train was late', 'Nobody like her had been on the train', 'Mark lost his bag'], 1]
  ] }
];
