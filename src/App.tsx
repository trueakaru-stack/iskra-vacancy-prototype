import { useMemo, useState } from 'react';
import { Check, CircleAlert, List, LoaderCircle, Mic, Plus, Search, Sparkle, Square } from 'lucide-react';
import { Button } from '@neobook/react/components/Button/Button';
import { DataTable, DataTableBody, DataTableCell, DataTableColumn, DataTableHeader, DataTableRow } from '@neobook/react/components/DataTable/DataTable';
import { Modal } from '@neobook/react/components/Modal/Modal';
import { ProgressRing } from '@neobook/react/components/ProgressRing/ProgressRing';
import { Select, SelectItem } from '@neobook/react/components/Select/Select';
import { TextField } from '@neobook/react/components/TextField/TextField';
import { Textarea } from '@neobook/react/components/Textarea/Textarea';
import { generateDescription } from './generation';
import { useSpeech } from './useSpeech';
import { answerProgress, appendTranscript, createEmptyDraft, DEMO_VACANCIES, filterVacancies, isFilled, QUESTIONS, toVacancyRow, type Answers, type VacancyDraft, type VacancyRow, type VacancySections } from './vacancy';

type Phase = 'main' | 'conditions' | 'questions' | 'review';
type Sort = { column: string | number; direction: 'ascending' | 'descending' };

function formatDate(date: string | null): string {
  if (!date) return '—';
  const parts = date.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))).replace(' г.', '');
}

function orderedVacancies(rows: VacancyRow[], sort: Sort): VacancyRow[] {
  const key = String(sort.column) as keyof VacancyRow;
  return [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (a === null) return b === null ? 0 : 1;
    if (b === null) return -1;
    const result = typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'ru', { numeric: true });
    return sort.direction === 'ascending' ? result : -result;
  });
}

export function App() {
  const [vacancies, setVacancies] = useState<VacancyRow[]>([...DEMO_VACANCIES]);
  const [savedDrafts, setSavedDrafts] = useState<Record<string, { draft: VacancyDraft; sections: VacancySections }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState<Sort>({ column: 'processed', direction: 'ascending' });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VacancyDraft>(createEmptyDraft);
  const [sections, setSections] = useState<VacancySections | null>(null);
  const [phase, setPhase] = useState<Phase>('main');
  const [question, setQuestion] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const regions = useMemo(() => [...new Set(vacancies.map((item) => item.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')), [vacancies]);
  const filtered = useMemo(() => orderedVacancies(filterVacancies(vacancies, query, region === 'all' ? '' : region), sort), [vacancies, query, region, sort]);

  const setField = (name: keyof Omit<VacancyDraft, 'answers'>, value: string) => setDraft((current) => ({ ...current, [name]: value }));
  const setAnswer = (id: keyof Answers, value: string) => setDraft((current) => ({ ...current, answers: { ...current.answers, [id]: value } }));
  const addTranscript = (text: string) => setDraft((current) => ({
    ...current,
    answers: { ...current.answers, [QUESTIONS[question].id]: appendTranscript(current.answers[QUESTIONS[question].id], text) },
  }));
  const speech = useSpeech(addTranscript);

  const moveBack = () => {
    speech.reset();
    setGenerationError('');
    if (phase === 'conditions') setPhase('main');
    else if (phase === 'questions') {
      if (question > 0) setQuestion((current) => current - 1);
      else setPhase('conditions');
    } else if (phase === 'review') setPhase('questions');
  };

  const moveForward = async () => {
    speech.reset();
    setGenerationError('');
    if (phase === 'main') { setPhase('conditions'); return; }
    if (phase === 'conditions') { setPhase('questions'); return; }
    if (phase !== 'questions' || !isFilled(draft.answers[QUESTIONS[question].id])) return;
    if (question < QUESTIONS.length - 1) { setQuestion((current) => current + 1); return; }
    setGenerating(true);
    try {
      setSections(await generateDescription(draft.title, draft.answers));
      setPhase('review');
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Не удалось подготовить описание.');
    } finally { setGenerating(false); }
  };

  const save = () => {
    if (!isFilled(draft.title) || !sections) return;
    const id = editingId ?? `draft-${Date.now()}`;
    setSavedDrafts((current) => ({ ...current, [id]: { draft, sections } }));
    setVacancies((current) => editingId
      ? current.map((item) => item.id === id ? toVacancyRow(draft, id) : item)
      : [toVacancyRow(draft, id), ...current]);
    setEditingId(null);
    setDraft(createEmptyDraft());
    setSections(null);
    setPhase('main');
    setQuestion(0);
    setOpen(false);
  };

  const openSaved = (id: string) => {
    const saved = savedDrafts[id];
    if (!saved) return;
    setEditingId(id);
    setDraft(saved.draft);
    setSections(saved.sections);
    setQuestion(3);
    setPhase('review');
    setGenerationError('');
    speech.reset();
    setOpen(true);
  };

  const title = phase === 'main' ? 'Основное' : phase === 'conditions' ? 'Условия' : phase === 'questions' ? 'Описание вакансии' : 'Проверка описания';
  const busy = speech.busy || generating;
  const salary = [draft.salaryFrom && `от ${draft.salaryFrom}`, draft.salaryTo && `до ${draft.salaryTo}`].filter(Boolean).join(' ');
  const detailCandidates: Array<[string, string]> = [
    ['Название', draft.title], ['Регион', draft.region], ['Опыт работы', draft.experience],
    ['Зарплата', salary], ['Занятость', draft.employment], ['Формат работы', draft.workFormat],
    ['График', draft.schedule], ['Оформление', draft.contract],
  ];
  const details = detailCandidates.filter(([, value]) => isFilled(value));

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Навигация">
        <div className="brand">
          <span className="brand-mark"><Sparkle aria-hidden="true" size={16} /></span>
          <span className="brand-copy"><strong>Искра</strong><span>Лаборатория ПИИ</span></span>
        </div>
        <nav aria-label="Основное меню"><div className="nav-current" aria-current="page"><List size={17} aria-hidden="true" />Все вакансии</div></nav>
      </aside>

      <main className="content">
        <div className="page-heading"><h1>Вакансии</h1></div>
        <div className="table-controls">
          <TextField className="search-field" label="Поиск по названию" placeholder="Поиск по названию..." value={query} onChange={setQuery} prefix={<Search size={16} />} />
          <Select className="region-filter" label="Регион" placeholder="Регион" selectedKey={region === 'all' ? null : region} onSelectionChange={(key) => setRegion(String(key ?? 'all'))}>
            <SelectItem id="all">Все регионы</SelectItem>
            {regions.map((item) => <SelectItem id={item} key={item}>{item}</SelectItem>)}
          </Select>
          <Button className="add-button" variant="primary" leadingIcon={<Plus size={16} />} onPress={() => {
            if (editingId !== null) {
              setEditingId(null);
              setDraft(createEmptyDraft());
              setSections(null);
              setPhase('main');
              setQuestion(0);
            }
            setOpen(true);
          }}>Добавить вакансию</Button>
        </div>
        <DataTable aria-label="Вакансии" className="vacancy-table" density="cozy" isRich sortDescriptor={sort} onSortChange={(next) => setSort({ column: next.column ?? 'title', direction: next.direction })} minInlineSize={720}>
          <DataTableHeader>
            <DataTableColumn id="title" isRowHeader allowsSorting minWidth={280}>Название</DataTableColumn>
            <DataTableColumn id="region" allowsSorting width={150}>Регион</DataTableColumn>
            <DataTableColumn id="responses" allowsSorting width={130}>Отклики</DataTableColumn>
            <DataTableColumn id="processed" allowsSorting width={150}>Обработано</DataTableColumn>
            <DataTableColumn id="expires" allowsSorting width={155}>Истекает</DataTableColumn>
          </DataTableHeader>
          <DataTableBody items={filtered} renderEmptyState={() => 'Вакансии не найдены'}>
            {(item) => <DataTableRow id={item.id} {...(savedDrafts[item.id] ? { onAction: () => openSaved(item.id) } : {})}>
              <DataTableCell>{item.title}</DataTableCell>
              <DataTableCell>{item.region || '—'}</DataTableCell>
              <DataTableCell>{item.responses === null ? '—' : item.responses}</DataTableCell>
              <DataTableCell>{item.processed === null ? '—' : `${item.processed}%`}</DataTableCell>
              <DataTableCell>{formatDate(item.expires)}</DataTableCell>
            </DataTableRow>}
          </DataTableBody>
        </DataTable>
        <p className="table-count">Всего: {filtered.length}</p>
      </main>

      <Modal isOpen={open} onOpenChange={(next) => { if (!busy) setOpen(next); }} isDismissable={!busy} backdrop="blur" size="lg" title="Добавить вакансию" className="vacancy-modal" footer={
        <div className="modal-actions">
          {phase !== 'main' && <Button variant="secondary" onPress={moveBack} isDisabled={busy}>Назад</Button>}
          {phase === 'review'
            ? <Button variant="primary" onPress={save} isDisabled={!isFilled(draft.title)}>Сохранить</Button>
            : <Button variant="primary" onPress={() => void moveForward()} isDisabled={speech.busy || (phase === 'questions' && !isFilled(draft.answers[QUESTIONS[question].id]))} isPending={generating}>
                {phase === 'questions' && question === 3 ? 'Создать описание' : 'Далее'}
              </Button>}
        </div>
      }>
        <section className="modal-content" aria-labelledby="section-title">
          <h2 id="section-title">{title}</h2>
          {phase === 'main' && <div className="fields">
            <TextField label="Название вакансии" isRequired placeholder="Например, руководитель отдела маркетинга" value={draft.title} onChange={(value) => setField('title', value)} />
            <TextField label="Регион" placeholder="Например, Москва" value={draft.region} onChange={(value) => setField('region', value)} />
            <TextField label="Опыт работы" placeholder="Например, от 3 лет" value={draft.experience} onChange={(value) => setField('experience', value)} />
          </div>}
          {phase === 'conditions' && <div className="fields">
            <div className="field-pair">
              <TextField label="Зарплата от" placeholder="Сумма" value={draft.salaryFrom} onChange={(value) => setField('salaryFrom', value)} inputMode="numeric" />
              <TextField label="Зарплата до" placeholder="Сумма" value={draft.salaryTo} onChange={(value) => setField('salaryTo', value)} inputMode="numeric" />
            </div>
            <TextField label="Занятость" placeholder="Например, полная" value={draft.employment} onChange={(value) => setField('employment', value)} />
            <TextField label="Формат работы" placeholder="Например, удалённо" value={draft.workFormat} onChange={(value) => setField('workFormat', value)} />
            <TextField label="График" placeholder="Например, 5/2" value={draft.schedule} onChange={(value) => setField('schedule', value)} />
            <TextField label="Оформление" placeholder="Например, трудовой договор" value={draft.contract} onChange={(value) => setField('contract', value)} />
            <Textarea label="Что предлагаем" rows={3} value={draft.benefits} onChange={(value) => setField('benefits', value)} />
            <Textarea label="Будет преимуществом" rows={3} value={draft.advantages} onChange={(value) => setField('advantages', value)} />
          </div>}
          {phase === 'questions' && <div className="question-area">
            <p className="question-count">Вопрос {question + 1} из 4</p>
            <p className="question-text">{QUESTIONS[question].text}</p>
            <div className="answer-wrap">
              <Textarea className="answer-field" label="Ваш ответ" placeholder="Введите ответ или расскажите голосом" rows={6} value={draft.answers[QUESTIONS[question].id]} onChange={(value) => setAnswer(QUESTIONS[question].id, value)} />
              <div className="voice-control">
                {speech.state === 'listening' && <span className="voice-level" aria-hidden="true">{[0.45, 0.8, 1, 0.65, 0.35].map((weight, index) => <span key={index} style={{ transform: `scaleY(${Math.max(0.18, speech.level * weight)})` }} />)}</span>}
                <div className="voice-ring"><ProgressRing size="sm" value={answerProgress(draft.answers)} aria-label="Заполненность ответов" valueLabel={<span aria-hidden="true" />} />
                  <Button variant="primary" size="sm" isIconOnly className="voice-button" aria-label={speech.state === 'listening' ? 'Остановить запись' : speech.state === 'error' ? 'Повторить запись' : 'Начать запись'} isDisabled={speech.state === 'starting' || speech.state === 'processing'} onPress={() => speech.state === 'listening' ? speech.stop() : void speech.start()}>
                    {speech.state === 'listening' ? <Square size={14} fill="currentColor" /> : speech.state === 'processing' || speech.state === 'starting' ? <LoaderCircle size={17} className="spinner" /> : speech.state === 'success' ? <Check size={18} /> : speech.state === 'error' ? <CircleAlert size={18} /> : <Mic size={18} />}
                  </Button>
                </div>
              </div>
            </div>
            {speech.message && <p className={speech.state === 'error' ? 'voice-message error' : 'voice-message'} role="status">{speech.message}</p>}
            {generationError && <p className="generation-error" role="alert">{generationError}</p>}
          </div>}
          {phase === 'review' && sections && <div className="fields">
            {details.length > 0 && <dl className="review-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            {QUESTIONS.map(({ id, section }) => <Textarea key={id} label={section} rows={4} value={sections[id]} onChange={(value) => setSections((current) => current ? { ...current, [id]: value } : current)} />)}
            {draft.advantages && <Textarea label="Будет преимуществом" rows={3} value={draft.advantages} onChange={(value) => setField('advantages', value)} />}
            {draft.benefits && <Textarea label="Что предлагаем" rows={3} value={draft.benefits} onChange={(value) => setField('benefits', value)} />}
            {!isFilled(draft.title) && <p className="generation-error" role="alert">Укажите название вакансии на шаге «Основное», чтобы сохранить черновик.</p>}
          </div>}
        </section>
      </Modal>
    </div>
  );
}
