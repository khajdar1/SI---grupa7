"use client";

import Link from 'next/link';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { api } from '../../lib/api';
import { Category } from '../../models/Category';

type CompanyOption = {
  id: number;
  name: string;
  contact: string | null;
  type: string | null;
};

type AttachmentDraft = {
  key: string;
  file: File;
  mimeType: string;
};

type FieldErrorKey =
  | 'companyId'
  | 'categoryId'
  | 'location'
  | 'description'
  | 'reporterName'
  | 'reporterEmail'
  | 'reporterPhone'
  | 'templateId'
  | 'attachments';

type FieldErrors = Partial<Record<FieldErrorKey, string>>;

type IntakeTemplate = {
  id: string;
  title: string;
  description: string;
};

type ReportMode = 'regular' | 'emergency';

const intakeTemplates: IntakeTemplate[] = [
  {
    id: 'power-outage',
    title: 'Nestanak struje',
    description: 'Kritičan prekid napajanja ili parcijalni kvar na elektroinstalacijama.',
  },
  {
    id: 'water-leak',
    title: 'Curenje vode',
    description: 'Hitno curenje, poplava ili kvar na vodovodnoj instalaciji.',
  },
  {
    id: 'elevator-failure',
    title: 'Kvar lifta',
    description: 'Zastoj lifta, zaglavljeni korisnici ili problem s upravljačkom jedinicom.',
  },
  {
    id: 'network-outage',
    title: 'Nestanak mreže',
    description: 'Problemi s internetskom konekcijom, switch infrastrukturom ili Wi-Fi pokrivenošću.',
  },
];

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function inferMimeType(file: File): string {
  if (file.type && allowedMimeTypes.has(file.type)) {
    return file.type;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return file.type || 'application/octet-stream';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('bs-BA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Page() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reportMode, setReportMode] = useState<ReportMode>('regular');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(intakeTemplates[0].id);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState<{
    faultReportId: number;
    interventionId: number;
    referenceNumber: string;
    receivedAt: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const auth = Boolean(token);
    setIsAuthenticated(auth);
    // Default to emergency for guests, regular for authenticated users
    setReportMode(auth ? 'regular' : 'emergency');

    const loadIntakeData = async () => {
      try {
        const [companyResponse, categoryResponse] = await Promise.all([
          api.get('/companies'),
          api.get('/categories'),
        ]);

        setCompanies(companyResponse.data);
        setCategories(categoryResponse.data.filter((category: Category) => category.active));

        if (companyResponse.data.length > 0) {
          setSelectedCompanyId(String(companyResponse.data[0].id));
        }

        const firstActiveCategory = categoryResponse.data.find((category: Category) => category.active);
        if (firstActiveCategory) {
          setSelectedCategoryId(String(firstActiveCategory.id));
        }
      } catch (_error) {
        setLoadError('Neuspješno učitavanje inicijalnih podataka za prijavu kvara.');
      } finally {
        setLoading(false);
      }
    };

    void loadIntakeData();
  }, []);

  const selectedTemplate = intakeTemplates.find((template) => template.id === selectedTemplateId) ?? intakeTemplates[0];

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFieldErrors((current) => ({
        ...current,
        location: 'Preglednik ne podržava automatsko određivanje lokacije.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = Number(position.coords.latitude.toFixed(6));
        const nextLongitude = Number(position.coords.longitude.toFixed(6));

        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setLocation(`Automatski detektovana lokacija (${nextLatitude}, ${nextLongitude})`);
        setFieldErrors((current) => ({ ...current, location: undefined }));
      },
      () => {
        setFieldErrors((current) => ({
          ...current,
          location: 'Automatsko određivanje lokacije nije odobreno ili nije dostupno.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Attachments are available only for regular reports.
    if (!isAuthenticated && reportMode === 'emergency') {
      setFieldErrors((current) => ({
        ...current,
        attachments: 'Upload je dostupan samo prijavljenim korisnicima.',
      }));
      event.target.value = '';
      return;
    }

    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const nextAttachments = files.map((file) => ({
      key: crypto.randomUUID(),
      file,
      mimeType: inferMimeType(file),
    }));

    setAttachments((current) => [...current, ...nextAttachments]);
    setFieldErrors((current) => ({ ...current, attachments: undefined }));
    event.target.value = '';
  };

  const removeAttachment = (key: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.key !== key));
  };

  const applyServerFields = (errors: Array<{ field: string; message: string }>) => {
    const nextErrors: FieldErrors = {};

    for (const error of errors) {
      if (
        error.field === 'companyId' ||
        error.field === 'categoryId' ||
        error.field === 'location' ||
        error.field === 'description' ||
        error.field === 'reporterName' ||
        error.field === 'reporterEmail' ||
        error.field === 'reporterPhone' ||
        error.field === 'templateId' ||
        error.field === 'attachments'
      ) {
        nextErrors[error.field] = error.message;
      }
    }

    setFieldErrors(nextErrors);
  };

  async function fileToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setFieldErrors({});

    try {
      // client-side validation per flow
      if (reportMode === 'regular') {
        const errors: FieldErrors = {};
        if (!selectedCompanyId) errors.companyId = 'Firma je obavezna za redovnu prijavu.';
        if (!selectedCategoryId) errors.categoryId = 'Kategorija je obavezna za redovnu prijavu.';
        if (!location || location.trim().length < 3) errors.location = 'Lokacija mora imati najmanje 3 znaka.';
        if (!description || description.trim().length === 0) errors.description = 'Opis je obavezan za redovnu prijavu.';

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return;
        }
      }

      if (reportMode === 'emergency' && !isAuthenticated) {
        // guests must provide name and phone
        const errors: FieldErrors = {};
        if (!reporterName || reporterName.trim().length < 2) errors.reporterName = 'Ime i prezime su obavezni za hitnu prijavu.';
        if (!reporterPhone || reporterPhone.trim().length < 5) errors.reporterPhone = 'Broj telefona je obavezan za hitnu prijavu.';

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return;
        }
      }

      const attachmentsPayload = attachments.length
        ? await Promise.all(
            attachments.map(async (attachment) => ({
              fileName: attachment.file.name,
              mimeType: attachment.mimeType,
              fileSize: attachment.file.size,
              fileContent: await fileToBase64(attachment.file),
            })),
          )
        : [];

      const selectedTemplate = intakeTemplates.find((template) => template.id === selectedTemplateId) ?? intakeTemplates[0];
      const templateId = reportMode === 'emergency' ? selectedTemplate.id : 'regular-report';
      const templateName = reportMode === 'emergency' ? selectedTemplate.title : 'Redovna prijava';

      // build payload depending on mode
      const payload: Record<string, unknown> = {
        templateId,
        templateName,
        isAuthenticated,
        latitude,
        longitude,
        attachments: attachmentsPayload,
      };

      if (reportMode === 'regular') {
        payload.companyId = Number(selectedCompanyId);
        payload.categoryId = Number(selectedCategoryId);
        payload.location = location;
        payload.description = description;
      } else {
        // emergency
        // include reporter fields only if provided (authenticated users may omit them)
        if (reporterName) payload.reporterName = reporterName;
        if (reporterEmail) payload.reporterEmail = reporterEmail;
        if (reporterPhone) payload.reporterPhone = reporterPhone;
        payload.location = '';
        payload.description = '';
        // Ensure all reporter fields are provided (or empty string)
        payload.reporterName = reporterName || '';
        payload.reporterEmail = reporterEmail || '';
        payload.reporterPhone = reporterPhone || '';
      }

      const response = await api.post('/fault-reports', payload);

      setConfirmation(response.data);
      setDescription('');
      setReporterName('');
      setReporterEmail('');
      setReporterPhone('');
      setAttachments([]);
      setLocation('');
      setLatitude(null);
      setLongitude(null);
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: {
            error?: {
              message?: string;
              fields?: Array<{ field: string; message: string }>;
            };
          };
        };
      };
      const responseError = apiError.response?.data?.error;

      if (responseError?.fields) {
        applyServerFields(responseError.fields);
      }

      setSubmitError(responseError?.message ?? 'Slanje prijave nije uspjelo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="intake-layout">
      <article className="panel stack-tight">
        <div className="section-heading">
          <span className="section-kicker">Javna prijava</span>
          <h1 className="section-title">Prijava kvara</h1>
          <p className="section-copy">
            Brzi obrazac za prijavu kvara bez obaveze registracije. Koordinator odmah dobija novu intervenciju, a
            korisnik potvrdu o prijemu.
          </p>
        </div>

        <div className="tag-row">
          <span className="tag tag--muted">Ne zahtijeva prijavu</span>
          <span className="tag tag--muted">Upload samo za prijavljenе (redovna)</span>
          <span className="tag tag--muted">Automatska intervencija</span>
        </div>

        {loadError && <div className="notice notice--error">{loadError}</div>}
        {submitError && <div className="notice notice--error">{submitError}</div>}

        {confirmation && (
          <div className="notice notice--success">
            <strong>Prijava je zaprimljena.</strong>
            <span>
              Broj intervencije {confirmation.referenceNumber} je generisan {formatTimestamp(confirmation.receivedAt)}.
            </span>
          </div>
        )}

        <form className="form-grid form-grid--intake" onSubmit={handleSubmit}>
          <div className="field field--full">
            <div className="section-heading section-heading--compact">
              <span className="section-kicker">Tip prijave</span>
              <h2 className="section-title">
                {isAuthenticated ? 'Redovna ili hitna prijava' : 'Hitna prijava'}
              </h2>
            </div>
            <div className="button-row">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className={`button ${reportMode === 'regular' ? 'button--solid' : 'button--ghost'}`}
                    onClick={() => setReportMode('regular')}
                  >
                    Redovna prijava
                  </button>
                  <button
                    type="button"
                    className={`button ${reportMode === 'emergency' ? 'button--solid' : 'button--ghost'}`}
                    onClick={() => setReportMode('emergency')}
                  >
                    Hitna prijava
                  </button>
                </>
              ) : (
                <span className="tag tag--muted">Dostupna je samo hitna prijava za neregistrirane korisnike.</span>
              )}
            </div>
          </div>

          {reportMode === 'regular' && (
            <div className="form-grid form-grid--two-columns field--full">
              <label className="field">
                <span>Firma *</span>
                <select
                  value={selectedCompanyId}
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                  disabled={loading || companies.length === 0}
                >
                  <option value="">Odaberite firmu</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.companyId && <span className="field-error">{fieldErrors.companyId}</span>}
              </label>

              <label className="field">
                <span>Kategorija usluge *</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  disabled={loading || categories.length === 0}
                >
                  <option value="">Odaberite kategoriju</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId && <span className="field-error">{fieldErrors.categoryId}</span>}
              </label>
            </div>
          )}

          {reportMode === 'regular' && (
            <div className="field field--full">
            <div className="section-heading section-heading--compact">
              <span className="section-kicker">Lokacija</span>
              <h2 className="section-title">Automatsko ili ručno popunjavanje</h2>
            </div>

            <div className="location-row">
              <label className="field field--grow">
                <span>Lokacija kvara *</span>
                <input
                  type="text"
                  value={location}
                  placeholder="Unesite adresu ili opis lokacije"
                  onChange={(event) => setLocation(event.target.value)}
                />
                {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
              </label>

              <button type="button" className="button button--ghost button--inline" onClick={handleUseCurrentLocation}>
                Auto-popuni lokaciju
              </button>
            </div>
          </div>
          )}


          {reportMode === 'regular' && (
            <label className="field field--full">
              <span>Opis problema *</span>
              <textarea
                value={description}
                placeholder="Opišite kvar, obim problema i sve što može pomoći koordinatoru"
                onChange={(event) => setDescription(event.target.value)}
              />
              {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
            </label>
          )}

          {reportMode === 'emergency' && (
            <div className="field field--full">
            <div className="section-heading section-heading--compact">
              <span className="section-kicker">Kategorija problema</span>
              <h2 className="section-title">Često korišćeni tipovi hitnih intervencija</h2>
            </div>

            <p className="field-note">
              <strong>Opciono:</strong> Odaberite šablonsku kategoriju ispod ako vam se problem poklapa.
              Opis koji ste upisali iznad će biti korišćen za sve slučajeve.
            </p>

            <div className="template-grid">
              {intakeTemplates.map((template) => {
                const isSelected = template.id === selectedTemplateId;

                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-card${isSelected ? ' template-card--selected' : ''}`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <span className="template-card__label">{template.title}</span>
                    <span className="template-card__copy">{template.description}</span>
                  </button>
                );
              })}
            </div>

            <p className="field-note">
              Odabrani tip: <strong>{selectedTemplate.title}</strong> (koristi se samo kao oznaka intervencije)
            </p>
            </div>
          )}

          {reportMode === 'emergency' && (
            <div className="form-grid form-grid--two-columns field--full">
              {isAuthenticated ? (
                <div className="field field--full">
                  <p className="field-note">Prijavljeni korisnici ne moraju unositi kontakt podatke za hitnu prijavu.</p>
                </div>
              ) : (
                <>
                  <label className="field">
                    <span>Ime i prezime *</span>
                    <input
                      type="text"
                      value={reporterName}
                      placeholder="Ko nas kontaktira?"
                      onChange={(event) => setReporterName(event.target.value)}
                    />
                    {fieldErrors.reporterName && <span className="field-error">{fieldErrors.reporterName}</span>}
                  </label>

                  <label className="field">
                    <span>Email (opciono)</span>
                    <input
                      type="email"
                      value={reporterEmail}
                      placeholder="kontakt@firma.ba"
                      onChange={(event) => setReporterEmail(event.target.value)}
                    />
                    {fieldErrors.reporterEmail && <span className="field-error">{fieldErrors.reporterEmail}</span>}
                  </label>

                  <label className="field field--full">
                    <span>Broj telefona *</span>
                    <input
                      type="tel"
                      value={reporterPhone}
                      placeholder="+387 ..."
                      onChange={(event) => setReporterPhone(event.target.value)}
                    />
                    {fieldErrors.reporterPhone && <span className="field-error">{fieldErrors.reporterPhone}</span>}
                  </label>
                </>
              )}
            </div>
          )}

          {reportMode === 'regular' && (
            <div className="field field--full">
              <span>Attachmenti (opciono)</span>
              <input
                type="file"
                accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={handleAttachmentChange}
              />
              <p className="field-note">Dozvoljene su slike i dokumenti.</p>
              {fieldErrors.attachments && <span className="field-error">{fieldErrors.attachments}</span>}

              {attachments.length > 0 && (
                <ul className="attachment-list">
                  {attachments.map((attachment) => (
                    <li key={attachment.key} className="attachment-item">
                      <div>
                        <strong>{attachment.file.name}</strong>
                        <span>
                          {attachment.mimeType} · {formatFileSize(attachment.file.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="button button--ghost button--compact"
                        onClick={() => removeAttachment(attachment.key)}
                      >
                        Ukloni
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="button-row field--full">
            <button
              className="button button--solid"
              type="submit"
              disabled={
                submitting ||
                loading ||
                  (reportMode === 'regular' && (companies.length === 0 || categories.length === 0))
              }
            >
              {submitting ? 'Šaljem prijavu...' : 'Pošalji prijavu'}
            </button>
            <Link className="button button--ghost" href="/interventions">
              Pregled intervencija
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}