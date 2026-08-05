import { useEffect, useState } from 'react';

const API = '/api/claims';

async function api(path, method = 'GET', body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export default function App() {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState('');

  const refresh = () => api('').then(setClaims).catch((e) => setError(e.message));

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <h1>L'Oréal Claims Intelligence Engine</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <NewClaimForm onCreated={refresh} setError={setError} />

      <h2>Claims pipeline</h2>
      {claims.length === 0 && <p>No claims yet — submit one above.</p>}
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} onChange={refresh} setError={setError} />
      ))}
    </div>
  );
}

function NewClaimForm({ onCreated, setError }) {
  const [productId, setProductId] = useState('');
  const [claimText, setClaimText] = useState('');
  const [claimType, setClaimType] = useState('efficacy');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api('', 'POST', { productId, claimText, claimType });
      setProductId('');
      setClaimText('');
      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>1. Business team — propose a claim</h2>
      <input placeholder="Product ID (e.g. PROD-SERUM-02)" value={productId} onChange={(e) => setProductId(e.target.value)} />
      <textarea placeholder='Claim text (e.g. "Reduces wrinkles by 20% in 4 weeks")' value={claimText} onChange={(e) => setClaimText(e.target.value)} />
      <select value={claimType} onChange={(e) => setClaimType(e.target.value)}>
        <option value="efficacy">efficacy</option>
        <option value="sensory">sensory</option>
        <option value="environmental">environmental</option>
      </select>
      <button onClick={submit} disabled={loading || !productId || !claimText}>
        {loading ? 'Submitting…' : 'Submit claim'}
      </button>
    </div>
  );
}

function ClaimCard({ claim, onChange, setError }) {
  return (
    <div className="card">
      <p>
        <strong>{claim.productId}</strong> —{' '}
        <span className={`status status-${claim.status}`}>{claim.status}</span>
      </p>
      <p>"{claim.claimText}" <em>({claim.claimType})</em></p>
      {claim.rejectionReason && <p style={{ color: '#721c24' }}>Rejected: {claim.rejectionReason}</p>}
      {claim.formulaRef && <p>Formula ref: {claim.formulaRef}</p>}

      {claim.status === 'PENDING' && <ClaimManagerActions claim={claim} onChange={onChange} setError={setError} />}
      {claim.status === 'APPROVED' && <ScientistAction claim={claim} onChange={onChange} setError={setError} />}
      {claim.status === 'FORMULATED' && <EvaluatorAction claim={claim} onChange={onChange} setError={setError} />}
      {claim.status === 'ASSESSED' && <ReopenEvaluatorAction claim={claim} onChange={onChange} setError={setError} />}

      {claim.assessments?.map((a) => (
        <div key={a.id} className="card" style={{ background: '#fafafa' }}>
          <p>
            Justified: <span className={`verdict-${a.justified}`}>{a.justified}</span> — Confidence: {a.confidenceScore}%
          </p>
          <p>Reasoning: {a.reasoning}</p>
        </div>
      ))}
    </div>
  );
}

function ClaimManagerActions({ claim, onChange, setError }) {
  const [reason, setReason] = useState('');

  const decide = async (decision) => {
    setError('');
    try {
      await api(`/${claim.id}/review`, 'PATCH', { decision, reason: decision === 'REJECTED' ? reason : undefined });
      onChange();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <p><em>2. Claim manager review</em></p>
      <input placeholder="Rejection reason (only needed if rejecting)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button onClick={() => decide('APPROVED')}>Approve</button>{' '}
      <button onClick={() => decide('REJECTED')}>Reject</button>
    </div>
  );
}

function ScientistAction({ claim, onChange, setError }) {
  const [formulaRef, setFormulaRef] = useState('');

  const submit = async () => {
    setError('');
    try {
      await api(`/${claim.id}/formulate`, 'PATCH', { formulaRef });
      onChange();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <p><em>3. Scientist — attach formula</em></p>
      <input placeholder="Formula reference (e.g. FORMULA-REF-4471)" value={formulaRef} onChange={(e) => setFormulaRef(e.target.value)} />
      <button onClick={submit} disabled={!formulaRef}>Submit formula</button>
    </div>
  );
}

// Shown once a claim already has an assessment. Keeps the flow feeling
// "complete" instead of leaving an open form forever — re-submitting evidence
// is a deliberate action (revised formula / new study), not the default state.
function ReopenEvaluatorAction({ claim, onChange, setError }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div>
        <p style={{ color: '#155724' }}>✓ Assessment complete.</p>
        <button onClick={() => setOpen(true)}>Submit additional evidence</button>
      </div>
    );
  }

  return <EvaluatorAction claim={claim} onChange={onChange} setError={setError} onSubmitted={() => setOpen(false)} />;
}

function EvaluatorAction({ claim, onChange, setError, onSubmitted }) {
  const [evidenceText, setEvidenceText] = useState('');
  const [sampleSize, setSampleSize] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api(`/${claim.id}/assess`, 'POST', {
        evidenceText,
        sampleSize: sampleSize ? Number(sampleSize) : undefined,
      });
      onChange();
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p><em>4. Evaluator — submit study evidence (triggers AI assessment)</em></p>
      <textarea placeholder='e.g. "68% of 50 panelists showed measurable reduction after 4 weeks, average 22%"' value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} />
      <input placeholder="Sample size (optional)" value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} />
      <button onClick={submit} disabled={loading || !evidenceText}>
        {loading ? 'Assessing with AI…' : 'Submit evidence & assess'}
      </button>
    </div>
  );
}
