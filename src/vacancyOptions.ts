import regionData from './regions.json';

export const EXPERIENCE = ['Без опыта', 'От 1 года', 'От 3 лет', 'От 6 лет'] as const;
export const EMPLOYMENT = ['Полная занятость', 'Частичная занятость', 'Проектная работа', 'Подработка', 'Вахта'] as const;
export const WORK_FORMATS = ['На месте работодателя', 'Удалённо', 'Гибрид', 'Разъездной'] as const;
export const SCHEDULES = ['1/2', '1/3', '2/1', '2/2', '3/2', '3/3', '4/2', '4/3', '4/4', '5/2', '6/1', 'По выходным', 'Сменный график', 'Свободный', 'Другое'] as const;
export const CONTRACTS = ['Трудовой договор (ТК РФ)', 'ГПХ с физлицом', 'ГПХ с самозанятым', 'ГПХ с ИП'] as const;
export const ALL_REGIONS = 'Вся Россия';
export const REGION_OPTIONS = [{ name: ALL_REGIONS }, ...regionData.map((name) => ({ name }))];
export const CHOICE_OPTIONS = { employment: EMPLOYMENT, workFormat: WORK_FORMATS, schedule: SCHEDULES, contract: CONTRACTS };
export type ChoiceField = keyof typeof CHOICE_OPTIONS;

export function normalizeSpokenSchedules(text: string): string {
  const digits: Record<string, string> = { один: '1', одна: '1', два: '2', две: '2', три: '3', четыре: '4', пять: '5', шесть: '6' };
  return text.replace(/(один|одна|два|две|три|четыре|пять|шесть)\s+на\s+(один|одна|два|две|три|четыре|пять|шесть)/giu, (_match, from: string, to: string) => `${digits[from.toLocaleLowerCase('ru-RU')]}/${digits[to.toLocaleLowerCase('ru-RU')]}`);
}

export function optionKey(value: string): string {
  return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replace(/[^а-яa-z0-9]/gu, '');
}

const regionByKey = new Map(REGION_OPTIONS.map(({ name }) => [optionKey(name), name]));
const regionAliases = new Map([
  ['россия', ALL_REGIONS], ['всерегионы', ALL_REGIONS], ['всяроссия', ALL_REGIONS], ['любойрегион', ALL_REGIONS],
  ['мск', 'Москва'], ['питер', 'Санкт-Петербург'], ['спб', 'Санкт-Петербург'],
  ['подмосковье', 'Московская область'], ['ленобласть', 'Ленинградская область'],
]);

export function canonicalRegion(value: string): string | null {
  const key = optionKey(value.replace(/^\s*(?:г\.|город)\s+/iu, ''));
  return regionByKey.get(key) ?? regionAliases.get(key) ?? null;
}

export function regionMatches(name: string, query: string): boolean {
  if (name === ALL_REGIONS) return true;
  return optionKey(name.replace(/\s*\(.*/u, '')).includes(optionKey(query));
}

const aliases: Record<ChoiceField, Record<string, string>> = {
  employment: { полная: 'Полная занятость', полныйдень: 'Полная занятость', частичная: 'Частичная занятость', неполнаязанятость: 'Частичная занятость', проект: 'Проектная работа', проектная: 'Проектная работа', вахтовыйметод: 'Вахта' },
  workFormat: { удаленный: 'Удалённо', удаленная: 'Удалённо', удаленнаяработа: 'Удалённо', удаленка: 'Удалённо', дистанционно: 'Удалённо', гибридный: 'Гибрид', гибридная: 'Гибрид', гибридныйформат: 'Гибрид', офис: 'На месте работодателя', вофисе: 'На месте работодателя', офисный: 'На месте работодателя', очно: 'На месте работодателя', разъездная: 'Разъездной', разъезднаяработа: 'Разъездной' },
  schedule: { пятидневка: '5/2', пятьнадва: '5/2', дванадва: '2/2', сменный: 'Сменный график', гибкий: 'Свободный', гибкийграфик: 'Свободный', свободныйграфик: 'Свободный', посубботамивоскресеньям: 'По выходным' },
  contract: { поткрф: 'Трудовой договор (ТК РФ)', ткрф: 'Трудовой договор (ТК РФ)', трудовойдоговор: 'Трудовой договор (ТК РФ)', потрудовомудоговору: 'Трудовой договор (ТК РФ)', трудовойдоговорпоткрф: 'Трудовой договор (ТК РФ)', гпх: 'ГПХ с физлицом', гпхсфизическимлицом: 'ГПХ с физлицом', самозанятость: 'ГПХ с самозанятым', самозанятый: 'ГПХ с самозанятым', ип: 'ГПХ с ИП' },
};

export function canonicalChoice(field: ChoiceField, value: string): string | null {
  if (field === 'schedule') value = normalizeSpokenSchedules(value);
  const key = optionKey(value);
  const exact = CHOICE_OPTIONS[field].find((option) => optionKey(option) === key);
  if (exact) return exact;
  if (field === 'schedule') {
    const days = value.match(/^(\d)\s*(?:на|\/)\s*(\d)$/u);
    if (days) return SCHEDULES.find((option) => option === `${days[1]}/${days[2]}`) ?? null;
  }
  return aliases[field][key] ?? null;
}

export function canonicalExperience(value: string): string | null {
  if (!value.trim()) return '';
  const key = optionKey(value);
  const exact = EXPERIENCE.find((option) => optionKey(option) === key);
  if (exact) return exact;
  if (['неважно', 'любойопыт', 'неуказан'].includes(key)) return '';
  if (['нетопыта', 'безопытаработы', 'опытнетребуется'].includes(key)) return 'Без опыта';
  if (!/(?:^|\s)от\s|не менее/iu.test(value) && /(?:до|менее|не больше|не более)\s+\d/iu.test(value)) return null;
  const numeric = value.replace(/одного|один|одна/giu, '1').replace(/трех|трёх|три/giu, '3').replace(/шести|шесть/giu, '6').match(/\d+/u)?.[0];
  return numeric ? EXPERIENCE.find((option) => option.startsWith(`От ${numeric} `)) ?? null : null;
}
