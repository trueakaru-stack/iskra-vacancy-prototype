import { useMemo, useState } from 'react';
import { ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@neobook/react/components/Button/Button';
import { DataTable, DataTableBody, DataTableCell, DataTableColumn, DataTableHeader, DataTableRow } from '@neobook/react/components/DataTable/DataTable';
import { Modal } from '@neobook/react/components/Modal/Modal';
import { Select, SelectItem } from '@neobook/react/components/Select/Select';
import { Stepper } from '@neobook/react/components/Stepper/Stepper';
import { TextField } from '@neobook/react/components/TextField/TextField';
import { Textarea } from '@neobook/react/components/Textarea/Textarea';
import { generateDescription, reviseVacancy, structureAnswer } from './generation';
import { useSpeech } from './useSpeech';
import { VoiceAnswer } from './VoiceAnswer';
import { answerProgress, appendTranscript, CONDITION_FIELDS, createEmptyDraft, DEMO_VACANCIES, draftError, filterVacancies, isFilled, MAX_ANSWER_LENGTH, QUESTIONS, toVacancyRow, type Answers, type IntakeStage, type VacancyDraft, type VacancyRevision, type VacancyRow, type VacancySections } from './vacancy';

type Phase = 'main' | 'conditions' | 'questions' | 'review';
type Sort = { column: string | number; direction: 'ascending' | 'descending' };
interface SavedVacancy { draft: VacancyDraft; sections: VacancySections; sectionEdits: Partial<VacancySections> }
const STAGES = [{ label: 'Основное' }, { label: 'Условия' }, { label: 'Описание' }, { label: 'Проверка' }];
const PHASES: Phase[] = ['main', 'conditions', 'questions', 'review'];
const PROMPTS = {
  main: 'Назовите должность, регион и требуемый опыт работы.',
  conditions: 'Расскажите о зарплате, занятости, формате работы, графике и оформлении.',
};

function formatDate(date: string | null): string {
  if (!date) return '—';
  const parts = date.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))).replace(' г.', '');
}

function orderedVacancies(rows: VacancyRow[], sort: Sort): VacancyRow[] {
  const key = String(sort.column) as keyof VacancyRow;
  return [...rows].sort((left, right) => {
    const a = left[key], b = right[key];
    if (a === null) return b === null ? 0 : 1;
    if (b === null) return -1;
    const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'ru', { numeric: true });
    return sort.direction === 'ascending' ? result : -result;
  });
}

function detailsOf(draft: VacancyDraft, includeTitle = true): Array<[string, string]> {
  const salary = [draft.salaryFrom && 'от ' + draft.salaryFrom, draft.salaryTo && 'до ' + draft.salaryTo].filter(Boolean).join(' ');
  const details: Array<[string, string]> = [
    ['Название', includeTitle ? draft.title : ''], ['Регион', draft.region], ['Опыт работы', draft.experience],
    ['Зарплата', salary], ['Занятость', draft.employment.join(', ')], ['Формат работы', draft.workFormat.join(', ')],
    ['График', draft.schedule.join(', ')], ['Оформление', draft.contract.join(', ')],
  ];
  return details.filter(([, value]) => isFilled(value));
}

function Details({ draft, includeTitle = true }: { draft: VacancyDraft; includeTitle?: boolean }) {
  return <dl className="review-details">{detailsOf(draft, includeTitle).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function App() {
  const [vacancies, setVacancies] = useState<VacancyRow[]>([...DEMO_VACANCIES]);
  const [savedDrafts, setSavedDrafts] = useState<Record<string, SavedVacancy>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState<Sort>({ column: 'title', direction: 'ascending' });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VacancyDraft>(createEmptyDraft);
  const [sections, setSections] = useState<VacancySections | null>(null);
  const [sectionEdits, setSectionEdits] = useState<Partial<VacancySections>>({});
  const [phase, setPhase] = useState<Phase>('main');
  const [question, setQuestion] = useState(0);
  const [intake, setIntake] = useState({ main: '', conditions: '' });
  const [parsedIntake, setParsedIntake] = useState<{ main: string | null; conditions: string | null }>({ main: null, conditions: null });
  const [operation, setOperation] = useState<'main' | 'conditions' | 'generate' | 'revise' | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [revision, setRevision] = useState<VacancyRevision | null>(null);

  const addTranscript = (text: string) => {
    if (selectedId && editing && !open) {
      setEditText((current) => appendTranscript(current, text));
      setRevision(null);
    } else if (phase === 'main' || phase === 'conditions') {
      setIntake((current) => ({ ...current, [phase]: appendTranscript(current[phase], text) }));
    } else {
      const id = QUESTIONS[question].id;
      setDraft((current) => ({ ...current, answers: { ...current.answers, [id]: appendTranscript(current.answers[id], text) } }));
    }
  };
  const speech = useSpeech(addTranscript);
  const busy = speech.busy || operation !== null;
  const regions = useMemo(() => [...new Set(vacancies.map((item) => item.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [vacancies]);
  const filtered = useMemo(() => orderedVacancies(filterVacancies(vacancies, query, region === 'all' ? '' : region), sort), [vacancies, query, region, sort]);
  const selectedRow = vacancies.find((row) => row.id === selectedId);
  const saved = selectedId ? savedDrafts[selectedId] : undefined;
  const visibleDraft = saved ? { ...saved.draft, ...revision?.fields } : { ...createEmptyDraft(), title: selectedRow?.title ?? '', region: selectedRow?.region ?? '' };
  const visibleSections = saved ? { ...saved.sections, ...revision?.sections } : null;
  const currentAnswer = phase === 'main' || phase === 'conditions' ? intake[phase] : draft.answers[QUESTIONS[question].id];
  const operationLabel = operation === 'generate' ? 'Создаём описание' : operation === 'revise' ? 'Готовим изменения' : 'Обрабатываем ответ';

  const leaveDetails = () => {
    if (busy) return;
    setSelectedId(null); setEditing(false); setRevision(null); setEditText(''); setError(''); speech.reset();
  };
  const moveBack = () => {
    speech.reset(); setError('');
    if (phase === 'conditions') setPhase('main');
    else if (phase === 'questions') {
      if (question > 0) setQuestion((current) => current - 1);
      else setPhase('conditions');
    } else if (phase === 'review') setPhase('questions');
  };
  const moveForward = async () => {
    speech.reset(); setError('');
    if (currentAnswer.length > MAX_ANSWER_LENGTH) return;
    if (phase === 'main' || phase === 'conditions') {
      const stage: IntakeStage = phase;
      if (stage === 'main' && !isFilled(intake.main)) return;
      if (parsedIntake[stage] === intake[stage]) { setPhase(stage === 'main' ? 'conditions' : 'questions'); return; }
      setOperation(stage);
      try {
        const empty = createEmptyDraft();
        const fields = stage === 'conditions' && !isFilled(intake.conditions)
          ? Object.fromEntries(CONDITION_FIELDS.map((key) => [key, empty[key]]))
          : await structureAnswer(stage, intake[stage]);
        const next = { ...draft, ...fields };
        const invalid = draftError(next);
        if (invalid) throw new Error(invalid);
        setDraft(next); setParsedIntake((current) => ({ ...current, [stage]: intake[stage] }));
        setPhase(stage === 'main' ? 'conditions' : 'questions');
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось обработать ответ. Попробуйте ещё раз.'); }
      finally { setOperation(null); }
      return;
    }
    if (phase !== 'questions' || !isFilled(currentAnswer)) return;
    if (question < 3) { setQuestion((current) => current + 1); return; }
    setOperation('generate');
    try {
      const generated = await generateDescription(draft.title, draft.answers);
      setSections({ ...generated, ...sectionEdits }); setPhase('review');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось подготовить описание.'); }
    finally { setOperation(null); }
  };
  const save = () => {
    if (!sections || draftError(draft)) return;
    const id = 'draft-' + Date.now();
    setSavedDrafts((current) => ({ ...current, [id]: { draft, sections, sectionEdits } }));
    setVacancies((current) => [toVacancyRow(draft, id), ...current]);
    setSelectedId(id); setEditing(false); setRevision(null); setEditText('');
    setDraft(createEmptyDraft()); setSections(null); setSectionEdits({});
    setIntake({ main: '', conditions: '' }); setParsedIntake({ main: null, conditions: null });
    setPhase('main'); setQuestion(0); setOpen(false);
  };
  const submitEdit = async () => {
    if (!saved || !selectedId || !isFilled(editText) || editText.length > MAX_ANSWER_LENGTH) return;
    if (revision) {
      const updated = { draft: visibleDraft, sections: visibleSections ?? saved.sections, sectionEdits: { ...saved.sectionEdits, ...revision.sections } };
      setSavedDrafts((current) => ({ ...current, [selectedId]: updated }));
      setVacancies((current) => current.map((row) => row.id === selectedId ? toVacancyRow(updated.draft, selectedId) : row));
      setEditing(false); setRevision(null); setEditText(''); setError(''); speech.reset();
      return;
    }
    speech.reset(); setError(''); setOperation('revise');
    try {
      const proposed = await reviseVacancy(editText, saved.draft, saved.sections);
      const invalid = draftError({ ...saved.draft, ...proposed.fields });
      if (invalid) throw new Error(invalid);
      setRevision(proposed);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось подготовить изменения.'); }
    finally { setOperation(null); }
  };

  return <div className="app-shell">
    <aside className="sidebar" aria-label="Навигация">
      <div className="brand" role="img" aria-label="Искра, Лаборатория ПИИ">
        <span className="brand-mark"><svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 1C12 10.9 13.1 12 23 12C13.1 12 12 13.1 12 23C12 13.1 10.9 12 1 12C10.9 12 12 10.9 12 1ZM12 9C12 10.6 13.4 12 15 12C13.4 12 12 13.4 12 15C12 13.4 10.6 12 9 12C10.6 12 12 10.6 12 9Z" /></svg></span>
        <span className="brand-copy"><strong>Искра</strong><span>Лаборатория ПИИ</span></span>
        <ChevronsUpDown className="brand-chevron" aria-hidden="true" size={16} />
      </div>
      <nav aria-label="Основное меню">
        <Button className="nav-item" variant="ghost" aria-current="page" onPress={leaveDetails} isDisabled={busy}>Вакансии</Button>
        <Button className="nav-item" variant="ghost" isDisabled>Подключение вакансий</Button>
      </nav>
    </aside>
    <main className="content">
      {selectedRow ? <>
        <div className="page-heading detail-heading"><h1>{visibleDraft.title}</h1><Button variant="secondary" size="lg" onPress={leaveDetails} isDisabled={busy}>К вакансиям</Button></div>
        <article className="vacancy-detail" aria-label="Описание вакансии">
          <Details draft={visibleDraft} includeTitle={false} />
          {saved && !editing && <div className="detail-actions"><Button variant="primary" size="lg" onPress={() => { setEditing(true); setError(''); speech.reset(); }}>Изменить голосом</Button></div>}
          {editing && <section className="voice-editor" aria-labelledby="edit-heading">
            <h2 id="edit-heading">{revision ? 'Проверка изменений' : 'Что изменить?'}</h2>
            <VoiceAnswer value={editText} onChange={(value) => { setEditText(value); setRevision(null); }} speech={speech} progress={100} disabled={operation !== null} />
            {editText.length > MAX_ANSWER_LENGTH && <p className="generation-error" role="alert">Сократите ответ до 4000 символов, чтобы продолжить.</p>}
            {error && <p className="generation-error" role="alert">{error}</p>}
            <div className="modal-actions">
              <Button variant="secondary" size="lg" isDisabled={busy} onPress={() => { setEditing(false); setRevision(null); setEditText(''); setError(''); speech.reset(); }}>Отмена</Button>
              <Button className="generation-button" variant="primary" size="lg" isPending={operation === 'revise'} isDisabled={speech.busy || !isFilled(editText) || editText.length > MAX_ANSWER_LENGTH} onPress={() => void submitEdit()}>{revision ? 'Сохранить изменения' : 'Показать изменения'}</Button>
            </div>
          </section>}
          {visibleSections ? <div className="description-sections">{QUESTIONS.map(({ id, section }) => <section key={id}><h2>{section}</h2><p>{visibleSections[id] || '—'}</p></section>)}</div> : <p className="empty-description">Описание вакансии не добавлено.</p>}
        </article>
      </> : <>
        <div className="page-heading"><h1>Вакансии</h1></div>
        <div className="table-controls">
          <TextField className="search-field" size="lg" label="Поиск по названию" placeholder="Поиск по названию..." value={query} onChange={setQuery} />
          <div className="region-wrap"><CirclePlus className="region-icon" size={18} aria-hidden="true" />
            <Select className="region-filter" size="lg" label="Фильтр региона" placeholder="Регион" selectedKey={region === 'all' ? null : region} onSelectionChange={(key) => setRegion(String(key ?? 'all'))}>
              <SelectItem id="all">Все регионы</SelectItem>{regions.map((item) => <SelectItem id={item} key={item}>{item}</SelectItem>)}
            </Select>
          </div>
          <Button className="add-button" variant="primary" size="lg" leadingIcon={<CirclePlus className="add-icon" size={18} aria-hidden="true" />} onPress={() => { setError(''); speech.reset(); setOpen(true); }}>Добавить вакансию</Button>
        </div>
        <DataTable aria-label="Вакансии" className="vacancy-table" density="cozy" isRich sortDescriptor={sort} onSortChange={(next) => setSort({ column: next.column ?? 'title', direction: next.direction })} minInlineSize={720}>
          <DataTableHeader>
            <DataTableColumn id="title" isRowHeader allowsSorting width="51%" minWidth={280}>Название</DataTableColumn>
            <DataTableColumn id="region" allowsSorting width="11%">Регион</DataTableColumn>
            <DataTableColumn id="responses" allowsSorting width="13%">Отклики</DataTableColumn>
            <DataTableColumn id="expires" allowsSorting width="25%">Истекает</DataTableColumn>
          </DataTableHeader>
          <DataTableBody items={filtered} renderEmptyState={() => 'Вакансии не найдены'}>{(item) => <DataTableRow id={item.id} onAction={() => { setSelectedId(item.id); setEditing(false); setRevision(null); setEditText(''); setError(''); speech.reset(); }}>
            <DataTableCell>{item.title}</DataTableCell><DataTableCell>{item.region || '—'}</DataTableCell><DataTableCell>{item.responses === null ? '—' : item.responses}</DataTableCell><DataTableCell>{formatDate(item.expires)}</DataTableCell>
          </DataTableRow>}</DataTableBody>
        </DataTable>
      </>}
      {operation && !open && <span className="visually-hidden" role="status">{operationLabel}</span>}
    </main>
    <Modal isOpen={open} onOpenChange={(next) => { if (!busy) { if (!next) speech.reset(); setOpen(next); } }} isDismissable={!busy} backdrop="blur" size="lg" radius="2xl" title="Добавить вакансию" className="vacancy-modal" overlayClassName="vacancy-modal-overlay" footer={<div className="modal-actions">
      {phase !== 'main' && <Button variant="secondary" size="lg" onPress={moveBack} isDisabled={busy}>Назад</Button>}
      {phase === 'review' ? <Button variant="primary" size="lg" onPress={save} isDisabled={!!draftError(draft)}>Сохранить</Button> : <Button className="generation-button" variant="primary" size="lg" aria-label={operation ? operationLabel : undefined} onPress={() => void moveForward()} isPending={operation !== null} isDisabled={speech.busy || currentAnswer.length > MAX_ANSWER_LENGTH || ((phase === 'main' || phase === 'questions') && !isFilled(currentAnswer))}>{phase === 'questions' && question === 3 ? 'Создать описание' : 'Далее'}</Button>}
    </div>}>
      <Stepper className="vacancy-steps" role="group" aria-label="Этапы создания вакансии" steps={STAGES} current={PHASES.indexOf(phase)} />
      {operation && <span className="visually-hidden" role="status">{operationLabel}</span>}
      <section key={phase + '-' + question} className="modal-content" aria-labelledby="section-title">
        <h2 id="section-title">{phase === 'main' ? 'Основное' : phase === 'conditions' ? 'Условия' : phase === 'questions' ? 'Описание вакансии' : 'Проверка описания'}</h2>
        {phase !== 'review' ? <div className="question-area">
          {phase === 'questions' && <p className="question-count">Вопрос {question + 1} из 4</p>}
          <p className="question-text">{phase === 'questions' ? QUESTIONS[question].text : PROMPTS[phase]}</p>
          <VoiceAnswer value={currentAnswer} onChange={(value) => {
            if (phase === 'main' || phase === 'conditions') setIntake((current) => ({ ...current, [phase]: value }));
            else { const id = QUESTIONS[question].id; setDraft((current) => ({ ...current, answers: { ...current.answers, [id]: value } })); }
          }} speech={speech} progress={answerProgress(draft.answers)} disabled={operation !== null} />
          {currentAnswer.length > MAX_ANSWER_LENGTH && <p className="generation-error" role="alert">Сократите ответ до 4000 символов, чтобы продолжить.</p>}
          {error && <p className="generation-error" role="alert">{error}</p>}
        </div> : sections && <div className="fields">
          <Details draft={draft} />
          {QUESTIONS.map(({ id, section }) => <Textarea size="lg" key={id} label={section} rows={4} value={sections[id]} onChange={(value) => { setSections((current) => current ? { ...current, [id]: value } : current); setSectionEdits((current) => ({ ...current, [id]: value })); }} />)}
        </div>}
      </section>
    </Modal>
  </div>;
}
