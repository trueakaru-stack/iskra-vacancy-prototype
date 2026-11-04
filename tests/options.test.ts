import { describe, expect, it } from 'vitest';
import { readFieldPatch } from '../src/vacancy';
import { canonicalExperience, regionMatches } from '../src/vacancyOptions';

describe('голосовые формулировки и справочники', () => {
  it('сводит синонимы формата и оформления к существующим пунктам без дублей', () => {
    expect(readFieldPatch({ workFormat: ['удаленный', 'Удалённо', 'гибридный'], contract: ['по ТК РФ', 'Трудовой договор'] })).toEqual({ workFormat: ['Удалённо', 'Гибрид'], contract: ['Трудовой договор (ТК РФ)'] });
    expect(readFieldPatch({ workFormat: ['Несуществующий формат'] })).toBeNull();
  });

  it('не добавляет в справочник произвольный опыт и не заменяет верхнюю границу нижней', () => {
    expect(canonicalExperience('от трёх лет')).toBe('От 3 лет');
    expect(canonicalExperience('не менее 6 лет')).toBe('От 6 лет');
    expect(canonicalExperience('нет опыта')).toBe('Без опыта');
    expect(canonicalExperience('неважно')).toBe('');
    expect(canonicalExperience('до 3 лет')).toBeNull();
    expect(canonicalExperience('от 5 лет')).toBeNull();
  });

  it('нормализует числовой график, сохраняя порядок рабочих дней и выходных', () => {
    expect(readFieldPatch({ schedule: ['5 на 2', '5/2', 'сменный'] })).toEqual({ schedule: ['5/2', 'Сменный график'] });
    expect(readFieldPatch({ schedule: ['пять на два', 'два на два'] })).toEqual({ schedule: ['5/2', '2/2'] });
    expect(readFieldPatch({ schedule: ['7/0'] })).toBeNull();
  });

  it('поддерживает несколько известных городов и поиск по названию региона', () => {
    expect(readFieldPatch({ region: ['москва', 'Казань', 'Москва'] })).toEqual({ region: ['Москва', 'Казань'] });
    expect(readFieldPatch({ region: ['Москва', 'все регионы'] })).toEqual({ region: ['Вся Россия'] });
    expect(readFieldPatch({ region: ['Несуществующий город'] })).toBeNull();
    expect(regionMatches('Республика Татарстан', 'татарстан')).toBe(true);
    expect(regionMatches('Аксениха (Новосибирская область)', 'Новосибирск')).toBe(false);
    expect(regionMatches('Завьялово (Новосибирская область', 'Новосибирск')).toBe(false);
  });
});
