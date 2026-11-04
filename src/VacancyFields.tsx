import { useId } from 'react';
import { NumberInput } from '@neobook/react/components/NumberInput/NumberInput';
import { Select, SelectItem } from '@neobook/react/components/Select/Select';
import { TextField } from '@neobook/react/components/TextField/TextField';
import { ALL_REGIONS, CONTRACTS, EMPLOYMENT, EXPERIENCE, REGION_OPTIONS, regionMatches, SCHEDULES, WORK_FORMATS } from './vacancyOptions';
import type { VacancyFields as Fields } from './vacancy';

const ALL_CHOICES = '__all__';

function MultiChoice({ label, options, value, onChange }: {
  label: string; options: readonly string[]; value: string[]; onChange: (value: string[]) => void;
}) {
  const allSelected = options.every((option) => value.includes(option));
  return <Select<{ id: string }, 'multiple'> className="choice-field" size="lg" label={label} placeholder="Выберите варианты" selectionMode="multiple" selectAllKey={ALL_CHOICES} value={allSelected ? [ALL_CHOICES, ...value] : value} onChange={(keys) => {
    const next = keys.map(String);
    if (next.includes(ALL_CHOICES) && !allSelected) onChange([...options]);
    else if (!next.includes(ALL_CHOICES) && allSelected && next.length === options.length) onChange([]);
    else onChange(next.filter((key) => key !== ALL_CHOICES));
  }}>
    <SelectItem id={ALL_CHOICES}>Все</SelectItem>
    {options.map((option) => <SelectItem id={option} key={option}>{option}</SelectItem>)}
  </Select>;
}

function renderRegion(item: { name: string }) {
  return <SelectItem id={item.name}>{item.name === ALL_REGIONS ? 'Все регионы' : item.name}</SelectItem>;
}

function RegionField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return <Select<{ name: string }, 'multiple'> className="choice-field region-choice" size="lg" label="Регион" placeholder="Выберите города или регионы" selectionMode="multiple" searchable searchFilter={(name, query) => name === 'Все регионы' || regionMatches(name, query)} value={value} onChange={(keys) => {
    const next = keys.map(String);
    if (next.includes(ALL_REGIONS) && !value.includes(ALL_REGIONS)) onChange([ALL_REGIONS]);
    else onChange(next.length > 1 ? next.filter((name) => name !== ALL_REGIONS) : next);
  }} items={REGION_OPTIONS}>{renderRegion}</Select>;
}

export function VacancyFields({ value, onChange }: { value: Fields; onChange: (patch: Partial<Fields>) => void }) {
  const salaryLabel = useId();
  const salaryInvalid = !!value.salaryFrom && !!value.salaryTo && Number(value.salaryFrom) > Number(value.salaryTo);
  return <>
    <TextField size="lg" label="Название вакансии" isRequired maxLength={200} placeholder="Например: менеджер по работе с клиентами" value={value.title} onChange={(title) => onChange({ title })} isInvalid={!value.title.trim()} errorMessage="Укажите название вакансии." />
    <div className="fields-row">
      <RegionField value={value.region} onChange={(region) => onChange({ region })} />
      <Select className="choice-field" size="lg" label="Опыт работы" placeholder="Не указан" selectedKey={value.experience || null} onSelectionChange={(key) => onChange({ experience: String(key ?? '') })}>
        <SelectItem id="">Не указан</SelectItem>
        {EXPERIENCE.map((option) => <SelectItem id={option} key={option}>{option}</SelectItem>)}
      </Select>
    </div>
    <div className="fields-row">
      <div className="salary-field" role="group" aria-labelledby={salaryLabel}>
        <span id={salaryLabel} className="salary-label">Зарплата, ₽</span>
        <div className="salary-range">
          <NumberInput className="salary-number" aria-label="Зарплата от" size="lg" prefix="от" width="100%" showSteppers={false} textAlign="start" minValue={0} maxValue={999_999_999_999.99} formatOptions={{ maximumFractionDigits: 2 }} isInvalid={salaryInvalid} value={value.salaryFrom === '' ? NaN : Number(value.salaryFrom)} onChange={(amount) => onChange({ salaryFrom: Number.isFinite(amount) ? String(amount) : '' })} />
          <span aria-hidden="true">—</span>
          <NumberInput className="salary-number" aria-label="Зарплата до" size="lg" prefix="до" width="100%" showSteppers={false} textAlign="start" minValue={0} maxValue={999_999_999_999.99} formatOptions={{ maximumFractionDigits: 2 }} isInvalid={salaryInvalid} value={value.salaryTo === '' ? NaN : Number(value.salaryTo)} onChange={(amount) => onChange({ salaryTo: Number.isFinite(amount) ? String(amount) : '' })} />
        </div>
        {salaryInvalid && <span className="salary-error" role="alert">Сумма «от» не может быть больше суммы «до».</span>}
      </div>
      <MultiChoice label="Занятость" options={EMPLOYMENT} value={value.employment} onChange={(employment) => onChange({ employment })} />
    </div>
    <MultiChoice label="Формат работы" options={WORK_FORMATS} value={value.workFormat} onChange={(workFormat) => onChange({ workFormat })} />
    <MultiChoice label="График" options={SCHEDULES} value={value.schedule} onChange={(schedule) => onChange({ schedule })} />
    <MultiChoice label="Оформление" options={CONTRACTS} value={value.contract} onChange={(contract) => onChange({ contract })} />
  </>;
}
