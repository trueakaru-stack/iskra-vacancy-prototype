import { NumberInput } from '@neobook/react/components/NumberInput/NumberInput';
import { Select, SelectItem } from '@neobook/react/components/Select/Select';
import { TextField } from '@neobook/react/components/TextField/TextField';
import type { VacancyFields as Fields } from './vacancy';

const EXPERIENCE = ['Нет опыта', 'От 1 года до 3 лет', 'От 3 до 6 лет', 'Более 6 лет'];
const EMPLOYMENT = ['Полная занятость', 'Частичная занятость', 'Проектная работа', 'Подработка', 'Вахта'];
const WORK_FORMATS = ['На месте работодателя', 'Удалённо', 'Гибрид', 'Разъездной'];
const SCHEDULES = ['5/2', '6/1', '4/4', '4/3', '4/2', '3/3', '3/2', '2/2', '2/1', '1/3', '1/2', 'По выходным', 'Свободный', 'Другое'];
const CONTRACTS = ['Трудовой договор', 'ГПХ с физлицом', 'ГПХ с самозанятым', 'ГПХ с ИП'];

function optionsWithValue(options: string[], value: string[]): string[] {
  return [...new Set([...options, ...value.filter(Boolean)])];
}

function MultiChoice({ label, options, value, onChange }: {
  label: string; options: string[]; value: string[]; onChange: (value: string[]) => void;
}) {
  return <Select<{ id: string }, 'multiple'> className="choice-field" size="lg" label={label} placeholder="Выберите варианты" selectionMode="multiple" value={value} onChange={(next) => onChange(next.map(String))}>
    {optionsWithValue(options, value).map((option) => <SelectItem id={option} key={option}>{option === 'Трудовой договор' ? 'Трудовой договор (ТК РФ)' : option}</SelectItem>)}
  </Select>;
}

export function VacancyFields({ value, onChange }: { value: Fields; onChange: (patch: Partial<Fields>) => void }) {
  const salaryInvalid = !!value.salaryFrom && !!value.salaryTo && Number(value.salaryFrom) > Number(value.salaryTo);
  return <>
    <TextField size="lg" label="Название вакансии" isRequired maxLength={200} placeholder="Например: менеджер по работе с клиентами" value={value.title} onChange={(title) => onChange({ title })} isInvalid={!value.title.trim()} errorMessage="Укажите название вакансии." />
    <TextField size="lg" label="Регион" maxLength={200} placeholder="Например: Москва" value={value.region} onChange={(region) => onChange({ region })} />
    <Select className="choice-field" size="lg" label="Опыт работы" placeholder="Не указан" selectedKey={value.experience || null} onSelectionChange={(key) => onChange({ experience: String(key ?? '') })}>
      <SelectItem id="">Не указан</SelectItem>
      {optionsWithValue(EXPERIENCE, [value.experience]).map((option) => <SelectItem id={option} key={option}>{option}</SelectItem>)}
    </Select>
    <div className="salary-field" role="group" aria-labelledby="salary-label">
      <span id="salary-label" className="salary-label">Зарплата, ₽</span>
      <div className="salary-range">
        <NumberInput className="salary-number" aria-label="Зарплата от" size="lg" prefix="от" width="100%" showSteppers={false} textAlign="start" minValue={0} maxValue={999_999_999_999.99} formatOptions={{ maximumFractionDigits: 2 }} isInvalid={salaryInvalid} value={value.salaryFrom === '' ? NaN : Number(value.salaryFrom)} onChange={(amount) => onChange({ salaryFrom: Number.isFinite(amount) ? String(amount) : '' })} />
        <span aria-hidden="true">—</span>
        <NumberInput className="salary-number" aria-label="Зарплата до" size="lg" prefix="до" width="100%" showSteppers={false} textAlign="start" minValue={0} maxValue={999_999_999_999.99} formatOptions={{ maximumFractionDigits: 2 }} isInvalid={salaryInvalid} value={value.salaryTo === '' ? NaN : Number(value.salaryTo)} onChange={(amount) => onChange({ salaryTo: Number.isFinite(amount) ? String(amount) : '' })} />
      </div>
      {salaryInvalid && <span className="salary-error" role="alert">Сумма «от» не может быть больше суммы «до».</span>}
    </div>
    <MultiChoice label="Занятость" options={EMPLOYMENT} value={value.employment} onChange={(employment) => onChange({ employment })} />
    <MultiChoice label="Формат работы" options={WORK_FORMATS} value={value.workFormat} onChange={(workFormat) => onChange({ workFormat })} />
    <MultiChoice label="График" options={SCHEDULES} value={value.schedule} onChange={(schedule) => onChange({ schedule })} />
    <MultiChoice label="Оформление" options={CONTRACTS} value={value.contract} onChange={(contract) => onChange({ contract })} />
  </>;
}
