"""
Сборка общей базы слов WordFlow.
Берёт все файлы data/src/<уровень>_NN.json и собирает data/base.js,
который подключается в index.html (работает и при открытии файла с диска).

Запуск (если меняли базу):  python data/build_base.py
"""
import json, glob, os, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
BLOCK = 20  # слов в одном блоке курса

items, seen = [], set()
for path in sorted(glob.glob(os.path.join(SRC, '*.json'))):
    level = os.path.basename(path)[:2].upper()          # a1_01.json -> A1
    for e in json.load(open(path, encoding='utf-8')):
        word, pos = e[0].strip(), e[1]
        key = f'{word.lower()}|{pos}'
        if key in seen:
            continue
        seen.add(key)
        items.append([level] + e)

# номер блока внутри уровня (порядок = порядок в исходных файлах)
counter = {}
out = []
for it in items:
    lvl = it[0]
    n = counter.get(lvl, 0)
    counter[lvl] = n + 1
    out.append(it + [n // BLOCK + 1])

data = {
    'version': datetime.date.today().isoformat() + '-' + str(len(out)),
    'fields': ['level', 'word', 'pos', 'transcription', 'translation_ru', 'translation_ua', 'topic',
               'example1_en', 'example1_ru', 'example1_ua', 'example2_en', 'example2_ru', 'example2_ua', 'block'],
    'items': out,
}
with open(os.path.join(HERE, 'base.js'), 'w', encoding='utf-8') as f:
    f.write('/* Общая база слов WordFlow — файл собирается скриптом data/build_base.py, вручную не редактировать */\n')
    f.write('window.WF_BASE = ')
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print('Собрано слов:', len(out), counter)
