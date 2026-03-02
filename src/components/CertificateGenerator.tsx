import CertificatePreview from './CertificatePreview';

interface CertificateGeneratorProps {
  template: {
    level: string;
    title: string;
    subtitle: string;
    body_text: string;
    signature_url?: string | null;
  };
  studentName: string;
  booksRead?: number;
  date?: string;
}

const CertificateGenerator = ({ template, studentName, booksRead = 0, date = new Date().toLocaleDateString() }: CertificateGeneratorProps) => {
  const safeTemplate = {
    ...template,
    level: template.level as 'beginner' | 'bronze' | 'silver' | 'gold',
  };

  return (
    <div className="space-y-6">
      <div className="w-full max-w-lg mx-auto overflow-auto">
        <CertificatePreview template={safeTemplate} studentName={studentName} booksRead={booksRead} date={date} />
      </div>
    </div>
  );
};

export default CertificateGenerator;
